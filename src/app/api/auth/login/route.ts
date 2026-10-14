import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getDb } from "@/lib/db/client";
import { clients, users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { getClientIp, hashIdentity, limitConfig, rateLimit } from "@/lib/utilities/rate-limit";
import type { AuthResponse } from "@/types/api";

/**
 * POST /api/auth/login (§30)
 * ---------------------------------------------------------------------------
 * Credential login. Rate limited per connection to blunt password guessing, and
 * deliberately uniform in its failures: the same message and a similar response
 * time whether the email is unknown or the password is wrong, so the endpoint
 * cannot be used to enumerate accounts.
 *
 * A successful login:
 *   - records `lastLoginAt`;
 *   - resolves the CLIENT's own `clients` row so the token carries `clientId`,
 *     which is the only key the portal is allowed to scope queries by (§29);
 *   - issues a signed httpOnly session cookie.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INVALID_MESSAGE = "The email or password is incorrect.";

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  /* --- Rate limit -------------------------------------------------------- */
  const headerList = await headers();
  const clientIp = getClientIp(headerList);
  const { windowSeconds, maxLogins } = limitConfig();
  const limit = rateLimit({
    key: "login",
    identity: hashIdentity(clientIp),
    limit: maxLogins,
    windowSeconds,
  });

  if (!limit.success) {
    return NextResponse.json<AuthResponse>(
      {
        ok: false,
        code: "rate_limited",
        message: `Too many attempts. Please try again in ${limit.resetInSeconds} seconds.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } },
    );
  }

  /* --- Parse ------------------------------------------------------------- */
  const json = (await request.json().catch(() => null)) as unknown;
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json<AuthResponse>(
      {
        ok: false,
        code: "invalid",
        message: "Some details need correcting.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { email, password } = parsed.data;

  /* --- Database ---------------------------------------------------------- */
  const db = getDb();
  if (!db) {
    console.error("[auth/login] DATABASE_URL is not configured");
    return NextResponse.json<AuthResponse>(
      {
        ok: false,
        code: "error",
        message: "Sign-in is not available right now. Please try again later.",
      },
      { status: 503 },
    );
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // No such account. Compare against a throwaway hash anyway so the response
    // time does not reveal whether the email exists.
    if (!user) {
      await verifyPassword(password, DUMMY_HASH);
      return unauthorized();
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) return unauthorized();

    if (!user.isActive) {
      console.error(`[auth/login] inactive account attempted sign-in: ${user.email}`);
      return NextResponse.json<AuthResponse>(
        {
          ok: false,
          code: "inactive",
          message: "This account is not active. Please contact the facility.",
        },
        { status: 403 },
      );
    }

    /* --- Resolve the portal scope (§29) ---------------------------------- */
    let clientId: string | null = null;
    if (user.role === "CLIENT") {
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.userId, user.id))
        .limit(1);
      clientId = client?.id ?? null;
    }

    /* --- Issue the session ----------------------------------------------- */
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId,
      tv: user.tokenVersion,
    });

    if (!token) {
      console.error("[auth/login] AUTH_SECRET is not configured — cannot sign a session");
      return NextResponse.json<AuthResponse>(
        {
          ok: false,
          code: "error",
          message: "Sign-in is not available right now. Please try again later.",
        },
        { status: 503 },
      );
    }

    await setSessionCookie(token);

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json<AuthResponse>({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId,
      },
    });
  } catch (error) {
    // §39 — the technical reason is logged here and never returned.
    console.error("[auth/login] failure", error);
    return NextResponse.json<AuthResponse>(
      {
        ok: false,
        code: "error",
        message: "Sign-in is not available right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}

/** One message for every credential failure, so accounts cannot be enumerated. */
function unauthorized(): NextResponse<AuthResponse> {
  return NextResponse.json<AuthResponse>(
    { ok: false, code: "invalid_credentials", message: INVALID_MESSAGE },
    { status: 401 },
  );
}

/**
 * A fixed bcrypt hash of an unusable password, used only to keep the timing of an
 * unknown-email response close to that of a wrong-password one.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpDLFmzYqJ5yqJ5yqJ5yqJ5yqJ5yq";
