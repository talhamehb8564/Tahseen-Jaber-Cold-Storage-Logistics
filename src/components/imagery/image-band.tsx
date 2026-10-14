import Image from "next/image";

import { cn } from "@/lib/utilities/cn";

/**
 * ImageBand — a full-bleed cinematic still with scroll parallax.
 * ---------------------------------------------------------------------------
 * Server-safe (§35): the drift is applied to the `data-parallax` attribute by
 * the global ScrollFx engine, so this component ships zero JavaScript. The
 * plate is over-scaled 1.25× so ±84px of travel never exposes an edge.
 *
 * Under reduced motion the image simply sits still — nothing is hidden.
 */
export function ImageBand({
  src,
  alt,
  eyebrow,
  title,
  caption,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tj-panel-shine group relative h-[46vh] min-h-[340px] overflow-hidden rounded-2xl border border-hull-line/60",
        "shadow-[0_28px_80px_-32px_rgba(4,7,29,0.9)] md:h-[58vh]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="scale-[1.25] object-cover"
        data-parallax="0.4"
      />

      {/* Legibility scrims — the plate is atmosphere, not a text background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.92),rgba(4,7,29,0.25)_46%,rgba(4,7,29,0.38))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_110%,rgba(76,194,255,0.12),transparent_60%)]"
      />

      {/* Caption plate. */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <div className="glass max-w-xl rounded-xl border border-hull-line/60 p-5 sm:p-6">
          {eyebrow ? (
            <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-ice uppercase">{eyebrow}</p>
          ) : null}
          {title ? (
            <p className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-frost sm:text-2xl">
              {title}
            </p>
          ) : null}
          {caption ? (
            <p className="mt-2 max-w-md text-[0.8125rem] leading-relaxed text-silver">{caption}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
