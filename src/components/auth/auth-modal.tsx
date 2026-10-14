"use client";

import { Check, Lock, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { LoginForm, type LoginStatus } from "@/components/auth/login-form";
import { cn } from "@/lib/utilities/cn";

/**
 * SIGN-IN MODAL — frosted glass, with the verification sequence
 * ---------------------------------------------------------------------------
 * Opens over whatever page the visitor is on, so signing in never costs them
 * their place in the scroll. Heavy glass (`glass-strong`), a blurred backdrop
 * and a cold glow ring; the dialog reads as an instrument panel, not a form on a
 * white card.
 *
 * THE SEQUENCE
 *   Submitting plays three beats — establishing the channel, verifying
 *   credentials, access granted — each landing as the real request progresses,
 *   and the granted beat holds long enough to be seen before the router takes
 *   over. The beats are driven by `LoginStatus` from the form itself, so the
 *   theatre can never claim success the request did not return.
 *
 * ACCESSIBILITY (§37)
 *   A real `dialog` pattern: focus moves in on open and is restored to the
 *   trigger on close, Tab is trapped inside, Escape closes, and the backdrop
 *   click closes. `aria-modal` + a labelled title keep it announced correctly,
 *   and body scroll is locked only while it is open.
 *
 * §45 — GOOGLE / SIGN-UP
 *   Google sign-in is not configured for this facility and accounts are
 *   provisioned by the business rather than self-registered. Both facts are
 *   stated on the panel instead of being implied by a button that cannot work:
 *   a dead OAuth button is a broken promise to a real visitor.
 */

const BEATS = [
  { key: "channel", label: "Establishing secure channel" },
  { key: "verify", label: "Verifying credentials" },
  { key: "granted", label: "Access granted" },
] as const;

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Where the visitor was heading; re-validated server-side before use. */
  from?: string;
}

export function AuthModal({ open, onClose, from }: AuthModalProps) {
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<LoginStatus>("idle");
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  /* ------------------------------------------------- focus + scroll lock --- */
  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog once it has painted.
    const focusTimer = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), button",
      );
      target?.focus();
    }, 60);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      restoreTo.current?.focus?.();
    };
  }, [open]);

  /* ------------------------------------------------- Escape + focus trap --- */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type=hidden]), textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Never leave the panel showing a stale success state on the next open.
  useEffect(() => {
    if (open) setStatus("idle");
  }, [open]);

  const verifying = status === "submitting";
  const granted = status === "granted";
  /** The beat index the sequence has reached. */
  const beat = granted ? 3 : verifying ? 2 : 0;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 sm:p-6">
          {/* ---------------- Backdrop ---------------- */}
          <motion.button
            type="button"
            aria-label="Close sign in"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-midnight/78 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          />

          {/* Cold light pooling behind the glass. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: granted ? 1 : 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.7 }}
            style={{
              background:
                "radial-gradient(58% 48% at 50% 46%, rgba(143,123,255,0.16), transparent 70%)",
            }}
          />

          {/* ---------------- Dialog ---------------- */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className={cn(
              "glass-strong tj-corners relative w-full max-w-md overflow-hidden rounded-[4px]",
              "transition-shadow duration-700",
              granted && "glow-ring",
            )}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.965, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: reduced ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Frost creep at the edges of the glass. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 40% at 0% 0%, rgba(233,243,255,0.14), transparent 68%)," +
                  "radial-gradient(52% 38% at 100% 100%, rgba(76,194,255,0.12), transparent 70%)",
              }}
            />

            {/* ---------------- Header ---------------- */}
            <div className="relative flex items-start justify-between gap-4 border-b border-glow/18 px-6 py-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.24em] text-glow uppercase">
                  <Lock size={12} strokeWidth={1.9} aria-hidden />
                  Secure access
                </p>
                <h2
                  id="auth-modal-title"
                  className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-frost uppercase"
                >
                  Client sign in
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  "-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-[3px]",
                  "border border-hull-line/70 text-silver-dim transition-all duration-300",
                  "hover:border-alert/50 hover:text-alert",
                  "focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none",
                )}
              >
                <X size={15} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {/* ---------------- Body ---------------- */}
            <div className="relative px-6 py-6">
              <LoginForm from={from} onStatusChange={setStatus} />

              {/* --- Verification sequence overlay ------------------------- */}
              <AnimatePresence>
                {verifying || granted ? (
                  <motion.div
                    className="absolute inset-0 z-10 flex flex-col justify-center gap-5 px-7"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.3 }}
                    style={{
                      background:
                        "linear-gradient(168deg, rgba(11,16,52,0.94), rgba(4,7,29,0.97))",
                      backdropFilter: "blur(18px)",
                    }}
                    aria-live="assertive"
                  >
                    {/* Scanning sweep while the request is in flight. */}
                    {!reduced && verifying ? (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 h-24"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent, rgba(143,123,255,0.10), transparent)",
                        }}
                        initial={{ top: "-10%" }}
                        animate={{ top: "110%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : null}

                    <ul className="relative space-y-3.5">
                      {BEATS.map((item, index) => {
                        const done = beat > index;
                        const current = beat === index + 1;
                        return (
                          <li key={item.key} className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-500",
                                done
                                  ? "border-glow bg-glow/20 text-glow"
                                  : current
                                    ? "border-glow/50 text-glow"
                                    : "border-hull-line text-silver-dim",
                              )}
                              style={done ? { boxShadow: "0 0 16px rgba(143,123,255,0.4)" } : undefined}
                            >
                              {done ? (
                                <Check size={13} strokeWidth={2.6} aria-hidden />
                              ) : current && !reduced ? (
                                <motion.span
                                  className="size-1.5 rounded-full bg-glow"
                                  animate={{ opacity: [1, 0.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  aria-hidden
                                />
                              ) : (
                                <span className="size-1.5 rounded-full bg-current opacity-40" aria-hidden />
                              )}
                            </span>
                            <span
                              className={cn(
                                "font-mono text-[0.6875rem] tracking-[0.18em] uppercase transition-colors duration-500",
                                done ? "text-glow" : current ? "text-frost" : "text-silver-dim",
                              )}
                            >
                              {item.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {granted ? (
                      <motion.p
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative font-mono text-[0.5625rem] tracking-[0.2em] text-silver-dim uppercase"
                      >
                        Opening your area…
                      </motion.p>
                    ) : (
                      <p className="relative font-mono text-[0.5625rem] tracking-[0.2em] text-silver-dim uppercase">
                        Do not close this window
                      </p>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* ---------------- Footer: honest about what is not available --- */}
            <div className="relative border-t border-glow/18 px-6 py-4">
              <p className="flex items-start gap-2.5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
                <ShieldCheck size={13} strokeWidth={1.7} aria-hidden className="mt-px shrink-0 text-ice" />
                Accounts are provisioned by the facility. Google sign-in is not
                yet enabled — request access through the inquiry form.
              </p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
