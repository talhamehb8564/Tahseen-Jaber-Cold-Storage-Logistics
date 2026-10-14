import type { Metadata } from "next";
import Image from "next/image";

import { PrecisionCooling } from "@/components/cold-chain/precision-cooling";
import { FinalCta } from "@/components/cta/final-cta";
import { ImageBand } from "@/components/imagery/image-band";
import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { ProductVault } from "@/components/products/product-vault";
import { FlexibleStorage } from "@/components/storage/flexible-storage";
import { Section } from "@/components/ui/section";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Temperature-controlled storage solutions: chilled, frozen and deep-frozen holding, dedicated chambers, part-load space and seasonal capacity, with monitoring and documentation throughout.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "Solutions — Tahseen Jaber Cold Storage & Logistics",
    description:
      "Chilled, frozen and deep-frozen holding with monitoring and documentation throughout.",
    url: `${siteConfig.seo.url}/solutions`,
    type: "website",
  },
};

/**
 * /solutions
 * ---------------------------------------------------------------------------
 * Composes the existing solution sections rather than restating them, so there is
 * one implementation of each idea (§41). The page adds the framing a visitor
 * arriving directly here needs: what is offered, and on what terms.
 */
export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={
          <>
            Storage arranged around
            <br />
            <span className="tj-frost-text">the requirement</span>
          </>
        }
        lede="Temperature-controlled holding for produce, protein, seafood and pharmaceuticals — in transit, in season, or under a standing agreement. Every mode runs against the same process: batch reference, monitored chamber, documented intake and release."
        crumbs={[{ label: "Solutions", href: "/solutions" }]}
        aside={
          <HeroSpec
            title="At a glance"
            items={[
              { label: "Categories", value: "4 handled" },
              { label: "Storage modes", value: "6 available" },
              { label: "Set points", value: FALLBACK.temperature },
              { label: "Terms", value: FALLBACK.pricing },
            ]}
          />
        }
      />

      <ProductVault />

      {/* The discipline every mode shares — illustrative (§45). */}
      <section
        aria-label="One discipline across every mode"
        className="relative z-10 mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12"
      >
        <ImageBand
          src="/assets/frozen-pallets-frost.jpg"
          alt="Pallets of sealed frozen goods furred with frost inside a deep-freeze aisle under azure light."
          eyebrow="Every mode"
          title="One discipline"
          caption="Transit holding or a dedicated chamber, a week or a year — the batch reference, the monitoring and the paperwork do not change."
        />
      </section>

      <PrecisionCooling />
      <FlexibleStorage />

      {/* The environments, as imagery — illustrative (§45). */}
      <section
        aria-label="Held conditions"
        className="relative z-10 mx-auto w-full max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12"
      >
        <ul className="grid gap-3 md:grid-cols-3">
          <li>
            <figure className="tj-panel-shine group relative h-56 overflow-hidden rounded-2xl border border-hull-line/60 md:h-64">
              <Image
                src="/assets/produce-cold-room.jpg"
                alt="Fresh produce crates in a chilled room under azure strip lighting."
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-[1.18] object-cover"
                data-parallax="0.28"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.78),transparent_58%)]" />
              <figcaption className="absolute bottom-4 left-4">
                <p className="font-mono text-[0.5625rem] tracking-[0.22em] text-[#dba175] uppercase">Chilled</p>
                <p className="mt-1 font-display text-sm font-bold uppercase tracking-tight text-white">Produce & fresh lines</p>
              </figcaption>
            </figure>
          </li>
          <li className="md:mt-6">
            <figure className="tj-panel-shine group relative h-56 overflow-hidden rounded-2xl border border-hull-line/60 md:h-64">
              <Image
                src="/assets/sealed-frozen-cartons.jpg"
                alt="Sealed frozen cartons furred with frost in the deep-freeze chamber."
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-[1.18] object-cover"
                data-parallax="0.28"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.78),transparent_58%)]" />
              <figcaption className="absolute bottom-4 left-4">
                <p className="font-mono text-[0.5625rem] tracking-[0.22em] text-[#dba175] uppercase">Deep-frozen</p>
                <p className="mt-1 font-display text-sm font-bold uppercase tracking-tight text-white">Protein & prepared</p>
              </figcaption>
            </figure>
          </li>
          <li>
            <figure className="tj-panel-shine group relative h-56 overflow-hidden rounded-2xl border border-hull-line/60 md:h-64">
              <Image
                src="/assets/seafood-frozen-storage.jpg"
                alt="Sealed frozen seafood boxes with frost crystals inside a cold store."
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-[1.18] object-cover"
                data-parallax="0.28"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.78),transparent_58%)]" />
              <figcaption className="absolute bottom-4 left-4">
                <p className="font-mono text-[0.5625rem] tracking-[0.22em] text-[#dba175] uppercase">Least forgiving</p>
                <p className="mt-1 font-display text-sm font-bold uppercase tracking-tight text-white">Seafood</p>
              </figcaption>
            </figure>
          </li>
        </ul>
      </section>

      <Section
        id="process"
        index="05"
        eyebrow="How a booking works"
        heading={
          <>
            From request to
            <span className="tj-frost-text"> release</span>
          </>
        }
        lede="The same sequence runs whether the stock sits for a week or a year."
        width="wide"
        rule
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              step: "01",
              title: "Request",
              detail:
                "Send the requirement through the calculator or the inquiry form. A TJ-XXXXX reference is issued immediately.",
            },
            {
              step: "02",
              title: "Agree",
              detail:
                "Product, volume, duration, target temperature and terms are confirmed in writing before anything moves.",
            },
            {
              step: "03",
              title: "Receive",
              detail:
                "The load is met at the gate, checked against its documentation and opened against a batch reference.",
            },
            {
              step: "04",
              title: "Hold",
              detail:
                "Stock is placed to a zone and location, and chamber conditions are logged against it throughout.",
            },
            {
              step: "05",
              title: "Release",
              detail:
                "Outbound stock is verified against the order and its paperwork, then released through the gate.",
            },
          ].map((item) => (
            <li key={item.step}>
              <div className="tj-panel tj-corners flex h-full flex-col rounded-[2px] p-5 transition-colors duration-500 hover:border-glow/35">
                <span className="tabular font-mono text-[0.625rem] tracking-[0.2em] text-glow">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-base font-bold tracking-[-0.005em] text-frost uppercase">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-silver-dim">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
          Service levels and turnaround times are agreed per requirement —
          {` ${FALLBACK.coverage.toLowerCase()}.`}
        </p>
      </Section>

      <FinalCta />
    </>
  );
}
