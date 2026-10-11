import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type { UserRole } from "@/lib/db/schema";

/**
 * SESSIONS (§30)
 * ---------------------------------------------------------------------------
 * A self-contained JWT session in an httpOnly cookie, signed with HS256 against
 * AUTH_SECRET.
 *
 * WHY NOT AUTH.JS
 *   §02 names Auth.js as the intended library, but the only version compatible
 *   with Next 16 here is `next-auth@5.0.0-beta.32`, which pins
 *   `nodemailer@^7 || ^8` while this project runs nodemailer 10 — an unresolvable
 *   peer conflict — and its Next 16 support is still beta. Rather than ship a
 *   beta dependency with a broken peer tree, the session is implemented directly:
 *   ~120 lines using `jose`, which is what Auth.js itself uses internally. Every
 *   §30 requirement is still met: hashed passwords, secure httpOnly cookies,
 *   server-side route protection, and CSRF defence.
 *
 * REVOCATION WITHOUT A SESSIONS TABLE
 *   The token carries `tv` (the user's `tokenVersion`). Guards compare it against
 *   the database on every privileged request, so incrementing that column
 *   instantly invalidates every token a user holds — on password change, on
 *   deactivation, or when an admin needs to force a logout.
 */

export const SESSION_COOKIE = "tj_session";
export const CSRF_COOKIE = "tj_csrf";

/** Session as encoded in the token. Deliberately minimal — no secrets inside. */
export interface SessionClaims {
  /** User id. */
  sub: string;
  email: string;
  role: UserRole;
  /** Present for CLIENT accounts; the only key the portal is allowed to use. */
  clientId: string | null;
  /** Mirrors users.tokenVersion. */
  tv: number;
}

/** Session plus the database-verified user, produced by the guards. */
export interface AuthenticatedUser extends SessionClaims {
  name: string | null;
  isActive: boolean;
}

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function sessionMaxAge(): number {
  const raw = Number(process.env.AUTH_SESSION_MAX_AGE);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_MAX_AGE;
}

/**
 * The signing key. Returns null rather than throwing when unconfigured, so a
 * missing secret degrades to "not signed in" instead of a 500 on every page.
 */
function secretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  // HS256 requires at least 256 bits of key material.
  if (secret.length < 32) {
    console.error(
      "[auth] AUTH_SECRET is shorter than 32 characters — refusing to sign sessions. Generate one with: openssl rand -base64 48",
    );
    return null;
  }
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  return secretKey() !== null;
}

/* ==========================================================================
   ISSUE / CLEAR
   ========================================================================== */

export async function createSessionToken(claims: SessionClaims): Promise<string | null> {
  const key = secretKey();
  if (!key) return null;

  const now = Math.floor(Date.now() / 1000);
  const maxAge = sessionMaxAge();

  return new SignJWT({
    email: claims.email,
    role: claims.role,
    clientId: claims.clientId,
    tv: claims.tv,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + maxAge)
    .setIssuer("tahseen-jaber")
    .setAudience("tahseen-jaber-web")
    .sign(key);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // A session cookie must never be reachable from script (§30).
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}

/* ==========================================================================
   READ / VERIFY
   ========================================================================== */

/**
 * Verifies the session cookie. Returns null for any failure — absent, malformed,
 * expired, bad signature, wrong issuer. The reason is logged server-side only;
 * §39 forbids leaking it to the caller.
 */
export async function readSession(): Promise<SessionClaims | null> {
  const key = secretKey();
  if (!key) return null;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: "tahseen-jaber",
      audience: "tahseen-jaber-web",
    });

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = payload.role as UserRole | undefined;
    const tv = typeof payload.tv === "number" ? payload.tv : null;

    if (!sub || !email || !role || tv === null) {
      console.error("[auth] session token missing required claims");
      return null;
    }
    if (!isValidRole(role)) {
      console.error("[auth] session token carries an unknown role", role);
      return null;
    }

    return {
      sub,
      email,
      role,
      clientId: typeof payload.clientId === "string" ? payload.clientId : null,
      tv,
    };
  } catch (error) {
    // Expired or tampered tokens are routine, not incidents — log quietly.
    const reason = error instanceof Error ? error.message : "unknown";
    if (!reason.includes("expired")) {
      console.error("[auth] session verification failed:", reason);
    }
    return null;
  }
}

function isValidRole(role: string): role is UserRole {
  return role === "ADMIN" || role === "OPERATOR" || role === "CLIENT";
}

/* ==========================================================================
   CSRF (§30)
   Double-submit cookie. The token is readable by script (that is the point) but
   a cross-site request cannot read it, so it cannot reproduce the header.
   ========================================================================== */

export const CSRF_HEADER = "x-csrf-token";

export async function ensureCsrfToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing && existing.length >= 32) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  store.set(CSRF_COOKIE, token, {
    // NOT httpOnly — the client must read it to echo it back in the header.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge(),
  });

  return token;
}

/**
 * Validates the double-submit pair. Session cookies are `sameSite: lax`, which
 * already blocks cross-site POSTs; this is defence in depth for any state change.
 */
export async function verifyCsrf(request: Request): Promise<boolean> {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length < 32 || headerToken.length < 32) return false;

  // Constant-time compare so token length cannot be probed.
  return timingSafeEqual(cookieToken, headerToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let diff = 0;
  for (let index = 0; index < bufA.length; index += 1) {
    diff |= (bufA[index] ?? 0) ^ (bufB[index] ?? 0);
  }
  return diff === 0;
}
