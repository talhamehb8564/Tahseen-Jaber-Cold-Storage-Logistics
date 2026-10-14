"use client";

import { ChevronDown, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { HeroSlider } from "@/components/hero/hero-slider";
import { TemperatureController } from "@/components/hero/temperature-controller";
import { TemperatureHud } from "@/components/hero/temperature-hud";
import { Cta } from "@/components/ui/cta";
import { WordReveal } from "@/components/ui/reveal";
import { primaryCta, secondaryCta, siteConfig } from "@/lib/site";

/**
 * HERO — high-definition facility slider (§10–§14)
 * ---------------------------------------------------------------------------
 * The visitor arrives standing inside the cold store: cinematic plates of the
 * real facility cross-fade behind the headline with parallax depth, and the
 * whole frame responds to the chamber set point in the instruments column.
 *
 * WHAT DRIVES WHAT
 *   HeroSlider            plates, parallax, Ken Burns, mist-burst transitions
 *   WordReveal            the headline arrives word by word out of a line mask
 *   TemperatureHud        glassmorphic telemetry, pulsing system chip
 *   TemperatureController the drag input; its value freezes/thaws the plates
 *
 * The cinematic truck-docking sequence lives in its own section immediately
 * below (`ColdChainArrival`), where it can play full-frame without competing
 * with the photography here.
 *
 * LCP (§35): the first plate is `priority`, and the headline is real text in the
 * server HTML rather than a canvas or a masked placeholder, so the largest
 * element on the page paints without waiting on JavaScript. Nothing here holds
 * content hostage to an animation — there is no intro to skip (§33).
 */

const HERO_LINES = [
  siteConfig.brand.wordmarkLine1,
  siteConfig.brand.wordmarkLine2,
  siteConfig.brand.wordmarkLine3,
] as const;

export function Hero() {
  const reduced = useReducedMotion();
  const [temperature, setTemperature] = useState(-18.4);
  const [mounted, setMounted] = useState(false);

  // Gate the entrance choreography on mount so the server HTML is never
  // animated from a hidden state (which would flash on hydration).
  useEffect(() => setMounted(true), []);

  const enter = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 18 },
    animate: mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: reduced ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] as const, delay: reduced ? 0 : delay },
  });

  return (
    <section
      className="relative isolate min-h-svh w-full overflow-hidden bg-midnight"
      aria-labelledby="hero-heading"
    >
      {/* ================= HD PLATE SLIDER ================= */}
      <HeroSlider temperature={temperature} visible={mounted} />

      {/* ================= OVERLAY CONTENT ================= */}
      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[86rem] flex-col justify-center px-5 pt-28 pb-32 sm:px-8 sm:pb-36 lg:px-12 lg:pt-32 lg:pb-40">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          {/* ---------------- Typography + CTAs ---------------- */}
          <div className="min-w-0">
            {/* Location — a verified fact, so it may state it plainly. */}
            <motion.p
              className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.625rem] tracking-[0.24em] text-silver-dim uppercase"
              {...enter(0)}
            >
              <MapPin size={13} strokeWidth={1.6} aria-hidden className="text-glow" />
              {siteConfig.location.facility}
              <span aria-hidden className="text-hull-line">
                ·
              </span>
              {siteConfig.location.city}, {siteConfig.location.country}
            </motion.p>

            <h1 id="hero-heading" className="tj-display mt-5">
              {/* Line 1 — the house name, set wide and small: architectural. */}
              <WordReveal
                as="span"
                text={HERO_LINES[0]}
                start={mounted}
                delay={0.05}
                stagger={0.07}
                className="block text-[clamp(0.95rem,2.4vw,1.5rem)] font-semibold tracking-[0.34em] text-ice"
              />

              {/* Lines 2–3 — the scale that carries the WOW. */}
              <WordReveal
                as="span"
                text={HERO_LINES[1]}
                start={mounted}
                delay={0.2}
                className="tj-frost-text mt-1.5 block text-[clamp(2.5rem,8.6vw,7rem)] sm:mt-2.5"
              />
              <WordReveal
                as="span"
                text={HERO_LINES[2]}
                start={mounted}
                delay={0.34}
                className="glass-text mt-0.5 block text-[clamp(2.5rem,8.6vw,7rem)]"
              />
            </h1>

            {/* Supporting line — §12. Verified wording only. */}
            <motion.p
              className="mt-6 max-w-xl text-base leading-relaxed text-silver sm:mt-7 sm:text-lg"
              {...enter(0.5)}
            >
              {siteConfig.brand.tagline}
            </motion.p>

            {/* CTAs — §14 */}
            <motion.div
              className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4"
              {...enter(0.62)}
            >
              <Cta href={primaryCta.href} size="lg" variant="primary">
                {primaryCta.label}
              </Cta>
              <Cta href={secondaryCta.href} size="lg" variant="secondary" magnetic={false}>
                {secondaryCta.label}
              </Cta>
            </motion.div>
          </div>

          {/* ---------------- Instruments ---------------- */}
          <div className="flex flex-col gap-4 lg:gap-5">
            <TemperatureHud
              temperature={temperature}
              visible={mounted}
              className="lg:self-end"
            />

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: reduced ? 0 : 0.85,
                ease: [0.16, 1, 0.3, 1],
                delay: reduced ? 0 : 0.72,
              }}
            >
              <TemperatureController
                value={temperature}
                onChange={setTemperature}
                compact
              />
            </motion.div>
          </div>
        </div>

        {/* ---------------- Scroll cue ---------------- */}
        <motion.div
          className="mt-12 flex items-center gap-3 lg:mt-14"
          initial={reduced ? false : { opacity: 0 }}
          animate={mounted ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.9 }}
        >
          <Link
            href="#arrival"
            className="group flex items-center gap-3 font-mono text-[0.5625rem] tracking-[0.24em] text-silver-dim uppercase transition-colors duration-300 hover:text-glow"
            aria-label="Scroll to the arrival sequence"
          >
            <span className="relative flex h-8 w-5 items-start justify-center rounded-full border border-glow/30 pt-1.5">
              <motion.span
                className="size-1 rounded-full bg-glow"
                style={{ boxShadow: "0 0 8px #8f7bff" }}
                animate={reduced ? undefined : { y: [0, 10, 0], opacity: [1, 0.25, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            Begin the sequence
            <ChevronDown
              size={13}
              strokeWidth={1.7}
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-y-0.5"
            />
          </Link>
          <span
            aria-hidden
            className="h-px flex-1 bg-gradient-to-r from-glow/40 via-hull-line to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
