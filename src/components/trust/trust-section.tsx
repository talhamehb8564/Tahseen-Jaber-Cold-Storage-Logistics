import { CircleAlert } from "lucide-react";
import Image from "next/image";

import { CatalogIcon } from "@/components/ui/catalog-icon";
import { TiltCard } from "@/components/ui/tilt-card";
import { operatingPrinciples, pendingCredentials } from "@/lib/catalog";

/**
 * TRUST (§48 · section 10)
 * ---------------------------------------------------------------------------
 * This is the section where a template would put a wall of invented certification
 * logos, a fabricated "500+ clients served" counter and three testimonials from
 * people who do not exist. §45 forbids all of that, so instead:
 *
 *   1. Six OPERATING PRINCIPLES — commitments about what the system actually
 *      does. These are structural descriptions of the process, not claims about
 *      accreditation, and they are true of the software being built here.
 *   2. A clearly-marked PENDING block listing exactly which credentials are
 *      missing and must be supplied before they may be published. Publishing the
 *      gap is more trustworthy than filling it with something approximate, and it
 *      also appears in the admin content-gap list so it cannot be forgotten.
 *
 * Server component: no interactivity is required, so none is shipped.
 */

export function TrustSection() {
  return (
    <section
      id="trust"
      aria-labelledby="trust-heading"
      className="relative border-b border-hull-line/60 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12">
        <header className="max-w-3xl">
          <p className="tj-eyebrow">
            <span className="text-silver-dim">09</span> Trust
          </p>
          <h2
            id="trust-heading"
            className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)] font-bold tracking-[-0.035em] uppercase"
          >
            What we commit to,
            <br />
            <span className="tj-frost-text">and what we don't claim</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-silver sm:text-lg">
            Cold storage is a custody business. The commitments below are about how
            stock is handled and recorded — the parts that are verifiable on every
            consignment rather than on a certificate.
          </p>
        </header>

        {/* ---------------- Operating principles ---------------- */}
        <ul className="mt-14 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {operatingPrinciples.map((principle) => (
            <li key={principle.id} className="flex gap-4">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-hull-line bg-midnight/50 text-ice">
                <CatalogIcon name={principle.icon} size={18} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold tracking-[-0.005em] text-frost uppercase">
                  {principle.title}
                </h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-silver-dim">
                  {principle.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* ---------------- The floor, as it actually feels ---------------- */}
        {/* §45: illustrative imagery only — no facility facts are implied. */}
        <ul className="mt-16 grid gap-3 sm:gap-4 md:grid-cols-3">
          <li>
            <TiltCard intensity={6} className="h-64 rounded-2xl md:h-80">
            <figure className="tj-panel-shine relative h-full w-full overflow-hidden rounded-2xl border border-hull-line/60">
              <Image
                src="/assets/dock-receiving-crew.jpg"
                alt="Workers in insulated jackets guiding a sealed pallet into a lit dock doorway at night."
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-[1.2] object-cover"
                data-parallax="0.3"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.75),transparent_55%)]" />
              <figcaption className="absolute bottom-4 left-4 font-mono text-[0.5625rem] tracking-[0.22em] text-[#dba175] uppercase">
                Receiving
              </figcaption>
            </figure>
          </TiltCard>
          </li>
          <li className="md:mt-8">
            <TiltCard intensity={6} className="h-64 rounded-2xl md:h-80">
            <figure className="tj-panel-shine relative h-full w-full overflow-hidden rounded-2xl border border-hull-line/60">
              <Image
                src="/assets/pharma-cold-room.jpg"
                alt="A precision pharmaceutical cold room with stainless shelving and temperature sensors."
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-[1.2] object-cover"
                data-parallax="0.3"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.75),transparent_55%)]" />
              <figcaption className="absolute bottom-4 left-4 font-mono text-[0.5625rem] tracking-[0.22em] text-[#dba175] uppercase">
                Precision
              </figcaption>
            </figure>
          </TiltCard>
          </li>
          <li>
            <TiltCard intensity={6} className="h-64 rounded-2xl md:h-80">
            <figure className="tj-panel-shine relative h-full w-full overflow-hidden rounded-2xl border border-hull-line/60">
              <Image
                src="/assets/ice-crystal-macro.jpg"
                alt="Macro photograph of ice crystals refracting azure and violet light."
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-[1.2] object-cover"
                data-parallax="0.3"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.75),transparent_55%)]" />
              <figcaption className="absolute bottom-4 left-4 font-mono text-[0.5625rem] tracking-[0.22em] text-[#dba175] uppercase">
                Discipline
              </figcaption>
            </figure>
          </TiltCard>
          </li>
        </ul>

        {/* ---------------- Honest gap disclosure ---------------- */}
        <div className="tj-panel mt-16 rounded-[2px] border-caution/30 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-caution/40 bg-caution/[0.08] text-caution">
              <CircleAlert size={18} strokeWidth={1.7} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-frost uppercase">
                Credentials pending confirmation
              </h3>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-silver">
                The following have not been supplied and are therefore not stated
                anywhere on this site. They will be published as soon as they are
                confirmed — this site does not fill a gap with an approximation,
                because an approximate compliance claim is worse than none.
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {pendingCredentials.map((item) => (
                  <li
                    key={item}
                    className="rounded-[2px] border border-hull-line bg-midnight/50 px-3 py-2 font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim uppercase"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
