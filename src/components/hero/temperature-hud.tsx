"use client";

import { Activity, Droplets, ThermometerSnowflake } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { temperatureShift } from "@/animations/variants";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { cn } from "@/lib/utilities/cn";
import { formatTemperature } from "@/lib/utilities/format";

/**
 * TEMPERATURE HUD (§11 Scene 07)
 * ---------------------------------------------------------------------------
 * The monitoring instrument that appears once the facility activates.
 *
 * §11 carries an explicit warning: unless this is wired to real sensors it is a
 * demonstration interface and must never be presented as live facility data.
 * The SIMULATION badge here is not decorative — it is rendered from the same
 * `simulated` provenance flag the rest of the product uses, so the hero cannot
 * drift out of line with the admin command center.
 *
 * Values respond to the temperature controller (§13). Humidity is derived from
 * the same normalised cold factor so the two readings stay physically coherent:
 * colder air carries less moisture.
 */

interface TemperatureHudProps {
  temperature: number;
  zoneCode?: string;
  zoneName?: string;
  visible: boolean;
  className?: string;
}

export function TemperatureHud({
  temperature,
  zoneCode = "C-04",
  zoneName = "FROZEN STORAGE",
  visible,
  className,
}: TemperatureHudProps) {
  const reduced = useReducedMotion();
  const look = temperatureShift(temperature);
  const cold = look.frost;

  // 96 − 34·cold reproduces ~72 % RH at −18.4 °C, the reference case in §11.
  const humidity = Math.round(Math.min(96, Math.max(55, 96 - cold * 34)));

  return (
    <motion.aside
      className={cn("pointer-events-none select-none", className)}
      initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(10px)" }}
      animate={
        visible
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 22, filter: "blur(10px)" }
      }
      transition={{ duration: reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden={!visible}
      role="complementary"
      aria-label="Facility monitoring demonstration"
    >
      <div
        className={cn(
          "tj-panel tj-corners pointer-events-auto w-[19rem] max-w-[calc(100vw-2.5rem)] p-4 sm:w-[21rem] sm:p-5",
        )}
        style={{ opacity: 0.35 + look.hudIntensity * 0.65 }}
      >
        {/* --- Header ----------------------------------------------------- */}
        <div className="flex items-start justify-between gap-3 border-b border-hull-line/70 pb-3">
          <div className="min-w-0">
            <p className="tj-label tj-label-glow">Zone {zoneCode}</p>
            <p className="mt-1 truncate font-display text-sm font-bold tracking-[0.02em] text-frost uppercase">
              {zoneName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ProvenanceBadge simulated compact />
            {/* Pulsing system chip — the heartbeat of the monitoring stack. */}
            <span className="flex items-center gap-1.5">
              <motion.span
                className="size-1.5 rounded-full bg-glow"
                style={{ boxShadow: "0 0 10px #00F5D4" }}
                animate={reduced ? undefined : { opacity: [1, 0.25, 1], scale: [1, 0.72, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
              <span className="font-mono text-[0.5rem] font-semibold tracking-[0.18em] text-glow uppercase">
                System optimal
              </span>
            </span>
          </div>
        </div>

        {/* --- Readings ---------------------------------------------------- */}
        <dl className="mt-4 space-y-3.5">
          <HudRow
            icon={<ThermometerSnowflake size={14} strokeWidth={1.6} aria-hidden />}
            label="Temperature"
            value={formatTemperature(temperature)}
            tone="ice"
          />
          <HudRow
            icon={<Droplets size={14} strokeWidth={1.6} aria-hidden />}
            label="Humidity"
            value={`${humidity}%`}
            tone="default"
          />
          <HudRow
            icon={
              <span
                className="size-1.5 rounded-full bg-stable"
                style={{ boxShadow: "0 0 8px #22C55E" }}
                aria-hidden
              />
            }
            label="Status"
            value="STABLE"
            tone="stable"
          />
          <HudRow
            icon={<Activity size={14} strokeWidth={1.6} aria-hidden />}
            label="Monitoring"
            value="ACTIVE"
            tone="glow"
          />
        </dl>

        {/* --- Regime strip ------------------------------------------------ */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-hull-line/70 pt-3">
          <span className="tj-label">Regime</span>
          <span
            className="font-mono text-[0.625rem] font-semibold tracking-[0.16em] uppercase"
            style={{ color: look.light }}
          >
            {look.label}
          </span>
        </div>

        {/* Frost bar — the visual consequence of the current set point. */}
        <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-hull-line/60">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#48cae4,#00f5d4)" }}
            animate={{ width: `${Math.round(cold * 100)}%` }}
            transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </motion.aside>
  );
}

function HudRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "default" | "ice" | "glow" | "stable";
}) {
  const tones = {
    default: "text-frost",
    ice: "text-ice",
    glow: "text-glow",
    stable: "text-stable",
  } as const;

  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2">
        <span className="text-silver-dim">{icon}</span>
        <span className="tj-label">{label}</span>
      </dt>
      <dd className={cn("tabular font-mono text-sm font-medium tracking-tight", tones[tone])}>
        {value}
      </dd>
    </div>
  );
}
