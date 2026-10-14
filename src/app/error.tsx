"use client";

import { RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

import { ColdPool } from "@/components/global/cold-atmosphere";

/**
 * ROUTE ERROR BOUNDARY (§38, §39)
 * ---------------------------------------------------------------------------
 * Catches a render failure in a route segment and offers a retry, so one broken
 * panel cannot take the whole page down.
 *
 * §38 — the error object is logged for whoever is debugging, and NEVER rendered.
 * A visitor must not be shown a stack trace, an internal message or a hint about
 * the server. What they get is a plain statement that something failed and a
 * control to try again.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Surfaced in the browser console / monitoring only, never in the DOM.
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main className="relative flex min-h-[70svh] flex-col items-center justify-center overflow-hidden px-5 py-28 sm:px-8">
      <ColdPool intensity={0.55} hue="ice" />

      <div className="glass-strong tj-corners relative w-full max-w-lg rounded-[4px] p-8 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-alert/45 bg-alert/12">
          <ShieldAlert size={20} strokeWidth={1.7} aria-hidden className="text-alert" />
        </span>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em] text-frost uppercase sm:text-3xl">
          Something interrupted this section
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-silver sm:text-base">
          The rest of the facility plan is unaffected. Try loading this section
          again — if it keeps failing, send your requirement through the enquiry
          form and we will follow up directly.
        </p>

        {/* §39 — an honest recovery path, not a fabricated status message. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="group inline-flex items-center justify-center gap-2.5 rounded-[2px] bg-glow px-6 py-3.5 font-display text-[0.75rem] font-bold tracking-[0.16em] text-midnight uppercase shadow-[0_12px_34px_-14px_rgba(182,106,60,0.9)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ice active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none"
          >
            <RotateCcw
              size={15}
              strokeWidth={2.2}
              aria-hidden
              className="transition-transform duration-500 group-hover:-rotate-180"
            />
            Try again
          </button>

          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-[2px] border border-hull-line bg-midnight/40 px-6 py-3.5 font-display text-[0.75rem] font-bold tracking-[0.16em] text-silver uppercase backdrop-blur-md transition-colors duration-300 hover:border-glow/50 hover:text-frost focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none"
          >
            Contact us
          </a>
        </div>

        {/* The digest is a correlation id, safe to show and useful in support. */}
        {error.digest ? (
          <p className="mt-7 font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
            Reference {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
