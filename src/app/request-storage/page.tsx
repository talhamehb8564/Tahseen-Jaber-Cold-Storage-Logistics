import type { Metadata } from "next";

import { FinalCta } from "@/components/cta/final-cta";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { StorageCalculator } from "@/components/inquiry/storage-calculator";
import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/ui/section";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Storage",
  description:
    "Build a storage requirement with the calculator or send an inquiry directly. You receive a TJ-XXXXX reference immediately and a written quote from the facility team. No account needed.",
  alternates: { canonical: "/request-storage" },
  openGraph: {
    title: "Request Storage — Tahseen Jaber Cold Storage & Logistics",
    description:
      "Build a storage requirement with the calculator or send an inquiry directly. No account needed.",
    url: `${siteConfig.seo.url}/request-storage`,
    type: "website",
  },
};

/**
 * /request-storage (§25, §26)
 * ---------------------------------------------------------------------------
 * The conversion page. The calculator comes first because it produces a
 * structured requirement, which is easier for the facility to quote from and
 * faster for a visitor who already knows their volumes. The free-text inquiry
 * follows for anyone who would rather just describe the situation.
 *
 * Both submit through the same validated endpoint, so both honour the same rate
 * limit, abuse filter and §39 state machine.
 */
export default function RequestStoragePage() {
  return (
    <>
      <PageHero
        index="§25"
        eyebrow="Request Storage"
        title={
          <>
            Build the requirement,
            <br />
            <span className="tj-frost-text">get a reference</span>
          </>
        }
        lede="No account, no gate. Describe what needs storing and the system issues a reference immediately, then routes the requirement to the facility team for a written quote."
        crumbs={[{ label: "Request Storage", href: "/request-storage" }]}
        aside={
          <HeroSpec
            title="How it works"
            items={[
              { label: "Account required", value: "No" },
              { label: "Reference", value: "TJ-XXXXX" },
              { label: "Published rates", value: FALLBACK.pricing },
              { label: "Facility", value: siteConfig.location.facility },
            ]}
          />
        }
      />

      {/* ---------------- Calculator ---------------- */}
      <Section
        id="calculator"
        index="01"
        eyebrow="Storage Calculator"
        heading={
          <>
            Configure the
            <span className="tj-frost-text"> requirement</span>
          </>
        }
        lede="Select the product, quantity, duration and target temperature. The summary updates as you go. No estimate is invented — the requirement itself is what gets quoted."
        width="wide"
      >
        <StorageCalculator />
      </Section>

      {/* ---------------- Direct inquiry ---------------- */}
      <Section
        id="inquiry"
        index="02"
        eyebrow="Direct Inquiry"
        heading={
          <>
            Or describe it
            <span className="tj-frost-text"> in your own words</span>
          </>
        }
        lede="If the calculator does not fit the situation — unusual handling, an existing agreement, a question rather than a booking — send the details directly."
        width="wide"
        surface="raised"
        rule
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="lg:pt-2">
            <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-frost uppercase">
              What happens next
            </h3>

            <ol className="mt-6 space-y-5 border-l border-hull-line/70 pl-6">
              {[
                {
                  title: "Reference issued",
                  detail:
                    "A TJ-XXXXX reference is generated and shown to you immediately. Quote it in any follow-up and the request is found without searching.",
                },
                {
                  title: "Requirement recorded",
                  detail:
                    "The submission is stored against that reference with the product, quantity, duration and any handling notes you supplied.",
                },
                {
                  title: "Team notified",
                  detail:
                    "The facility team receives the requirement through the configured notification channel and can respond with questions.",
                },
                {
                  title: "Written quote",
                  detail:
                    "Terms and pricing are confirmed in writing. Nothing is estimated automatically, because no published rate list exists for this facility.",
                },
              ].map((step, index) => (
                <li key={step.title} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[1.65rem] size-2 rounded-full border border-glow/60 bg-midnight"
                  />
                  <p className="font-mono text-[0.5625rem] tracking-[0.2em] text-silver-dim uppercase">
                    Step {String(index + 1).padStart(2, "0")}
                  </p>
                  <h4 className="mt-1.5 font-display text-base font-bold tracking-[-0.005em] text-frost uppercase">
                    {step.title}
                  </h4>
                  <p className="mt-1.5 text-[0.875rem] leading-relaxed text-silver-dim">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>

            <div className="tj-panel mt-8 rounded-[2px] p-5">
              <p className="tj-label">Details we hold</p>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-silver-dim">
                Submitted details are used only to respond to your request. A
                connection identifier is stored as a salted hash purely to limit
                automated submissions — never as a readable address.
              </p>
            </div>
          </div>

          <InquiryForm source="WEBSITE" />
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
