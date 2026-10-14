import { z } from "zod";

import { PASSWORD_MAX_LENGTH } from "@/lib/auth/password-policy";

/**
 * AUTH VALIDATION (§30)
 * ---------------------------------------------------------------------------
 * Login input is validated before it reaches bcrypt. That is not only hygiene:
 * an unbounded password string is a cheap denial-of-service against a bcrypt
 * comparison, since cost scales with input length.
 *
 * The password field is capped but NOT strength-checked at login — an existing
 * account may legitimately hold a password that predates the current policy, and
 * rejecting it here would lock the user out of their own account.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address").max(320, "Email is too long")),
  password: z
    .string()
    .min(1, "Enter your password")
    .max(PASSWORD_MAX_LENGTH, "Password is too long"),
  /** Where to return after a successful login. Path-only; validated again server-side. */
  from: z
    .string()
    .max(500)
    .optional()
    .refine(
      (value) => !value || (value.startsWith("/") && !value.startsWith("//")),
      "Invalid redirect target",
    ),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginPayload = z.output<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(PASSWORD_MAX_LENGTH),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(PASSWORD_MAX_LENGTH, "Password is too long")
      .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), {
        message: "Include both letters and numbers",
      }),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password you have not used before",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordPayload = z.output<typeof changePasswordSchema>;

/**
 * Safe post-login destination. Re-checked here even though the schema validated
 * it, because the value may also arrive from a query string rather than the form.
 */
export function safeRedirect(from: string | null | undefined): string {
  if (!from) return "/";
  if (!from.startsWith("/") || from.startsWith("//")) return "/";
  // Reject anything that smuggles a scheme or a backslash trick.
  if (/[\\]/.test(from) || from.includes("://")) return "/";
  return from;
}
