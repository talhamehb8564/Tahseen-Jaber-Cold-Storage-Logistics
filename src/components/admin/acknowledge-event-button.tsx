"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { acknowledgeEvent } from "@/lib/actions/admin";
import { cn } from "@/lib/utilities/cn";

/**
 * ACKNOWLEDGE EVENT (§28, §39)
 * ---------------------------------------------------------------------------
 * Closes out an open facility event through the audited Server Action. Shows a
 * pending state and reports the outcome inline — acknowledging an alarm is exactly
 * the kind of action that must never appear to succeed when it did not.
 */
export function AcknowledgeEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function acknowledge() {
    setError(null);
    startTransition(async () => {
      const result = await acknowledgeEvent({ eventId });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={acknowledge}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5",
          "font-mono text-[0.5rem] tracking-[0.14em] uppercase",
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "border-glow/45 bg-glow/10 text-glow hover:bg-glow/18",
          "focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isPending ? (
          <>
            <Loader2 size={11} strokeWidth={2.2} aria-hidden className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Check size={11} strokeWidth={2.4} aria-hidden />
            Acknowledge
          </>
        )}
      </button>

      {error ? (
        <p role="alert" className="mt-2 max-w-[14rem] text-[0.6875rem] leading-relaxed text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
