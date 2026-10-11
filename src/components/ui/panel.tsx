import type { ReactNode } from "react";

import { cn } from "@/lib/utilities/cn";

/**
 * PANEL — the frosted instrument surface used everywhere (§09, §41).
 * `as` lets a panel be a section, article, li or div without losing the skin.
 */
interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Draw the corner brackets. On for interactive panels, off for dense lists. */
  corners?: boolean;
  /** Reduce padding for instrument-dense layouts. */
  dense?: boolean;
  as?: "div" | "section" | "article" | "li" | "aside" | "header" | "footer";
  id?: string;
  interactive?: boolean;
  accent?: string;
}

export function Panel({
  children,
  className,
  corners = true,
  dense = false,
  as: Tag = "div",
  id,
  interactive = false,
  accent,
}: PanelProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "group tj-panel relative",
        corners && "tj-corners",
        dense ? "p-4" : "p-6 sm:p-7",
        interactive &&
          "transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-glow/40 hover:shadow-[0_28px_70px_-32px_rgba(0,245,212,0.35)]",
        className,
      )}
      style={accent ? ({ "--tj-accent": accent } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

/** Header row inside a panel: mono label left, optional status right. */
export function PanelHeader({
  label,
  value,
  right,
  className,
}: {
  label: string;
  value?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-hull-line/70 pb-3",
        className,
      )}
    >
      <span className="tj-label">{label}</span>
      {value ? (
        <span className="tabular font-mono text-sm font-medium text-frost">{value}</span>
      ) : null}
      {right ? <div className="ml-auto flex items-center gap-3">{right}</div> : null}
    </div>
  );
}

/** A single labelled datum — the atomic unit of every HUD in the product. */
export function Datum({
  label,
  value,
  unit,
  tone = "default",
  className,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: "default" | "ice" | "glow" | "stable" | "caution" | "alert" | "frost";
  className?: string;
  mono?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "text-frost",
    ice: "text-ice",
    glow: "text-glow",
    stable: "text-stable",
    caution: "text-caution",
    alert: "text-alert",
    frost: "text-frost",
  };

  return (
    <div className={cn("min-w-0", className)}>
      <dt className="tj-label truncate">{label}</dt>
      <dd
        className={cn(
          "tabular mt-1.5 truncate text-lg font-semibold tracking-tight",
          mono && "font-mono font-medium",
          tones[tone],
        )}
      >
        {value}
        {unit ? <span className="ml-0.5 text-xs font-normal opacity-70">{unit}</span> : null}
      </dd>
    </div>
  );
}
