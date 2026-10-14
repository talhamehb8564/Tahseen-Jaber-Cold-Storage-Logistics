import type { Metadata } from "next";

import { ArrivalSequence } from "@/components/cold-chain/arrival-sequence";
import { ColdChainTimeline } from "@/components/cold-chain/cold-chain-timeline";
import { PrecisionCooling } from "@/components/cold-chain/precision-cooling";
import { FinalCta } from "@/components/cta/final-cta";
import { FacilityMap } from "@/components/facility/facility-map";
import { HorizontalGallery } from "@/components/gallery/horizontal-gallery";
import { Hero } from "@/components/hero/hero";
import { ImageBand } from "@/components/imagery/image-band";
import Image from "next/image";
import { StorageCalculator } from "@/components/inquiry/storage-calculator";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { InventoryScanner } from "@/components/inventory/inventory-scanner";
import { LogisticsRoute } from "@/components/logistics/logistics-route";
import { ProductVault } from "@/components/products/product-vault";
import { SecurityMatrix } from "@/components/security/security-matrix";
import { FlexibleStorage } from "@/components/storage/flexible-storage";
import { ThreeChamberSection } from "@/components/three/three-chamber-section";
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

      {/* Interlude — receiving, as light and frost rather than diagram. */}
      <section
        aria-label="Receiving at the threshold"
        className="relative z-10 mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12"
      >
        <ImageBand
          src="/assets/dock-receiving-crew.jpg"
          alt="Workers in insulated jackets guiding a sealed pallet into an illuminated cold storage dock doorway at night."
          eyebrow="Receiving"
          title="The threshold moment"
          caption="Sealed pallets cross from the reefer into controlled atmosphere — the first ten minutes that decide the condition of the next month."
        />
      </section>

      {/* 03 — PRECISION COOLING: chamber cutaway (§18) */}
      <PrecisionCooling />

      {/* 03b — THE CHAMBER IN 3D: illustrative WebGL model */}
      <ThreeChamberSection />

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

      {/* 05b — GALLERY: the pinned horizontal walk-through */}
      <HorizontalGallery />

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

        {/* The stock, as it is held — illustrative (§45). */}
        <figure className="tj-panel-shine group relative mt-8 h-[38vh] min-h-[280px] overflow-hidden rounded-2xl border border-hull-line/60">
          <Image
            src="/assets/frozen-pallets-frost.jpg"
            alt="Pallets of sealed frozen goods furred with frost inside the deep-freeze aisle."
            fill
            sizes="(min-width: 1024px) 86rem, 100vw"
            className="scale-[1.22] object-cover"
            data-parallax="0.35"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.85),transparent_55%)]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
            <div>
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-[#dba175] uppercase">Batch custody</p>
              <p className="mt-1.5 font-display text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                Frost-locked, location-recorded
              </p>
            </div>
            <p className="font-mono text-[0.5625rem] tracking-[0.16em] text-white/60 uppercase">
              Illustrative visual
            </p>
          </figcaption>
        </figure>
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

        {/* The watchtower, as atmosphere — illustrative (§45). */}
        <figure className="tj-panel-shine group relative mt-8 h-[38vh] min-h-[280px] overflow-hidden rounded-2xl border border-hull-line/60">
          <Image
            src="/assets/barcode-scanning-ops.jpg"
            alt="A warehouse operator scanning the label of a sealed pallet at receiving, scan beam visible."
            fill
            sizes="(min-width: 1024px) 86rem, 100vw"
            className="scale-[1.22] object-cover"
            data-parallax="0.35"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.85),transparent_55%)]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
            <div>
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-[#dba175] uppercase">The watchtower</p>
              <p className="mt-1.5 font-display text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                Every threshold, watched
              </p>
            </div>
            <p className="font-mono text-[0.5625rem] tracking-[0.16em] text-white/60 uppercase">
              Illustrative visual
            </p>
          </figcaption>
        </figure>
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

      {/* Interlude — the cold chain in motion. */}
      <section
        aria-label="The cold chain in motion"
        className="relative z-10 mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12"
      >
        <ImageBand
          src="/assets/reefer-truck-highway.jpg"
          alt="A refrigerated truck running an empty highway at dusk, marker lights glowing under a violet sky."
          eyebrow="The road"
          title="The cold chain in motion"
          caption="Held at set point from dock to destination — the reefer is a chamber on wheels, and it answers to the same discipline."
        />
      </section>

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
