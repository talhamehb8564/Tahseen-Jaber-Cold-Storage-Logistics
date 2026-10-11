/**
 * PASSWORD POLICY — client-safe constants (§30)
 * ---------------------------------------------------------------------------
 * Split out of `lib/auth/password` on purpose. That module imports
 * `server-only` and bcrypt, so it must never enter a client bundle; but the
 * validation schemas in `lib/validation/auth` need the same length bounds to
 * check input *before* it reaches bcrypt, and those schemas are shared with
 * client forms.
 *
 * Keeping the numbers here means the client and the server enforce one policy
 * without the client ever pulling in the hashing implementation. Nothing in
 * this file touches a secret, a hash or the database.
 */

/** Length beats complexity rules, which mostly produce predictable substitutions. */
export const PASSWORD_MIN_LENGTH = 10;

/** bcrypt truncates its input beyond 72 bytes, so an upper bound is enforced too. */
export const PASSWORD_MAX_LENGTH = 200;

export interface PasswordCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Strength check for *created* passwords. Deliberately not applied at login: an
 * existing account may legitimately hold a password that predates the current
 * policy, and rejecting it there would lock the user out of their own account.
 */
export function checkPasswordStrength(password: string): PasswordCheck {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      reason: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, reason: "That password is too long." };
  }
  // Reject the trivially guessable without demanding symbols.
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      ok: false,
      reason: "Include both letters and numbers.",
    };
  }
  return { ok: true };
}
