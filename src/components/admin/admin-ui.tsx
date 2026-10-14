import type { ReactNode } from "react";

import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { cn } from "@/lib/utilities/cn";

/**
 * ADMIN UI PRIMITIVES (§28, §41)
 * ---------------------------------------------------------------------------
 * The console has eleven screens. Without a shared header, stat card and table
 * they would each drift slightly apart, so the three repeated structures live
 * here and every admin route composes them.
 *
 * These are server components — the console is mostly read, and the few mutating
 * controls are client islands inside the pages that need them (§35).
 */

/* ==========================================================================
   PAGE HEADER
   ========================================================================== */

export function AdminPageHeader({
  title,
  description,
  simulated,
  actions,
  meta,
}: {
  title: string;
  description?: ReactNode;
  /** Renders the SIMULATION/LIVE badge beside the title (§40). */
  simulated?: boolean;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-7 border-b border-hull-line/70 pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] text-frost uppercase">
              {title}
            </h1>
            {typeof simulated === "boolean" ? (
              <ProvenanceBadge simulated={simulated} />
            ) : null}
          </div>

          {description ? (
            <p className="mt-2.5 max-w-2xl text-[0.875rem] leading-relaxed text-silver-dim">
              {description}
            </p>
          ) : null}

          {meta ? <div className="mt-4">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */

export type StatTone = "default" | "ice" | "glow" | "stable" | "caution" | "alert";

const STAT_TONES: Record<StatTone, { value: string; accent: string }> = {
  default: { value: "text-frost", accent: "bg-silver-dim" },
  ice: { value: "text-ice", accent: "bg-ice" },
  glow: { value: "text-glow", accent: "bg-glow" },
  stable: { value: "text-stable", accent: "bg-stable" },
  caution: { value: "text-caution", accent: "bg-caution" },
  alert: { value: "text-alert", accent: "bg-alert" },
};

export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
  icon,
  /** Renders a dash instead of a number when the figure is not known (§45). */
  unavailable = false,
  unavailableLabel = "Not supplied",
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  tone?: StatTone;
  icon?: ReactNode;
  unavailable?: boolean;
  unavailableLabel?: string;
  className?: string;
}) {
  const palette = STAT_TONES[tone];

  return (
    <div
      className={cn(
        "tj-panel group relative overflow-hidden rounded-[2px] p-5 transition-colors duration-500 hover:border-hull-raised",
        className,
      )}
    >
      {/* Accent rule */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px origin-left scale-x-0 opacity-70 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100",
          palette.accent,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <p className="tj-label">{label}</p>
        {icon ? <span className="shrink-0 text-silver-dim">{icon}</span> : null}
      </div>

      {unavailable ? (
        // §45 — an unknown figure is rendered as unknown, never as zero. A zero
        // would read as a measurement of "none" rather than "not supplied".
        <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.14em] text-silver-dim uppercase">
          {unavailableLabel}
        </p>
      ) : (
        <p className={cn("tabular mt-2 font-mono text-[1.75rem] font-semibold leading-none tracking-tight", palette.value)}>
          {value}
          {unit ? (
            <span className="ml-1.5 text-[0.6875rem] font-normal tracking-[0.12em] text-silver-dim uppercase">
              {unit}
            </span>
          ) : null}
        </p>
      )}

      {hint ? <div className="mt-2.5 text-[0.75rem] leading-relaxed text-silver-dim">{hint}</div> : null}
    </div>
  );
}

/** Responsive grid sized for stat cards. */
export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const grid = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  } as const;

  return <div className={cn("grid gap-3", grid[columns], className)}>{children}</div>;
}

/* ==========================================================================
   DATA TABLE
   ========================================================================== */

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. `align` and `className` handle the common cases. */
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Hide below this breakpoint. Keeps dense tables usable on small screens. */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
}

const HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty,
  dense = false,
  caption,
  onRowClick,
}: {
  rows: readonly T[];
  columns: readonly Column<T>[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  dense?: boolean;
  /** Accessible caption — read by screen readers, not rendered visually. */
  caption?: string;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="tj-panel rounded-[2px] px-6 py-14 text-center">
        {empty ?? (
          <p className="font-mono text-[0.625rem] tracking-[0.18em] text-silver-dim uppercase">
            No records
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="tj-panel overflow-hidden rounded-[2px]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {caption ? <caption className="sr-only">{caption}</caption> : null}

          <thead>
            <tr className="border-b border-hull-line/70 bg-midnight/40">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "tj-label whitespace-nowrap px-4 py-3 font-normal",
                    ALIGN[column.align ?? "left"],
                    column.hideBelow ? HIDE_BELOW[column.hideBelow] : undefined,
                    dense && "px-3 py-2.5",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-hull-line/45">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "transition-colors duration-200 hover:bg-hull/25",
                  onRowClick && "cursor-pointer",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 align-middle text-[0.8125rem] text-silver",
                      ALIGN[column.align ?? "left"],
                      column.hideBelow ? HIDE_BELOW[column.hideBelow] : undefined,
                      dense && "px-3 py-2.5",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   PANEL BLOCK — a titled region of the console
   ========================================================================== */

export function AdminBlock({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)} aria-labelledby={undefined}>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[0.9375rem] font-bold tracking-[0.01em] text-frost uppercase">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[0.75rem] leading-relaxed text-silver-dim">{description}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

/* ==========================================================================
   EMPTY / NOTICE STATES (§39)
   ========================================================================== */

export function EmptyState({
  title,
  detail,
  icon,
  action,
}: {
  title: string;
  detail?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="tj-panel flex flex-col items-center rounded-[2px] px-6 py-14 text-center">
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-[2px] border border-hull-line bg-midnight/50 text-silver-dim">
          {icon}
        </span>
      ) : null}
      <p className="mt-5 font-display text-base font-bold tracking-[0.01em] text-frost uppercase">
        {title}
      </p>
      {detail ? (
        <p className="mt-2 max-w-md text-[0.8125rem] leading-relaxed text-silver-dim">{detail}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
