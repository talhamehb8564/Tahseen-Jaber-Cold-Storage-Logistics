import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie, verifyCsrf } from "@/lib/auth/session";

/**
 * POST /api/auth/logout (§30)
 * ---------------------------------------------------------------------------
 * Clears the session and CSRF cookies. CSRF-checked: an unauthenticated
 * cross-site POST that could log a user out is a nuisance vector, and the check
 * costs nothing here.
 *
 * A failed CSRF check returns 403 without clearing anything, so a stale tab does
 * not silently destroy a working session.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse<{ ok: boolean }>> {
  const csrfOk = await verifyCsrf(request);
  if (!csrfOk) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
