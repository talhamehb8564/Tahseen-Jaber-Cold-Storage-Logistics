import { Snowflake } from "lucide-react";

/**
 * ROUTE LOADING STATE (§39, §51)
 * ---------------------------------------------------------------------------
 * Shown while a route segment streams. Rather than a spinner on an empty page,
 * this holds the section's rhythm: the header block and a frosted panel skeleton
 * with a cold shimmer crossing it, so the layout does not jump when the real
 * content lands.
 *
 * Deliberately dependency-free — no client JavaScript, no animation library. It
 * is pure CSS so it paints immediately, which is the whole point of a loading
 * state. Reduced motion disables the shimmer via globals.css.
 */
export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
    >
      <p className="sr-only">Loading section…</p>

      {/* ---------------- Header skeleton ---------------- */}
      <div className="max-w-2xl">
        <div className="tj-skeleton h-3 w-28 rounded-full" />
        <div className="tj-skeleton mt-5 h-9 w-3/4 rounded-[3px]" />
        <div className="tj-skeleton mt-3 h-9 w-1/2 rounded-[3px]" />
        <div className="tj-skeleton mt-6 h-3.5 w-full rounded-full" />
        <div className="tj-skeleton mt-2.5 h-3.5 w-5/6 rounded-full" />
      </div>

      {/* ---------------- Panel skeleton ---------------- */}
      <div className="glass tj-corners relative mt-14 overflow-hidden rounded-[4px] p-6 sm:p-8">
        {/* Cold shimmer crossing the glass. */}
        <span
          aria-hidden
          className="tj-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
          style={{
            background:
              "linear-gradient(100deg, transparent, rgba(182,106,60,0.10), transparent)",
          }}
        />

        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[3px] border border-glow/25 bg-glow/8">
            <Snowflake
              size={15}
              strokeWidth={1.6}
              aria-hidden
              className="animate-breathe text-glow"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="tj-skeleton h-3 w-40 rounded-full" />
            <div className="tj-skeleton mt-2 h-2.5 w-24 rounded-full" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2.5">
              <div className="tj-skeleton h-2.5 w-20 rounded-full" />
              <div className="tj-skeleton h-6 w-28 rounded-[3px]" />
              <div className="tj-skeleton h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="tj-skeleton h-11 w-full rounded-[3px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
