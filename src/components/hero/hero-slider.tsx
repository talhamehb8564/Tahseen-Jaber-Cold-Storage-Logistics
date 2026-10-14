"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { temperatureShift } from "@/animations/variants";
import { cn } from "@/lib/utilities/cn";

/**
 * HERO SLIDER — high-definition facility imagery
 * ---------------------------------------------------------------------------
 * Three cinematic plates of the facility cross-fade behind the headline. The
 * slider is not a slideshow bolted onto the page: it is wired into the same
 * systems as everything else on screen.
 *
 *   PARALLAX      two independent layers — the stack drifts on scroll, and the
 *                 plate itself shifts against the pointer, so the room has depth
 *                 rather than sitting flat behind the type.
 *   KEN BURNS     the active plate breathes outward over its whole dwell time,
 *                 which is what stops a static photograph reading as a hero
 *                 background image.
 *   TEMPERATURE   the frost veil, ice-crystal edges and colour grade all read
 *                 from the chamber set point (§13). Drag to −30 °C and the
 *                 plates freeze over; drag to +10 °C and the frost lifts.
 *   MIST BLAST    each transition vents a cyan mist burst across the plate —
 *                 the door-whoosh motif carried into the slider.
 *
 * ACCESSIBILITY (§37)
 *   The plates are decorative: the same information is available as text in the
 *   slide caption, and the control strip is a real labelled tablist. Auto-advance
 *   pauses on hover, on focus within, and when the tab is hidden, and is disabled
 *   entirely under `prefers-reduced-motion` — where the visitor changes slides
 *   themselves instead.
 */

interface Slide {
  src: string;
  alt: string;
  caption: string;
  zone: string;
  /** Where the plate's vanishing point sits, for the parallax bias. */
  focus: { x: number; y: number };
}

const SLIDES: Slide[] = [
  {
    src: "/assets/warehouse-hero-interior.jpg",
    alt: "Interior of a temperature-controlled cold store: tall pallet racking under cyan industrial lighting, with vapour hanging in the air.",
    caption: "CHAMBER INTERIOR",
    zone: "ZONE C-04",
    focus: { x: 0.5, y: 0.42 },
  },
  {
    src: "/assets/facility-exterior-night.jpg",
    alt: "The cold storage facility exterior at night: a row of illuminated loading dock doors with refrigerated trucks backed in under an indigo sky.",
    caption: "THE MAIN GATE",
    zone: "DOCK ROW",
    focus: { x: 0.5, y: 0.5 },
  },
  {
    src: "/assets/control-room-ops.jpg",
    alt: "The facility monitoring control room at night, walls of glowing screens tracking zone temperatures.",
    caption: "CONTROL ROOM",
    zone: "OPS CENTER",
    focus: { x: 0.55, y: 0.46 },
  },
  {
    src: "/assets/truck-refrigerated-dock.jpg",
    alt: "A refrigerated trailer backed onto a sealed loading dock bay at night, mist spilling from the open doorway.",
    caption: "DOCKING BAY",
    zone: "BAY 02",
    focus: { x: 0.62, y: 0.5 },
  },
  {
    src: "/assets/automated-racking.jpg",
    alt: "High-bay automated racking aisle in a cold storage facility, lit in frost blue with floor-level fog.",
    caption: "HIGH-BAY RACKING",
    zone: "AISLE 07",
    focus: { x: 0.45, y: 0.46 },
  },
];

const DWELL_MS = 7200;
/** Plates are inset and over-scaled so parallax never exposes an edge. */
const PLATE_INSET = "-8%";

interface HeroSliderProps {
  /** Chamber set point in °C; drives the frost response (§13). */
  temperature: number;
  /** Lets a parent reveal the plates at the right beat in the sequence. */
  visible?: boolean;
}

export function HeroSlider({ temperature, visible = true }: HeroSliderProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);

  const stackRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  const look = temperatureShift(temperature);

  /* ------------------------------------------------------- scroll parallax --- */
  const { scrollY } = useScroll();
  const stackY = useTransform(scrollY, [0, 900], [0, reduced ? 0 : 220]);

  /* --------------------------------------------------------- auto-advance --- */
  const advance = useCallback((next?: number) => {
    setIndex((prev) => {
      const value = next ?? (prev + 1) % SLIDES.length;
      return value === prev ? prev : value;
    });
  }, []);

  /* Vent a mist burst whenever the plate actually changes. Kept out of the
     setIndex updater — state updaters must stay pure. */
  const booted = useRef(false);
  useEffect(() => {
    if (!booted.current) {
      booted.current = true;
      return;
    }
    setBurst((count) => count + 1);
  }, [index]);

  useEffect(() => {
    if (reduced || paused || !visible) return;
    const timer = window.setTimeout(() => advance(), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced, visible, advance]);

  // Never spend frames animating a tab nobody is looking at.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* ------------------------------------------------------ pointer parallax --- */
  useEffect(() => {
    if (reduced) return;

    const onMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    const tick = () => {
      // Eased toward the target so the room settles instead of snapping.
      current.current.x += (pointer.current.x - current.current.x) * 0.045;
      current.current.y += (pointer.current.y - current.current.y) * 0.045;
      if (pointerRef.current) {
        const { x, y } = current.current;
        pointerRef.current.style.transform =
          `translate3d(${(-x * 26).toFixed(2)}px, ${(-y * 16).toFixed(2)}px, 0)`;
      }
      frame.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [reduced]);

  /* ------------------------------------------------------- keyboard arrows --- */
  const onStripKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    advance((index + delta + SLIDES.length) % SLIDES.length);
  };

  const active = SLIDES[index]!;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* ================= PLATE STACK ================= */}
      <motion.div
        ref={stackRef}
        className="absolute inset-0"
        style={{ y: stackY }}
        aria-hidden
      >
        <div ref={pointerRef} className="absolute" style={{ inset: PLATE_INSET }}>
          {SLIDES.map((slide, position) => {
            const isActive = position === index;
            return (
              <div
                key={slide.src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[1400ms]",
                  "ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              >
                {/* Ken Burns: the plate breathes for as long as it is on screen. */}
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={
                    reduced || !isActive
                      ? { scale: 1.04 }
                      : {
                          scale: [1.04, 1.16],
                          x: [`${(0.5 - slide.focus.x) * -2}%`, `${(0.5 - slide.focus.x) * 2}%`],
                        }
                  }
                  transition={{ duration: DWELL_MS / 1000, ease: "linear" }}
                >
                  <Image
                    src={slide.src}
                    alt=""
                    fill
                    priority={position === 0}
                    sizes="100vw"
                    className="object-cover"
                    // Colder set points pull the grade toward ice; warmer ones
                    // let the plate's own steel tones through (§13).
                    style={{
                      filter: `saturate(${(0.78 + look.frost * 0.5).toFixed(2)}) contrast(1.08) brightness(${(0.62 + look.frost * 0.12).toFixed(2)})`,
                    }}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ================= TEMPERATURE-DRIVEN FROST ================= */}
      {/* Opacity is bound to the cold factor, so dragging the set point visibly
          freezes or thaws the photograph behind the type. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: 0.18 + look.frost * 0.6,
          background:
            "radial-gradient(120% 78% at 50% 108%, rgba(233,243,255,0.30), transparent 58%)," +
            "radial-gradient(90% 60% at 8% 4%, rgba(76,194,255,0.20), transparent 62%)," +
            "radial-gradient(80% 54% at 96% 12%, rgba(143,123,255,0.16), transparent 64%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Ice-crystal creep in from the corners as the chamber deepens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-[900ms]"
        style={{
          opacity: look.frost * 0.85,
          background:
            "radial-gradient(46% 40% at 0% 0%, rgba(233,243,255,0.20), transparent 70%)," +
            "radial-gradient(42% 38% at 100% 0%, rgba(233,243,255,0.16), transparent 70%)," +
            "radial-gradient(52% 44% at 0% 100%, rgba(233,243,255,0.22), transparent 72%)," +
            "radial-gradient(48% 42% at 100% 100%, rgba(233,243,255,0.18), transparent 72%)",
        }}
      />

      {/* ================= MIST BLAST ON TRANSITION ================= */}
      {/* Keyed on the burst counter so it re-fires on every change of plate. */}
      {!reduced && burst > 0 ? (
        <motion.div
          key={burst}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0.55, scale: 0.86 }}
          animate={{ opacity: 0, scale: 1.22 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background:
              "radial-gradient(70% 60% at 50% 60%, rgba(143,123,255,0.28), transparent 68%)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      {/* ================= LEGIBILITY SCRIMS ================= */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(4,7,29,0.94)_0%,rgba(4,7,29,0.80)_32%,rgba(4,7,29,0.26)_60%,rgba(4,7,29,0.58)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(4,7,29,0.98),rgba(4,7,29,0.55)_46%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(to_bottom,rgba(4,7,29,0.90),transparent)]"
      />

      {/* ================= SLIDE CONTROLS ================= */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto w-full max-w-[86rem] px-5 pb-6 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between gap-6">
            {/* Caption — the text equivalent of the decorative plate. */}
            <div className="min-w-0">
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-silver-dim uppercase">
                {active.zone}
              </p>
              <motion.p
                key={active.caption}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-1 font-mono text-[0.6875rem] tracking-[0.2em] text-ice uppercase"
              >
                {active.caption}
              </motion.p>
            </div>

            {/* Tablist: real buttons, labelled, arrow-key operable. */}
            <div
              role="tablist"
              aria-label="Facility views"
              onKeyDown={onStripKeyDown}
              className="flex shrink-0 items-center gap-2"
            >
              {SLIDES.map((slide, position) => {
                const isActive = position === index;
                return (
                  <button
                    key={slide.src}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`View ${slide.caption}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => advance(position)}
                    className={cn(
                      "group relative h-8 w-14 overflow-hidden rounded-[3px] border",
                      "backdrop-blur-md transition-all duration-500",
                      "ease-[cubic-bezier(0.22,1,0.36,1)]",
                      "focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2",
                      "focus-visible:ring-offset-midnight focus-visible:outline-none",
                      isActive
                        ? "border-glow/60 bg-glow/10 shadow-[0_0_18px_rgba(143,123,255,0.28)]"
                        : "border-hull-line/70 bg-midnight/40 hover:border-ice/40",
                    )}
                  >
                    {/* Progress bar for the active plate. */}
                    {isActive && !reduced && !paused ? (
                      <motion.span
                        key={`${index}-${burst}`}
                        className="absolute inset-x-0 bottom-0 h-px bg-glow"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: DWELL_MS / 1000, ease: "linear" }}
                        style={{ transformOrigin: "left" }}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        "font-mono text-[0.5rem] tracking-[0.14em] transition-colors duration-300",
                        isActive
                          ? "text-glow"
                          : "text-silver-dim group-hover:text-ice",
                      )}
                    >
                      {String(position + 1).padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
