import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { WordmarkGlyph } from "@/components/navigation/wordmark";
import { navigation, primaryCta, siteConfig } from "@/lib/site";
import { FALLBACK } from "@/lib/site";

/**
 * FOOTER (§46)
 * ---------------------------------------------------------------------------
 * Premium dark footer. Only verified contact details are rendered as links:
 * `siteConfig.contact` holds `null` for anything the business has not supplied,
 * and a null field renders an explicit "pending confirmation" line instead of a
 * fabricated number or address (§45).
 */

const SOLUTIONS = [
  { label: "Cold Storage", href: "/solutions#cold-storage" },
  { label: "Frozen Storage", href: "/solutions#frozen-storage" },
  { label: "Temperature Control", href: "/solutions#temperature-control" },
  { label: "Inventory Handling", href: "/solutions#inventory" },
  { label: "Cold-Chain Logistics", href: "/logistics" },
] as const;

const RESOURCES = [
  { label: "Request Storage", href: "/request-storage" },
  { label: "Storage Calculator", href: "/request-storage#calculator" },
  { label: "Facility Plan", href: "/facility" },
  { label: "Client Portal", href: "/portal" },
  { label: "Contact", href: "/contact" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const { contact, location } = siteConfig;

  return (
    <footer className="relative mt-auto border-t border-hull-line/70 bg-midnight/85">
      {/* Cold pool lifting off the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(143,123,255,0.13), transparent 72%)",
        }}
      />
      <div aria-hidden className="tj-grid pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative mx-auto w-full max-w-[86rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        {/* ---------------- Top: wordmark + CTA ---------------- */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <Link href="/" className="group inline-flex items-center gap-3.5" aria-label="Home">
              <WordmarkGlyph size={40} className="text-ice" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-bold tracking-[-0.01em] text-frost uppercase">
                  {siteConfig.brand.shortName}
                </span>
                <span className="mt-1.5 font-mono text-[0.5625rem] tracking-[0.26em] text-silver-dim uppercase">
                  Cold Storage &amp; Logistics
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-silver">
              {siteConfig.brand.tagline}
            </p>

            <address className="mt-6 not-italic">
              <p className="tj-label">Facility</p>
              <p className="mt-2.5 flex items-start gap-2.5 text-sm leading-relaxed text-frost">
                <MapPin size={15} strokeWidth={1.6} aria-hidden className="mt-0.5 shrink-0 text-glow" />
                <span>
                  {location.facility}
                  <br />
                  {location.city}, {location.country}
                </span>
              </p>
            </address>
          </div>

          {/* Contact — verified details only */}
          <div className="lg:text-right">
            <p className="tj-label">Direct</p>
            <ul className="mt-3 space-y-2.5 lg:inline-block lg:text-left">
              <ContactRow
                icon={<Phone size={14} strokeWidth={1.6} aria-hidden />}
                href={contact.phone ? `tel:${contact.phone}` : null}
                value={contact.phoneDisplay ?? contact.phone}
                label="Telephone"
              />
              <ContactRow
                icon={<MessageCircle size={14} strokeWidth={1.6} aria-hidden />}
                href={contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : null}
                value={contact.whatsapp}
                label="WhatsApp"
                external
              />
              <ContactRow
                icon={<Mail size={14} strokeWidth={1.6} aria-hidden />}
                href={contact.email ? `mailto:${contact.email}` : null}
                value={contact.email}
                label="Email"
              />
            </ul>

            <div className="mt-8 lg:flex lg:justify-end">
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center gap-2 border-b border-glow/40 pb-1 font-mono text-[0.6875rem] tracking-[0.18em] text-glow uppercase transition-colors duration-300 hover:border-glow hover:text-ice"
              >
                {primaryCta.label}
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ---------------- Link columns ---------------- */}
        <nav aria-label="Footer" className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title="Navigate" links={navigation.map((item) => ({ label: item.label, href: item.href }))} />
          <FooterColumn title="Solutions" links={[...SOLUTIONS]} />
          <FooterColumn title="Resources" links={[...RESOURCES]} />

          <div>
            <p className="tj-label">Operations</p>
            <ul className="mt-4 space-y-2.5">
              {[
                "Receiving & inspection",
                "Chilled storage",
                "Frozen storage",
                "Access-controlled pharma",
                "Monitoring & logging",
                "Dispatch & gate control",
              ].map((item) => (
                <li key={item} className="text-sm text-silver-dim">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/70 uppercase">
              Capability figures: {FALLBACK.capability}
            </p>
          </div>
        </nav>

        {/* ---------------- Legal ---------------- */}
        <div className="mt-14 flex flex-col gap-4 border-t border-hull-line/70 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.625rem] tracking-[0.1em] text-silver-dim uppercase">
            © {year} {siteConfig.brand.name}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {contact.socials.length > 0 ? (
              <ul className="flex items-center gap-4">
                {contact.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-mono text-[0.625rem] tracking-[0.14em] text-silver-dim uppercase transition-colors duration-300 hover:text-ice"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim/70 uppercase">
              Facility data shown on this site is illustrative unless marked live
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({
  icon,
  href,
  value,
  label,
  external = false,
}: {
  icon: React.ReactNode;
  href: string | null;
  value: string | null;
  label: string;
  external?: boolean;
}) {
  if (!href || !value) {
    // §45 — no supplied detail, so no invented one either.
    return (
      <li className="flex items-center gap-2.5 lg:justify-end">
        <span className="text-silver-dim/60">{icon}</span>
        <span className="font-mono text-[0.625rem] tracking-[0.12em] text-silver-dim/70 uppercase">
          {label} {FALLBACK.enquiry}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2.5 lg:justify-end">
      <span className="text-glow">{icon}</span>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        className="font-mono text-sm text-silver transition-colors duration-300 hover:text-ice"
      >
        {value}
      </a>
    </li>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="tj-label">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-sm text-silver-dim transition-colors duration-300 hover:text-frost"
            >
              <span
                aria-hidden
                className="h-px w-0 bg-glow transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-3"
              />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
