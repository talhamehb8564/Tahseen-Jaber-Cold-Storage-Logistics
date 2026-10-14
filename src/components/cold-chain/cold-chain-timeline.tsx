"use client";

import { useEffect, useRef, useState } from "react";

import { getGsap, type GsapScrollTrigger as ScrollTrigger } from "@/animations/gsap";
import { CatalogIcon } from "@/components/ui/catalog-icon";
import { useInView, useMediaQuery, useReducedMotion } from "@/hooks";
import { coldChainStages } from "@/lib/catalog";
import { cn } from "@/lib/utilities/cn";

/**
 * THE COLD CHAIN (§17)
 * ---------------------------------------------------------------------------
 * A pinned horizontal journey: ARRIVAL → RECEIVING → TEMPERATURE CONTROL →
 * STORAGE → MONITORING → DISPATCH. Scroll position drives a single progress
 * value; the connecting line draws from it and the active stage lights up.
 *
 * The point of §17 is comprehension without prose, so each stage carries a big
 * index, an icon, one sentence and three signal chips — the process is legible
 * at a glance even if nobody reads the sentence.
 *
 * RESPONSIVE (§34)
 *   Desktop: pinned horizontal track driven by ScrollTrigger.
 *   Mobile / reduced motion: an unpinned vertical rail that activates each stage
 *   as it enters the viewport. Same content, same line-draw metaphor, no pinning
 *   — pinned horizontal scrollers are hostile on a touch screen.
 *
 * React state is only updated when the ACTIVE INDEX changes, so scrubbing the
 * timeline never re-renders the tree on every frame.
 */

export function ColdChainTimeline() {
  const reduced = useReducedMotion();
  // Shared hook rather than a local copy (§41) — one source of truth for the
  // breakpoint that decides between pinned and vertical layouts.
  const isDesktop = useMediaQuery("(min-width: 1024px)", false);
  const pinned = isDesktop && !reduced;

  return (
    <section
      id="cold-chain"
      aria-labelledby="cold-chain-heading"
      className="relative border-y border-hull-line/60 bg-navy/30"
    >
      <div className="mx-auto w-full max-w-[86rem] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <header className="max-w-3xl">
          <p className="tj-eyebrow">
            <span className="text-silver-dim">02</span> The Cold Chain
          </p>
          <h2
            id="cold-chain-heading"
            className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)] font-bold tracking-[-0.035em] uppercase"
          >
            One unbroken
            <br />
            <span className="tj-frost-text">chain of custody</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-silver sm:text-lg">
            Six stages, one record. From the moment a vehicle reaches the gate to
            the moment a load is released, every step is performed against a batch
            reference so the history of a consignment can be followed end to end.
          </p>
        </header>
      </div>

      {pinned ? <PinnedTrack /> : <VerticalRail />}
    </section>
  );
}

/* ==========================================================================
   DESKTOP — pinned horizontal track
   ========================================================================== */

function PinnedTrack() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const lineRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    const { gsap, ScrollTrigger } = getGsap();
    const section = sectionRef.current;
    const line = lineRef.current;
    if (!section || !line) return;

    const total = coldChainStages.length;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${section.offsetWidth * 1.35}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: (self: ScrollTrigger) => {
        // Draw the connecting line directly — no React render per frame.
        line.style.transform = `scaleX(${self.progress})`;

        const index = Math.min(total - 1, Math.floor(self.progress * total));
        if (index !== activeRef.current) {
          activeRef.current = index;
          setActive(index);
        }
      },
    });

    return () => {
      trigger.kill();
      gsap.set(line, { clearProps: "transform" });
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative overflow-hidden">
      <div className="flex h-svh items-center">
        <div className="relative w-full px-5 sm:px-8 lg:px-12">
          {/* --- Progress rail ------------------------------------------- */}
          <div className="relative mx-auto mb-14 h-px w-full max-w-6xl bg-hull-line/70">
            <div
              ref={lineRef}
              className="absolute inset-0 origin-left bg-gradient-to-r from-ice to-glow"
              style={{ transform: "scaleX(0)" }}
            />
            {/* Stage nodes on the rail */}
            <div className="absolute inset-0 flex justify-between">
              {coldChainStages.map((stage, index) => {
                const reached = index <= active;
                return (
                  <span
                    key={stage.id}
                    className={cn(
                      "relative -top-[3.5px] size-[7px] rounded-full border transition-all duration-500",
                      reached
                        ? "border-glow bg-glow shadow-[0_0_12px_rgba(143,123,255,0.8)]"
                        : "border-hull-line bg-midnight",
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* --- Stage track ------------------------------------------------ */}
          <div className="mx-auto grid max-w-6xl grid-cols-6 gap-4">
            {coldChainStages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={index}
                active={index === active}
                reached={index <= active}
                layout="compact"
              />
            ))}
          </div>

          <p className="mx-auto mt-14 max-w-6xl font-mono text-[0.5625rem] tracking-[0.22em] text-silver-dim/70 uppercase">
            Scroll to advance the chain
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MOBILE / REDUCED MOTION — unpinned vertical rail
   ========================================================================== */

function VerticalRail() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <ol className="relative space-y-3 border-l border-hull-line/70 pl-6 sm:pl-8">
        {coldChainStages.map((stage, index) => (
          <VerticalStage key={stage.id} stage={stage} index={index} />
        ))}
      </ol>
    </div>
  );
}

function VerticalStage({
  stage,
  index,
}: {
  stage: (typeof coldChainStages)[number];
  index: number;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLLIElement>({ threshold: 0.4, once: false });

  return (
    <li ref={ref} className="relative">
      {/* Node on the rail */}
      <span
        aria-hidden
        className={cn(
          "absolute top-6 -left-[1.85rem] size-[9px] rounded-full border transition-all duration-500 sm:-left-[2.35rem]",
          inView
            ? "border-glow bg-glow shadow-[0_0_12px_rgba(143,123,255,0.8)]"
            : "border-hull-line bg-midnight",
        )}
      />

      <div
        className={cn(
          "tj-panel rounded-[2px] p-5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          inView
            ? "border-glow/35 opacity-100"
            : "opacity-55",
          !reduced && inView && "-translate-y-0",
        )}
      >
        <StageCardBody stage={stage} index={index} active={inView} layout="full" />
      </div>
    </li>
  );
}

/* ==========================================================================
   STAGE CARD
   ========================================================================== */

function StageCard({
  stage,
  index,
  active,
  reached,
  layout,
}: {
  stage: (typeof coldChainStages)[number];
  index: number;
  active: boolean;
  reached: boolean;
  layout: "compact" | "full";
}) {
  return (
    <div
      className={cn(
        "tj-panel relative rounded-[2px] p-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        layout === "compact" && "min-h-[17rem]",
        active
          ? "border-glow/45 bg-hull/55 shadow-[0_24px_60px_-30px_rgba(143,123,255,0.45)]"
          : reached
            ? "border-hull-line opacity-85"
            : "border-hull-line/60 opacity-45",
      )}
      aria-current={active ? "step" : undefined}
    >
      <StageCardBody stage={stage} index={index} active={active} layout={layout} />
    </div>
  );
}

function StageCardBody({
  stage,
  index,
  active,
  layout,
}: {
  stage: (typeof coldChainStages)[number];
  index: number;
  active: boolean;
  layout: "compact" | "full";
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "tabular font-mono text-[0.625rem] font-medium tracking-[0.2em] transition-colors duration-500",
            active ? "text-glow" : "text-silver-dim",
          )}
        >
          {stage.index}
        </span>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[2px] border transition-all duration-700",
            active
              ? "border-glow/50 bg-glow/12 text-glow shadow-[0_0_20px_-4px_rgba(143,123,255,0.6)]"
              : "border-hull-line bg-midnight/50 text-silver-dim",
          )}
        >
          <CatalogIcon name={stage.icon} size={17} strokeWidth={1.5} />
        </span>
      </div>

      <h3
        className={cn(
          "mt-4 font-display font-bold tracking-[-0.02em] uppercase transition-colors duration-500",
          layout === "compact" ? "text-base" : "text-lg",
          active ? "text-frost" : "text-silver",
        )}
      >
        {stage.title}
      </h3>

      <p
        className={cn(
          "mt-2.5 text-[0.8125rem] leading-relaxed text-silver-dim",
          layout === "compact" && "line-clamp-5",
        )}
      >
        {stage.summary}
      </p>

      {/* Signal chips — the at-a-glance comprehension layer (§17). */}
      <ul className={cn("mt-4 flex flex-wrap gap-1.5", layout === "compact" && "mt-auto pt-4")}>
        {stage.signals.map((signal) => (
          <li
            key={signal}
            className={cn(
              "rounded-[2px] border px-2 py-1 font-mono text-[0.5rem] tracking-[0.14em] uppercase transition-colors duration-500",
              active
                ? "border-glow/30 bg-glow/8 text-ice"
                : "border-hull-line/70 text-silver-dim/80",
            )}
          >
            {signal}
          </li>
        ))}
      </ul>

      {/* Active stage indicator */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-transparent via-glow to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          active ? "scale-x-100" : "scale-x-0",
        )}
      />

      <span className="sr-only">Step {index + 1} of {coldChainStages.length}</span>
    </>
  );
}


