"use client";

import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { Reveal, WordReveal } from "@/components/ui/reveal";
import { ColdPool } from "@/components/global/cold-atmosphere";
import { primaryCta, secondaryCta, siteConfig } from "@/lib/site";

/**
 * FINAL CALL TO ACTION (§47)
 * ---------------------------------------------------------------------------
 * "YOUR PRODUCTS. OUR CONTROL." — the closing statement, set as large as the
 * viewport comfortably allows, with the two CTAs and the facility address beneath
 * it. The cold pool intensifies behind the type so the page ends colder and
 * brighter than it began.
 *
 * Reduced motion: the mask reveal is skipped and the type is simply present.
 */

const LINE_1 = "YOUR PRODUCTS.";
const LINE_2 = "OUR CONTROL.";

export function FinalCta() {

  return (
    <section
      id="contact-cta"
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden border-t border-hull-line/60"
    >
      <ColdPool intensity={0.85} hue="cyan" className="-z-10" />

      {/* Frost floor rising from the bottom edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-80"
        style={{
          background:
            "linear-gradient(to top, rgba(0,245,212,0.10), rgba(0,245,212,0.02) 45%, transparent)",
        }}
      />
      <div aria-hidden className="tj-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <div className="relative mx-auto w-full max-w-[86rem] px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
        <Reveal preset="fadeUp">
          <p className="tj-eyebrow justify-center text-center">
            <span className="text-silver-dim">10</span> Request Storage
          </p>
        </Reveal>

        <h2
          id="final-cta-heading"
          className="tj-display mx-auto mt-7 max-w-5xl text-center"
        >
          {/* Word by word, as the closing statement scrolls into view — the
              last thing the visitor reads should land with weight. */}
          <WordReveal
            as="span"
            text={LINE_1}
            inView
            amount={0.6}
            stagger={0.09}
            duration={1.05}
            className="block text-[clamp(2.4rem,9.2vw,7.5rem)]"
          />
          <WordReveal
            as="span"
            text={LINE_2}
            inView
            amount={0.6}
            delay={0.16}
            stagger={0.09}
            duration={1.05}
            className="glass-text block text-[clamp(2.4rem,9.2vw,7.5rem)]"
          />
        </h2>

        <Reveal preset="fadeUp" delay={0.18} className="mx-auto mt-9 max-w-2xl text-center">
          <p className="text-base leading-relaxed text-silver sm:text-lg">
            Tell us what needs storing, in what quantity, and for how long. You
            will receive a reference immediately and a written quote from the
            facility team.
          </p>
        </Reveal>

        <Reveal preset="fadeUp" delay={0.26} className="mt-11">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={primaryCta.href}
              className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[2px] bg-glow px-8 py-4 font-display text-[0.875rem] font-bold tracking-[0.16em] text-midnight uppercase shadow-[0_16px_44px_-16px_rgba(0,245,212,0.9)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ice hover:shadow-[0_20px_56px_-16px_rgba(72,202,228,1)] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none sm:w-auto"
              data-cursor="explore"
            >
              {/* Sheen sweep */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.45)_50%,transparent_65%)] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full"
              />
              <span className="relative">{primaryCta.label}</span>
              <ArrowRight
                size={17}
                strokeWidth={2.1}
                aria-hidden
                className="relative transition-transform duration-500 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href={secondaryCta.href}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-[2px] border border-hull-raised bg-midnight/45 px-8 py-4 font-display text-[0.875rem] font-bold tracking-[0.16em] text-silver uppercase backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-glow/45 hover:text-frost focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none sm:w-auto"
              data-cursor="explore"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </Reveal>

        {/* Facility address — verified, so it is stated plainly (§46). */}
        <Reveal preset="fadeIn" delay={0.34} className="mt-14">
          <div className="flex flex-col items-center gap-3 border-t border-hull-line/60 pt-9 text-center sm:flex-row sm:justify-center sm:gap-4">
            <MapPin size={15} strokeWidth={1.6} aria-hidden className="text-glow" />
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-silver-dim uppercase">
              {siteConfig.location.facility}
              <span aria-hidden className="mx-2.5 text-hull-line">
                ·
              </span>
              {siteConfig.location.city}, {siteConfig.location.country}
            </p>
          </div>

          {siteConfig.contact.phone ? (
            <p className="mt-4 text-center">
              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="tabular font-mono text-sm text-silver transition-colors duration-300 hover:text-ice"
              >
                {siteConfig.contact.phoneDisplay ?? siteConfig.contact.phone}
              </a>
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
