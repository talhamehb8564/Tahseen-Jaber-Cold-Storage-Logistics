import { cn } from "@/lib/utilities/cn";

/**
 * STATUS TOKENS
 * ---------------------------------------------------------------------------
 * Colour is assigned from a closed map keyed by the actual domain enum, so a new
 * database status cannot silently render with the wrong meaning. Anything not in
 * the map falls back to neutral silver rather than guessing.
 */

const TONES = {
  glow: "text-glow",
  ice: "text-ice",
  stable: "text-stable",
  caution: "text-caution",
  alert: "text-alert",
  silver: "text-silver",
  frost: "text-frost",
} as const;

type Tone = keyof typeof TONES;

const INQUIRY_TONES: Record<string, Tone> = {
  NEW: "glow",
  CONTACTED: "ice",
  QUOTED: "caution",
  APPROVED: "stable",
  REJECTED: "alert",
  COMPLETED: "silver",
};

const INVENTORY_TONES: Record<string, Tone> = {
  IN_TRANSIT: "ice",
  RECEIVED: "glow",
  IN_STORAGE: "stable",
  RESERVED: "caution",
  PICKING: "glow",
  DISPATCHED: "silver",
  ON_HOLD: "caution",
  ADJUSTED: "alert",
};

const HEALTH_TONES: Record<string, Tone> = {
  STABLE: "stable",
  DRIFT: "caution",
  ALERT: "alert",
  MAINTENANCE: "silver",
};

const SEVERITY_TONES: Record<string, Tone> = {
  INFO: "silver",
  NOTICE: "ice",
  WARNING: "caution",
  CRITICAL: "alert",
};

const CONTRACT_TONES: Record<string, Tone> = {
  DRAFT: "silver",
  ACTIVE: "stable",
  SUSPENDED: "caution",
  COMPLETED: "ice",
  TERMINATED: "alert",
};

const NOTIFICATION_TONES: Record<string, Tone> = {
  QUEUED: "ice",
  SENT: "glow",
  DELIVERED: "stable",
  FAILED: "alert",
  SKIPPED: "silver",
};

export type StatusDomain =
  | "inquiry"
  | "inventory"
  | "health"
  | "severity"
  | "contract"
  | "notification"
  | "generic";

const DOMAIN_MAPS: Record<StatusDomain, Record<string, Tone>> = {
  inquiry: INQUIRY_TONES,
  inventory: INVENTORY_TONES,
  health: HEALTH_TONES,
  severity: SEVERITY_TONES,
  contract: CONTRACT_TONES,
  notification: NOTIFICATION_TONES,
  generic: {},
};

interface StatusPillProps {
  value: string;
  domain?: StatusDomain;
  className?: string;
  /** Animate the dot. Only for statuses that represent an active process. */
  pulse?: boolean;
  /** Override the displayed text (defaults to the enum value). */
  label?: string;
  /** Tighter padding + dot-only emphasis for dense tables. */
  compact?: boolean;
}

export function StatusPill({
  value,
  domain = "generic",
  className,
  pulse = false,
  label,
  compact = false,
}: StatusPillProps) {
  const tone = DOMAIN_MAPS[domain][value] ?? "silver";
  const display = label ?? value.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "tj-status",
        pulse && "tj-status-live",
        compact && "gap-1.5 px-1.5 py-1 text-[0.5rem] tracking-[0.12em]",
        TONES[tone],
        className,
      )}
    >
      <span className="tj-status-dot" aria-hidden />
      {display}
    </span>
  );
}

/** Resolve just the colour class, for charts and progress bars that need it. */
export function statusToneClass(value: string, domain: StatusDomain = "generic"): string {
  const tone = DOMAIN_MAPS[domain][value] ?? "silver";
  return TONES[tone];
}

export function statusHex(value: string, domain: StatusDomain = "generic"): string {
  const tone = DOMAIN_MAPS[domain][value] ?? "silver";
  switch (tone) {
    case "glow":
      return "#8f7bff";
    case "ice":
      return "#4cc2ff";
    case "stable":
      return "#22C55E";
    case "caution":
      return "#F59E0B";
    case "alert":
      return "#EF4444";
    case "frost":
      return "#e9f3ff";
    default:
      return "#97a6cc";
  }
}
