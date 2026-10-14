import { Compass, ThermometerSnowflake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ColdPool } from "@/components/global/cold-atmosphere";

/**
 * NOT FOUND (§38, §51)
 * ---------------------------------------------------------------------------
 * A dead end should still feel like the facility: frosted glass, cold light and
 * a way out. It must never read as a stack trace or a bare browser page.
 *
 * §38 — nothing about the server, the stack or the route table is exposed. The
 * copy states only that the area is not part of the published plan, and offers
 * real destinations.
 */

export const metadata: Metadata = {
  title: "Area not found",
  robots: { index: false, follow: true },
};

/** Only routes that actually exist — a 404 must not offer another dead end. */
const DESTINATIONS = [
  { href: "/", label: "Facility overview", note: "The cold chain, start to finish" },
  { href: "/products", label: "Product environments", note: "Produce, protein, seafood, pharma" },
  { href: "/facility", label: "Facility & zones", note: "The plan, bay by bay" },
  { href: "/request-storage", label: "Request storage", note: "Tell us the requirement" },
] as const;

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-28 sm:px-8">
      <ColdPool intensity={0.7} hue="ice" />

      {/* Frost creep from the corners — the room is colder than usual. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 40% at 0% 0%, rgba(233,243,255,0.14), transparent 70%)," +
            "radial-gradient(46% 38% at 100% 100%, rgba(76,194,255,0.12), transparent 72%)",
        }}
      />

      <div className="relative w-full max-w-2xl text-center">
        <p className="flex items-center justify-center gap-2 font-mono text-[0.625rem] tracking-[0.28em] text-glow uppercase">
          <ThermometerSnowflake size={13} strokeWidth={1.7} aria-hidden />
          404 · Off the plan
        </p>

        <h1 className="tj-display mt-6 text-[clamp(3rem,13vw,7rem)]">
          <span className="glass-text">Not found</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-silver">
          This area is not part of the published facility plan. Nothing has been
          lost — the link may be out of date, or the address mistyped.
        </p>

        {/* ---------------- Destinations ---------------- */}
        <div className="mt-11 grid gap-3 text-left sm:grid-cols-2">
          {DESTINATIONS.map((destination) => (
            <Link
              key={destination.href}
              href={destination.href}
              className="glass tj-corners group rounded-[3px] p-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-glow/55 hover:shadow-[0_0_34px_rgba(143,123,255,0.22)] focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none"
              data-cursor="explore"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-[0.8125rem] font-bold tracking-[0.06em] text-frost uppercase">
                  {destination.label}
                </span>
                <Compass
                  size={14}
                  strokeWidth={1.7}
                  aria-hidden
                  className="shrink-0 text-silver-dim transition-all duration-300 group-hover:rotate-45 group-hover:text-glow"
                />
              </span>
              <span className="mt-1.5 block font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
                {destination.note}
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 font-mono text-[0.5625rem] tracking-[0.18em] text-silver-dim uppercase">
          Reference format for storage enquiries: TJ-XXXXX
        </p>
      </div>
    </main>
  );
}
