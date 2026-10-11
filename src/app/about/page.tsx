import type { Metadata } from "next";
import { CircleAlert, MapPin } from "lucide-react";

import { FinalCta } from "@/components/cta/final-cta";
import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { CatalogIcon } from "@/components/ui/catalog-icon";
import { Section } from "@/components/ui/section";
import { operatingPrinciples, pendingCredentials } from "@/lib/catalog";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tahseen Jaber Cold Storage & Logistics operates a temperature-controlled facility at Uuayrij Industrial Area, Baghdad — how it works, what it commits to, and what it does not claim.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Tahseen Jaber Cold Storage & Logistics",
    description:
      "A temperature-controlled facility at Uuayrij Industrial Area, Baghdad.",
    url: `${siteConfig.seo.url}/about`,
    type: "website",
  },
};

/**
 * /about (§45)
 * ---------------------------------------------------------------------------
 * The hardest page on the site to write honestly, because an "About" page is
 * normally where a company's history, awards, team and client list live — and
 * §45 forbids inventing any of that. None has been supplied.
 *
 * So this page is built from what IS known and verifiable:
 *   - the business name, what it does and where it operates;
 *   - how the work is actually performed (the operating principles, which are
 *     descriptions of the process this site and its systems implement);
 *   - an explicit, prominently-marked statement of what has not been supplied.
 *
 * Publishing the gap is the point. A visitor who reads "year established:
 * pending confirmation" learns something true; one who reads "established 1998"
 * learns something nobody can stand behind.
 */
export default function AboutPage() {
  const { brand, location } = siteConfig;

  return (
    <>
      <PageHero
        eyebrow="About"
        title={
          <>
            A cold chain is a
            <br />
            <span className="tj-frost-text">promise kept over time</span>
          </>
        }
        lede={`${brand.name} operates a temperature-controlled storage and logistics facility at ${location.facility}, ${location.city}. The work is custody: holding other people's product at the condition it needs, and being able to answer for it afterwards.`}
        crumbs={[{ label: "About", href: "/about" }]}
        atmosphere={0.5}
        aside={
          <HeroSpec
            title="The business"
            items={[
              { label: "Name", value: brand.shortName },
              { label: "Base", value: location.facility },
              { label: "City", value: location.city },
              { label: "Established", value: FALLBACK.enquiry },
            ]}
          />
        }
      />

      {/* ---------------- What the work is ---------------- */}
      <Section
        id="the-work"
        index="01"
        eyebrow="The work"
        heading={
          <>
            Custody, not just
            <span className="tj-frost-text"> cold air</span>
          </>
        }
        lede="Refrigeration is the easy part to describe and the hard part to keep stable. The rest of the job is discipline: knowing what is in the building, where it is, what condition it has been held in, and who moved it."
        width="wide"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-silver">
              Produce loses quality to warmth and to dry air. Protein survives
              freeze-thaw badly. Seafood is the least forgiving category there is.
              Pharmaceuticals need a restricted space where access is controlled and
              every movement is recorded. Those are four different problems that
              happen to share a building.
            </p>
            <p className="text-base leading-relaxed text-silver-dim">
              So the facility is divided rather than generalised: separate zones,
              each held to the conditions its stock needs, each with its own access
              rules. Product moves through them in one direction — received, placed,
              monitored, released — and a single batch reference ties the records
              from each stage back to the same load.
            </p>
            <p className="text-base leading-relaxed text-silver-dim">
              That last part matters more than it sounds. A cold chain is only worth
              something if it can be answered for after the fact: what was held, at
              what condition, for how long, and who released it. Without the record,
              "it was held correctly" is just an assertion.
            </p>
          </div>

          <div className="tj-panel tj-corners rounded-[2px] p-6 sm:p-7">
            <p className="tj-label tj-label-glow flex items-center gap-2">
              <MapPin size={13} strokeWidth={1.7} aria-hidden />
              Where we operate
            </p>
            <address className="mt-4 not-italic">
              <p className="text-base leading-relaxed text-frost">
                {location.facility}
                <br />
                {location.city}, {location.country}
              </p>
            </address>
            <p className="mt-5 text-[0.875rem] leading-relaxed text-silver-dim">
              An industrial area is the right setting for this work: heavy vehicles
              reach the dock without crossing retail streets, and neighbouring uses
              expect industrial movement at unsocial hours.
            </p>
            <p className="mt-5 border-t border-hull-line/70 pt-4 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
              Street address, coordinates and opening hours are pending confirmation
              and are not published.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------- Operating principles ---------------- */}
      <Section
        id="principles"
        index="02"
        eyebrow="How we work"
        heading={
          <>
            Six commitments we
            <span className="tj-frost-text"> can actually evidence</span>
          </>
        }
        lede="These are not aspirations or values statements. Each one is a thing the process does, on every consignment, and each produces a record."
        width="wide"
        surface="raised"
        rule
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {operatingPrinciples.map((principle, index) => (
            <li key={principle.id}>
              <article className="tj-panel tj-corners flex h-full flex-col rounded-[2px] p-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-glow/40">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-hull-line bg-midnight/50 text-ice">
                    <CatalogIcon name={principle.icon} size={18} strokeWidth={1.5} />
                  </span>
                  <span className="tabular font-mono text-[0.625rem] tracking-[0.18em] text-silver-dim/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-base font-bold tracking-[-0.005em] text-frost uppercase">
                  {principle.title}
                </h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-silver-dim">
                  {principle.detail}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- What we do NOT claim ---------------- */}
      <Section
        id="disclosure"
        index="03"
        eyebrow="Disclosure"
        heading={
          <>
            What this site
            <span className="tj-frost-text"> deliberately omits</span>
          </>
        }
        lede="Most company sites fill these spaces with approximations. This one leaves them empty and says so, because an unverifiable claim about cold storage is worse than no claim at all."
        width="wide"
        rule
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div className="tj-panel rounded-[2px] border-caution/25 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-caution/40 bg-caution/[0.08] text-caution">
                <CircleAlert size={18} strokeWidth={1.7} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-frost uppercase">
                  Pending confirmation
                </h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-silver">
                  The following have not been supplied by the business, so they are
                  not stated anywhere on this site. Each will be published once it is
                  confirmed.
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-2">
              {pendingCredentials.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-[2px] border border-hull-line/70 bg-midnight/40 px-3.5 py-2.5"
                >
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-caution/70" />
                  <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-silver uppercase">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="tj-panel rounded-[2px] p-6">
              <p className="tj-label tj-label-glow">On capacity and temperature</p>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-silver-dim">
                Pallet positions, floor area, chamber count and approved temperature
                ranges are all shown as{" "}
                <span className="font-mono text-[0.75rem] tracking-[0.08em] text-frost uppercase">
                  {FALLBACK.capability}
                </span>{" "}
                or{" "}
                <span className="font-mono text-[0.75rem] tracking-[0.08em] text-frost uppercase">
                  {FALLBACK.temperature}
                </span>
                . A specific number here would read as a specification, and inventing
                one is exactly the failure this site is built to avoid.
              </p>
            </div>

            <div className="tj-panel rounded-[2px] p-6">
              <p className="tj-label tj-label-glow">On simulated data</p>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-silver-dim">
                Where this site shows instrumented readings — zone temperatures,
                humidity, camera state, occupancy — they are generated for
                demonstration and badged{" "}
                <span className="font-mono text-[0.75rem] tracking-[0.1em] text-caution uppercase">
                  SIMULATION
                </span>
                . Nothing is labelled live unless it is genuinely connected to a
                source, and the badge is derived from the data source itself rather
                than written by hand.
              </p>
            </div>

            <div className="tj-panel rounded-[2px] p-6">
              <p className="tj-label tj-label-glow">On pharmaceuticals</p>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-silver-dim">
                Pharmaceutical storage is offered as a restricted, monitored,
                access-controlled space. No medical-grade, regulatory or compliance
                certification is claimed, because none has been verified. Clients
                with a regulated requirement should confirm suitability directly
                before placing stock.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
