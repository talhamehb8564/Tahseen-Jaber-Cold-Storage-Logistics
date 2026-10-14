import "server-only";

import bcrypt from "bcryptjs";

/**
 * PASSWORDS (§30)
 * ---------------------------------------------------------------------------
 * bcrypt via `bcryptjs` — a pure-JS implementation, so it behaves identically on
 * every runtime and needs no native build step.
 *
 * §30 is explicit: passwords are never stored in plain text. They are never
 * logged either, and never returned in an API response — the user views in
 * `lib/data` omit `passwordHash` entirely rather than filtering it later.
 */

/**
 * Cost factor 12 ≈ 250 ms on typical server hardware. That is slow enough to
 * make offline cracking expensive and fast enough that a login does not feel
 * broken. Raising it later is safe: bcrypt records its own cost in the hash, so
 * existing hashes still verify.
 */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null,
): Promise<boolean> {
  // A null hash means an OAuth-only account: there is no password to check, and
  // returning false is the only safe answer.
  if (!hash) return false;
  if (!plain) return false;

  try {
    return await bcrypt.compare(plain, hash);
  } catch (error) {
    // A malformed hash in the database should fail closed, not throw upward.
    console.error("[auth] password comparison failed", error);
    return false;
  }
}

/*
 * The policy constants and the strength check live in `./password-policy`,
 * which is client-safe, and are re-exported here so server callers keep one
 * import path. They are deliberately NOT defined in this module: this file
 * imports `server-only` and bcrypt, and the validation schemas need the same
 * bounds without dragging either into a client bundle.
 */
export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  checkPasswordStrength,
  type PasswordCheck,
} from "@/lib/auth/password-policy";
