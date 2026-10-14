"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utilities/cn";

/**
 * SHOWCASE CAROUSEL — a cinematic, crossfading environment slider.
 * ---------------------------------------------------------------------------
 * Full-bleed plates cross-fade with a slow settle, each carrying its own
 * caption plate. Auto-advance pauses on hover/focus and when the tab is
 * hidden, and is disabled entirely under `prefers-reduced-motion` (§37) —
 * where slides change only by explicit control. Real buttons, arrow-key
 * operable, labelled as a carousel for assistive tech.
 */

export type ShowcaseSlide = {
  src: string;
  alt: string;
  title: string;
  caption: string;
  tag?: string;
};

const DWELL_MS = 6500;

export function ShowcaseCarousel({
  slides,
  label = "Environment showcase",
  className,
}: {
  slides: ShowcaseSlide[];
  label?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const active = slides[index] ?? slides[0];

  const go = useCallback(
    (next: number) => {
      setIndex((prev) => {
        const value = ((next % count) + count) % count;
        return value === prev ? prev : value;
      });
    },
    [count],
  );

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const timer = window.setTimeout(() => setIndex((prev) => (prev + 1) % count), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced, count]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!active) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn(
        "relative h-[56vh] min-h-[380px] overflow-hidden rounded-3xl border border-hull-line/70",
        "shadow-[0_28px_80px_-32px_rgba(4,7,29,0.9)]",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1);
        }
      }}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={active.src}
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: reduced ? 1.06 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={active.src}
            alt={active.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* scrims */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.92),rgba(4,7,29,0.18)_48%,rgba(4,7,29,0.3))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_115%,rgba(126,62,34,0.14),transparent_62%)]"
      />

      {/* caption plate */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.src}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass max-w-lg rounded-xl border border-hull-line/60 p-5"
          >
            {active.tag ? (
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-ice uppercase">
                {active.tag}
              </p>
            ) : null}
            <p className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-frost sm:text-2xl">
              {active.title}
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-silver">
              {active.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className={cn(
              "glass flex size-11 items-center justify-center rounded-full border border-hull-line/70",
              "text-silver transition-colors duration-300 hover:border-ice/50 hover:text-frost",
              "focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none",
            )}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <span
            aria-live="polite"
            className="glass rounded-full border border-hull-line/70 px-4 py-2 font-mono text-[0.625rem] tracking-[0.18em] text-silver tabular"
          >
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className={cn(
              "glass flex size-11 items-center justify-center rounded-full border border-hull-line/70",
              "text-silver transition-colors duration-300 hover:border-ice/50 hover:text-frost",
              "focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none",
            )}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
