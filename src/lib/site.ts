/**
 * SITE CONFIGURATION — single source of truth for business facts.
 * ---------------------------------------------------------------------------
 * §45 CONTENT SAFETY. This module is deliberately strict:
 *
 *   - A fact supplied and confirmed by the client is a string.
 *   - A fact that has NOT been supplied is `null` and MUST NOT be invented.
 *     The UI renders `FALLBACK` copy for those fields ("ON REQUEST",
 *     "CLIENT CONFIGURED", …) so nothing fictional is ever published.
 *
 * `CONTENT_GAPS` at the bottom is the live checklist of everything still
 * required from the business. It is surfaced in the admin command center so
 * the gap list can never be silently forgotten.
 */

/**
 * A field the business has not yet supplied.
 *
 * The VALUE is always `null` — §45 forbids inventing contact details, figures or
 * claims — but the TYPE is nullable so the rendering code that handles a real
 * value stays live and type-checks. The moment the client confirms a detail it is
 * filled in here and every surface picks it up automatically.
 */
export type Unsupplied<T = string> = T | null;

export const FALLBACK = {
  /** Used wherever a numeric capability has not been confirmed. */
  capability: "ON REQUEST",
  /** Used wherever a storage temperature has not been confirmed. */
  temperature: "CLIENT CONFIGURED",
  /** Used wherever coverage or a service level has not been confirmed. */
  coverage: "ON REQUEST",
  /** Generic "we will tell you directly" copy. */
  enquiry: "AVAILABLE ON REQUEST",
  /**
   * §25 — pricing rules have not been supplied, so no rate is ever published or
   * estimated. Every surface that would otherwise show a price prints this.
   */
  pricing: "REQUEST A CUSTOM QUOTE",
} as const;

export const siteConfig = {
  brand: {
    name: "Tahseen Jaber Cold Storage & Logistics",
    shortName: "Tahseen Jaber",
    wordmarkLine1: "TAHSEEN JABER",
    wordmarkLine2: "COLD STORAGE",
    wordmarkLine3: "& LOGISTICS",
    initials: "TJ",
    tagline: "Precision temperature-controlled storage and cold-chain logistics.",
    /** Reference ID prefix used across inquiries, batches and gate passes. */
    referencePrefix: "TJ",
  },

  location: {
    facility: "Uuayrij Industrial Area",
    city: "Baghdad",
    country: "Iraq",
    countryCode: "IQ",
    addressLine: "Uuayrij Industrial Area, Baghdad, Iraq",
    /** Not supplied — required for LocalBusiness structured data & maps. */
    street: null as Unsupplied<string>,
    postalCode: null as Unsupplied<string>,
    /** Not supplied — required before any map embed or geo structured data. */
    latitude: null as Unsupplied<number>,
    longitude: null as Unsupplied<number>,
    /** Operating hours have not been supplied. */
    openingHours: null as Unsupplied<string>,
  },

  contact: {
    /** None of these have been supplied. Do not publish placeholders as real. */
    phone: null as Unsupplied<string>,
    phoneDisplay: null as Unsupplied<string>,
    whatsapp: null as Unsupplied<string>,
    email: null as Unsupplied<string>,
    salesEmail: null as Unsupplied<string>,
    /** Social profiles have not been supplied. */
    socials: [] as readonly { label: string; url: string }[],
  },

  seo: {
    /**
     * Absolute origin for canonical URLs, Open Graph and the sitemap.
     * Resolution order:
     *   1. NEXT_PUBLIC_SITE_URL — set this to the final domain (e.g. https://example.com)
     *   2. VERCEL_URL — provided automatically by Vercel preview/production deploys
     *   3. localhost fallback for local development
     */
    url:
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    titleTemplate: "%s — Tahseen Jaber Cold Storage & Logistics",
    defaultTitle:
      "Tahseen Jaber Cold Storage & Logistics | Baghdad Cold Chain Facility",
    defaultDescription:
      "Temperature-controlled cold storage and cold-chain logistics at Uuayrij Industrial Area, Baghdad, Iraq. Receiving, monitoring, secure storage and dispatch for produce, meat and poultry, seafood and pharmaceutical products.",
    keywords: [
      "cold storage Baghdad",
      "cold chain logistics Iraq",
      "temperature controlled warehouse",
      "frozen storage Uuayrij",
      "refrigerated logistics Baghdad",
    ],
    /** Not supplied — required before publishing Open Graph imagery. */
    ogImage: null as Unsupplied<string>,
    locale: "en_US",
  },

  /**
   * Trust & compliance.
   * §45: certifications, licences, client counts and awards are NEVER invented.
   * This array stays empty until the business supplies verifiable documents,
   * at which point each entry should carry a source reference.
   */
  certifications: [] as readonly {
    name: string;
    issuer: string;
    /** Optional public verification URL. */
    source?: string;
  }[],

  /**
   * Capability figures. All `null` until confirmed by the business.
   * The UI must render FALLBACK.capability for every one of these.
   */
  capabilities: {
    totalPalletPositions: null as Unsupplied<number>,
    totalAreaSqm: null as Unsupplied<number>,
    chamberCount: null as Unsupplied<number>,
    fleetVehicles: null as Unsupplied<number>,
    dockDoors: null as Unsupplied<number>,
    yearEstablished: null as Unsupplied<number>,
    /** Delivery coverage has NOT been verified — never claim nationwide. */
    deliveryCoverage: null as Unsupplied<string>,
  },
} as const;

export const navigation = [
  { label: "HOME", href: "/", match: "exact" },
  { label: "SOLUTIONS", href: "/solutions", match: "prefix" },
  { label: "FACILITY", href: "/facility", match: "prefix" },
  { label: "PRODUCTS", href: "/products", match: "prefix" },
  { label: "LOGISTICS", href: "/logistics", match: "prefix" },
  { label: "ABOUT", href: "/about", match: "prefix" },
  { label: "CONTACT", href: "/contact", match: "prefix" },
] as const;

export const primaryCta = {
  label: "REQUEST STORAGE",
  href: "/request-storage",
} as const;

export const secondaryCta = {
  label: "EXPLORE FACILITY",
  href: "/facility",
} as const;

/**
 * Everything the business still needs to confirm before launch.
 * Rendered in the admin command center → Content audit.
 */
export const CONTENT_GAPS = [
  { id: "phone", label: "Public telephone number", area: "Contact" },
  { id: "whatsapp", label: "WhatsApp business number", area: "Contact" },
  { id: "email", label: "Public email address", area: "Contact" },
  { id: "socials", label: "Social profiles", area: "Contact" },
  { id: "street", label: "Full street address", area: "Location" },
  { id: "hours", label: "Operating hours", area: "Location" },
  { id: "coordinates", label: "Map coordinates", area: "Location" },
  { id: "capacity", label: "Pallet positions / floor area", area: "Capability" },
  { id: "chambers", label: "Chamber count and dock doors", area: "Capability" },
  { id: "temperatures", label: "Approved temperature ranges per category", area: "Operations" },
  { id: "coverage", label: "Verified delivery coverage", area: "Operations" },
  { id: "pricing", label: "Pricing rules for the storage calculator", area: "Commercial" },
  { id: "certifications", label: "Certifications and licences", area: "Trust" },
  { id: "history", label: "Company history and milestones", area: "Trust" },
  { id: "clients", label: "Named clients / testimonials", area: "Trust" },
  { id: "photography", label: "Facility photography", area: "Assets" },
  { id: "logo", label: "Final logo artwork", area: "Assets" },
  { id: "og-image", label: "Open Graph share image", area: "Assets" },
] as const;

/** True when a capability figure has been supplied by the business. */
export function hasCapability(
  key: keyof typeof siteConfig.capabilities,
): boolean {
  return siteConfig.capabilities[key] !== null;
}

/**
 * Render a capability figure, or the approved fallback when it is unknown.
 * This is the only sanctioned way to print a capability number.
 */
export function capabilityOr(
  key: keyof typeof siteConfig.capabilities,
  formatter: (value: number) => string = (value) => value.toLocaleString("en-US"),
): string {
  const value = siteConfig.capabilities[key];
  return typeof value === "number" ? formatter(value) : FALLBACK.capability;
}
