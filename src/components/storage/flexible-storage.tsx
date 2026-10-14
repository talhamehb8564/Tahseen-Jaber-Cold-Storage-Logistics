import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CatalogIcon } from "@/components/ui/catalog-icon";
import { storageOptions } from "@/lib/catalog";
import { primaryCta } from "@/lib/site";

/**
 * FLEXIBLE STORAGE (§48 · section 9)
 * ---------------------------------------------------------------------------
 * Server component — the modes are static content, so no client JavaScript is
 * needed to render them. Interaction is CSS-only hover state, which is the right
 * call here: a grid of six cards does not warrant a hydration cost (§35).
 *
 * §45 — no capacity figures appear. Each mode describes how space is held and
 * defers the commercial terms to the agreement rather than publishing a rate
 * that has not been supplied (§25).
 */

export function FlexibleStorage() {
  return (
    <section
      id="storage"
      aria-labelledby="storage-heading"
      className="relative border-b border-hull-line/60 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-end lg:gap-16">
          <header>
            <p className="tj-eyebrow">
              <span className="text-silver-dim">08</span> Flexible Storage
            </p>
            <h2
              id="storage-heading"
              className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)] font-bold tracking-[-0.035em] uppercase"
            >
              Held the way
              <br />
              <span className="tj-frost-text">your stock moves</span>
            </h2>
          </header>

          <div>
            <p className="text-base leading-relaxed text-silver sm:text-lg">
              Storage is arranged around the requirement rather than a fixed
              product. Transit holding, seasonal capacity, a dedicated chamber or
              a few pallets in a shared zone are all handled against the same
              process — the same batch reference, the same monitoring, the same
              documentation at both ends.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-silver-dim">
              Terms are agreed per requirement. No published rate list exists for
              this facility, so a written quote follows every request.
            </p>
          </div>
        </div>

        {/* ---------------- The environments, as imagery ---------------- */}
        {/* §45: illustrative visuals — terms stay per-requirement, not implied by
            the photographs. */}
        <ul className="mt-14 grid gap-3 md:grid-cols-2">
          <li>
            <figure className="tj-panel-shine group relative h-[36vh] min-h-[260px] overflow-hidden rounded-2xl border border-hull-line/60">
              <Image
                src="/assets/produce-cold-room.jpg"
                alt="Fresh produce crates stacked in a chilled room under azure strip lighting."
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="scale-[1.2] object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.28]"
                data-parallax="0.3"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.8),transparent_58%)]" />
              <figcaption className="absolute bottom-4 left-4">
                <p className="font-mono text-[0.5625rem] tracking-[0.22em] text-ice uppercase">Chilled modes</p>
                <p className="mt-1 font-display text-base font-bold uppercase tracking-tight text-frost">Shared & dedicated chambers</p>
              </figcaption>
            </figure>
          </li>
          <li>
            <figure className="tj-panel-shine group relative h-[36vh] min-h-[260px] overflow-hidden rounded-2xl border border-hull-line/60">
              <Image
                src="/assets/sealed-frozen-cartons.jpg"
                alt="Sealed frozen cartons furred with frost inside the deep-freeze chamber."
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="scale-[1.2] object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.28]"
                data-parallax="0.3"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.8),transparent_58%)]" />
              <figcaption className="absolute bottom-4 left-4">
                <p className="font-mono text-[0.5625rem] tracking-[0.22em] text-ice uppercase">Frozen modes</p>
                <p className="mt-1 font-display text-base font-bold uppercase tracking-tight text-frost">Deep-freeze & transit holding</p>
              </figcaption>
            </figure>
          </li>
        </ul>

        {/* ---------------- The modes ---------------- */}
        <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {storageOptions.map((option, index) => (
            <li key={option.id}>
              <article className="tj-panel tj-corners group relative flex h-full flex-col overflow-hidden rounded-[2px] p-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-glow/40 hover:bg-hull/45 sm:p-7">
                {/* Corner index */}
                <span
                  aria-hidden
                  className="tabular absolute top-5 right-6 font-mono text-[0.625rem] tracking-[0.16em] text-silver-dim/45"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex size-11 items-center justify-center rounded-[2px] border border-glow/30 bg-glow/[0.08] text-glow transition-all duration-700 group-hover:border-glow/55 group-hover:bg-glow/[0.14]">
                  <CatalogIcon name={option.icon} size={20} strokeWidth={1.5} />
                </span>

                <h3 className="mt-5 font-display text-lg font-bold tracking-[-0.01em] text-frost uppercase">
                  {option.name}
                </h3>

                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-silver">
                  {option.summary}
                </p>

                <ul className="mt-5 space-y-2">
                  {option.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[0.8125rem] leading-snug text-silver-dim">
                      <span aria-hidden className="mt-[0.45rem] h-px w-3 shrink-0 bg-glow/55" />
                      {point}
                    </li>
                  ))}
                </ul>

                <p className="mt-auto pt-6 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim/75 uppercase">
                  {option.terms}
                </p>

                {/* Hover sweep — restrained, one pass (§01: no gratuitous motion) */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-glow to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                />
              </article>
            </li>
          ))}
        </ul>

        {/* ---------------- Route to a quote ---------------- */}
        <div className="tj-panel mt-6 flex flex-col gap-6 rounded-[2px] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl">
            <h3 className="font-display text-xl font-bold tracking-[-0.01em] text-frost uppercase sm:text-2xl">
              Not sure which mode fits?
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-silver">
              Describe the stock and the timing. The calculator captures the
              requirement and sends it for a written quote — no account, no
              obligation, and no price invented in the meantime.
            </p>
          </div>

          <Link
            href={`${primaryCta.href}#calculator`}
            className="group inline-flex shrink-0 items-center gap-2.5 self-start rounded-[2px] border border-glow/45 bg-glow/[0.08] px-6 py-3.5 font-display text-[0.8125rem] font-bold tracking-[0.14em] text-glow uppercase transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-glow hover:bg-glow/15 hover:text-ice sm:self-auto"
            data-cursor="explore"
          >
            Open the calculator
            <ArrowUpRight
              size={16}
              strokeWidth={2}
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
