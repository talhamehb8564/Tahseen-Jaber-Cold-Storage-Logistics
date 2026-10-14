/** Formatting helpers. All output is deterministic and locale-pinned to en-GB/en-US
 *  so telemetry columns stay tabular and never reflow between renders. */

const numberFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/**
 * Temperature.
 * §40/§45 — a temperature is only ever formatted from a value that actually
 * exists. `null`/`undefined` renders the configured fallback label, never `0`.
 */
export function formatTemperature(
  value: number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  const sign = value > 0 ? "+" : "";
  // Minus sign U+2212 keeps tabular alignment with the plus sign.
  const body = value < 0 ? `\u2212${Math.abs(value).toFixed(1)}` : `${sign}${value.toFixed(1)}`;
  return `${body}\u00A0\u00B0C`;
}

export function formatPercent(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${Math.round(value)}%`;
}

export function formatMass(
  value: number | null | undefined,
  unit: "kg" | "t" = "kg",
  fallback = "—",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${numberFormatter.format(value)} ${unit}`;
}

export function formatDate(value: Date | string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Relative time, used in activity feeds. Falls back to an absolute date. */
export function formatRelative(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}

/** Sentence-case for enum values coming out of the database. */
export function humaniseEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Deterministic 2-letter initials for avatar blocks. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase();
}
