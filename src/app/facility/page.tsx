import type { Metadata } from "next";

import { PrecisionCooling } from "@/components/cold-chain/precision-cooling";
import { FinalCta } from "@/components/cta/final-cta";
import { FacilityMap } from "@/components/facility/facility-map";
import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { SecurityMatrix } from "@/components/security/security-matrix";
import { CatalogIcon } from "@/components/ui/catalog-icon";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Section } from "@/components/ui/section";
import { getDataProvider, getDataSourceInfo } from "@/lib/data";
import { facilityZones } from "@/lib/catalog";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Facility",
  description:
    "Inside the Uuayrij facility: eight controlled zones from receiving to dispatch, the refrigeration circuit behind them, and the security thresholds between them.",
  alternates: { canonical: "/facility" },
  openGraph: {
    title: "Facility — Tahseen Jaber Cold Storage & Logistics",
    description:
      "Eight controlled zones from receiving to dispatch, and the refrigeration circuit behind them.",
    url: `${siteConfig.seo.url}/facility`,
    type: "website",
  },
};

/**
 * /facility (§21, §23, §18)
 * ---------------------------------------------------------------------------
 * The building in depth: the interactive plan, the refrigeration cutaway, the
 * zone register and the security thresholds.
 *
 * §21 — capacity is never stated. Every zone prints the configured fallback,
 * because pallet positions and floor area have not been supplied. The plan is
 * labelled schematic and not to measured scale, on the artwork itself as well as
 * in the caption, so it cannot be mistaken for a survey drawing.
 */
export default async function FacilityPage() {
  const [provider, source] = await Promise.all([
    getDataProvider(),
    getDataSourceInfo(),
  ]);
  const [zoneReadings, security] = await Promise.all([
    provider.getZoneReadings(),
    provider.getSecurityStatus(),
  ]);

  const simulated = source.badge !== "LIVE";

  return (
    <>
      <PageHero
        eyebrow="Facility"
        title={
          <>
            Eight zones between
            <br />
            <span className="tj-frost-text">gate and dock</span>
          </>
        }
        lede="A single controlled building at Uuayrij Industrial Area, divided so that product moves through it in one direction — received, placed, monitored, released — and so that each zone can be held to the conditions its stock needs."
        crumbs={[{ label: "Facility", href: "/facility" }]}
        atmosphere={0.55}
        aside={
          <HeroSpec
            title="The building"
            items={[
              { label: "Zones", value: `${facilityZones.length} controlled` },
              { label: "Restricted", value: "Pharma · Security" },
              { label: "Capacity", value: FALLBACK.capability },
              { label: "Set points", value: FALLBACK.temperature },
            ]}
          />
        }
      />

      {/* ---------------- Interactive plan ---------------- */}
      <Section
        id="plan"
        index="01"
        eyebrow="Site plan"
        heading={
          <>
            Select a zone to
            <span className="tj-frost-text"> open it</span>
          </>
        }
        lede="Hover or focus any zone to preview it; select it to read what it is for, how it is held and who may enter. The whole plan is keyboard operable."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
      >
        <FacilityMap readings={zoneReadings} simulated={simulated} />
      </Section>

      {/* ---------------- Zone register ---------------- */}
      <Section
        id="zones"
        index="02"
        eyebrow="Zone register"
        heading={
          <>
            Every zone,
            <span className="tj-frost-text"> written down</span>
          </>
        }
        lede="The same information in table form, for anyone who would rather read the register than work through the plan."
        width="wide"
        surface="raised"
        rule
      >
        <div className="tj-panel overflow-hidden rounded-[2px]">
          <div className="hidden grid-cols-[5.5rem_minmax(0,1.1fr)_5.5rem_minmax(0,1.6fr)_8rem] gap-4 border-b border-hull-line/70 px-5 py-3 lg:grid">
            {["Code", "Zone", "Target", "Purpose", "Access"].map((heading) => (
              <span key={heading} className="tj-label">
                {heading}
              </span>
            ))}
          </div>

          <ul className="divide-y divide-hull-line/50">
            {facilityZones.map((zone) => (
              <li
                key={zone.id}
                className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors duration-300 hover:bg-hull/25 lg:grid-cols-[5.5rem_minmax(0,1.1fr)_5.5rem_minmax(0,1.6fr)_8rem] lg:items-center lg:gap-4"
              >
                <span className="tabular font-mono text-[0.75rem] font-medium text-glow">
                  {zone.code}
                </span>

                <span className="flex items-center gap-2.5">
                  <span className="text-ice" aria-hidden>
                    <CatalogIcon name={zone.icon} size={15} strokeWidth={1.6} />
                  </span>
                  <span className="font-display text-[0.875rem] font-bold tracking-[-0.005em] text-frost uppercase">
                    {zone.name}
                  </span>
                </span>

                <span className="font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim uppercase lg:text-[0.625rem]">
                  {zone.temperatureLabel}
                </span>

                <span className="text-[0.8125rem] leading-relaxed text-silver-dim">
                  {zone.purpose}
                </span>

                <span
                  className={
                    zone.kind === "pharma" || zone.kind === "security"
                      ? "font-mono text-[0.5625rem] tracking-[0.14em] text-caution uppercase"
                      : "font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase"
                  }
                >
                  {zone.kind === "pharma" || zone.kind === "security"
                    ? "Restricted"
                    : "Standard"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
          Capacity and floor area: {FALLBACK.capability} — not published because
          they have not been confirmed for this facility.
        </p>
      </Section>

      <PrecisionCooling />

      {/* ---------------- Security thresholds ---------------- */}
      <Section
        id="security"
        index="04"
        eyebrow="Security"
        heading={
          <>
            Controlled at every
            <span className="tj-frost-text"> threshold</span>
          </>
        }
        lede="Perimeter, gate, chamber doors and the restricted zones each form a controlled threshold. The console below is the view an operator would work from."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
        rule
      >
        <SecurityMatrix status={security} simulated={security.simulated} />
      </Section>

      {/* ---------------- Location ---------------- */}
      <Section id="location" index="05" eyebrow="Location" width="wide" rule>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[0.98] tracking-[-0.03em] uppercase">
              Uuayrij Industrial Area,
              <br />
              <span className="tj-frost-text">Baghdad</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-silver">
              The facility sits inside an industrial area, which is where cold
              storage belongs: heavy vehicles can reach it without crossing retail
              streets, and the neighbouring uses expect industrial traffic at
              unsocial hours.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-silver-dim">
              An exact street address, postal code and map coordinates have not been
              supplied, so no pin is published here. Directions are given directly
              when a collection or delivery is arranged.
            </p>
          </div>

          <div className="tj-panel tj-corners rounded-[2px] p-6 sm:p-7">
            <p className="tj-label tj-label-glow">Facility record</p>
            <dl className="mt-4 divide-y divide-hull-line/60 border-y border-hull-line/60">
              {[
                { label: "Area", value: siteConfig.location.facility },
                { label: "City", value: siteConfig.location.city },
                { label: "Country", value: siteConfig.location.country },
                { label: "Street", value: siteConfig.location.street ?? FALLBACK.enquiry },
                { label: "Coordinates", value: FALLBACK.enquiry },
                { label: "Hours", value: siteConfig.location.openingHours ?? FALLBACK.enquiry },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="tj-label shrink-0">{row.label}</dt>
                  <dd className="min-w-0 truncate text-right font-mono text-[0.6875rem] tracking-[0.1em] text-frost uppercase">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
              Fields marked "available on request" have not been supplied and are
              not invented on this site.
            </p>
          </div>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
