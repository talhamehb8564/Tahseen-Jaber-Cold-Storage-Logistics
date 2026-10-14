"use client";

import { SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { HeroStage, readSeenFlag, type HeroPhase } from "@/components/hero/hero-stage";
import { TemperatureController } from "@/components/hero/temperature-controller";
import { cn } from "@/lib/utilities/cn";

/**
 * ARRIVAL SEQUENCE — the truck docks, the chamber opens
 * ---------------------------------------------------------------------------
 * The cinematic that opens the cold chain, given a full frame of its own below
 * the photographic hero: a reefer trailer arrives, reverses onto the bay, the
 * door retracts with a cyan mist blast, and the pallets are taken in.
 *
 * SCENE → COPY
 *   Each phase of the GSAP timeline surfaces a line of narration, so the visitor
 *   is told what the business is doing rather than watching shapes move. The
 *   copy is factual description of the sequence on screen — no invented
 *   capacity, throughput or certification (§45).
 *
 * SEEN BEFORE
 *   The timeline plays once per session (`sessionStorage`). A returning visitor
 *   starts already docked, and SKIP / Escape are available from the first frame
 *   so nobody is made to wait (§33). Reduced-motion users get the finished
 *   state with no animation at all (§07, §37).
 */

const NARRATION: Record<HeroPhase, { step: string; text: string }> = {
  idle: { step: "STANDBY", text: "Facility standing by." },
  darkness: { step: "SCENE 01", text: "The yard is dark. The chamber is holding temperature." },
  atmosphere: { step: "SCENE 02", text: "Bay lighting comes up across the dock face." },
  arrival: { step: "SCENE 03", text: "A refrigerated trailer arrives at the gate." },
  docking: { step: "SCENE 04", text: "The trailer reverses onto the sealed dock." },
  door: { step: "SCENE 05", text: "The door retracts. Cold air vents across the apron." },
  cargo: { step: "SCENE 06", text: "Pallets are taken in and tagged to their zone." },
  active: { step: "SCENE 07", text: "The chamber is live and monitoring." },
};

export function ArrivalSequence() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const [temperature, setTemperature] = useState(-18.4);
  const [skipToken, setSkipToken] = useState(0);
  const [booted, setBooted] = useState(false);
  const [alreadySeen, setAlreadySeen] = useState(false);

  // Read the session flag once, before the timeline is built.
  useEffect(() => {
    setAlreadySeen(readSeenFlag());
    setBooted(true);
  }, []);

  // Escape jumps to the docked state, same as SKIP.
  useEffect(() => {
    if (phase === "active") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSkipToken((token) => token + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const introRunning = !reduced && phase !== "active" && booted;
  const narration = NARRATION[phase] ?? NARRATION.idle;

  return (
    <div id="arrival" className="relative scroll-mt-24">
      {/* ---------------- Stage ---------------- */}
      <div className="relative isolate overflow-hidden border-y border-hull-line/60">
        <HeroStage
          temperature={temperature}
          phase={phase}
          onPhaseChange={setPhase}
          skipToken={skipToken}
          alreadySeen={alreadySeen}
          booted={booted}
        />

        {/* Narration + skip, floating over the scene on heavy glass. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-12">
            <div className="glass tj-corners pointer-events-auto max-w-xl rounded-[4px] px-4 py-3">
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-glow uppercase">
                {narration.step}
              </p>
              <motion.p
                key={narration.text}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-1.5 text-sm leading-relaxed text-silver"
                aria-live="polite"
              >
                {narration.text}
              </motion.p>
            </div>

            <div
              className={cn(
                "pointer-events-auto transition-opacity duration-500",
                introRunning ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <button
                type="button"
                onClick={() => setSkipToken((token) => token + 1)}
                className={cn(
                  "glass group inline-flex items-center gap-2 rounded-[4px] px-3.5 py-2.5",
                  "font-mono text-[0.5625rem] tracking-[0.2em] text-silver uppercase",
                  "transition-colors duration-300 hover:text-glow",
                  "focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none",
                )}
              >
                <SkipForward
                  size={12}
                  strokeWidth={1.8}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
                Skip sequence
                <span className="normal-case tracking-normal opacity-60">(Esc)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Set point ---------------- */}
      {/* The same control as the hero, driving this scene's lighting and frost. */}
      <div className="mx-auto w-full max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-center lg:gap-12">
          <TemperatureController value={temperature} onChange={setTemperature} compact />
          <div className="min-w-0">
            <p className="tj-label tj-label-glow">Drive the chamber</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver sm:text-base">
              Every reading on this page is an illustrative demonstration of the
              monitoring interface — not a live feed from the facility. Drag the
              set point and the scene, the instruments and the frost response all
              move together, because they are reading one value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
