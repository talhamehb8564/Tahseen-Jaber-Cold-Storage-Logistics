"use client";

import { useEffect, useState } from "react";

import { CatalogIcon } from "@/components/ui/catalog-icon";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { logisticsStops } from "@/lib/catalog";
import { FALLBACK, siteConfig } from "@/lib/site";
import { useElementProgress, useReducedMotion } from "@/hooks";
import { cn } from "@/lib/utilities/cn";

/**
 * LOGISTICS ROUTE (§24)
 * ---------------------------------------------------------------------------
 * A route that draws itself as the visitor scrolls, with a refrigerated truck
 * travelling the drawn length: RECEIVE → STORE → LOAD → CHECK → DISPATCH.
 *
 * TECHNIQUE (§35, §43)
 *   `pathLength="1"` normalises the path so the draw is a single dashoffset
 *   value, and the truck rides the same geometry through CSS `offset-path`. Both
 *   are compositor-friendly and need no GSAP instance, no MotionPathPlugin and no
 *   per-frame JavaScript — the scroll progress hook writes two CSS variables and
 *   the browser does the rest.
 *
 * §24 / §45 CONSTRAINT
 *   Verified delivery coverage has NOT been supplied, so this makes no
 *   geographic claim. The map is an abstract regional texture, explicitly
 *   labelled schematic, and the five stops are *process* stages rather than
 *   destinations. The coverage line prints the configured fallback.
 */

/** Route geometry, shared by the drawn line and the truck's motion path. */
const ROUTE_PATH =
  "M 100 440 C 180 430 220 380 280 330 C 350 275 400 300 470 300 C 545 300 585 250 640 200 C 700 148 750 140 810 130";

/** Stop coordinates, in path order — each sits on the route curve. */
const STOP_POINTS = [
  { x: 100, y: 440 },
  { x: 280, y: 330 },
  { x: 470, y: 300 },
  { x: 640, y: 200 },
  { x: 810, y: 130 },
] as const;

/** Normalised position along the route for each stop (0 → 1). */
const STOP_PROGRESS = [0, 0.27, 0.52, 0.76, 1] as const;

export function LogisticsRoute({ simulated }: { simulated: boolean }) {
  const reduced = useReducedMotion();
  const { ref, progress } = useElementProgress<HTMLDivElement>(!reduced);
  const [activeStop, setActiveStop] = useState(0);

  // Reduced motion: show the route fully drawn and every stop reached.
  const draw = reduced ? 1 : Math.min(1, Math.max(0, (progress - 0.08) / 0.78));

  useEffect(() => {
    if (reduced) {
      setActiveStop(logisticsStops.length - 1);
      return;
    }
    let next = 0;
    for (let index = 0; index < STOP_PROGRESS.length; index += 1) {
      if (draw >= (STOP_PROGRESS[index] ?? 0) - 0.02) next = index;
    }
    setActiveStop(next);
  }, [draw, reduced]);

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
      {/* ---------------- The route map ---------------- */}
      <figure className="tj-panel tj-corners relative overflow-hidden rounded-[2px] p-3 sm:p-4">
        <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="Schematic route diagram showing the five stages of a consignment moving through the facility: receive, store, load, check and dispatch.">
          <defs>
            <linearGradient id="lr-land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0E1B2C" />
              <stop offset="100%" stopColor="#08111D" />
            </linearGradient>
            <linearGradient id="lr-river" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#48cae4" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="lr-route" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#48cae4" />
              <stop offset="100%" stopColor="#00f5d4" />
            </linearGradient>
            <filter id="lr-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          {/* ---- Abstract regional texture ---- */}
          <rect width="900" height="560" rx="3" fill="url(#lr-land)" />

          {/* Graticule */}
          <g stroke="#1c3157" strokeWidth="0.7" opacity="0.45">
            {Array.from({ length: 14 }, (_, index) => (
              <path key={`gv${index}`} d={`M${60 + index * 60} 0 V560`} />
            ))}
            {Array.from({ length: 9 }, (_, index) => (
              <path key={`gh${index}`} d={`M0 ${60 + index * 60} H900`} />
            ))}
          </g>

          {/* Landmass contours — abstract, not a geographic claim */}
          <g fill="none" stroke="#2C4258" strokeWidth="1.1" opacity="0.5">
            <path d="M-20 180 Q160 120 300 190 T620 170 T940 220" />
            <path d="M-20 250 Q180 200 340 260 T680 240 T940 290" />
            <path d="M-20 470 Q200 420 380 480 T740 460 T940 500" />
          </g>

          {/* River */}
          <path
            d="M420 -20 C 460 90, 380 170, 430 260 C 480 350, 400 430, 450 580"
            fill="none"
            stroke="url(#lr-river)"
            strokeWidth="22"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M420 -20 C 460 90, 380 170, 430 260 C 480 350, 400 430, 450 580"
            fill="none"
            stroke="#48cae4"
            strokeWidth="1.2"
            opacity="0.28"
          />

          {/* Road network */}
          <g stroke="#33506B" strokeWidth="1.4" opacity="0.42" fill="none">
            <path d="M0 380 H900" />
            <path d="M180 0 V560" />
            <path d="M700 0 V560" />
            <path d="M0 90 Q300 140 560 90 T900 120" />
          </g>

          {/* City node */}
          <g transform="translate(556,392)">
            <circle r="5" fill="#48cae4" opacity="0.85" />
            <circle r="13" fill="none" stroke="#48cae4" strokeWidth="1" opacity="0.4" />
            <text
              x="20"
              y="5"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="13"
              letterSpacing="2"
              fill="#94a3b8"
            >
              BAGHDAD
            </text>
          </g>

          {/* Facility node */}
          <g transform="translate(196,486)">
            <rect x="-7" y="-7" width="14" height="14" rx="1.5" fill="#00f5d4" opacity="0.9" />
            <rect x="-15" y="-15" width="30" height="30" rx="2" fill="none" stroke="#00f5d4" strokeWidth="1.2" opacity="0.45" />
            <text
              x="24"
              y="-2"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="12"
              letterSpacing="1.6"
              fill="#48cae4"
            >
              UUAYRIJ INDUSTRIAL AREA
            </text>
            <text
              x="24"
              y="14"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10"
              letterSpacing="1.4"
              fill="#64748b"
            >
              FACILITY
            </text>
          </g>

          {/* ---- The route ---- */}
          {/* Bed */}
          <path d={ROUTE_PATH} fill="none" stroke="#1c3157" strokeWidth="3" strokeLinecap="round" />
          {/* Glow underneath the drawn portion */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="#00f5d4"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.22"
            filter="url(#lr-glow)"
            pathLength={1}
            strokeDasharray="1"
            style={{ strokeDashoffset: 1 - draw, transition: reduced ? undefined : "stroke-dashoffset 220ms linear" }}
          />
          {/* Drawn line */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="url(#lr-route)"
            strokeWidth="2.6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            style={{ strokeDashoffset: 1 - draw, transition: reduced ? undefined : "stroke-dashoffset 220ms linear" }}
          />

          {/* ---- Stops ---- */}
          {STOP_POINTS.map((point, index) => {
            const reached = draw >= (STOP_PROGRESS[index] ?? 0) - 0.02;
            const stop = logisticsStops[index];
            const labelBelow = index % 2 === 0;
            return (
              <g key={point.x} transform={`translate(${point.x},${point.y})`}>
                <circle
                  r={reached ? 9 : 6}
                  fill={reached ? "#0A1421" : "#08111D"}
                  stroke={reached ? "#00f5d4" : "#3A5772"}
                  strokeWidth={reached ? 2.4 : 1.6}
                  style={{ transition: reduced ? undefined : "all 500ms cubic-bezier(0.22,1,0.36,1)" }}
                />
                {reached ? <circle r="3.2" fill="#00f5d4" /> : null}
                {reached ? (
                  <circle r="16" fill="none" stroke="#00f5d4" strokeWidth="1" opacity="0.3" />
                ) : null}

                <text
                  x="0"
                  y={labelBelow ? 34 : -22}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="12.5"
                  fontWeight="600"
                  letterSpacing="1.8"
                  fill={reached ? "#eafcff" : "#64748b"}
                  style={{ transition: reduced ? undefined : "fill 500ms" }}
                >
                  {stop?.label ?? ""}
                </text>
                <text
                  x="0"
                  y={labelBelow ? 50 : -38}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="10"
                  letterSpacing="1.2"
                  fill="#64748b"
                >
                  {stop?.detail ?? ""}
                </text>
              </g>
            );
          })}

          {/* ---- The truck, riding the route ---- */}
          {!reduced ? (
            <g
              className="lr-truck"
              style={
                {
                  "--lr-path": `path("${ROUTE_PATH}")`,
                  "--lr-distance": `${draw * 100}%`,
                } as React.CSSProperties
              }
            >
              <g transform="translate(-19,-11)">
                <rect x="0" y="4" width="26" height="13" rx="1.5" fill="#DCE7F2" stroke="#0A1421" strokeWidth="1" />
                <path d="M26 7 h8 l4 5 v5 h-12 Z" fill="#2E4661" stroke="#0A1421" strokeWidth="1" />
                <rect x="2" y="7" width="22" height="2" fill="#00f5d4" opacity="0.75" />
                <circle cx="8" cy="19" r="3.2" fill="#151B23" stroke="#4A586A" strokeWidth="0.9" />
                <circle cx="31" cy="19" r="3.2" fill="#151B23" stroke="#4A586A" strokeWidth="0.9" />
              </g>
            </g>
          ) : null}

          {/* ---- Schematic disclaimer, printed on the artwork itself ---- */}
          <text
            x="24"
            y="34"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="11"
            letterSpacing="2"
            fill="#64748b"
            opacity="0.85"
          >
            SCHEMATIC · NOT TO GEOGRAPHIC SCALE
          </text>
        </svg>

        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hull-line/70 px-1 pt-3">
          <span className="tj-label">Consignment route</span>
          <div className="flex items-center gap-3">
            <span className="tabular font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
              {activeStop + 1} / {logisticsStops.length} stages
            </span>
            <ProvenanceBadge simulated={simulated} compact />
          </div>
        </figcaption>

        {/* Truck motion path — offset-path needs real CSS, so it lives here. */}
        <style>{`
          .lr-truck {
            offset-path: var(--lr-path);
            offset-rotate: auto;
            offset-distance: var(--lr-distance);
            offset-anchor: center;
          }
        `}</style>
      </figure>

      {/* ---------------- Stage detail ---------------- */}
      <div>
        <ol className="space-y-2">
          {logisticsStops.map((stop, index) => {
            const reached = index <= activeStop;
            return (
              <li key={stop.id}>
                <div
                  className={cn(
                    "tj-panel flex items-start gap-4 rounded-[2px] p-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-5",
                    reached ? "border-glow/35 opacity-100" : "opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "tabular flex size-9 shrink-0 items-center justify-center rounded-[2px] border font-mono text-[0.625rem] font-semibold transition-colors duration-500",
                      reached
                        ? "border-glow/50 bg-glow/12 text-glow"
                        : "border-hull-line bg-midnight/50 text-silver-dim",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-display text-base font-bold tracking-[-0.01em] uppercase transition-colors duration-500",
                        reached ? "text-frost" : "text-silver",
                      )}
                    >
                      {stop.label}
                    </p>
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-silver-dim">
                      {STAGE_COPY[stop.id] ?? stop.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="tj-panel mt-5 rounded-[2px] p-5">
          <p className="tj-label flex items-center gap-2">
            <CatalogIcon name="map-pin" size={13} strokeWidth={1.7} />
            Service area
          </p>
          <p className="mt-3 font-mono text-sm tracking-[0.1em] text-caution uppercase">
            {siteConfig.capabilities.deliveryCoverage ?? FALLBACK.coverage}
          </p>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-silver-dim">
            Collection and delivery coverage has not been confirmed, so no service
            area is published here. Tell us where stock needs to move and the
            requirement will be confirmed directly.
          </p>
        </div>
      </div>
    </div>
  );
}

/** One line per stage — the process explanation beside the schematic. */
const STAGE_COPY: Record<string, string> = {
  receive:
    "The vehicle is met at the gate, its load is checked against documentation and the consignment is opened against a batch reference.",
  store:
    "Product is placed in the chamber configured for it and recorded to a zone and location, so its position is known from that moment on.",
  load:
    "Outbound stock is staged at the dock and loaded onto a refrigerated vehicle, keeping the product inside its temperature envelope.",
  check:
    "The load is verified against the order and its paperwork before release — quantity, batch and condition all confirmed.",
  dispatch:
    "The vehicle is released through the gate with a matching record, closing the chain of custody for that consignment.",
};
