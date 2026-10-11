import { cn } from "@/lib/utilities/cn";

/**
 * WORDMARK
 * ---------------------------------------------------------------------------
 * §45 lists "final logo artwork" as an outstanding content gap, so this is a
 * clean typographic mark built to be swapped for the client's artwork later.
 * It lives in exactly one file; replacing it is a one-component change.
 *
 * The glyph is a frost asterisk inside corner brackets — the same bracket
 * language used by `.tj-corners` across the whole product, so the mark and the
 * interface read as one system.
 */

interface WordmarkProps {
  className?: string;
  /** Show the two-line descriptor under the name. */
  descriptor?: boolean;
  size?: number;
}

export function WordmarkGlyph({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("shrink-0", className)}
    >
      {/* Corner brackets */}
      <g stroke="currentColor" strokeWidth="1.4" opacity="0.55" strokeLinecap="square">
        <path d="M1 9V1h8" />
        <path d="M39 9V1h-8" />
        <path d="M1 31v8h8" />
        <path d="M39 31v8h-8" />
      </g>

      {/* Frost asterisk: three axes through the centre */}
      <g stroke="url(#tj-mark)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M20 7.5v25" />
        <path d="M9.2 13.75 30.8 26.25" />
        <path d="M30.8 13.75 9.2 26.25" />
      </g>

      {/* Arm notches — what turns an asterisk into a crystal */}
      <g stroke="url(#tj-mark)" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <path d="M16.4 10.9 20 14.2l3.6-3.3" />
        <path d="M16.4 29.1 20 25.8l3.6 3.3" />
        <path d="M11.6 19.1 15.2 20l-1.5 3.6" />
        <path d="M28.4 20.9 24.8 20l1.5-3.6" />
      </g>

      {/* Core */}
      <circle cx="20" cy="20" r="2.1" fill="currentColor" opacity="0.9" />

      <defs>
        <linearGradient id="tj-mark" x1="20" y1="6" x2="20" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eafcff" />
          <stop offset="0.55" stopColor="#48cae4" />
          <stop offset="1" stopColor="#00f5d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Wordmark({ className, descriptor = true, size = 34 }: WordmarkProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <WordmarkGlyph size={size} className="text-ice" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-bold tracking-[-0.01em] text-frost uppercase">
          Tahseen Jaber
        </span>
        {descriptor ? (
          <span className="mt-1 font-mono text-[0.5rem] font-medium tracking-[0.26em] text-silver-dim uppercase">
            Cold Storage &amp; Logistics
          </span>
        ) : null}
      </span>
    </span>
  );
}
