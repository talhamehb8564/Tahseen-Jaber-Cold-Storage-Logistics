import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema";
import {
  readSession,
  type AuthenticatedUser,
  type SessionClaims,
} from "@/lib/auth/session";

/**
 * ROUTE GUARDS (§29, §30)
 * ---------------------------------------------------------------------------
 * §30: "Admin and client portal routes must be protected server-side. Do not
 * rely only on frontend guards." These functions are the protection. They run in
 * a server component, layout or route handler, before any data is fetched — so a
 * page cannot render a fragment of privileged content on its way to a redirect.
 *
 * Every guard re-reads the user from the database rather than trusting the token
 * alone. That costs one indexed lookup and buys three things:
 *   - `isActive` is honoured immediately, so deactivating an account works now;
 *   - `tokenVersion` is compared, giving a revocation switch with no sessions
 *     table (a password change or a forced logout invalidates every old token);
 *   - a deleted user cannot keep operating on a still-valid signature.
 *
 * §29: the portal additionally resolves the CLIENT's own row and returns
 * `clientId`. Downstream queries must filter by that id and never by anything the
 * browser supplied — that is what stops one client reading another's stock.
 */

/** Roles permitted in the admin command center (§28). */
export const ADMIN_ROLES: readonly UserRole[] = ["ADMIN"];
/** Roles permitted to operate the facility (admin + operators). */
export const STAFF_ROLES: readonly UserRole[] = ["ADMIN", "OPERATOR"];

/* ==========================================================================
   RESOLUTION
   ========================================================================== */

/** Verifies the session cookie against the database. Never redirects. */
export async function resolveUser(): Promise<AuthenticatedUser | null> {
  const claims = await readSession();
  if (!claims) return null;

  const db = getDb();
  if (!db) {
    // A valid token with no database cannot be checked for revocation, so it
    // must not be honoured (§30 — fail closed, never open).
    return null;
  }

  try {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .where(eq(users.id, claims.sub))
      .limit(1);

    if (!row) return null;
    if (!row.isActive) return null;
    // Revocation check.
    if (row.tokenVersion !== claims.tv) return null;

    return {
      sub: row.id,
      email: row.email,
      role: row.role,
      clientId: claims.clientId,
      tv: row.tokenVersion,
      name: row.name,
      isActive: row.isActive,
    };
  } catch (error) {
    console.error("[auth] user resolution failed", error);
    return null;
  }
}

/* ==========================================================================
   GUARDS
   ========================================================================== */

/** Returns the signed-in user or null. For optional personalisation. */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  return resolveUser();
}

/**
 * Requires any signed-in user. Redirects to /login otherwise, preserving the
 * original destination so login can send the visitor back where they were going.
 */
export async function requireUser(from?: string): Promise<AuthenticatedUser> {
  const user = await resolveUser();
  if (user) return user;
  redirect(loginUrl(from));
}

/** Requires a role in the allow-list. Redirects to /login when signed out. */
export async function requireRole(
  roles: readonly UserRole[],
  from?: string,
): Promise<AuthenticatedUser> {
  const user = await resolveUser();

  if (!user) redirect(loginUrl(from));

  // Signed in but insufficient: sending them to /login would loop, since they
  // would arrive back here already authenticated. §39 — no silent failures.
  if (!roles.includes(user.role)) {
    console.error(
      `[auth] forbidden: user ${user.email} (role ${user.role}) attempted a ${roles.join("/")} route`,
    );
    redirect("/forbidden");
  }

  return user;
}

/** Requires ADMIN. Entry to the command center (§28). */
export async function requireAdmin(from?: string): Promise<AuthenticatedUser> {
  return requireRole(ADMIN_ROLES, from);
}

/** Requires ADMIN or OPERATOR. Facility operations screens. */
export async function requireStaff(from?: string): Promise<AuthenticatedUser> {
  return requireRole(STAFF_ROLES, from);
}

export function loginUrl(from?: string): string {
  // Only ever redirect back to a path on this origin — an open redirect here
  // would turn the login flow into a phishing aid.
  const safe =
    from && from.startsWith("/") && !from.startsWith("//") ? from : undefined;
  return safe ? `/login?from=${encodeURIComponent(safe)}` : "/login";
}

/* ==========================================================================
   API GUARDS
   Route handlers cannot `redirect()` usefully, so they get a result object and
   choose their own status code.
   ========================================================================== */

export type ApiGuardResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: 401 | 403; message: string };

export async function requireUserApi(): Promise<ApiGuardResult> {
  const user = await resolveUser();
  if (!user) {
    return { ok: false, status: 401, message: "Authentication required." };
  }
  return { ok: true, user };
}

export async function requireRoleApi(
  roles: readonly UserRole[],
): Promise<ApiGuardResult> {
  const result = await requireUserApi();
  if (!result.ok) return result;

  if (!roles.includes(result.user.role)) {
    // §39 — a generic message. Naming the required role would map the
    // privilege structure for anyone probing it.
    return { ok: false, status: 403, message: "You do not have access to this resource." };
  }

  return result;
}

export async function requireAdminApi(): Promise<ApiGuardResult> {
  return requireRoleApi(ADMIN_ROLES);
}

export async function requireStaffApi(): Promise<ApiGuardResult> {
  return requireRoleApi(STAFF_ROLES);
}

/**
 * Requires a CLIENT account and returns the client id that scopes every portal
 * query (§29). Returns null for staff, who reach client data through admin
 * routes instead.
 */
export async function requireClient(
  from?: string,
): Promise<{ user: AuthenticatedUser; clientId: string }> {
  const user = await requireUser(from);

  if (user.role !== "CLIENT") {
    console.error(`[auth] forbidden: ${user.role} attempted a client portal route`);
    redirect("/forbidden");
  }

  if (!user.clientId) {
    // A CLIENT row without a linked client record cannot be scoped, so it must
    // not be shown anything rather than being shown everything.
    console.error(`[auth] client ${user.email} has no linked client record`);
    redirect("/portal/no-account");
  }

  return { user, clientId: user.clientId };
}

export type { SessionClaims };
