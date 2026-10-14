"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/forms/fields";
import { loginSchema, safeRedirect, type LoginInput, type LoginPayload } from "@/lib/validation/auth";
import type { AuthResponse } from "@/types/api";
import { cn } from "@/lib/utilities/cn";

/**
 * Where the form is in its lifecycle. Surfaced to the parent so a wrapper (the
 * frosted sign-in modal) can choreograph its own beats without duplicating any
 * of the request logic — §41.
 */
export type LoginStatus = "idle" | "submitting" | "granted" | "error";

/**
 * How long the granted beat is held before navigating, so "ACCESS GRANTED" is
 * actually seen rather than flashed past. Kept short: nobody should wait on a
 * celebration (§33).
 */
const GRANTED_HOLD_MS = 900;

/**
 * LOGIN FORM (§30)
 * ---------------------------------------------------------------------------
 * Posts credentials to /api/auth/login. The server sets an httpOnly session
 * cookie, so the token never reaches this component and cannot be read by script.
 *
 * On success the visitor is sent to the destination they were heading for, or to
 * the home area for their role. That destination is re-validated by
 * `safeRedirect()` on the client AND by the server guard, because a `from` value
 * is exactly where an open redirect would live.
 */

export function LoginForm({
  from,
  onStatusChange,
}: {
  from?: string;
  onStatusChange?: (status: LoginStatus) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LoginStatus>("idle");

  /** Every status change is mirrored to the parent as well as to local state. */
  const changeStatus = (next: LoginStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput, unknown, LoginPayload>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: { email: "", password: "", from },
  });

  const registerField = (name: keyof LoginInput) =>
    register(name as never) as unknown as Record<string, unknown>;

  const onSubmit = handleSubmit(async (payload) => {
    changeStatus("submitting");
    setServerMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as AuthResponse | null;

      if (!data) {
        changeStatus("error");
        setServerMessage("Sign-in is not available right now. Please try again later.");
        return;
      }

      if (!data.ok) {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            const message = messages?.[0];
            if (message) setError(field as never, { type: "server", message });
          }
        }
        changeStatus("error");
        setServerMessage(data.message);
        return;
      }

      // Role determines the landing area when no explicit destination was given.
      const destination =
        safeRedirect(payload.from) !== "/"
          ? safeRedirect(payload.from)
          : data.user.role === "CLIENT"
            ? "/portal"
            : "/admin";

      // Hold the granted beat, then hand over to the router.
      changeStatus("granted");
      window.setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, GRANTED_HOLD_MS);
    } catch {
      changeStatus("error");
      setServerMessage("Sign-in is not available right now. Please try again later.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={status === "submitting"}>
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        required
        autoComplete="username"
        placeholder="name@company.com"
        error={errors.email}
        registerProps={registerField("email")}
      />

      {/* Password with a reveal toggle — useful, and it stays a real input so
          password managers and screen readers keep working (§37). */}
      <div className="relative">
        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password}
          className="pr-12"
          registerProps={registerField("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute top-[2.35rem] right-3 flex size-8 items-center justify-center rounded-[2px] text-silver-dim transition-colors duration-300 hover:text-ice focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none"
        >
          {showPassword ? (
            <EyeOff size={16} strokeWidth={1.6} aria-hidden />
          ) : (
            <Eye size={16} strokeWidth={1.6} aria-hidden />
          )}
        </button>
      </div>

      <input type="hidden" {...registerField("from")} defaultValue={from ?? ""} />

      {status === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-3 border border-alert/45 bg-alert/[0.07] p-4"
        >
          <CircleAlert size={17} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0 text-alert" />
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] font-semibold tracking-[0.14em] text-alert uppercase">
              Sign-in failed
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-silver">
              {serverMessage ?? "Please check your details and try again."}
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(
          "group flex w-full items-center justify-center gap-2.5 rounded-[2px] px-6 py-4",
          "font-display text-[0.8125rem] font-bold tracking-[0.16em] uppercase",
          "bg-glow text-midnight shadow-[0_12px_34px_-14px_rgba(143,123,255,0.9)]",
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:bg-ice active:scale-[0.985]",
          "focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {status === "submitting" ? (
          <>
            <span
              aria-hidden
              className="size-3.5 animate-spin rounded-full border-2 border-midnight/35 border-t-midnight"
            />
            Processing…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight
              size={16}
              strokeWidth={2}
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </>
        )}
      </button>

      <div aria-live="polite" className="sr-only">
        {status === "submitting"
          ? "Signing in."
          : status === "error"
            ? (serverMessage ?? "Sign-in failed.")
            : ""}
      </div>

      <p className="flex items-start gap-2.5 border-t border-hull-line/70 pt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
        <ShieldCheck size={13} strokeWidth={1.7} aria-hidden className="mt-px shrink-0 text-glow" />
        Sessions are held in a secure cookie. Passwords are stored hashed and are
        never returned by this site.
      </p>
    </form>
  );
}
