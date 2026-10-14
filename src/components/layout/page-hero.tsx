import type { ReactNode } from "react";

import { ColdPool } from "@/components/global/cold-atmosphere";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utilities/cn";

/**
 * PAGE HERO (§42)
 * ---------------------------------------------------------------------------
 * The header used by every interior public page, so /about, /solutions,
 * /facility, /products, /logistics, /contact and /request-storage share one
 * rhythm instead of seven hand-rolled variants (§41).
 *
 * Deliberately much quieter than the home hero: the interior pages are about
 * reading, so the header establishes position and gets out of the way. It is a
 * server component — no JavaScript ships for it.
 */

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Optional index shown beside the eyebrow, e.g. "05". */
  index?: string;
  /** Right-hand slot: a stat, a badge, a short spec list. */
  aside?: ReactNode;
  /** Breadcrumb trail, excluding the current page. */
  crumbs?: readonly { label: string; href: string }[];
  className?: string;
  /** Cold pool strength behind the header (0–1). */
  atmosphere?: number;
}

export function PageHero({
  eyebrow,
  title,
  lede,
  index,
  aside,
  crumbs,
  className,
  atmosphere = 0.4,
}: PageHeroProps) {
  return (
    <header
      className={cn(
        "relative isolate overflow-hidden border-b border-hull-line/60",
        "pt-32 pb-14 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20",
        className,
      )}
    >
      <ColdPool intensity={atmosphere} hue="ice" className="-z-10" />
      <div aria-hidden className="tj-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

      {/* Nav offset so anchor links land below the fixed bar. */}
      <div className="mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12">
        {/* Breadcrumb (§36 — semantic nav aid) */}
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.5625rem] tracking-[0.18em] text-silver-dim uppercase">
              <li>
                <a
                  href="/"
                  className="transition-colors duration-300 hover:text-ice"
                >
                  Home
                </a>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  <span aria-hidden className="text-hull-line">
                    /
                  </span>
                  <a href={crumb.href} className="transition-colors duration-300 hover:text-ice">
                    {crumb.label}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-hull-line">
                  /
                </span>
                <span aria-current="page" className="text-silver">
                  {eyebrow}
                </span>
              </li>
            </ol>
          </nav>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <Reveal preset="fadeUp">
              <p className="tj-eyebrow">
                {index ? <span className="text-silver-dim">{index}</span> : null}
                {eyebrow}
              </p>
            </Reveal>

            <Reveal preset="fadeUp" delay={0.06}>
              <h1 className="mt-5 text-[clamp(2.1rem,6vw,4.25rem)] font-bold leading-[0.94] tracking-[-0.04em] text-frost uppercase">
                {title}
              </h1>
            </Reveal>

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
              <div className="lg:pb-2">{aside}</div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/**
 * A compact spec block for the PageHero `aside` slot — the honest way to fill
 * that space when capability figures have not been supplied (§45).
 */
export function HeroSpec({
  items,
  title,
}: {
  items: readonly { label: string; value: ReactNode }[];
  title?: string;
}) {
  return (
    <div className="tj-panel tj-corners rounded-[2px] p-5">
      {title ? <p className="tj-label tj-label-glow">{title}</p> : null}
      <dl className={cn("divide-y divide-hull-line/60", title && "mt-3")}>
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="tj-label shrink-0">{item.label}</dt>
            <dd className="min-w-0 truncate text-right font-mono text-[0.6875rem] tracking-[0.1em] text-frost uppercase">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
