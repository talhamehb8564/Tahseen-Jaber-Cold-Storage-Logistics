/**
 * CSRF TOKEN ACCESS (§30)
 * ---------------------------------------------------------------------------
 * Split out from `lib/auth/session` because session.ts is `server-only` — the
 * header NAME is needed by client components to submit state-changing requests,
 * and importing the server module from the browser would fail the build.
 *
 * Only the constant lives here. Issuing and verifying tokens stays server-side.
 */

/** Header a client must echo the `tj_csrf` cookie value into. */
export const CSRF_HEADER = "x-csrf-token";

/** Cookie holding the double-submit token. Readable by script by design. */
export const CSRF_COOKIE = "tj_csrf";

/** Reads the CSRF token in the browser. Returns null before it is issued. */
export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${CSRF_COOKIE}=`));
  const value = entry?.split("=")[1];
  return value && value.length >= 32 ? value : null;
}
