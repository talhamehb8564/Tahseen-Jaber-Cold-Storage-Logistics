import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";

import { ContactForm } from "@/components/inquiry/contact-form";
import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/ui/section";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Tahseen Jaber Cold Storage & Logistics at Uuayrij Industrial Area, Baghdad, Iraq. Send a message and receive a TJ-XXXXX reference immediately.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Tahseen Jaber Cold Storage & Logistics",
    description: "Uuayrij Industrial Area, Baghdad, Iraq.",
    url: `${siteConfig.seo.url}/contact`,
    type: "website",
  },
};

/**
 * /contact (§46)
 * ---------------------------------------------------------------------------
 * The facility address is a verified fact and is stated plainly. Telephone,
 * WhatsApp, email, opening hours and social profiles have NOT been supplied, so
 * each renders an explicit "pending confirmation" line rather than an invented
 * number — §45 treats a fabricated contact detail as a correctness failure, not
 * a cosmetic one.
 */
export default function ContactPage() {
  const { contact, location } = siteConfig;

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Uuayrij Industrial Area,
            <br />
            <span className="tj-frost-text">Baghdad</span>
          </>
        }
        lede="Send a message and you will receive a reference immediately. For a storage requirement with volumes and timings, the calculator produces a more complete request."
        crumbs={[{ label: "Contact", href: "/contact" }]}
        aside={
          <HeroSpec
            title="Facility"
            items={[
              { label: "Area", value: location.facility },
              { label: "City", value: location.city },
              { label: "Country", value: location.country },
              { label: "Hours", value: location.openingHours ?? FALLBACK.enquiry },
            ]}
          />
        }
      />

      <Section width="wide" spacing="loose">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-14">
          {/* ---------------- Details ---------------- */}
          <div className="space-y-5">
            {/* The facility — illustrative (§45). */}
            <figure className="tj-panel-shine relative h-44 overflow-hidden rounded-2xl border border-hull-line/60 sm:h-52">
              <Image
                src="/assets/facility-exterior-night.jpg"
                alt="The cold storage facility at night: illuminated dock doors under an indigo sky."
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="scale-[1.18] object-cover"
                data-parallax="0.25"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.82),transparent_62%)]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-[#dba175] uppercase">
                  Uuayrij Industrial Area
                </span>
                <span className="font-mono text-[0.5rem] tracking-[0.16em] text-white/60 uppercase">
                  Illustrative
                </span>
              </figcaption>
            </figure>
            <div className="tj-panel tj-corners rounded-[2px] p-6">
              <p className="tj-label tj-label-glow flex items-center gap-2">
                <MapPin size={13} strokeWidth={1.7} aria-hidden />
                Address
              </p>
              <address className="mt-4 not-italic">
                <p className="text-base leading-relaxed text-frost">
                  {location.facility}
                  <br />
                  {location.city}, {location.country}
                </p>
                {location.street ? (
                  <p className="mt-2 text-sm leading-relaxed text-silver">{location.street}</p>
                ) : null}
                {location.postalCode ? (
                  <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.1em] text-silver-dim uppercase">
                    {location.postalCode}
                  </p>
                ) : null}
              </address>

              <p className="mt-5 border-t border-hull-line/70 pt-4 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/80 uppercase">
                Street address and coordinates are pending confirmation, so no map
                pin is published.
              </p>
            </div>

            <div className="tj-panel rounded-[2px] p-6">
              <p className="tj-label tj-label-glow">Direct</p>
              <ul className="mt-4 space-y-3.5">
                <ContactLine
                  icon={<Phone size={15} strokeWidth={1.6} aria-hidden />}
                  label="Telephone"
                  href={contact.phone ? `tel:${contact.phone}` : null}
                  value={contact.phoneDisplay ?? contact.phone}
                />
                <ContactLine
                  icon={<MessageCircle size={15} strokeWidth={1.6} aria-hidden />}
                  label="WhatsApp"
                  href={
                    contact.whatsapp
                      ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`
                      : null
                  }
                  value={contact.whatsapp}
                  external
                />
                <ContactLine
                  icon={<Mail size={15} strokeWidth={1.6} aria-hidden />}
                  label="Email"
                  href={contact.email ? `mailto:${contact.email}` : null}
                  value={contact.email}
                />
                <ContactLine
                  icon={<Clock size={15} strokeWidth={1.6} aria-hidden />}
                  label="Opening hours"
                  href={null}
                  value={location.openingHours}
                />
              </ul>
            </div>

            {/* Social profiles — only rendered when supplied and verified. */}
            {contact.socials.length > 0 ? (
              <div className="tj-panel rounded-[2px] p-6">
                <p className="tj-label tj-label-glow">Elsewhere</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {contact.socials.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-[2px] border border-hull-line px-3 py-2 font-mono text-[0.5625rem] tracking-[0.14em] text-silver uppercase transition-colors duration-300 hover:border-glow/45 hover:text-glow"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="tj-panel rounded-[2px] border-dashed p-6">
                <p className="tj-label">Elsewhere</p>
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-silver-dim">
                  Social profiles have not been supplied and verified, so none are
                  listed. This avoids pointing visitors at an account that may not
                  belong to the business.
                </p>
              </div>
            )}

            <div className="tj-panel rounded-[2px] p-6">
              <p className="tj-label tj-label-glow">Planning a requirement?</p>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-silver">
                The storage calculator captures product, quantity, duration and
                target temperature in a form the facility can quote from directly.
              </p>
              <a
                href="/request-storage#calculator"
                className="mt-4 inline-flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.16em] text-glow uppercase transition-colors duration-300 hover:text-ice"
              >
                Open the calculator
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          {/* ---------------- The form ---------------- */}
          <div>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}

function ContactLine({
  icon,
  label,
  href,
  value,
  external = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string | null;
  value: string | null;
  external?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-glow">{icon}</span>
      <div className="min-w-0">
        <p className="tj-label">{label}</p>
        {href && value ? (
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            className="mt-1 block font-mono text-sm text-silver transition-colors duration-300 hover:text-ice"
          >
            {value}
          </a>
        ) : (
          // §45 — no supplied detail, so no invented one either.
          <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.1em] text-silver-dim/75 uppercase">
            {FALLBACK.enquiry}
          </p>
        )}
      </div>
    </li>
  );
}
