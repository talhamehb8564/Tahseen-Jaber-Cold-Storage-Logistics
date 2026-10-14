"use client";

import { Lock, RadioTower, ThermometerSnowflake } from "lucide-react";
import { useCallback, useState } from "react";

import { CatalogIcon } from "@/components/ui/catalog-icon";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { StatusPill } from "@/components/ui/status-pill";
import type { ZoneReading } from "@/lib/data/types";
import { facilityZones, type FacilityZone } from "@/lib/catalog";
import { FALLBACK } from "@/lib/site";
import { formatTemperature } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

/**
 * FACILITY MAP (§21)
 * ---------------------------------------------------------------------------
 * An interactive architectural plan of the site. Hovering a zone highlights it;
 * selecting one opens its information panel. Zone geometry, purpose and wording
 * come from `lib/catalog`; live state (health, monitoring) comes from the data
 * provider and is badged with its provenance.
 *
 * §21 / §45 CONSTRAINT
 *   Capacity is NOT shown here. The business has not confirmed pallet positions
 *   or floor area, so the panel prints the configured fallback ("ON REQUEST")
 *   rather than a figure that would read as a real specification. Occupancy and
 *   capacity belong to the admin command center, where they are badged as
 *   simulation and are not public claims.
 *
 * ACCESSIBILITY (§37)
 *   Every zone is a focusable SVG group with role="button", an aria-label and
 *   Enter/Space handling, so the whole plan is usable without a pointer. On
 *   touch devices the hover preview becomes a tap (§34).
 */

/* Plan mapping: catalog geometry is normalised to a 0–100 space. */
const SX = 9.6;
const SY = 7.4;
const OX = 20;
const OY = 20;
const VIEW_W = 1000;
const VIEW_H = 780;

function toPlan(rect: FacilityZone["rect"]) {
  return {
    x: rect.x * SX + OX,
    y: rect.y * SY + OY,
    w: rect.w * SX,
    h: rect.h * SY,
  };
}

interface FacilityMapProps {
  readings: readonly ZoneReading[];
  simulated: boolean;
}

export function FacilityMap({ readings, simulated }: FacilityMapProps) {
  const [selectedId, setSelectedId] = useState<string>(facilityZones[3]?.id ?? "frozen-storage");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId ?? selectedId;
  const activeZone = facilityZones.find((zone) => zone.id === activeId) ?? facilityZones[0]!;
  const activeReading = readings.find((reading) => reading.zoneId === activeZone.id);

  const select = useCallback((id: string) => setSelectedId(id), []);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
      {/* ---------------- The plan ---------------- */}
      <figure className="tj-panel tj-corners relative overflow-hidden rounded-[2px] p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          role="group"
          aria-label="Interactive plan of the Tahseen Jaber cold storage facility"
        >
          <defs>
            <linearGradient id="fm-shell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9eef5" />
              <stop offset="100%" stopColor="#e3e8f0" />
            </linearGradient>
            <pattern id="fm-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#b66a3c" strokeWidth="1.4" opacity="0.16" />
            </pattern>
          </defs>

          {/* Site shell */}
          <rect x="8" y="8" width={VIEW_W - 16} height={VIEW_H - 16} rx="4" fill="url(#fm-shell)" />
          <rect
            x="8"
            y="8"
            width={VIEW_W - 16}
            height={VIEW_H - 16}
            rx="4"
            fill="none"
            stroke="#afbbcb"
            strokeWidth="2"
          />

          {/* Fine engineering grid */}
          <g stroke="#c9d4e1" strokeWidth="0.6" opacity="0.5">
            {Array.from({ length: 24 }, (_, index) => (
              <path key={`v${index}`} d={`M${40 + index * 40} 12 V${VIEW_H - 12}`} />
            ))}
            {Array.from({ length: 18 }, (_, index) => (
              <path key={`h${index}`} d={`M12 ${40 + index * 40} H${VIEW_W - 12}`} />
            ))}
          </g>

          {/* Dock openings on the east elevation */}
          <g>
            {[toPlan(facilityZones[0]!.rect), toPlan(facilityZones[5]!.rect)].map((rect, index) => (
              <g key={index}>
                <rect
                  x={VIEW_W - 22}
                  y={rect.y + rect.h * 0.3}
                  width="14"
                  height={rect.h * 0.4}
                  fill="url(#fm-hatch)"
                  stroke="#F59E0B"
                  strokeWidth="1.4"
                  strokeOpacity="0.5"
                />
              </g>
            ))}
          </g>

          {/* Zones */}
          {facilityZones.map((zone) => {
            const rect = toPlan(zone.rect);
            const reading = readings.find((item) => item.zoneId === zone.id);
            const isActive = zone.id === activeId;
            const isSelected = zone.id === selectedId;
            const health = reading?.health ?? "STABLE";

            const healthColour =
              health === "ALERT"
                ? "#EF4444"
                : health === "DRIFT"
                  ? "#F59E0B"
                  : health === "MAINTENANCE"
                    ? "#43536b"
                    : "#22C55E";

            return (
              <g
                key={zone.id}
                role="button"
                tabIndex={0}
                aria-label={`${zone.code} ${zone.name}. ${zone.purpose}. Status ${health}.`}
                aria-pressed={isSelected}
                className="cursor-pointer outline-none"
                data-cursor="inspect"
                onClick={() => select(zone.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select(zone.id);
                  }
                }}
                onPointerEnter={() => setHoveredId(zone.id)}
                onPointerLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(zone.id)}
                onBlur={() => setHoveredId(null)}
              >
                {/* Fill */}
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  rx="2"
                  fill={isActive ? "#dde5ee" : "#d7dfe9"}
                  stroke={isSelected ? "#b66a3c" : isActive ? "#97a6bb" : "#c9d4e1"}
                  strokeWidth={isSelected ? 2.6 : 1.6}
                  style={{ transition: "fill 400ms, stroke 400ms" }}
                />

                {/* Restricted-access hatching */}
                {zone.kind === "pharma" || zone.kind === "security" ? (
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx="2"
                    fill="url(#fm-hatch)"
                    opacity={isActive ? 0.9 : 0.45}
                    pointerEvents="none"
                  />
                ) : null}

                {/* Active glow */}
                {isActive ? (
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx="2"
                    fill="#b66a3c"
                    opacity="0.07"
                    pointerEvents="none"
                  />
                ) : null}

                {/* Zone code */}
                <text
                  x={rect.x + 14}
                  y={rect.y + 30}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="19"
                  fontWeight="500"
                  letterSpacing="2"
                  fill={isActive ? "#7e3e22" : "#64778d"}
                  style={{ transition: "fill 400ms" }}
                  pointerEvents="none"
                >
                  {zone.code}
                </text>

                {/* Zone name */}
                <text
                  x={rect.x + 14}
                  y={rect.y + rect.h - 22}
                  fontFamily="'Archivo Variable', sans-serif"
                  fontSize={rect.w > 300 ? "26" : "21"}
                  fontWeight="700"
                  letterSpacing="0.6"
                  fill={isActive ? "#122033" : "#43536b"}
                  style={{ transition: "fill 400ms" }}
                  pointerEvents="none"
                >
                  {zone.name}
                </text>

                {/* Health indicator */}
                <g transform={`translate(${rect.x + rect.w - 26},${rect.y + 24})`} pointerEvents="none">
                  <circle r="6" fill={healthColour} opacity={isActive ? 1 : 0.65}>
                    {health !== "STABLE" ? (
                      <animate
                        attributeName="opacity"
                        values="1;0.25;1"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    ) : null}
                  </circle>
                  <circle r="11" fill="none" stroke={healthColour} strokeWidth="1.2" opacity="0.35" />
                </g>

                {/* Restricted marker */}
                {zone.kind === "pharma" ? (
                  <g
                    transform={`translate(${rect.x + rect.w - 62},${rect.y + 18})`}
                    pointerEvents="none"
                    opacity={isActive ? 0.95 : 0.5}
                  >
                    <rect width="26" height="14" rx="2" fill="#e3e8f0" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.55" />
                    <text
                      x="13"
                      y="11"
                      textAnchor="middle"
                      fontFamily="'JetBrains Mono', monospace"
                      fontSize="8.5"
                      letterSpacing="0.6"
                      fill="#F59E0B"
                    >
                      ACC
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* Circulation route: receiving → chambers → loading → dispatch */}
          <g pointerEvents="none">
            <path
              d="M165 380 V440 H560 V400"
              fill="none"
              stroke="#b66a3c"
              strokeWidth="2"
              strokeDasharray="10 9"
              opacity="0.34"
            />
            <path
              d="M560 440 H860 V400"
              fill="none"
              stroke="#b66a3c"
              strokeWidth="2"
              strokeDasharray="10 9"
              opacity="0.34"
            />
            <path
              d="M250 620 H470"
              fill="none"
              stroke="#b66a3c"
              strokeWidth="2"
              strokeDasharray="10 9"
              opacity="0.28"
            />
            {/* Flow arrowheads */}
            <g fill="#b66a3c" opacity="0.5">
              <path d="M556 396 l10 6 l-10 6 Z" />
              <path d="M856 396 l10 6 l-10 6 Z" />
              <path d="M466 614 l10 6 l-10 6 Z" />
            </g>
          </g>

          {/* North arrow + scale */}
          <g pointerEvents="none" opacity="0.6">
            <g transform="translate(60,700)">
              <path d="M0 -22 L7 6 L0 0 L-7 6 Z" fill="#43536b" />
              <text
                x="0"
                y="24"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="13"
                letterSpacing="1.4"
                fill="#64778d"
              >
                N
              </text>
            </g>
            <g transform="translate(820,706)">
              <path d="M0 0 H120" stroke="#64778d" strokeWidth="1.6" />
              <path d="M0 -5 V5M60 -4 V4M120 -5 V5" stroke="#64778d" strokeWidth="1.6" />
              <text
                x="60"
                y="22"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="12"
                letterSpacing="1.2"
                fill="#64778d"
              >
                SCALE NOT TO MEASURE
              </text>
            </g>
          </g>
        </svg>

        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hull-line/70 px-1 pt-3">
          <span className="tj-label">Site plan · Uuayrij Industrial Area</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim uppercase">
              <span className="size-2 rounded-full bg-stable" aria-hidden /> Stable
            </span>
            <span className="flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim uppercase">
              <span className="size-2 rounded-full bg-caution" aria-hidden /> Drift
            </span>
            <span className="flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim uppercase">
              <span className="size-2 rounded-full bg-alert" aria-hidden /> Alert
            </span>
          </div>
        </figcaption>
      </figure>

      {/* ---------------- Information panel ---------------- */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <ZonePanel zone={activeZone} reading={activeReading} simulated={simulated} />

        {/* Zone index — a non-visual way to reach every zone */}
        <div className="mt-5">
          <p className="tj-label mb-3">All zones</p>
          <ul className="grid grid-cols-2 gap-1.5">
            {facilityZones.map((zone) => {
              const reading = readings.find((item) => item.zoneId === zone.id);
              return (
                <li key={zone.id}>
                  <button
                    type="button"
                    onClick={() => select(zone.id)}
                    aria-current={zone.id === selectedId}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-[2px] border px-2.5 py-2",
                      "font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-all duration-300",
                      zone.id === selectedId
                        ? "border-glow/50 bg-glow/10 text-frost"
                        : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                    )}
                  >
                    <span className="truncate">{zone.code}</span>
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        reading?.health === "ALERT"
                          ? "bg-alert"
                          : reading?.health === "DRIFT"
                            ? "bg-caution"
                            : "bg-stable",
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   ZONE PANEL
   -------------------------------------------------------------------------- */
function ZonePanel({
  zone,
  reading,
  simulated,
}: {
  zone: FacilityZone;
  reading: ZoneReading | undefined;
  simulated: boolean;
}) {
  return (
    <div className="tj-panel tj-corners rounded-[2px] p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex size-12 items-center justify-center rounded-[2px] border border-glow/35 bg-glow/10 text-glow"
          aria-hidden
        >
          <CatalogIcon name={zone.icon} size={22} strokeWidth={1.4} />
        </span>
        <ProvenanceBadge simulated={simulated || (reading?.simulated ?? true)} />
      </div>

      <p className="tj-label tj-label-glow mt-5">Zone {zone.code}</p>
      <h3 className="mt-1.5 font-display text-2xl font-bold tracking-[-0.02em] uppercase sm:text-3xl">
        {zone.name}
      </h3>
      <p className="mt-2 text-sm text-silver">{zone.purpose}</p>

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-silver-dim">{zone.detail}</p>

      <dl className="mt-6 divide-y divide-hull-line/60 border-y border-hull-line/60">
        <PanelRow
          icon={<ThermometerSnowflake size={14} strokeWidth={1.6} aria-hidden />}
          label="Target temperature"
          value={zone.temperatureLabel}
          tone="ice"
        />
        <PanelRow
          label="Observed"
          value={formatTemperature(reading?.temperatureC ?? null, FALLBACK.capability)}
          tone="glow"
          note={simulated ? "simulated" : undefined}
        />
        <PanelRow label="Humidity" value={reading?.humidityPercent != null ? `${reading.humidityPercent}%` : FALLBACK.capability} />
        <PanelRow label="Status" value={<StatusPill value={reading?.health ?? "STABLE"} domain="health" />} />
        <PanelRow
          icon={<RadioTower size={14} strokeWidth={1.6} aria-hidden />}
          label="Monitoring"
          value={reading?.monitoringActive ? "ACTIVE" : "NOT REPORTING"}
          tone={reading?.monitoringActive ? "stable" : "caution"}
        />
        <PanelRow
          icon={<Lock size={14} strokeWidth={1.6} aria-hidden />}
          label="Access"
          value={zone.kind === "pharma" || zone.kind === "security" ? "RESTRICTED" : "STANDARD"}
        />
        {/* §21 — capacity is never fabricated on a public surface. */}
        <PanelRow label="Capacity" value={FALLBACK.capability} tone="silver" />
      </dl>

      <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
        Plan is schematic and not to measured scale. Zone status is shown for
        demonstration unless the data source is marked live.
      </p>
    </div>
  );
}

function PanelRow({
  icon,
  label,
  value,
  tone = "frost",
  note,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "frost" | "ice" | "glow" | "stable" | "caution" | "silver";
  note?: string;
}) {
  const tones = {
    frost: "text-frost",
    ice: "text-ice",
    glow: "text-glow",
    stable: "text-stable",
    caution: "text-caution",
    silver: "text-silver",
  } as const;

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="tj-label flex items-center gap-2">
        {icon ? <span className="text-silver-dim">{icon}</span> : null}
        {label}
      </dt>
      <dd className={cn("flex items-center gap-2 font-mono text-[0.6875rem] font-medium tracking-[0.1em] uppercase", tones[tone])}>
        {value}
        {note ? (
          <span className="font-mono text-[0.5rem] tracking-[0.12em] text-caution/80 uppercase">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
