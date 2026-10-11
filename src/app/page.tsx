import type { Metadata } from "next";

import { ArrivalSequence } from "@/components/cold-chain/arrival-sequence";
import { ColdChainTimeline } from "@/components/cold-chain/cold-chain-timeline";
import { PrecisionCooling } from "@/components/cold-chain/precision-cooling";
import { FinalCta } from "@/components/cta/final-cta";
import { FacilityMap } from "@/components/facility/facility-map";
import { Hero } from "@/components/hero/hero";
import { StorageCalculator } from "@/components/inquiry/storage-calculator";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { InventoryScanner } from "@/components/inventory/inventory-scanner";
import { LogisticsRoute } from "@/components/logistics/logistics-route";
import { ProductVault } from "@/components/products/product-vault";
import { SecurityMatrix } from "@/components/security/security-matrix";
import { FlexibleStorage } from "@/components/storage/flexible-storage";
import { TrustSection } from "@/components/trust/trust-section";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Section } from "@/components/ui/section";
import { getDataProvider, getDataSourceInfo } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.seo.defaultTitle,
  description: siteConfig.seo.defaultDescription,
  alternates: { canonical: "/" },
  openGraph: {
    url: siteConfig.seo.url,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    type: "website",
  },
};

/**
 * HOME — THE COLD CHAIN COMES ALIVE (§16, §48)
 * ---------------------------------------------------------------------------
 * Server component. It resolves the data provider once and passes plain view
 * objects down to the client sections, which keeps two promises:
 *
 *   §40 — demo data is generated on the server, so the server render and the
 *         client hydration see identical values and the SIMULATION badge is
 *         derived from the provider rather than chosen by an author.
 *   §35 — only the sections that genuinely need interaction are client
 *         components; the trust and storage grids ship no JavaScript at all.
 *
 * Section order follows §48 exactly.
 */
export default async function HomePage() {
  const [provider, source] = await Promise.all([
    getDataProvider(),
    getDataSourceInfo(),
  ]);

  const [zoneReadings, inventory, security] = await Promise.all([
    provider.getZoneReadings(),
    provider.getInventorySnapshot(),
    provider.getSecurityStatus(),
  ]);

  const simulated = source.badge !== "LIVE";

  return (
    <>
      {/* 01 — HERO: high-definition facility slider (§10–§14) */}
      <Hero />

      {/* 02 — ARRIVAL: the truck docks, the chamber opens (§11) */}
      <ArrivalSequence />

      {/* 03 — THE COLD CHAIN: pinned journey (§17) */}
      <ColdChainTimeline />

      {/* 03 — PRECISION COOLING: chamber cutaway (§18) */}
      <PrecisionCooling />

      {/* 04 — PRODUCTS: four environments (§19, §20) */}
      <ProductVault />

      {/* 05 — FACILITY: interactive plan (§21) */}
      <Section
        id="facility"
        index="05"
        eyebrow="Facility"
        heading={
          <>
            The building,
            <br />
            <span className="tj-frost-text">zone by zone</span>
          </>
        }
        lede="Eight zones between the gate and the dock. Select any one of them to see what it is for, how it is held and what its access rules are."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
        rule
      >
        <FacilityMap readings={zoneReadings} simulated={simulated} />
      </Section>

      {/* 06 — INVENTORY: WMS view + scan animation (§22) */}
      <Section
        id="inventory"
        index="06"
        eyebrow="Inventory"
        heading={
          <>
            Every batch,
            <br />
            <span className="tj-frost-text">accounted for</span>
          </>
        }
        lede="Stock is recorded to a batch, a zone and a location. Selecting a batch runs it through the verification bay the way an operator would at intake."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
        rule
      >
        <InventoryScanner items={inventory.items} simulated={inventory.simulated} />
      </Section>

      {/* 07 — SECURITY: matrix, access, door, thermal (§23) */}
      <Section
        id="security"
        index="07"
        eyebrow="Security"
        heading={
          <>
            Controlled at
            <br />
            <span className="tj-frost-text">every threshold</span>
          </>
        }
        lede="Perimeter, gate, chamber doors and restricted zones are each a controlled threshold. The console below is the view an operator would work from."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
        rule
      >
        <SecurityMatrix status={security} simulated={security.simulated} />
      </Section>

      {/* 08 — LOGISTICS: the drawn route (§24) */}
      <Section
        id="logistics"
        index="08"
        eyebrow="Logistics"
        heading={
          <>
            Received, held,
            <br />
            <span className="tj-frost-text">released</span>
          </>
        }
        lede="The route a consignment takes from intake to gate release. Scroll and the line draws itself, with the vehicle following it stage by stage."
        aside={<ProvenanceBadge simulated={simulated} compact />}
        width="wide"
        rule
      >
        <LogisticsRoute simulated={simulated} />
      </Section>

      {/* 09 — FLEXIBLE STORAGE */}
      <FlexibleStorage />

      {/* 10 — TRUST */}
      <TrustSection />

      {/* 11 — REQUEST STORAGE: calculator + inquiry (§25, §26) */}
      <Section
        id="request-storage"
        index="11"
        eyebrow="Request Storage"
        heading={
          <>
            Tell us what
            <br />
            <span className="tj-frost-text">needs storing</span>
          </>
        }
        lede="Use the calculator to build the requirement, or send an inquiry directly. Either way you receive a reference immediately and a written quote from the facility team. No account is needed."
        width="wide"
        surface="gradient"
        rule
      >
        <div id="calculator" className="scroll-mt-32">
          <StorageCalculator />
        </div>

        <div className="mt-20 grid gap-8 border-t border-hull-line/70 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-bold tracking-[-0.01em] text-frost uppercase sm:text-2xl">
              Send an inquiry
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-silver">
              If you would rather describe the requirement in your own words, use
              the form. Every submission is recorded against a reference in the
              format <span className="font-mono text-glow">TJ-XXXXX</span> and
              routed to the facility team.
            </p>

            <dl className="mt-7 space-y-3 border-t border-hull-line/70 pt-6">
              <SummaryLine label="Reference format" value="TJ-XXXXX" mono />
              <SummaryLine label="Pricing" value="Quoted per requirement" />
              <SummaryLine label="Account required" value="No" />
              <SummaryLine label="Facility" value={siteConfig.location.facility} />
            </dl>

            <p className="mt-6 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
              Submitted details are used only to respond to your request.
            </p>
          </div>

          <InquiryForm source="WEBSITE" />
        </div>
      </Section>

      {/* 12 — FINAL CALL TO ACTION (§47) */}
      <FinalCta />
    </>
  );
}

function SummaryLine({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="tj-label shrink-0">{label}</dt>
      <dd
        className={
          mono
            ? "tabular truncate font-mono text-[0.75rem] tracking-[0.08em] text-glow"
            : "truncate text-right text-[0.8125rem] text-silver"
        }
      >
        {value}
      </dd>
    </div>
  );
}
