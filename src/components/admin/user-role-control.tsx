"use client";

import { Check, CircleAlert, Loader2, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateUser, type ActionResult } from "@/lib/actions/admin";
import { cn } from "@/lib/utilities/cn";

/**
 * USER ROLE CONTROL (§28, §30)
 * ---------------------------------------------------------------------------
 * Changes a user's role or active state through the audited Server Action.
 *
 * Two safeguards worth naming:
 *   - the action re-authorizes server-side and refuses self-demotion or
 *     self-deactivation, so the console can never be stranded with no
 *     administrator. The `isSelf` prop here only greys the control out early; it
 *     is presentation, not the control.
 *   - any change bumps `tokenVersion`, which invalidates that user's existing
 *     sessions immediately. The confirmation message says so, because an admin
 *     demoting a user needs to know the effect is instant rather than at expiry.
 */

const ROLES = ["ADMIN", "OPERATOR", "CLIENT"] as const;
type Role = (typeof ROLES)[number];

export function UserRoleControl({
  userId,
  userEmail,
  currentRole,
  isActive,
  isSelf,
}: {
  userId: string;
  userEmail: string;
  currentRole: Role;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function changeRole(role: Role) {
    if (role === currentRole) return;
    setResult(null);
    startTransition(async () => {
      const outcome = await updateUser({ userId, role });
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  function toggleActive() {
    setResult(null);
    startTransition(async () => {
      const outcome = await updateUser({ userId, isActive: !isActive });
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[0.5rem] tracking-[0.16em] text-silver-dim uppercase">
          Role
        </span>
        {ROLES.map((role) => {
          const active = role === currentRole;
          const blocked = isSelf && role !== "ADMIN";
          return (
            <button
              key={role}
              type="button"
              onClick={() => changeRole(role)}
              disabled={isPending || active || blocked}
              aria-pressed={active}
              title={blocked ? "You cannot remove your own administrator role" : undefined}
              className={cn(
                "rounded-[2px] border px-2.5 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase",
                "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none",
                active
                  ? "border-glow/50 bg-glow/12 font-semibold text-glow"
                  : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                (isPending || active || blocked) && !active && "opacity-55",
                blocked && "cursor-not-allowed",
                isPending && "cursor-wait",
              )}
            >
              {role}
            </button>
          );
        })}

        <button
          type="button"
          onClick={toggleActive}
          disabled={isPending || (isSelf && isActive)}
          title={isSelf && isActive ? "You cannot deactivate your own account" : undefined}
          className={cn(
            "ml-1 inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5",
            "font-mono text-[0.5rem] tracking-[0.14em] uppercase",
            "transition-all duration-300 focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none",
            isActive
              ? "border-alert/40 text-alert hover:bg-alert/10"
              : "border-stable/40 text-stable hover:bg-stable/10",
            (isPending || (isSelf && isActive)) && "cursor-not-allowed opacity-55",
          )}
        >
          <Power size={10} strokeWidth={2.2} aria-hidden />
          {isActive ? "Deactivate" : "Reactivate"}
        </button>

        {isPending ? (
          <span className="flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
            <Loader2 size={10} strokeWidth={2.2} aria-hidden className="animate-spin" />
            Processing…
          </span>
        ) : null}
      </div>

      {result ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-2.5 flex items-start gap-2 text-[0.75rem] leading-relaxed",
            result.ok ? "text-stable" : "text-alert",
          )}
        >
          {result.ok ? (
            <Check size={13} strokeWidth={2.2} aria-hidden className="mt-px shrink-0" />
          ) : (
            <CircleAlert size={13} strokeWidth={2} aria-hidden className="mt-px shrink-0" />
          )}
          <span>
            {result.message}
            {isSelf ? (
              <span className="mt-1 block font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim uppercase">
                {userEmail}
              </span>
            ) : null}
          </span>
        </p>
      ) : null}
    </div>
  );
}
