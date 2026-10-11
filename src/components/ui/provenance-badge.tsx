import { Info } from "lucide-react";

import { cn } from "@/lib/utilities/cn";

/**
 * PROVENANCE BADGE (§40 — CRITICAL RULE)
 * ---------------------------------------------------------------------------
 * Any panel showing facility data must render this badge. The word shown is
 * derived from the provider's `simulated` flag, never chosen by the component
 * author, so simulated data can never be mislabelled as live.
 *
 * The prohibited vocabulary (live, real-time, current, actual, operational) is
 * asserted in `src/lib/data/types.ts` and repeated here so a reviewer can find
 * the rule next to the component that enforces it.
 */

interface ProvenanceBadgeProps {
  simulated: boolean;
  className?: string;
  /** Render the compact dot-only form for dense tables. */
  compact?: boolean;
}

export function ProvenanceBadge({ simulated, className, compact = false }: ProvenanceBadgeProps) {
  if (!simulated) {
    return (
      <span
        className={cn(
          "tj-status tj-status-live text-stable",
          compact && "px-1.5 py-0.5",
          className,
        )}
      >
        <span className="tj-status-dot" aria-hidden />
        LIVE
      </span>
    );
  }

  return (
    <span
      className={cn(
        "tj-status text-caution",
        compact && "px-1.5 py-0.5",
        className,
      )}
      title="Illustrative data. This interface is not connected to facility sensors."
    >
      <span className="tj-status-dot" aria-hidden />
      SIMULATION
    </span>
  );
}

/**
 * Longer, explicit disclosure for hero-scale or full-section demonstrations.
 * Placed where a visitor could otherwise mistake the panel for real telemetry.
 */
export function ProvenanceNote({
  simulated,
  className,
  children,
}: {
  simulated: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  if (!simulated) return null;

  return (
    <p
      className={cn(
        "flex items-start gap-2 border-l border-caution/35 bg-caution/[0.06] py-2 pl-3 pr-4",
        "font-mono text-[0.625rem] leading-relaxed tracking-[0.1em] text-caution/90 uppercase",
        className,
      )}
      role="note"
    >
      <Info size={13} strokeWidth={1.75} aria-hidden className="mt-px shrink-0" />
      <span className="normal-case tracking-[0.04em] text-caution/80">
        {children ??
          "Illustrative interface. Values are generated for demonstration and are not readings from facility sensors."}
      </span>
    </p>
  );
}

/** Inline marker for a single figure inside an otherwise real table. */
export function SimulatedMarker({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "align-super font-mono text-[0.5rem] tracking-[0.12em] text-caution/80 uppercase",
        className,
      )}
      title="Simulated value"
    >
      sim
    </span>
  );
}
