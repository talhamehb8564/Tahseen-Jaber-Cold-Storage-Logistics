"use client";

import { Check, CircleAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useState } from "react";

import {
  INQUIRY_STATUSES,
  updateInquiryStatus,
  type ActionResult,
  type InquiryStatusValue,
} from "@/lib/actions/admin";
import { cn } from "@/lib/utilities/cn";

/**
 * INQUIRY STATUS CONTROL (§28)
 * ---------------------------------------------------------------------------
 * The only mutating control on the requests screen. Calls the `updateInquiryStatus`
 * Server Action inside a transition, so:
 *
 *   - the row shows a pending state while the write is in flight;
 *   - `router.refresh()` pulls the new server state rather than patching local
 *     state, keeping one source of truth;
 *   - success and failure are both surfaced inline (§39 — no silent failures).
 *
 * The action itself re-authorizes on the server. Disabling this button for a
 * non-admin would be presentation only; the real check is `requireAdmin()`.
 */

const STATUS_TONE: Record<InquiryStatusValue, string> = {
  NEW: "border-glow/50 bg-glow/12 text-glow",
  CONTACTED: "border-ice/45 bg-ice/10 text-ice",
  QUOTED: "border-caution/45 bg-caution/10 text-caution",
  APPROVED: "border-stable/45 bg-stable/10 text-stable",
  REJECTED: "border-alert/45 bg-alert/10 text-alert",
  COMPLETED: "border-silver-dim/45 bg-silver-dim/10 text-silver",
};

export function InquiryStatusControl({
  inquiryId,
  reference,
  currentStatus,
  initialNotes,
}: {
  inquiryId: string;
  reference: string;
  currentStatus: InquiryStatusValue;
  initialNotes?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [notesOpen, setNotesOpen] = useState(false);

  function changeStatus(next: InquiryStatusValue) {
    setResult(null);
    startTransition(async () => {
      const outcome = await updateInquiryStatus({
        inquiryId,
        status: next,
        internalNotes: notes.trim() || undefined,
      });
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  function saveNotes() {
    setResult(null);
    startTransition(async () => {
      // Saving notes re-asserts the current status, which is a no-op write for
      // the status column but persists the notes through the same audited path.
      const outcome = await updateInquiryStatus({
        inquiryId,
        status: currentStatus,
        internalNotes: notes.trim(),
      });
      setResult(
        outcome.ok ? { ok: true, message: "Notes saved." } : outcome,
      );
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <div className="min-w-0">
      {/* --- Status buttons --- */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Status for ${reference}`}>
        {INQUIRY_STATUSES.map((status) => {
          const active = status === currentStatus;
          return (
            <button
              key={status}
              type="button"
              onClick={() => changeStatus(status)}
              disabled={isPending || active}
              aria-pressed={active}
              className={cn(
                "rounded-[2px] border px-2.5 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase",
                "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none",
                active
                  ? cn(STATUS_TONE[status], "cursor-default font-semibold")
                  : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                (isPending || active) && !active && "opacity-60",
                isPending && "cursor-wait",
              )}
            >
              {status}
            </button>
          );
        })}

        {isPending ? (
          <span className="flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
            <Loader2 size={11} strokeWidth={2} aria-hidden className="animate-spin" />
            Processing…
          </span>
        ) : null}
      </div>

      {/* --- Internal notes --- */}
      <div className="mt-3">
        {notesOpen ? (
          <div className="space-y-2.5">
            <label className="block">
              <span className="tj-label mb-1.5 block">Internal notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 2000))}
                rows={3}
                placeholder="Not visible to the client."
                disabled={isPending}
                className="w-full resize-y rounded-[2px] border border-hull-line bg-midnight/60 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-frost transition-colors duration-300 placeholder:text-silver-dim/55 hover:border-hull-raised focus:border-glow/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/35 disabled:opacity-60"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveNotes}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-[2px] border border-glow/45 bg-glow/10 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] text-glow uppercase transition-colors duration-300 hover:bg-glow/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={11} strokeWidth={2.2} aria-hidden />
                Save notes
              </button>
              <button
                type="button"
                onClick={() => setNotesOpen(false)}
                disabled={isPending}
                className="rounded-[2px] px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase transition-colors duration-300 hover:text-silver disabled:opacity-60"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase transition-colors duration-300 hover:text-glow"
          >
            {initialNotes ? "Edit internal notes" : "Add internal note"}
          </button>
        )}
      </div>

      {/* --- Result (§39) --- */}
      {result ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 flex items-start gap-2 text-[0.75rem] leading-relaxed",
            result.ok ? "text-stable" : "text-alert",
          )}
        >
          {result.ok ? (
            <Check size={13} strokeWidth={2.2} aria-hidden className="mt-px shrink-0" />
          ) : (
            <CircleAlert size={13} strokeWidth={2} aria-hidden className="mt-px shrink-0" />
          )}
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
