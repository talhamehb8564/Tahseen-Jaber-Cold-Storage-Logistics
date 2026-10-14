/**
 * CONTENT CATALOG — cold chain stages, product categories, facility zones.
 * ---------------------------------------------------------------------------
 * Copy here is written to be true for a temperature-controlled facility of this
 * kind without asserting any specific figure, certification or service level
 * that the business has not confirmed (§45). Wherever a number would normally
 * appear, the value is `null` and the UI prints the approved fallback.
 */

import { FALLBACK } from "@/lib/site";

/** Icon identifiers resolved by `CatalogIcon` — keeps this module serializable. */
export type IconName =
  | "truck"
  | "clipboard-check"
  | "thermometer-snowflake"
  | "warehouse"
  | "activity"
  | "package-check"
  | "leaf"
  | "beef"
  | "fish"
  | "pill"
  | "shield-check"
  | "scan-line"
  | "route"
  | "boxes"
  | "door-open"
  | "snowflake"
  | "gauge"
  | "camera"
  | "fingerprint"
  | "clock"
  | "layers"
  | "file-check"
  | "map-pin"
  | "radio-tower"
  | "forklift"
  | "calendar-clock"
  | "scale"
  | "arrow-right";

export interface ColdChainStage {
  id: string;
  index: string;
  title: string;
  icon: IconName;
  summary: string;
  /** What the visitor should understand at a glance, without a paragraph. */
  signals: readonly string[];
}

/** §17 — the horizontal journey. Order matters; it is the narrative spine. */
export const coldChainStages: readonly ColdChainStage[] = [
  {
    id: "arrival",
    index: "01",
    title: "ARRIVAL",
    icon: "truck",
    summary:
      "Refrigerated vehicles arrive at the gate and are directed to an assigned dock, keeping the load inside its temperature envelope from the moment it reaches the site.",
    signals: ["GATE ENTRY", "DOCK ASSIGNMENT", "SEAL CHECK"],
  },
  {
    id: "receiving",
    index: "02",
    title: "RECEIVING",
    icon: "clipboard-check",
    summary:
      "Cargo is unloaded, counted and recorded against the client's documentation. Condition is inspected before anything enters a chamber.",
    signals: ["UNLOAD", "INSPECT", "RECORD"],
  },
  {
    id: "temperature-control",
    index: "03",
    title: "TEMPERATURE CONTROL",
    icon: "thermometer-snowflake",
    summary:
      "Product is moved into a chamber configured for its required regime. Set points are agreed with the client rather than assumed.",
    signals: ["SET POINT", "PULL DOWN", "STABILISE"],
  },
  {
    id: "storage",
    index: "04",
    title: "STORAGE",
    icon: "warehouse",
    summary:
      "Pallets are placed in a defined zone and location, recorded against a batch reference, and held under continuous environmental control.",
    signals: ["ZONE", "LOCATION", "BATCH REFERENCE"],
  },
  {
    id: "monitoring",
    index: "05",
    title: "MONITORING",
    icon: "activity",
    summary:
      "Chamber conditions are observed and logged. Deviations raise an alert so the response happens while the product is still safe.",
    signals: ["OBSERVE", "LOG", "ALERT"],
  },
  {
    id: "dispatch",
    index: "06",
    title: "DISPATCH",
    icon: "package-check",
    summary:
      "Outbound orders are picked, checked against documentation, loaded and released through the gate with a matching record.",
    signals: ["PICK", "CHECK", "RELEASE"],
  },
] as const;

export interface ProductCategory {
  id: string;
  name: string;
  shortName: string;
  icon: IconName;
  /** Accent drawn from the approved palette — only one is active at a time. */
  accent: string;
  /** Soft wash used behind the active category. */
  wash: string;
  /**
   * High-definition plate of the environment (§44 — assets live in
   * `/public/assets/`). Rendered under the technical linework so the card reads
   * as a real chamber, not an illustration.
   */
  image: string;
  headline: string;
  summary: string;
  /** Visual language notes that drive the environment styling (§19). */
  environment: string;
  handling: readonly string[];
  /**
   * §45 — storage temperatures have NOT been confirmed by the business.
   * Kept `null` so the UI can only ever print the fallback string.
   */
  temperature: null;
  temperatureLabel: string;
  /** §19 — never claim medical-grade compliance unless verified. */
  complianceNote?: string;
}

export const productCategories: readonly ProductCategory[] = [
  {
    id: "produce",
    name: "PRODUCE",
    shortName: "PRODUCE",
    icon: "leaf",
    accent: "#2E7D46",
    wash: "rgba(34, 197, 94, 0.10)",
    image: "/assets/produce-storage.jpg",
    headline: "Fruits & Vegetables",
    summary:
      "Chilled, humidity-aware storage for fresh produce. The environment is managed to slow respiration and water loss so quality holds through the distribution window.",
    environment: "FRESHNESS · HUMIDITY · CONTROLLED ATMOSPHERE",
    handling: [
      "Rapid intake from field or import",
      "Segregation by respiration and odour profile",
      "Humidity managed alongside temperature",
      "Stock rotation on a first-in, first-out basis",
    ],
    temperature: null,
    temperatureLabel: FALLBACK.temperature,
  },
  {
    id: "meat-poultry",
    name: "MEAT & POULTRY",
    shortName: "MEAT",
    icon: "beef",
    accent: "#9C4A33",
    wash: "rgba(126,62,34, 0.10)",
    image: "/assets/meat-storage.jpg",
    headline: "Frozen & Chilled Protein",
    summary:
      "Deep-cold frozen storage and chilled holding for meat and poultry. Product is kept in a stable regime with minimal temperature swing between handling events.",
    environment: "DEEP COLD · FROZEN · STABLE REGIME",
    handling: [
      "Frozen holding with minimal swing",
      "Chilled holding for short-cycle distribution",
      "Sealed, labelled pallets with batch traceability",
      "Separation from odour-sensitive categories",
    ],
    temperature: null,
    temperatureLabel: FALLBACK.temperature,
  },
  {
    id: "seafood",
    name: "SEAFOOD",
    shortName: "SEAFOOD",
    icon: "fish",
    accent: "#0F5E78",
    wash: "rgba(182,106,60, 0.10)",
    image: "/assets/seafood-storage.jpg",
    headline: "Marine Cold Chain",
    summary:
      "Frozen seafood storage built for a category with very little tolerance for temperature drift. Intake, storage and dispatch stay inside one unbroken cold chain.",
    environment: "MARINE · SUB-ZERO · UNBROKEN CHAIN",
    handling: [
      "Sub-zero frozen holding",
      "Odour and cross-contamination segregation",
      "Chain-of-custody records from intake to dispatch",
      "Fast turnaround loading at the dock",
    ],
    temperature: null,
    temperatureLabel: FALLBACK.temperature,
  },
  {
    id: "pharmaceuticals",
    name: "PHARMACEUTICALS",
    shortName: "PHARMA",
    icon: "pill",
    accent: "#5B4E8A",
    wash: "rgba(233,243,255, 0.08)",
    image: "/assets/pharma-storage.jpg",
    headline: "Temperature-Sensitive Products",
    summary:
      "Controlled storage for temperature-sensitive pharmaceutical and healthcare products, with monitoring, restricted access and documented handling.",
    environment: "PRECISION · MONITORING · RESTRICTED ACCESS",
    handling: [
      "Dedicated, access-controlled storage area",
      "Continuous environmental monitoring and logging",
      "Documented handling with audit trail",
      "Segregated from food categories",
    ],
    temperature: null,
    temperatureLabel: FALLBACK.temperature,
    // §19 — explicit guard against an unverifiable compliance claim.
    complianceNote:
      "Storage conditions are configured to the client's specification. Specific regulatory or medical-grade compliance claims are made only where the business holds verifiable certification.",
  },
] as const;

export type ZoneKind =
  | "receiving"
  | "chamber"
  | "frozen"
  | "pharma"
  | "loading"
  | "dispatch"
  | "security";

export interface FacilityZone {
  id: string;
  code: string;
  name: string;
  kind: ZoneKind;
  icon: IconName;
  purpose: string;
  detail: string;
  /**
   * §21 — capacity figures are NOT verified. `null` forces the fallback copy
   * so a fictional number can never reach the screen.
   */
  capacity: null;
  /**
   * §18/§45 — target temperatures are configurable per client agreement.
   * The label is intentionally non-numeric.
   */
  temperatureLabel: string;
  /** Normalised SVG geometry for the interactive facility plan (0–100 space). */
  rect: { x: number; y: number; w: number; h: number };
}

export const facilityZones: readonly FacilityZone[] = [
  {
    id: "receiving",
    code: "R-01",
    name: "RECEIVING",
    kind: "receiving",
    icon: "clipboard-check",
    purpose: "Inbound intake and inspection",
    detail:
      "Vehicles are unloaded here and every pallet is counted, inspected and recorded before it moves into a chamber.",
    capacity: null,
    temperatureLabel: "DOCK · CONTROLLED",
    rect: { x: 4, y: 8, w: 26, h: 34 },
  },
  {
    id: "cold-room-a",
    code: "A-01",
    name: "COLD ROOM A",
    kind: "chamber",
    icon: "snowflake",
    purpose: "Chilled storage chamber",
    detail:
      "Chilled chamber for produce and short-cycle distribution stock, configured to the client's agreed set point.",
    capacity: null,
    temperatureLabel: "TARGET · CONFIGURABLE",
    rect: { x: 33, y: 8, w: 30, h: 34 },
  },
  {
    id: "cold-room-b",
    code: "B-01",
    name: "COLD ROOM B",
    kind: "chamber",
    icon: "snowflake",
    purpose: "Chilled storage chamber",
    detail:
      "Second chilled chamber, allowing categories to be separated and a client's stock to be held independently.",
    capacity: null,
    temperatureLabel: "TARGET · CONFIGURABLE",
    rect: { x: 66, y: 8, w: 30, h: 34 },
  },
  {
    id: "frozen-storage",
    code: "C-04",
    name: "FROZEN STORAGE",
    kind: "frozen",
    icon: "thermometer-snowflake",
    purpose: "Sub-zero frozen holding",
    detail:
      "Deep-cold holding for meat, poultry and seafood, managed to keep temperature swing between handling events to a minimum.",
    capacity: null,
    temperatureLabel: "SUB-ZERO · CONFIGURABLE",
    rect: { x: 4, y: 46, w: 44, h: 30 },
  },
  {
    id: "pharma",
    code: "P-02",
    name: "PHARMA",
    kind: "pharma",
    icon: "pill",
    purpose: "Access-controlled sensitive storage",
    detail:
      "Restricted-access area for temperature-sensitive pharmaceutical and healthcare products, monitored and logged continuously.",
    capacity: null,
    temperatureLabel: "PRECISION · CONFIGURABLE",
    rect: { x: 51, y: 46, w: 22, h: 30 },
  },
  {
    id: "loading",
    code: "L-01",
    name: "LOADING",
    kind: "loading",
    icon: "forklift",
    purpose: "Outbound staging and loading",
    detail:
      "Orders are staged, checked against documentation and loaded onto refrigerated vehicles at the dock.",
    capacity: null,
    temperatureLabel: "DOCK · CONTROLLED",
    rect: { x: 76, y: 46, w: 20, h: 30 },
  },
  {
    id: "dispatch",
    code: "D-01",
    name: "DISPATCH",
    kind: "dispatch",
    icon: "route",
    purpose: "Release and gate control",
    detail:
      "Released loads leave through dispatch with a matching record, closing the chain of custody for the consignment.",
    capacity: null,
    temperatureLabel: "TRANSIT · CONTROLLED",
    rect: { x: 4, y: 80, w: 44, h: 16 },
  },
  {
    id: "security",
    code: "S-01",
    name: "SECURITY",
    kind: "security",
    icon: "shield-check",
    purpose: "Access control and surveillance",
    detail:
      "Access-controlled entry, surveillance coverage and monitoring across the site, with movement recorded against a gate pass.",
    capacity: null,
    temperatureLabel: "SITE-WIDE · MONITORED",
    rect: { x: 51, y: 80, w: 45, h: 16 },
  },
] as const;

/** §23 — camera matrix. Positions are illustrative unless wired to real feeds. */
export const securityCameras = [
  { id: "CAM 01", zone: "GATE" },
  { id: "CAM 02", zone: "RECEIVING" },
  { id: "CAM 03", zone: "COLD ROOM A" },
  { id: "CAM 04", zone: "FROZEN STORAGE" },
  { id: "CAM 05", zone: "PHARMA" },
  { id: "CAM 06", zone: "LOADING" },
  { id: "CAM 07", zone: "DISPATCH" },
  { id: "CAM 08", zone: "PERIMETER" },
] as const;

/** §24 — logistics route stops for the animated map. */
export const logisticsStops = [
  { id: "receive", label: "RECEIVE", detail: "Intake at Uuayrij" },
  { id: "store", label: "STORE", detail: "Chamber placement" },
  { id: "load", label: "LOAD", detail: "Dock staging" },
  { id: "check", label: "CHECK", detail: "Documentation" },
  { id: "dispatch", label: "DISPATCH", detail: "Gate release" },
] as const;

export function getProductCategory(id: string): ProductCategory | undefined {
  return productCategories.find((category) => category.id === id);
}

export function getFacilityZone(id: string): FacilityZone | undefined {
  return facilityZones.find((zone) => zone.id === id);
}

/* ==========================================================================
   FLEXIBLE STORAGE (§48 · section 9)
   --------------------------------------------------------------------------
   Storage MODES rather than capacities. §45 forbids inventing warehouse
   capacity, so no pallet count, floor area or chamber volume appears here —
   each mode describes how space is held and defers the terms to the agreement.
   ========================================================================== */

export interface StorageOption {
  id: string;
  name: string;
  icon: IconName;
  /** One line: what the mode is for. */
  summary: string;
  /** Two to four concrete characteristics of the mode. */
  points: readonly string[];
  /** How the commercial terms are established — never a published rate (§25). */
  terms: string;
}

export const storageOptions: readonly StorageOption[] = [
  {
    id: "short-term",
    name: "SHORT-TERM",
    icon: "clock",
    summary:
      "Holding between legs of a journey — product that is moving rather than sitting.",
    points: [
      "Intake and release against a batch reference",
      "Dock access for onward loading",
      "Documentation checked in and out",
    ],
    terms: "Quoted per requirement",
  },
  {
    id: "long-term",
    name: "LONG-TERM",
    icon: "warehouse",
    summary:
      "Extended holding under a standing agreement, with the product's position tracked throughout.",
    points: [
      "Assigned zone and location",
      "Continuous monitoring and logging",
      "Periodic stock reporting on request",
    ],
    terms: "Quoted per requirement",
  },
  {
    id: "seasonal",
    name: "SEASONAL",
    icon: "calendar-clock",
    summary:
      "Capacity arranged around a known peak, agreed ahead of the season rather than at it.",
    points: [
      "Agreed window and volume in advance",
      "Staged intake to protect pull-down",
      "Released as the season tapers",
    ],
    terms: "Quoted per requirement",
  },
  {
    id: "overflow",
    name: "OVERFLOW",
    icon: "boxes",
    summary:
      "Additional space when your own facility is full, so a delivery is never turned away.",
    points: [
      "Short-notice intake where capacity allows",
      "Same handling rules as standing stock",
      "Consolidated back when you are ready",
    ],
    terms: "Quoted per requirement",
  },
  {
    id: "dedicated",
    name: "DEDICATED CHAMBER",
    icon: "door-open",
    summary:
      "A chamber held for a single client, with access restricted to named people.",
    points: [
      "Restricted-access zone",
      "Set point configured for your product",
      "Separated from other clients' stock",
    ],
    terms: "Quoted per requirement",
  },
  {
    id: "part-load",
    name: "PART-LOAD",
    icon: "scale",
    summary:
      "Shared space for smaller volumes, so a full chamber is never a precondition.",
    points: [
      "Pallet-level rather than chamber-level",
      "Recorded to a location within a shared zone",
      "Scales up without changing the process",
    ],
    terms: "Quoted per requirement",
  },
] as const;

/* ==========================================================================
   TRUST (§48 · section 10)
   --------------------------------------------------------------------------
   §45 forbids inventing certifications, licences, client numbers, history or
   testimonials. So this section makes only commitments that are structural —
   things the system does — and publishes an explicit, clearly-marked gap where
   credentials would go once the client confirms them.
   ========================================================================== */

export interface OperatingPrinciple {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
}

export const operatingPrinciples: readonly OperatingPrinciple[] = [
  {
    id: "traceability",
    icon: "scan-line",
    title: "Traceable to the batch",
    detail:
      "Every consignment is opened against a batch reference, and that reference follows it through receiving, placement and release.",
  },
  {
    id: "monitoring",
    icon: "activity",
    title: "Monitored and logged",
    detail:
      "Chamber conditions are logged against the zone rather than held in somebody's head, so a history exists to answer a question later.",
  },
  {
    id: "access",
    icon: "fingerprint",
    title: "Access controlled",
    detail:
      "Restricted zones require a credential at the door. Movement in and out is recorded against the person and the gate pass.",
  },
  {
    id: "documentation",
    icon: "file-check",
    title: "Documented at both ends",
    detail:
      "Stock is checked against its paperwork on intake and again before release, so what leaves matches what arrived.",
  },
  {
    id: "reference",
    icon: "clipboard-check",
    title: "A reference for everything",
    detail:
      "Requests, stock movements and gate passes each carry an identifier that can be quoted back, instead of relying on memory.",
  },
  {
    id: "escalation",
    icon: "radio-tower",
    title: "Drift is escalated",
    detail:
      "A zone leaving its configured band raises an event rather than waiting to be noticed during a manual round.",
  },
] as const;

/**
 * Credentials the business has NOT yet supplied. Rendered as a clearly-marked
 * placeholder block (§45) and surfaced in the admin gap list so it cannot be
 * quietly forgotten.
 */
export const pendingCredentials = [
  "Certifications and licences",
  "Compliance and audit status",
  "Insurance and liability terms",
  "Client references and case history",
  "Year established and company history",
] as const;
