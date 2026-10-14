"use client";

import { useEffect, useRef, useState } from "react";
import { Wind } from "lucide-react";

import { getGsap, type GsapScrollTrigger as ScrollTrigger } from "@/animations/gsap";
import { CatalogIcon } from "@/components/ui/catalog-icon";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { useReducedMotion } from "@/hooks";
import { FALLBACK } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

/**
 * PRECISION COOLING (§18)
 * ---------------------------------------------------------------------------
 * A cutaway of a cold chamber: insulated panelling, the evaporator unit, the
 * airflow circuit, racking, lighting and surface condensation. Scrolling moves
 * the room through three REGIMES and the whole drawing responds — airflow speed,
 * frost intensity and light temperature all shift together.
 *
 * §18 / §45 CONSTRAINT, TAKEN SERIOUSLY
 *   The business has not supplied approved temperature ranges, so no number is
 *   asserted anywhere in this section. Each regime prints
 *   "TARGET TEMPERATURE — CONFIGURABLE" and names the regime only by its
 *   industry-standard category (chilled / frozen / deep frozen), which describes
 *   a capability rather than a measured value. The scroll interaction is a
 *   visualisation of how the room is *managed*, not a claim about what it
 *   currently reads — hence the SIMULATION badge on the gauge.
 */

interface Regime {
  id: string;
  name: string;
  /** 0 = warmest regime, 1 = coldest. Drives every visual response. */
  cold: number;
  accent: string;
  summary: string;
  /** What the refrigeration plant is doing in this regime. */
  plant: readonly string[];
  suitedTo: readonly string[];
  icon: "leaf" | "beef" | "thermometer-snowflake";
}

const REGIMES: readonly Regime[] = [
  {
    id: "chilled",
    name: "CHILLED",
    cold: 0.18,
    accent: "#4cc2ff",
    summary:
      "Holding above freezing for product that must stay cool without forming ice crystals. Airflow is gentle and even so leaf and surface moisture is not driven off.",
    plant: [
      "Evaporator running at low fan speed",
      "Short duty cycles, long rest periods",
      "Humidity held high to limit weight loss",
    ],
    suitedTo: ["Produce", "Dairy", "Short-cycle distribution"],
    icon: "leaf",
  },
  {
    id: "frozen",
    name: "FROZEN",
    cold: 0.62,
    accent: "#8f7bff",
    summary:
      "Sub-zero holding for protein and seafood. The plant runs harder and the defrost cycle becomes part of the routine, so swing between cycles is what gets managed.",
    plant: [
      "Evaporator at full fan speed",
      "Scheduled defrost between holding periods",
      "Door discipline critical to limit swing",
    ],
    suitedTo: ["Meat & poultry", "Seafood", "Frozen retail packs"],
    icon: "beef",
  },
  {
    id: "deep-frozen",
    name: "DEEP FROZEN",
    cold: 1,
    accent: "#e9f3ff",
    summary:
      "The coldest regime the chamber is asked to hold. Pull-down takes longest here, so intake is staged and the room is allowed to recover before the next load.",
    plant: [
      "Extended pull-down after intake",
      "Recovery window before the next cycle",
      "Continuous logging of the holding period",
    ],
    suitedTo: ["Long-term frozen storage", "Bulk seafood", "Reserve stock"],
    icon: "thermometer-snowflake",
  },
] as const;

export function PrecisionCooling() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(1);

  // Scroll drives the regime on desktop; reduced-motion and small screens get a
  // direct selector instead, so the content is reachable without scrubbing (§34).
  useEffect(() => {
    if (reduced) return;
    const { ScrollTrigger } = getGsap();
    const node = sectionRef.current;
    if (!node) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;

    const trigger = ScrollTrigger.create({
      trigger: node,
      start: "top 62%",
      end: "bottom 78%",
      onUpdate: (self: ScrollTrigger) => {
        const next = Math.min(
          REGIMES.length - 1,
          Math.max(0, Math.floor(self.progress * REGIMES.length + 0.001)),
        );
        setIndex((current) => (current === next ? current : next));
      },
    });

    return () => trigger.kill();
  }, [reduced]);

  const regime = REGIMES[index] ?? REGIMES[1]!;

  return (
    <section
      id="precision-cooling"
      aria-labelledby="precision-cooling-heading"
      className="relative border-b border-hull-line/60 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12">
        <header className="max-w-3xl">
          <p className="tj-eyebrow">
            <span className="text-silver-dim">03</span> Precision Cooling
          </p>
          <h2
            id="precision-cooling-heading"
            className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)] font-bold tracking-[-0.035em] uppercase"
          >
            The chamber,
            <br />
            <span className="tj-frost-text">cut open</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-silver sm:text-lg">
            Insulated panelling, an evaporator circuit, managed airflow and
            continuous logging. Scroll to move the room between regimes and watch
            the plant respond.
          </p>
        </header>

        <div ref={sectionRef} className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          {/* ---------------- The cutaway ---------------- */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ColdRoomCutaway regime={regime} reduced={reduced} />
          </div>

          {/* ---------------- Regime detail ---------------- */}
          <div>
            {/* Direct selector — the accessible, non-scroll path to the same content */}
            <div
              role="tablist"
              aria-label="Cooling regimes"
              className="mb-7 flex flex-wrap gap-2"
            >
              {REGIMES.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === index}
                  onClick={() => setIndex(itemIndex)}
                  className={cn(
                    "rounded-[2px] border px-3.5 py-2 font-mono text-[0.5625rem] tracking-[0.18em] uppercase",
                    "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    itemIndex === index
                      ? "border-glow/55 bg-glow/12 text-frost"
                      : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              key={regime.id}
              className="tj-panel tj-corners rounded-[2px] p-6 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className="flex size-12 items-center justify-center rounded-[2px] border"
                  style={{
                    borderColor: `${regime.accent}55`,
                    backgroundColor: `${regime.accent}12`,
                    color: regime.accent,
                  }}
                >
                  <CatalogIcon name={regime.icon} size={22} strokeWidth={1.4} />
                </span>
                <ProvenanceBadge simulated />
              </div>

              <h3 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em] uppercase sm:text-3xl">
                {regime.name}
              </h3>

              {/* §18 — the honest label. No invented set point. */}
              <div className="mt-4 flex items-baseline gap-3 border-y border-hull-line/70 py-3.5">
                <span className="tj-label shrink-0">Target temperature</span>
                <span
                  className="ml-auto font-mono text-sm font-medium tracking-[0.08em] uppercase"
                  style={{ color: regime.accent }}
                >
                  {FALLBACK.temperature}
                </span>
              </div>

              <p className="mt-5 text-[0.9375rem] leading-relaxed text-silver">
                {regime.summary}
              </p>

              <div className="mt-7">
                <p className="tj-label flex items-center gap-2">
                  <Wind size={13} strokeWidth={1.6} aria-hidden />
                  Plant behaviour
                </p>
                <ul className="mt-3 space-y-2.5">
                  {regime.plant.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-sm text-silver">
                      <span
                        aria-hidden
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: regime.accent }}
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7">
                <p className="tj-label">Suited to</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {regime.suitedTo.map((item) => (
                    <li
                      key={item}
                      className="rounded-[2px] border border-hull-line bg-midnight/45 px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.14em] text-silver uppercase"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.1em] text-silver-dim/80 uppercase">
              Set points are configured per client agreement. Approved ranges for
              this facility are pending confirmation and are not published here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   THE CUTAWAY
   ========================================================================== */

function ColdRoomCutaway({ regime, reduced }: { regime: Regime; reduced: boolean }) {
  const cold = regime.cold;
  const airflowSeconds = reduced ? 0 : 9 - cold * 4.5; // colder regime = faster circuit
  const frostOpacity = 0.05 + cold * 0.2;

  return (
    <figure className="tj-panel tj-corners relative overflow-hidden rounded-[2px] p-3 sm:p-4">
      <svg
        viewBox="0 0 800 560"
        className="w-full"
        role="img"
        aria-label={`Cutaway of a cold chamber in the ${regime.name.toLowerCase()} regime, showing insulated wall panelling, an evaporator unit, the airflow circuit, pallet racking and surface frost.`}
      >
        <defs>
          <linearGradient id="pc-wall" x1="0" y1="60" x2="0" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191b44" />
            <stop offset="100%" stopColor="#0b0c26" />
          </linearGradient>
          <linearGradient id="pc-insul" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.28" />
          </linearGradient>
          <radialGradient id="pc-air" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor={regime.accent} stopOpacity={0.16 + cold * 0.14} />
            <stop offset="100%" stopColor={regime.accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pc-floor" x1="0" y1="500" x2="0" y2="540" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#121d48" />
            <stop offset="100%" stopColor="#07081a" />
          </linearGradient>
          <filter id="pc-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* ---- Room shell ---- */}
        <rect x="40" y="60" width="720" height="440" fill="url(#pc-wall)" />

        {/* ---- Insulated wall cutaway (left) ---- */}
        <g>
          <rect x="40" y="60" width="46" height="440" fill="#090a22" />
          <rect x="52" y="60" width="22" height="440" fill="url(#pc-insul)" />
          <g stroke="#2a2f5a" strokeWidth="1.2" opacity="0.75">
            <path d="M40 60 V500" />
            <path d="M52 60 V500" />
            <path d="M74 60 V500" />
            <path d="M86 60 V500" />
          </g>
          {/* Panel label leader */}
          <path d="M86 120 H150" stroke="#4cc2ff" strokeWidth="1" opacity="0.45" strokeDasharray="4 4" />
          <text
            x="156"
            y="124"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
            letterSpacing="1.6"
            fill="#4cc2ff"
            opacity="0.75"
          >
            INSULATED PANEL
          </text>
        </g>

        {/* ---- Interior air wash ---- */}
        <rect x="86" y="60" width="674" height="440" fill="url(#pc-air)" />

        {/* ---- Ceiling light strips ---- */}
        <g>
          {[220, 420, 620].map((x) => (
            <g key={x}>
              <rect x={x - 60} y="72" width="120" height="6" rx="3" fill="#e8f2ff" opacity="0.8" />
              <rect
                x={x - 78}
                y="66"
                width="156"
                height="26"
                rx="8"
                fill={regime.accent}
                opacity={0.16 + cold * 0.1}
                filter="url(#pc-blur)"
              />
            </g>
          ))}
        </g>

        {/* ---- Evaporator / cooler unit ---- */}
        <g>
          <rect x="118" y="104" width="196" height="86" rx="4" fill="#14183e" stroke="#2a2f5a" strokeWidth="1.6" />
          <rect x="118" y="104" width="196" height="7" rx="3" fill="#31386d" opacity="0.7" />
          {/* Coil fins */}
          <g stroke="#383f74" strokeWidth="1.4" opacity="0.75">
            {Array.from({ length: 18 }, (_, i) => (
              <path key={i} d={`M${130 + i * 10} 122 V176`} />
            ))}
          </g>
          {/* Fans — speed scales with the regime */}
          {[166, 232, 298].map((x) => (
            <g key={x} transform={`translate(${x},148)`}>
              <circle r="21" fill="#090a22" stroke="#383f74" strokeWidth="1.4" />
              <g
                className="pc-fan"
                style={{
                  animationDuration: airflowSeconds ? `${airflowSeconds / 6}s` : undefined,
                  animationPlayState: reduced ? "paused" : "running",
                  transformOrigin: "0px 0px",
                }}
              >
                {[0, 120, 240].map((angle) => (
                  <path
                    key={angle}
                    d="M0 0 L15 -6 A16 16 0 0 1 15 6 Z"
                    fill="#4cc2ff"
                    opacity="0.55"
                    transform={`rotate(${angle})`}
                  />
                ))}
              </g>
              <circle r="4" fill="#2a2f5a" />
            </g>
          ))}
          {/* Unit label */}
          <text
            x="118"
            y="208"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
            letterSpacing="1.6"
            fill="#97a6cc"
            opacity="0.8"
          >
            EVAPORATOR UNIT
          </text>
        </g>

        {/* ---- Airflow circuit ---- */}
        {/* Throw across the ceiling, down the far wall, return along the floor. */}
        <g
          fill="none"
          stroke={regime.accent}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.32 + cold * 0.28}
          strokeDasharray="14 12"
        >
          <path
            id="pc-airflow-path"
            d="M314 147 H700 Q740 147 740 190 V440 Q740 470 700 470 H160 Q118 470 118 430 V196"
            className="pc-airflow"
            style={{ animationDuration: airflowSeconds ? `${airflowSeconds}s` : undefined }}
          />
        </g>
        {/* Secondary return streams */}
        <g
          fill="none"
          stroke={regime.accent}
          strokeWidth="1.2"
          opacity={0.16 + cold * 0.14}
          strokeDasharray="8 14"
        >
          <path
            d="M330 178 H690"
            className="pc-airflow-slow"
            style={{ animationDuration: airflowSeconds ? `${airflowSeconds * 1.6}s` : undefined }}
          />
          <path
            d="M180 440 H680"
            className="pc-airflow-slow"
            style={{ animationDuration: airflowSeconds ? `${airflowSeconds * 1.9}s` : undefined }}
          />
        </g>

        {/* ---- Pallet racking ---- */}
        <g>
          {[380, 540, 700].map((x, bayIndex) => (
            <g key={x}>
              {/* Uprights */}
              <g stroke="#2a2f5a" strokeWidth="5">
                <path d={`M${x - 62} 232 V498`} />
                <path d={`M${x + 62} 232 V498`} />
              </g>
              {/* Beams */}
              <g stroke="#383f74" strokeWidth="4">
                <path d={`M${x - 62} 320 H${x + 62}`} />
                <path d={`M${x - 62} 408 H${x + 62}`} />
                <path d={`M${x - 62} 496 H${x + 62}`} />
              </g>
              {/* Stock — fill varies so the room reads as part-loaded, not staged */}
              <g fill="#10214e" opacity="0.85" stroke="#081236" strokeWidth="1.2">
                {bayIndex < 2 ? <rect x={x - 54} y={286} width="46" height="32" rx="2" /> : null}
                <rect x={x + 4} y={290} width="50" height="28" rx="2" />
                {bayIndex !== 1 ? <rect x={x - 54} y={374} width="46" height="32" rx="2" /> : null}
                <rect x={x + 4} y={372} width="50" height="34" rx="2" />
                <rect x={x - 54} y={462} width="108" height="32" rx="2" />
              </g>
              {/* Bay code */}
              <text
                x={x}
                y="222"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="9.5"
                letterSpacing="1.4"
                fill="#97a6cc"
                opacity="0.65"
              >
                {`BAY 0${bayIndex + 1}`}
              </text>
            </g>
          ))}
        </g>

        {/* ---- Floor + drainage ---- */}
        <rect x="40" y="498" width="720" height="42" fill="url(#pc-floor)" />
        <path d="M40 498 H760" stroke="#2a2f5a" strokeWidth="1.6" opacity="0.8" />
        <g stroke="#1c214a" strokeWidth="1" opacity="0.55">
          {Array.from({ length: 15 }, (_, i) => (
            <path key={i} d={`M${70 + i * 48} 498 V540`} />
          ))}
        </g>
        {/* Drainage channel */}
        <rect x="300" y="512" width="200" height="7" rx="3" fill="#090a22" stroke="#1c214a" strokeWidth="1" />

        {/* ---- Surface frost / condensation (regime-driven) ---- */}
        <g opacity={frostOpacity} pointerEvents="none">
          <rect x="86" y="60" width="674" height="440" fill="#e8f2ff" opacity="0.14" />
          {/* Frost creeping in from the corners and the cold wall */}
          <path
            d="M86 60 H300 L86 210 Z"
            fill="#e8f2ff"
            opacity="0.22"
            filter="url(#pc-blur)"
          />
          <path
            d="M760 500 H520 L760 350 Z"
            fill="#e8f2ff"
            opacity="0.18"
            filter="url(#pc-blur)"
          />
          {/* Frost on the evaporator — heaviest where it is coldest */}
          <rect x="118" y="104" width="196" height="86" rx="4" fill="#e9f3ff" opacity={0.1 + cold * 0.22} />
        </g>

        {/* ---- Vertical temperature gauge ---- */}
        <g transform="translate(24,0)">
          <rect x="0" y="120" width="8" height="320" rx="4" fill="#090a22" stroke="#2a2f5a" strokeWidth="1" />
          <rect
            x="1.5"
            y={122 + (1 - cold) * 316}
            width="5"
            height={Math.max(4, cold * 316)}
            rx="2.5"
            fill={regime.accent}
            style={{ transition: reduced ? undefined : "all 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
          {/* Marker */}
          <g
            style={{
              transform: `translateY(${122 + (1 - cold) * 316}px)`,
              transition: reduced ? undefined : "transform 700ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <path d="M12 0 L22 -5 L22 5 Z" fill={regime.accent} />
          </g>
          <text
            x="4"
            y="110"
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="8"
            letterSpacing="1"
            fill="#6d7aa8"
          >
            WARM
          </text>
          <text
            x="4"
            y="458"
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="8"
            letterSpacing="1"
            fill="#6d7aa8"
          >
            COLD
          </text>
        </g>
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hull-line/70 px-1 pt-3">
        <span className="tj-label">
          Chamber section · {regime.name} regime
        </span>
        <span className="font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
          Illustrative section drawing
        </span>
      </figcaption>

      {/* Airflow animations are defined locally to keep them scoped to this figure. */}
      <style>{`
        @keyframes pc-dash { to { stroke-dashoffset: -260; } }
        @keyframes pc-dash-slow { to { stroke-dashoffset: -220; } }
        @keyframes pc-spin { to { transform: rotate(-360deg); } }
        .pc-airflow { animation: pc-dash linear infinite; }
        .pc-airflow-slow { animation: pc-dash-slow linear infinite; }
        .pc-fan { animation: pc-spin linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pc-airflow, .pc-airflow-slow, .pc-fan { animation: none !important; }
        }
      `}</style>
    </figure>
  );
}
