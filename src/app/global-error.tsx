"use client";

import { RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

import "@/app/globals.css";

/**
 * GLOBAL ERROR BOUNDARY (§38)
 * ---------------------------------------------------------------------------
 * The last line of defence: it replaces the root layout entirely, which means it
 * must render its own `<html>` and `<body>` and bring its own stylesheet — none
 * of the layout's chrome, fonts link or atmosphere layers exist at this point.
 *
 * Styling is kept to a handful of utility classes rather than the component
 * system, because whatever broke may well have broken a component. §38 holds
 * here more than anywhere: the error is logged and never rendered.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <body className="bg-[#04071d] font-sans text-[#97a6cc] antialiased">
        <main
          className="relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-20"
          style={{
            background:
              "radial-gradient(120% 90% at 50% -10%, #152355 0%, #0b1034 44%, #04071d 80%)",
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-[4px] border border-[rgba(143,123,255,0.28)] p-8 text-center backdrop-blur-2xl sm:p-10"
            style={{
              background:
                "linear-gradient(158deg, rgba(18,29,72,0.80), rgba(4,7,29,0.92))",
              boxShadow:
                "0 0 46px rgba(143,123,255,0.16), 0 40px 90px -36px rgba(0,0,0,1)",
            }}
          >
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.12)]">
              <ShieldAlert size={20} strokeWidth={1.7} aria-hidden className="text-[#ef4444]" />
            </span>

            <h1 className="mt-6 text-2xl font-bold tracking-[-0.02em] text-[#e9f3ff] uppercase sm:text-3xl">
              The site hit a fault
            </h1>

            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              Something failed while rendering this page. No data has been lost.
              Reload to try again — if the fault persists, contact the facility
              directly and your requirement will be handled by hand.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2.5 rounded-[2px] bg-[#8f7bff] px-6 py-3.5 text-[0.75rem] font-bold tracking-[0.16em] text-[#04071d] uppercase transition-colors duration-300 hover:bg-[#4cc2ff] focus-visible:ring-2 focus-visible:ring-[#8f7bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04071d] focus-visible:outline-none"
              >
                <RotateCcw size={15} strokeWidth={2.2} aria-hidden />
                Try again
              </button>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-[2px] border border-[rgba(28, 26, 89,0.9)] px-6 py-3.5 text-[0.75rem] font-bold tracking-[0.16em] text-[#97a6cc] uppercase transition-colors duration-300 hover:border-[rgba(143,123,255,0.5)] hover:text-[#e9f3ff] focus-visible:ring-2 focus-visible:ring-[#8f7bff] focus-visible:outline-none"
              >
                Back to start
              </a>
            </div>

            {error.digest ? (
              <p className="mt-7 font-mono text-[0.5625rem] tracking-[0.14em] text-[#6d7aa8] uppercase">
                Reference {error.digest}
              </p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
