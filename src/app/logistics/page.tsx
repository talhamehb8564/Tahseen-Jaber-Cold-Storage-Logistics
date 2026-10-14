import type { Metadata } from "next";

import { ColdChainTimeline } from "@/components/cold-chain/cold-chain-timeline";
import { FinalCta } from "@/components/cta/final-cta";
import { ImageBand } from "@/components/imagery/image-band";
import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { LogisticsRoute } from "@/components/logistics/logistics-route";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Section } from "@/components/ui/section";
import { getDataProvider, getDataSourceInfo } from "@/lib/data";
import { logisticsStops } from "@/lib/catalog";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Logistics",
  description:
    "Cold-chain movement through the Uuayrij facility: intake at the gate, chamber placement, dock staging, documentation check and gate release, tracked against one batch reference.",
  alternates: { canonical: "/logistics" },
  openGraph: {
    title: "Logistics — Tahseen Jaber Cold Storage & Logistics",
    description:
      "Intake, placement, staging, verification and release — one unbroken chain of custody.",
    url: `${siteConfig.seo.url}/logistics`,
    type: "website",
  },
};

/**
 * /logistics (§24)
 * ---------------------------------------------------------------------------
 * The chain of custody in depth: the drawn route and the stage-by-stage
 * explanation beside it.
 *
 * §24 — no coverage claim is made. Verified delivery coverage has not been
 * supplied, so the map is explicitly schematic, the five stops are process stages
 * rather than destinations, and the coverage line prints the fallback.
 */
export default async function LogisticsPage() {
  const source = await getDataSourceInfo();
  const simulated = source.badge !== "LIVE";

  return (
    <>
      <PageHero
        eyebrow="Logistics"
        title={
          <>
            One reference,
            <br />
            <span className="tj-frost-text">gate to gate</span>
          </>
        }
        lede="A consignment is opened against a batch reference when it reaches the gate and closed against the same reference when it leaves. Everything between those two points is recorded against it, so the history of a load can be followed after the fact rather than reconstructed from memory."
        crumbs={[{ label: "Logistics", href: "/logistics" }]}
        aside={
          <HeroSpec
            title="The route"
            items={[
              { label: "Stages", value: `${logisticsStops.length} controlled` },
              { label: "Tracked by", value: "Batch reference" },
              { label: "Coverage", value: FALLBACK.coverage },
              { label: "Base", value: siteConfig.location.facility },
            ]}
          />
        }
      />

      <Section
        id="route"
        index="01"
        eyebrow="Consignment route"
        heading={
          <>
            The line draws itself
            <span className="tj-frost-text"> as you scroll</span>
          </>
        }
        lede="Intake, placement, staging, verification and release. Scroll and the vehicle follows the route stage by stage; the panel alongside explains what happens at each one."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
      >
        <LogisticsRoute simulated={simulated} />
      </Section>

      {/* The cold chain in motion — illustrative (§45). */}
      <section
        aria-label="The cold chain in motion"
        className="relative z-10 mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12"
      >
        <ImageBand
          src="/assets/reefer-truck-highway.jpg"
          alt="A refrigerated truck running an empty highway at dusk, marker lights glowing under a violet sky."
          eyebrow="Gate to gate"
          title="A chamber on wheels"
          caption="The reefer answers to the same discipline as the building: one set point, one reference, one record from dock to destination."
        />
      </section>

      <ColdChainTimeline />

      {/* ---------------- Chain of custody ---------------- */}
      <Section
        id="custody"
        index="04"
        eyebrow="Chain of custody"
        heading={
          <>
            What gets recorded,
            <span className="tj-frost-text"> and when</span>
          </>
        }
        lede="The point of a cold chain is that it can be answered for later. These are the records produced along the route."
        width="wide"
        rule
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Batch reference",
              when: "Opened at intake",
              detail:
                "One identifier follows the consignment through placement, holding and release, so records from different stages can be tied back to the same load.",
            },
            {
              title: "Receiving record",
              when: "At the dock",
              detail:
                "What arrived, in what quantity, in what condition, and against which documentation — captured before the product leaves the vehicle's care.",
            },
            {
              title: "Zone and location",
              when: "On placement",
              detail:
                "Stock is recorded to a chamber and a position within it, so a specific pallet can be found rather than searched for.",
            },
            {
              title: "Condition log",
              when: "Throughout holding",
              detail:
                "Chamber conditions are logged against the zone over time, which is what turns a temperature claim into a temperature history.",
            },
            {
              title: "Facility events",
              when: "On any change",
              detail:
                "Intake, movement, release, an alarm or a door held open too long — each raises an event rather than being reconstructed later.",
            },
            {
              title: "Gate pass",
              when: "On release",
              detail:
                "What left, when, on which vehicle and against whose authority. The record that closes the chain for that consignment.",
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className="tj-panel tj-corners group flex h-full flex-col rounded-[2px] p-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-glow/40"
            >
              <span className="tabular font-mono text-[0.625rem] tracking-[0.2em] text-silver-dim/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-base font-bold tracking-[-0.005em] text-frost uppercase">
                {item.title}
              </h3>
              <p className="mt-1.5 font-mono text-[0.5625rem] tracking-[0.16em] text-glow uppercase">
                {item.when}
              </p>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-silver-dim">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------- Transport ---------------- */}
      <Section
        id="transport"
        index="05"
        eyebrow="Transport"
        heading={
          <>
            Movement arranged
            <span className="tj-frost-text"> per requirement</span>
          </>
        }
        lede="Collection and delivery can be arranged alongside storage. What is available depends on the requirement, so it is confirmed rather than advertised."
        width="wide"
        surface="raised"
        rule
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-4">
            {[
              {
                title: "Refrigerated movement",
                detail:
                  "Stock travels in a temperature-controlled vehicle so the chain is not broken between the chamber and the destination.",
              },
              {
                title: "Collection or delivery",
                detail:
                  "Either end of the journey can be handled. Say which when submitting the requirement and it will be confirmed in the quote.",
              },
              {
                title: "Documentation carried with the load",
                detail:
                  "The paperwork that matched the stock at intake travels with it, and is checked again before release.",
              },
            ].map((item) => (
              <div key={item.title} className="tj-panel rounded-[2px] p-5 sm:p-6">
                <h3 className="font-display text-base font-bold tracking-[-0.005em] text-frost uppercase">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-silver-dim">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="tj-panel tj-corners rounded-[2px] border-caution/25 p-6 sm:p-7">
            <p className="tj-label tj-label-glow">Coverage</p>
            <p className="mt-3 font-mono text-sm tracking-[0.1em] text-caution uppercase">
              {siteConfig.capabilities.deliveryCoverage ?? FALLBACK.coverage}
            </p>
            <p className="mt-4 text-[0.875rem] leading-relaxed text-silver">
              Verified delivery coverage has not been supplied for this facility, so
              no service area is published here — neither a list of governorates nor
              a claim of national reach.
            </p>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-silver-dim">
              Tell us where stock needs to move and the requirement will be confirmed
              directly. Fleet size and vehicle types are likewise{" "}
              {FALLBACK.capability.toLowerCase()}.
            </p>
          </div>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
