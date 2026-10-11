/**
 * DEMO DATA PROVIDER (§40)
 * ---------------------------------------------------------------------------
 * Supplies the entire product with plausible facility data when no real sensor
 * or database feed is connected.
 *
 * HARD RULES
 *   1. Every object returned carries `simulated: true` and `source:
 *      "SIMULATION"`. The UI renders a SIMULATION badge from that flag — it is
 *      never inferred, never optional and never removable by a component.
 *   2. No value here may be described with the words live, real-time, current,
 *      actual or operational.
 *   3. Values are deterministic (seeded PRNG), so a refresh is stable and a
 *      server render always matches what the client receives.
 *   4. Marketing claims are untouched by this module. Storage temperatures,
 *      capacities and coverage on the public pages still come from
 *      `lib/catalog` + `lib/site` and still print "CLIENT CONFIGURED" /
 *      "ON REQUEST". Simulation numbers appear only inside instrumented panels
 *      that are visibly badged as demonstrations.
 */

import { facilityZones, productCategories, securityCameras } from "@/lib/catalog";
import { createRng, hashSeed, noise, timeBucket } from "@/lib/data/rng";
import type {
  AnalyticsSnapshot,
  ClientPortalSnapshot,
  DataProvider,
  DataSourceInfo,
  FacilityEventView,
  InquiryView,
  InventoryItemView,
  InventorySnapshot,
  OccupancyView,
  OverviewSnapshot,
  SecurityStatusView,
  TelemetryPoint,
  ZoneHistory,
  ZoneReading,
} from "@/lib/data/types";
import type { EventSeverity, InquiryStatus, ProductCategory, ZoneKind } from "@/lib/db/schema";
import { siteConfig } from "@/lib/site";

/* --------------------------------------------------------------------------
   Zone profiles — the "character" of each chamber in the simulation.
   Non-chamber zones have no meaningful set point and stay null, which is also
   how the schema represents a figure the business has not supplied.
   -------------------------------------------------------------------------- */

interface ZoneProfile {
  baseTemperatureC: number | null;
  baseHumidityPercent: number | null;
  /** Allowed drift around the base, in °C. */
  drift: number;
  capacityPallets: number | null;
  occupiedPallets: number;
  restrictedAccess: boolean;
}

const ZONE_PROFILES: Record<string, ZoneProfile> = {
  "R-01": { baseTemperatureC: null, baseHumidityPercent: null, drift: 0, capacityPallets: null, occupiedPallets: 0, restrictedAccess: false },
  "A-01": { baseTemperatureC: 2.0, baseHumidityPercent: 88, drift: 0.6, capacityPallets: 640, occupiedPallets: 412, restrictedAccess: false },
  "B-01": { baseTemperatureC: 0.5, baseHumidityPercent: 84, drift: 0.5, capacityPallets: 520, occupiedPallets: 233, restrictedAccess: false },
  "C-04": { baseTemperatureC: -18.4, baseHumidityPercent: 72, drift: 0.7, capacityPallets: 980, occupiedPallets: 751, restrictedAccess: false },
  "P-02": { baseTemperatureC: 4.5, baseHumidityPercent: 46, drift: 0.3, capacityPallets: 180, occupiedPallets: 96, restrictedAccess: true },
  "L-01": { baseTemperatureC: null, baseHumidityPercent: null, drift: 0, capacityPallets: null, occupiedPallets: 0, restrictedAccess: false },
  "D-01": { baseTemperatureC: null, baseHumidityPercent: null, drift: 0, capacityPallets: null, occupiedPallets: 0, restrictedAccess: false },
  "S-01": { baseTemperatureC: null, baseHumidityPercent: null, drift: 0, capacityPallets: null, occupiedPallets: 0, restrictedAccess: true },
};

const PROFILE_FALLBACK: ZoneProfile = {
  baseTemperatureC: null,
  baseHumidityPercent: null,
  drift: 0,
  capacityPallets: null,
  occupiedPallets: 0,
  restrictedAccess: false,
};

/** Quantised "now" so demo timestamps are stable within a minute. */
function anchor(): Date {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function iso(date: Date): string {
  return date.toISOString();
}

function minutesAgo(minutes: number, from: Date = anchor()): Date {
  return new Date(from.getTime() - minutes * 60_000);
}

function healthFor(profile: ZoneProfile, temperature: number | null): ZoneReading["health"] {
  if (profile.baseTemperatureC === null || temperature === null) return "STABLE";
  const deviation = Math.abs(temperature - profile.baseTemperatureC);
  if (deviation > profile.drift * 2.4) return "ALERT";
  if (deviation > profile.drift * 1.4) return "DRIFT";
  return "STABLE";
}

/* --------------------------------------------------------------------------
   Simulated inventory — batch references follow the documented TJ-##### shape.
   -------------------------------------------------------------------------- */

interface DemoBatch {
  batchReference: string;
  productName: string;
  category: ProductCategory;
  zoneCode: string;
  locationCode: string;
  quantity: number;
  unit: string;
  status: InventoryItemView["status"];
  receivedMinutesAgo: number;
  clientName: string;
}

const DEMO_BATCHES: readonly DemoBatch[] = [
  { batchReference: "TJ-20481", productName: "Frozen shrimp, block", category: "SEAFOOD", zoneCode: "C-04", locationCode: "C-04-R12-B03-L2", quantity: 24, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 4_320, clientName: "Demo Client — Marine" },
  { batchReference: "TJ-20494", productName: "Whole chicken, graded", category: "MEAT_POULTRY", zoneCode: "C-04", locationCode: "C-04-R08-B01-L1", quantity: 32, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 2_880, clientName: "Demo Client — Protein" },
  { batchReference: "TJ-20517", productName: "Table grapes, packed", category: "PRODUCE", zoneCode: "A-01", locationCode: "A-01-R03-B02-L1", quantity: 18, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 1_440, clientName: "Demo Client — Fresh" },
  { batchReference: "TJ-20523", productName: "Tomatoes, crates", category: "PRODUCE", zoneCode: "A-01", locationCode: "A-01-R05-B04-L2", quantity: 22, unit: "PALLET", status: "RESERVED", receivedMinutesAgo: 960, clientName: "Demo Client — Fresh" },
  { batchReference: "TJ-20530", productName: "Vaccine cartons, sealed", category: "PHARMACEUTICAL", zoneCode: "P-02", locationCode: "P-02-R01-B01-L1", quantity: 6, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 720, clientName: "Demo Client — Healthcare" },
  { batchReference: "TJ-20538", productName: "Frozen fillets, glazed", category: "SEAFOOD", zoneCode: "C-04", locationCode: "C-04-R14-B02-L3", quantity: 27, unit: "PALLET", status: "PICKING", receivedMinutesAgo: 5_760, clientName: "Demo Client — Marine" },
  { batchReference: "TJ-20544", productName: "Beef cuts, vacuum packed", category: "MEAT_POULTRY", zoneCode: "B-01", locationCode: "B-01-R02-B03-L1", quantity: 14, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 300, clientName: "Demo Client — Protein" },
  { batchReference: "TJ-20551", productName: "Citrus, ventilated crates", category: "PRODUCE", zoneCode: "A-01", locationCode: "A-01-R07-B01-L2", quantity: 20, unit: "PALLET", status: "IN_TRANSIT", receivedMinutesAgo: 45, clientName: "Demo Client — Fresh" },
  { batchReference: "TJ-20559", productName: "Frozen vegetables, retail bags", category: "GENERAL", zoneCode: "C-04", locationCode: "C-04-R19-B05-L1", quantity: 40, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 8_640, clientName: "Demo Client — Retail" },
  { batchReference: "TJ-20566", productName: "Dairy, chilled pallets", category: "GENERAL", zoneCode: "B-01", locationCode: "B-01-R04-B02-L2", quantity: 16, unit: "PALLET", status: "ON_HOLD", receivedMinutesAgo: 1_080, clientName: "Demo Client — Retail" },
  { batchReference: "TJ-20572", productName: "Frozen lamb carcass", category: "MEAT_POULTRY", zoneCode: "C-04", locationCode: "C-04-R21-B01-L1", quantity: 19, unit: "PALLET", status: "DISPATCHED", receivedMinutesAgo: 11_520, clientName: "Demo Client — Protein" },
  { batchReference: "TJ-20580", productName: "Pharma diluent, boxed", category: "PHARMACEUTICAL", zoneCode: "P-02", locationCode: "P-02-R02-B01-L1", quantity: 4, unit: "PALLET", status: "IN_STORAGE", receivedMinutesAgo: 210, clientName: "Demo Client — Healthcare" },
] as const;

const DEMO_INQUIRIES: readonly {
  reference: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  storageDurationDays: number;
  message: string;
  status: InquiryStatus;
  source: string;
  createdMinutesAgo: number;
}[] = [
  { reference: "TJ-4K7QM", name: "Sample Contact", company: "Demo Trading Co.", email: "demo.inquiry@example.test", phone: "+964 7xx xxx xxxx", category: "SEAFOOD", quantity: 30, unit: "PALLET", storageDurationDays: 45, message: "Demonstration inquiry generated by the sample dataset.", status: "NEW", source: "WEBSITE", createdMinutesAgo: 42 },
  { reference: "TJ-8P2VN", name: "Sample Contact", company: "Demo Fresh Markets", email: "demo.fresh@example.test", phone: "+964 7xx xxx xxxx", category: "PRODUCE", quantity: 24, unit: "PALLET", storageDurationDays: 14, message: "Demonstration inquiry generated by the sample dataset.", status: "CONTACTED", source: "CALCULATOR", createdMinutesAgo: 260 },
  { reference: "TJ-3R9WD", name: "Sample Contact", company: "Demo Protein Ltd.", email: "demo.protein@example.test", phone: "+964 7xx xxx xxxx", category: "MEAT_POULTRY", quantity: 60, unit: "PALLET", storageDurationDays: 90, message: "Demonstration inquiry generated by the sample dataset.", status: "QUOTED", source: "WEBSITE", createdMinutesAgo: 1_500 },
  { reference: "TJ-6T1XB", name: "Sample Contact", company: "Demo Healthcare", email: "demo.health@example.test", phone: "+964 7xx xxx xxxx", category: "PHARMACEUTICAL", quantity: 8, unit: "PALLET", storageDurationDays: 120, message: "Demonstration inquiry generated by the sample dataset.", status: "APPROVED", source: "MANUAL", createdMinutesAgo: 4_400 },
  { reference: "TJ-9Y5ZC", name: "Sample Contact", company: "Demo Retail Group", email: "demo.retail@example.test", phone: "+964 7xx xxx xxxx", category: "GENERAL", quantity: 45, unit: "PALLET", storageDurationDays: 30, message: "Demonstration inquiry generated by the sample dataset.", status: "COMPLETED", source: "WHATSAPP", createdMinutesAgo: 12_000 },
  { reference: "TJ-2A8BD", name: "Sample Contact", company: "Demo Importers", email: "demo.import@example.test", phone: "+964 7xx xxx xxxx", category: "SEAFOOD", quantity: 18, unit: "PALLET", storageDurationDays: 21, message: "Demonstration inquiry generated by the sample dataset.", status: "REJECTED", source: "EMAIL", createdMinutesAgo: 20_000 },
] as const;

const EVENT_TEMPLATES: readonly {
  type: string;
  title: string;
  message: string;
  severity: EventSeverity;
  zoneCode: string;
}[] = [
  { type: "DOOR_OPENED", title: "Chamber door opened", message: "Dock door cycle recorded for an outbound load.", severity: "INFO", zoneCode: "L-01" },
  { type: "DOOR_CLOSED", title: "Chamber door closed", message: "Door returned to sealed state within the expected window.", severity: "INFO", zoneCode: "L-01" },
  { type: "BATCH_RECEIVED", title: "Batch received", message: "Inbound pallets counted, inspected and recorded against a batch reference.", severity: "NOTICE", zoneCode: "R-01" },
  { type: "BATCH_DISPATCHED", title: "Batch dispatched", message: "Outbound load released through the gate with a matching record.", severity: "NOTICE", zoneCode: "D-01" },
  { type: "DEVIATION", title: "Temperature deviation", message: "Reading moved outside the configured band and the controller responded.", severity: "WARNING", zoneCode: "C-04" },
  { type: "DEFROST_CYCLE", title: "Defrost cycle started", message: "Scheduled defrost initiated on the evaporator bank.", severity: "INFO", zoneCode: "A-01" },
  { type: "ACCESS_GRANTED", title: "Access granted", message: "Credential presented and accepted at a restricted door.", severity: "INFO", zoneCode: "P-02" },
  { type: "ACCESS_DENIED", title: "Access denied", message: "Unrecognised credential presented at a restricted door.", severity: "WARNING", zoneCode: "P-02" },
  { type: "HUMIDITY_DRIFT", title: "Humidity drift", message: "Relative humidity moved beyond the configured tolerance.", severity: "WARNING", zoneCode: "B-01" },
  { type: "SENSOR_FAULT", title: "Sensor fault", message: "A probe failed its self-check and was flagged for inspection.", severity: "CRITICAL", zoneCode: "A-01" },
] as const;

/* ==========================================================================
   PROVIDER
   ========================================================================== */

export function createDemoProvider(databaseConnected: boolean, reason: string): DataProvider {
  const info: DataSourceInfo = {
    mode: "demo",
    badge: "SIMULATION",
    reason,
    databaseConnected,
  };

  /** Shared, quantised seed so a whole page render is internally consistent. */
  const bucket = timeBucket(anchor(), 30);

  function zoneSeed(code: string, salt = ""): number {
    return hashSeed(`${code}|${bucket}|${salt}`);
  }

  async function getZoneReadings(): Promise<ZoneReading[]> {
    const recordedAt = iso(anchor());

    return facilityZones.map((zone) => {
      const profile = ZONE_PROFILES[zone.code] ?? PROFILE_FALLBACK;
      const rng = createRng(zoneSeed(zone.code, "reading"));
      const jitter = rng.range(-1, 1) * profile.drift;
      const temperatureC =
        profile.baseTemperatureC === null
          ? null
          : Number((profile.baseTemperatureC + jitter).toFixed(1));
      const humidityPercent =
        profile.baseHumidityPercent === null
          ? null
          : Math.round(profile.baseHumidityPercent + rng.range(-3, 3));

      return {
        zoneId: zone.id,
        code: zone.code,
        name: zone.name,
        kind: zoneKindOf(zone.kind),
        temperatureC,
        humidityPercent,
        // §45 — the *agreed* set point is never published as a marketing claim.
        setpointC: null,
        capacityPallets: profile.capacityPallets,
        occupiedPallets: profile.occupiedPallets,
        health: healthFor(profile, temperatureC),
        monitoringActive: true,
        restrictedAccess: profile.restrictedAccess,
        recordedAt,
        source: "SIMULATION" as const,
        simulated: true,
      };
    });
  }

  async function getZoneHistory(zoneId: string, hours = 24): Promise<ZoneHistory> {
    const zone = facilityZones.find((candidate) => candidate.id === zoneId) ?? facilityZones[0];
    const profile = ZONE_PROFILES[zone?.code ?? ""] ?? PROFILE_FALLBACK;
    const base = profile.baseTemperatureC ?? -18.4;
    const baseHumidity = profile.baseHumidityPercent ?? 70;
    const from = anchor();
    const points: TelemetryPoint[] = [];

    for (let i = hours; i >= 0; i -= 1) {
      const at = new Date(from.getTime() - i * 3_600_000);
      // Diurnal component: doors open more during working hours.
      const hourOfDay = at.getUTCHours() + 3; // Baghdad is UTC+3.
      const diurnal = Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2) * 0.35;
      const temperatureC = Number(
        (base + diurnal + noise(`${zone?.code ?? "ZONE"}:temp`, i / 4) * profile.drift).toFixed(2),
      );
      const humidityPercent = Number(
        (baseHumidity + noise(`${zone?.code ?? "ZONE"}:hum`, i / 5) * 4).toFixed(1),
      );
      points.push({ at: iso(at), temperatureC, humidityPercent });
    }

    return {
      zoneId: zone?.id ?? zoneId,
      code: zone?.code ?? "—",
      points,
      source: "SIMULATION",
      simulated: true,
    };
  }

  async function getFacilityEvents(limit = 12): Promise<FacilityEventView[]> {
    const rng = createRng(zoneSeed("events", "list"));
    const events: FacilityEventView[] = [];

    for (let i = 0; i < limit; i += 1) {
      const template = EVENT_TEMPLATES[rng.int(0, EVENT_TEMPLATES.length - 1)]!;
      const zone = facilityZones.find((candidate) => candidate.code === template.zoneCode);
      const occurredAt = minutesAgo(rng.int(2, 60 * 36));
      events.push({
        id: `demo-event-${i}-${hashSeed(template.type + occurredAt.toISOString()).toString(36)}`,
        zoneCode: zone?.code ?? null,
        zoneName: zone?.name ?? null,
        severity: template.severity,
        type: template.type,
        title: template.title,
        message: template.message,
        occurredAt: iso(occurredAt),
        acknowledged: template.severity === "CRITICAL" ? false : rng.chance(0.65),
        simulated: true,
      });
    }

    return events.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }

  async function getSecurityStatus(): Promise<SecurityStatusView> {
    const rng = createRng(zoneSeed("security", "status"));
    const cameras = securityCameras.map((camera, index) => ({
      id: camera.id,
      zone: camera.zone,
      // One camera offline in the simulation so the UI shows a non-uniform state.
      online: index === 5 ? false : rng.chance(0.96),
      simulated: true,
    }));

    return {
      accessSecured: true,
      monitoringActive: true,
      cameras,
      camerasOnline: cameras.filter((camera) => camera.online).length,
      camerasTotal: cameras.length,
      lastPatrolAt: iso(minutesAgo(rng.int(12, 90))),
      simulated: true,
    };
  }

  async function getInventorySnapshot(clientId?: string): Promise<InventorySnapshot> {
    const source = DEMO_BATCHES.map((batch, index) => toInventoryView(batch, index));
    const items = clientId ? source.filter((_, index) => index % 2 === 0) : source;

    const byCategoryMap = new Map<ProductCategory, number>();
    const byStatusMap = new Map<InventoryItemView["status"], number>();
    let totalPallets = 0;

    for (const item of items) {
      byCategoryMap.set(item.category, (byCategoryMap.get(item.category) ?? 0) + 1);
      byStatusMap.set(item.status, (byStatusMap.get(item.status) ?? 0) + 1);
      totalPallets += item.unit === "PALLET" ? item.quantity : 0;
    }

    return {
      items,
      totalBatches: items.length,
      totalPallets,
      byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({ category, count })),
      byStatus: [...byStatusMap.entries()].map(([status, count]) => ({ status, count })),
      simulated: true,
    };
  }

  async function getInquiries(
    filter: { status?: InquiryStatus; limit?: number; search?: string } = {},
  ): Promise<InquiryView[]> {
    let rows: InquiryView[] = DEMO_INQUIRIES.map((inquiry) => ({
      id: `demo-inquiry-${hashSeed(inquiry.reference).toString(36)}`,
      reference: inquiry.reference,
      name: inquiry.name,
      company: inquiry.company,
      email: inquiry.email,
      phone: inquiry.phone,
      category: inquiry.category,
      quantity: inquiry.quantity,
      unit: inquiry.unit,
      storageDurationDays: inquiry.storageDurationDays,
      message: inquiry.message,
      status: inquiry.status,
      source: inquiry.source,
      createdAt: iso(minutesAgo(inquiry.createdMinutesAgo)),
      internalNotes: null,
      simulated: true,
    }));

    if (filter.status) rows = rows.filter((row) => row.status === filter.status);
    if (filter.search) {
      const needle = filter.search.toLowerCase();
      rows = rows.filter((row) =>
        [row.reference, row.name, row.company ?? "", row.email]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows.slice(0, filter.limit ?? rows.length);
  }

  async function getOccupancy(): Promise<OccupancyView> {
    const zones = facilityZones.map((zone) => {
      const profile = ZONE_PROFILES[zone.code] ?? PROFILE_FALLBACK;
      return {
        code: zone.code,
        name: zone.name,
        capacity: profile.capacityPallets,
        occupied: profile.occupiedPallets,
        health: healthFor(profile, profile.baseTemperatureC) as OccupancyView["zones"][number]["health"],
      };
    });

    const withCapacity = zones.filter((zone) => zone.capacity !== null);
    const totalCapacity =
      withCapacity.length === zones.filter((z) => z.occupied > 0).length
        ? withCapacity.reduce((sum, zone) => sum + (zone.capacity ?? 0), 0)
        : null;
    const totalOccupied = zones.reduce((sum, zone) => sum + zone.occupied, 0);

    return {
      zones,
      totalCapacity,
      totalOccupied,
      // §45 — utilisation is only computed when every capacity is confirmed.
      utilisationPercent:
        totalCapacity && totalCapacity > 0
          ? Number(((totalOccupied / totalCapacity) * 100).toFixed(1))
          : null,
      simulated: true,
    };
  }

  async function getAnalytics(): Promise<AnalyticsSnapshot> {
    const chamberZones = facilityZones.filter(
      (zone) => (ZONE_PROFILES[zone.code] ?? PROFILE_FALLBACK).baseTemperatureC !== null,
    );

    const temperatureHistory = await Promise.all(
      chamberZones.map(async (zone) => {
        const history = await getZoneHistory(zone.id, 24);
        return { zoneCode: zone.code, points: history.points };
      }),
    );

    const rng = createRng(zoneSeed("analytics", "series"));

    const inquiryVolume = Array.from({ length: 8 }, (_, index) => ({
      period: `W${index + 1}`,
      count: rng.int(3, 26),
    }));

    const inventoryDistribution = productCategories.map((category) => {
      const matching = DEMO_BATCHES.filter((batch) => batch.category === categoryId(category.id));
      return {
        category: categoryId(category.id),
        pallets: matching.reduce((sum, batch) => sum + batch.quantity, 0),
      };
    });

    const utilisationTrend = Array.from({ length: 6 }, (_, index) => ({
      period: `M${index + 1}`,
      percent: Number((52 + rng.range(0, 26) + index * 1.4).toFixed(1)),
    }));

    return {
      temperatureHistory,
      inquiryVolume,
      inventoryDistribution,
      utilisationTrend,
      simulated: true,
    };
  }

  async function getOverview(): Promise<OverviewSnapshot> {
    const [inquiries, occupancy, inventory, events] = await Promise.all([
      getInquiries({}),
      getOccupancy(),
      getInventorySnapshot(),
      getFacilityEvents(14),
    ]);

    const tally = (status: InquiryStatus) =>
      inquiries.filter((inquiry) => inquiry.status === status).length;

    return {
      inquiries: {
        new: tally("NEW"),
        contacted: tally("CONTACTED"),
        quoted: tally("QUOTED"),
        approved: tally("APPROVED"),
        total: inquiries.length,
      },
      occupancy,
      activeStorageBatches: inventory.items.filter((item) => item.status === "IN_STORAGE").length,
      alerts: {
        critical: events.filter((event) => event.severity === "CRITICAL").length,
        warning: events.filter((event) => event.severity === "WARNING").length,
        info: events.filter((event) => event.severity === "INFO").length,
      },
      inventory: { batches: inventory.totalBatches, pallets: inventory.totalPallets },
      recentActivity: events.slice(0, 8),
      simulated: true,
    };
  }

  async function getClientPortal(clientId: string): Promise<ClientPortalSnapshot> {
    const [inventory, requests] = await Promise.all([
      getInventorySnapshot(clientId),
      getInquiries({ limit: 4 }),
    ]);
    const rng = createRng(zoneSeed(clientId, "portal"));

    return {
      clientId,
      companyName: "Demo Client — Marine",
      contactName: "Sample Contact",
      inventory: inventory.items,
      requests,
      leases: [
        {
          id: "demo-lease-1",
          reference: "TJ-LSE-0001",
          zoneCode: "C-04",
          palletPositions: 24,
          status: "ACTIVE",
          startedAt: iso(minutesAgo(60 * 24 * 40)),
          endedAt: null,
          simulated: true,
        },
      ],
      documents: [
        { id: "demo-doc-1", type: "GATE_PASS", title: "Gate pass — inbound load", filename: "gate-pass-TJ-20481.pdf", sizeBytes: 184_320, createdAt: iso(minutesAgo(60 * 24 * 3)), simulated: true },
        { id: "demo-doc-2", type: "CONTRACT", title: "Storage agreement", filename: "storage-agreement.pdf", sizeBytes: 402_111, createdAt: iso(minutesAgo(60 * 24 * 40)), simulated: true },
      ],
      invoices: [
        {
          id: "demo-inv-1",
          reference: "TJ-INV-0001",
          period: "Previous month",
          // §25 — pricing has not been supplied, so no amount is fabricated.
          amount: null,
          currency: "USD",
          status: "DRAFT",
          issuedAt: iso(minutesAgo(60 * 24 * 12)),
          simulated: true,
        },
      ],
      gatePasses: [
        {
          id: "demo-gp-1",
          reference: "TJ-GP-0001",
          direction: "INBOUND",
          vehicleRegistration: "DEMO PLATE",
          batchReference: "TJ-20481",
          status: "RELEASED",
          validFrom: iso(minutesAgo(60 * 24 * 3)),
          simulated: true,
        },
        {
          id: "demo-gp-2",
          reference: "TJ-GP-0002",
          direction: "OUTBOUND",
          vehicleRegistration: null,
          batchReference: "TJ-20538",
          status: "PENDING",
          validFrom: iso(minutesAgo(rng.int(30, 400))),
          simulated: true,
        },
      ],
      telemetry: (await getZoneReadings()).filter((zone) =>
        inventory.items.some((item) => item.zoneCode === zone.code),
      ),
      simulated: true,
    };
  }

  return {
    info,
    getZoneReadings,
    getZoneHistory,
    getFacilityEvents,
    getSecurityStatus,
    getInventorySnapshot,
    getInquiries,
    getOccupancy,
    getAnalytics,
    getOverview,
    getClientPortal,
  };
}

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function toInventoryView(batch: DemoBatch, index: number): InventoryItemView {
  return {
    id: `demo-item-${hashSeed(batch.batchReference).toString(36)}`,
    batchReference: batch.batchReference,
    productName: batch.productName,
    category: batch.category,
    zoneCode: batch.zoneCode,
    locationCode: batch.locationCode,
    quantity: batch.quantity,
    unit: batch.unit,
    status: batch.status,
    trackingActive: batch.status !== "DISPATCHED",
    receivedAt: iso(minutesAgo(batch.receivedMinutesAgo)),
    setpointC: null,
    clientId: `demo-client-${index % 4}`,
    clientName: batch.clientName,
    simulated: true,
  };
}

function categoryId(id: string): ProductCategory {
  switch (id) {
    case "produce":
      return "PRODUCE";
    case "meat-poultry":
      return "MEAT_POULTRY";
    case "seafood":
      return "SEAFOOD";
    case "pharmaceuticals":
      return "PHARMACEUTICAL";
    default:
      return "GENERAL";
  }
}

function zoneKindOf(kind: string): ZoneKind {
  switch (kind) {
    case "receiving":
      return "RECEIVING";
    case "chamber":
      return "CHAMBER";
    case "frozen":
      return "FROZEN";
    case "pharma":
      return "PHARMA";
    case "loading":
      return "LOADING";
    case "dispatch":
      return "DISPATCH";
    case "security":
      return "SECURITY";
    default:
      return "CHAMBER";
  }
}

export const demoBadgeLabel = `${siteConfig.brand.initials} DEMO DATASET`;
