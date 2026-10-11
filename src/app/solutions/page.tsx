import type { Metadata } from "next";

import { PrecisionCooling } from "@/components/cold-chain/precision-cooling";
import { FinalCta } from "@/components/cta/final-cta";
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
      <PrecisionCooling />
      <FlexibleStorage />

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
