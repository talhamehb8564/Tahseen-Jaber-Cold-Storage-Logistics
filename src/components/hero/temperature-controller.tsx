"use client";

import { Snowflake } from "lucide-react";
import { useId } from "react";

import {
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  TEMPERATURE_STOPS,
  temperatureShift,
} from "@/animations/variants";
import { cn } from "@/lib/utilities/cn";
import { formatTemperature } from "@/lib/utilities/format";

/**
 * TEMPERATURE CONTROLLER (§13)
 * ---------------------------------------------------------------------------
 * Drag from +10 °C down to −30 °C and the hero responds: frost density, light
 * colour, condensation, ambient mist and the HUD all shift together.
 *
 * TWO SAFEGUARDS FROM THE BRIEF
 *   §13 — "Do not imply that the website is controlling a real refrigeration
 *   system." The disclaimer is rendered as part of the control, not hidden in a
 *   tooltip, so it cannot be missed.
 *   §37 — implemented as a native range input. It is keyboard operable
 *   (arrows/home/end), announces its current value, and works with every
 *   assistive technology. A bespoke drag surface would have to re-earn all of
 *   that and usually doesn't.
 */

interface TemperatureControllerProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  compact?: boolean;
}

export function TemperatureController({
  value,
  onChange,
  className,
  compact = false,
}: TemperatureControllerProps) {
  const inputId = useId();
  const look = temperatureShift(value);
  const clamped = Math.min(TEMPERATURE_MAX, Math.max(TEMPERATURE_MIN, value));

  return (
    <div
      className={cn(
        "tj-panel tj-corners w-full",
        compact ? "p-3.5" : "p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={inputId} className="tj-label tj-label-glow block">
            Chamber set point
          </label>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span
              className="tabular font-mono text-2xl font-semibold tracking-tight sm:text-[1.75rem]"
              style={{ color: look.light }}
            >
              {formatTemperature(clamped)}
            </span>
            <span className="font-mono text-[0.625rem] tracking-[0.16em] text-silver-dim uppercase">
              {look.label}
            </span>
          </p>
        </div>

        <Snowflake
          size={compact ? 18 : 22}
          strokeWidth={1.4}
          aria-hidden
          className="mt-1 shrink-0 transition-colors duration-500"
          style={{ color: look.light, opacity: 0.35 + look.frost * 0.65 }}
        />
      </div>

      {/* --- The control --------------------------------------------------- */}
      <input
        id={inputId}
        type="range"
        className="tj-temp-range mt-3"
        // Native range runs low → high, so the visual scale is inverted to put
        // +10 °C on the left and −30 °C on the right, matching §13's ordering.
        min={TEMPERATURE_MIN}
        max={TEMPERATURE_MAX}
        step={0.5}
        value={clamped}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${formatTemperature(clamped)} — ${look.label}`}
        aria-describedby={`${inputId}-note`}
      />

      {/* --- Scale ticks ----------------------------------------------------
          The stops are 10 °C apart across a 40 °C range, so they land at exactly
          0/25/50/75/100 % of the track. `justify-between` is therefore precise
          and no per-tick positioning math is needed. */}
      <div className="mt-1 flex justify-between" aria-hidden>
        {TEMPERATURE_STOPS.map((stop) => {
          const active = Math.abs(clamped - stop) < 2.5;
          return (
            <span
              key={stop}
              className={cn(
                "tabular font-mono text-[0.5625rem] tracking-[0.1em] transition-colors duration-300",
                active ? "text-ice" : "text-silver-dim/70",
              )}
            >
              {stop > 0 ? `+${stop}` : stop}°
            </span>
          );
        })}
      </div>

      {/* --- Mandatory disclaimer (§13) ------------------------------------- */}
      <p
        id={`${inputId}-note`}
        className="mt-3 border-t border-hull-line/60 pt-2.5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase"
      >
        Visual demonstration only — this control does not operate facility
        equipment.
      </p>
    </div>
  );
}
