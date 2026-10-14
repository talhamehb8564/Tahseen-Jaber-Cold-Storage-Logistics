import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utilities/cn";

/**
 * SECTION SHELL
 * ---------------------------------------------------------------------------
 * Enforces the site's vertical rhythm and editorial hierarchy (§01.1, §06).
 * Every marketing section is a `<Section>` so spacing can never drift between
 * pages, and so the "index / eyebrow / headline / lede" pattern is consistent.
 */
interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Inner container width. `wide` for full-bleed visual sections. */
  width?: "narrow" | "default" | "wide" | "full";
  /** Vertical padding preset. */
  spacing?: "tight" | "default" | "loose" | "hero";
  /** Technical section index shown beside the eyebrow, e.g. "04". */
  index?: string;
  eyebrow?: string;
  /** H2 by default. Pass "h1" only on a page's principal heading. */
  heading?: ReactNode;
  headingAs?: "h1" | "h2" | "h3";
  lede?: ReactNode;
  /** Optional right-hand slot in the header row (stat, badge, control). */
  aside?: ReactNode;
  /** Draw the structural hairline above the section. */
  rule?: boolean;
  /** Background treatment. */
  surface?: "none" | "grid" | "grid-fine" | "raised" | "gradient";
}

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-[86rem]",
  full: "max-w-none",
} as const;

const SPACING = {
  tight: "py-16 sm:py-20",
  default: "py-24 sm:py-32",
  loose: "py-32 sm:py-44",
  hero: "py-40 sm:py-56",
} as const;

const SURFACES = {
  none: "",
  grid: "tj-grid",
  "grid-fine": "tj-grid-fine",
  raised: "bg-navy/40",
  gradient:
    "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(18,29,72,0.55),transparent_65%)]",
} as const;

export function Section({
  children,
  id,
  className,
  width = "default",
  spacing = "default",
  index,
  eyebrow,
  heading,
  headingAs: HeadingTag = "h2",
  lede,
  aside,
  rule = false,
  surface = "none",
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={heading && id ? `${id}-heading` : undefined}
      className={cn("relative", SPACING[spacing], SURFACES[surface], className)}
    >
      {rule ? (
        <div aria-hidden className="tj-hairline absolute inset-x-0 top-0" />
      ) : null}

      <div
        className={cn(
          "mx-auto w-full px-5 sm:px-8 lg:px-12",
          width !== "full" && WIDTHS[width],
        )}
      >
        {eyebrow || heading || lede || aside ? (
          <header
            className={cn(
              "mb-12 sm:mb-16",
              aside && "lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12",
            )}
          >
            <div className="max-w-3xl">
              {eyebrow ? (
                <Reveal preset="fadeIn">
                  <p className="tj-eyebrow">
                    {index ? <span className="text-silver-dim">{index}</span> : null}
                    {eyebrow}
                  </p>
                </Reveal>
              ) : null}

              {heading ? (
                <Reveal preset="fadeUp" delay={0.06}>
                  <HeadingTag
                    id={id ? `${id}-heading` : undefined}
                    className={cn(
                      "mt-5 text-[clamp(2rem,5.2vw,3.75rem)]",
                      HeadingTag === "h1" && "text-[clamp(2.5rem,7vw,5.5rem)]",
                    )}
                  >
                    {heading}
                  </HeadingTag>
                </Reveal>
              ) : null}

              {lede ? (
                <Reveal preset="fadeUp" delay={0.12}>
                  <div className="mt-6 max-w-2xl text-base leading-relaxed text-silver sm:text-lg">
                    {lede}
                  </div>
                </Reveal>
              ) : null}
            </div>

            {aside ? (
              <Reveal preset="fadeUp" delay={0.18}>
                <div className="mt-10 lg:mt-0">{aside}</div>
              </Reveal>
            ) : null}
          </header>
        ) : null}

        {children}
      </div>
    </section>
  );
}

/** Compact sub-heading used inside a section body. */
export function SubHeading({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <h3
      id={id}
      className={cn("text-xl font-semibold tracking-tight sm:text-2xl", className)}
    >
      {children}
    </h3>
  );
}
