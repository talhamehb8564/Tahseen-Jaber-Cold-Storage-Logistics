/**
 * LIVE DATA PROVIDER (§40)
 * ---------------------------------------------------------------------------
 * Reads real rows from PostgreSQL through Drizzle. Values returned here carry
 * `simulated: false`, which is the ONLY circumstance in which the UI is allowed
 * to describe a figure as live.
 *
 * If a query fails — unmigrated schema, unreachable host, revoked credential —
 * the resolver in `./index.ts` falls back to the demo provider and records the
 * reason. A broken database degrades the site to a labelled simulation; it never
 * renders a blank page and never silently invents numbers.
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import type {
  AnalyticsSnapshot,
  ClientPortalSnapshot,
  DataProvider,
  DataSourceInfo,
  DocumentView,
  FacilityEventView,
  GatePassView,
  InquiryView,
  InventoryItemView,
  InventorySnapshot,
  InvoiceView,
  LeaseView,
  OccupancyView,
  OverviewSnapshot,
  SecurityStatusView,
  TelemetryPoint,
  ZoneHistory,
  ZoneReading,
} from "@/lib/data/types";
import {
  documents,
  facilityEvents,
  inventoryItems,
  leases,
  notifications,
  storageContracts,
  storageInquiries,
  storageZones,
  telemetryLogs,
  type InquiryStatus,
} from "@/lib/db/schema";
import { securityCameras } from "@/lib/catalog";

const NUM = (value: string | null): number | null =>
  value === null || value === undefined ? null : Number(value);

export function createLiveProvider(db: Database): DataProvider {
  const info: DataSourceInfo = {
    mode: "live",
    badge: "LIVE",
    reason: "Reading from the connected PostgreSQL facility database.",
    databaseConnected: true,
  };

  async function getZoneReadings(): Promise<ZoneReading[]> {
    const zones = await db
      .select()
      .from(storageZones)
      .where(eq(storageZones.isActive, true))
      .orderBy(storageZones.sortOrder, storageZones.code);

    return Promise.all(
      zones.map(async (zone) => {
        // Latest reading per zone. Correlated subquery keeps this to one round
        // trip per zone; for a large fleet, replace with a lateral join.
        const [latest] = await db
          .select({
            temperatureC: telemetryLogs.temperatureC,
            humidityPercent: telemetryLogs.humidityPercent,
            recordedAt: telemetryLogs.recordedAt,
            source: telemetryLogs.source,
            alarmRaised: telemetryLogs.alarmRaised,
          })
          .from(telemetryLogs)
          .where(eq(telemetryLogs.zoneId, zone.id))
          .orderBy(desc(telemetryLogs.recordedAt))
          .limit(1);

        const temperatureC = NUM(latest?.temperatureC ?? null);
        const setpointC = NUM(zone.temperatureSetpointC);
        const minC = NUM(zone.temperatureMinC);
        const maxC = NUM(zone.temperatureMaxC);

        let health: ZoneReading["health"] = "STABLE";
        if (zone.status === "MAINTENANCE") health = "MAINTENANCE";
        else if (latest?.alarmRaised) health = "ALERT";
        else if (temperatureC !== null && minC !== null && maxC !== null) {
          if (temperatureC < minC || temperatureC > maxC) health = "ALERT";
          else if (setpointC !== null && Math.abs(temperatureC - setpointC) > 1) health = "DRIFT";
        }

        return {
          zoneId: zone.id,
          code: zone.code,
          name: zone.name,
          kind: zone.kind,
          temperatureC,
          humidityPercent: NUM(latest?.humidityPercent ?? null),
          setpointC,
          capacityPallets: zone.capacityPallets,
          occupiedPallets: zone.occupiedPallets,
          health,
          monitoringActive: latest !== undefined,
          restrictedAccess: zone.restrictedAccess,
          recordedAt: (latest?.recordedAt ?? new Date()).toISOString(),
          source: latest?.source ?? "SENSOR",
          // A SENSOR reading is real. A SIMULATION row stored in the database is
          // still a simulation, and is labelled as one.
          simulated: (latest?.source ?? "SENSOR") === "SIMULATION",
        };
      }),
    );
  }

  async function getZoneHistory(zoneId: string, hours = 24): Promise<ZoneHistory> {
    const since = new Date(Date.now() - hours * 3_600_000);
    const rows = await db
      .select({
        recordedAt: telemetryLogs.recordedAt,
        temperatureC: telemetryLogs.temperatureC,
        humidityPercent: telemetryLogs.humidityPercent,
        source: telemetryLogs.source,
      })
      .from(telemetryLogs)
      .where(
        and(eq(telemetryLogs.zoneId, zoneId), gte(telemetryLogs.recordedAt, since)),
      )
      .orderBy(telemetryLogs.recordedAt);

    const [zone] = await db
      .select({ code: storageZones.code })
      .from(storageZones)
      .where(eq(storageZones.id, zoneId))
      .limit(1);

    const points: TelemetryPoint[] = rows
      .filter((row) => row.temperatureC !== null)
      .map((row) => ({
        at: row.recordedAt.toISOString(),
        temperatureC: Number(row.temperatureC),
        humidityPercent: Number(row.humidityPercent ?? 0),
      }));

    return {
      zoneId,
      code: zone?.code ?? "—",
      points,
      source: rows[0]?.source ?? "SENSOR",
      simulated: (rows[0]?.source ?? "SENSOR") === "SIMULATION",
    };
  }

  async function getFacilityEvents(limit = 12): Promise<FacilityEventView[]> {
    const rows = await db
      .select({
        event: facilityEvents,
        zoneCode: storageZones.code,
        zoneName: storageZones.name,
      })
      .from(facilityEvents)
      .leftJoin(storageZones, eq(facilityEvents.zoneId, storageZones.id))
      .orderBy(desc(facilityEvents.occurredAt))
      .limit(limit);

    return rows.map(({ event, zoneCode, zoneName }) => ({
      id: event.id,
      zoneCode: zoneCode ?? null,
      zoneName: zoneName ?? null,
      severity: event.severity,
      type: event.type,
      title: event.title,
      message: event.message,
      occurredAt: event.occurredAt.toISOString(),
      acknowledged: event.acknowledgedAt !== null,
      simulated: false,
    }));
  }

  async function getSecurityStatus(): Promise<SecurityStatusView> {
    /**
     * Until the site's camera and access-control systems expose an API, the
     * camera matrix is not backed by real rows. It is therefore reported as a
     * simulation even in live mode — §40 forbids implying otherwise.
     */
    const cameras = securityCameras.map((camera) => ({
      id: camera.id,
      zone: camera.zone,
      online: true,
      simulated: true,
    }));

    return {
      accessSecured: true,
      monitoringActive: true,
      cameras,
      camerasOnline: cameras.length,
      camerasTotal: cameras.length,
      lastPatrolAt: null,
      simulated: true,
    };
  }

  async function getInventorySnapshot(clientId?: string): Promise<InventorySnapshot> {
    const rows = await db
      .select({ item: inventoryItems, zoneCode: storageZones.code })
      .from(inventoryItems)
      .leftJoin(storageZones, eq(inventoryItems.zoneId, storageZones.id))
      .where(clientId ? eq(inventoryItems.clientId, clientId) : undefined)
      .orderBy(desc(inventoryItems.receivedAt))
      .limit(500);

    const items: InventoryItemView[] = rows.map(({ item, zoneCode }) => ({
      id: item.id,
      batchReference: item.batchReference,
      productName: item.productName,
      category: item.productCategory,
      zoneCode: zoneCode ?? null,
      locationCode: item.locationCode,
      quantity: Number(item.quantity),
      unit: item.unit,
      status: item.status,
      trackingActive: item.status !== "DISPATCHED",
      receivedAt: item.receivedAt?.toISOString() ?? null,
      setpointC: NUM(item.setpointC),
      clientId: item.clientId,
      clientName: null,
      simulated: false,
    }));

    const byCategory = new Map<InventoryItemView["category"], number>();
    const byStatus = new Map<InventoryItemView["status"], number>();
    let totalPallets = 0;

    for (const item of items) {
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
      byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1);
      if (item.unit === "PALLET") totalPallets += item.quantity;
    }

    return {
      items,
      totalBatches: items.length,
      totalPallets,
      byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
      byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
      simulated: false,
    };
  }

  async function getInquiries(
    filter: { status?: InquiryStatus; limit?: number; search?: string } = {},
  ): Promise<InquiryView[]> {
    const conditions = [];
    if (filter.status) conditions.push(eq(storageInquiries.status, filter.status));
    if (filter.search) {
      const needle = `%${filter.search.toLowerCase()}%`;
      conditions.push(
        sql`(lower(${storageInquiries.reference}) like ${needle}
             or lower(${storageInquiries.name}) like ${needle}
             or lower(${storageInquiries.email}) like ${needle}
             or lower(coalesce(${storageInquiries.company}, '')) like ${needle})`,
      );
    }

    const rows = await db
      .select()
      .from(storageInquiries)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storageInquiries.createdAt))
      .limit(filter.limit ?? 200);

    return rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      category: row.productCategory,
      quantity: NUM(row.quantity),
      unit: row.unit,
      storageDurationDays: row.storageDurationDays,
      message: row.message,
      status: row.status,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      internalNotes: row.internalNotes,
      simulated: false,
    }));
  }

  async function getOccupancy(): Promise<OccupancyView> {
    const zones = await db
      .select()
      .from(storageZones)
      .where(eq(storageZones.isActive, true))
      .orderBy(storageZones.sortOrder, storageZones.code);

    const mapped = zones.map((zone) => ({
      code: zone.code,
      name: zone.name,
      capacity: zone.capacityPallets,
      occupied: zone.occupiedPallets,
      health:
        zone.status === "MAINTENANCE"
          ? ("MAINTENANCE" as const)
          : zone.status === "QUARANTINE"
            ? ("ALERT" as const)
            : ("STABLE" as const),
    }));

    // §45 — utilisation is only published when every occupied zone has a
    // confirmed capacity. Otherwise the figure is unknown and reported as null.
    const occupiedZones = mapped.filter((zone) => zone.occupied > 0);
    const allKnown = occupiedZones.every((zone) => zone.capacity !== null);
    const totalCapacity = allKnown
      ? mapped.reduce((sum, zone) => sum + (zone.capacity ?? 0), 0)
      : null;
    const totalOccupied = mapped.reduce((sum, zone) => sum + zone.occupied, 0);

    return {
      zones: mapped,
      totalCapacity,
      totalOccupied,
      utilisationPercent:
        totalCapacity && totalCapacity > 0
          ? Number(((totalOccupied / totalCapacity) * 100).toFixed(1))
          : null,
      simulated: false,
    };
  }

  async function getAnalytics(): Promise<AnalyticsSnapshot> {
    const [zones, inquiryVolumeRows, inventoryRows, utilisationRows] = await Promise.all([
      db.select({ id: storageZones.id, code: storageZones.code }).from(storageZones)
        .where(eq(storageZones.isActive, true)).orderBy(storageZones.sortOrder),
      db
        .select({
          period: sql<string>`to_char(date_trunc('week', ${storageInquiries.createdAt}), 'IYYY-"W"IW')`,
          count: sql<number>`count(*)::int`,
        })
        .from(storageInquiries)
        .where(gte(storageInquiries.createdAt, sql`now() - interval '8 weeks'`))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      db
        .select({
          category: inventoryItems.productCategory,
          pallets: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)::numeric`,
        })
        .from(inventoryItems)
        .where(sql`${inventoryItems.unit} = 'PALLET'`)
        .groupBy(inventoryItems.productCategory),
      db
        .select({
          period: sql<string>`to_char(date_trunc('month', ${leases.startedAt}), 'YYYY-MM')`,
          positions: sql<number>`coalesce(sum(${leases.palletPositions}), 0)::int`,
        })
        .from(leases)
        .where(gte(leases.startedAt, sql`now() - interval '6 months'`))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
    ]);

    const temperatureHistory = await Promise.all(
      zones.map(async (zone) => {
        const history = await getZoneHistory(zone.id, 24);
        return { zoneCode: zone.code, points: history.points };
      }),
    );

    return {
      temperatureHistory,
      inquiryVolume: inquiryVolumeRows.map((row) => ({ period: row.period, count: Number(row.count) })),
      inventoryDistribution: inventoryRows.map((row) => ({
        category: row.category,
        pallets: Number(row.pallets),
      })),
      // Utilisation trend needs a confirmed capacity baseline; without one the
      // series is reported as null rather than guessed.
      utilisationTrend: utilisationRows.map((row) => ({ period: row.period, percent: null })),
      simulated: false,
    };
  }

  async function getOverview(): Promise<OverviewSnapshot> {
    const [statusRows, occupancy, inventory, events, alertRows] = await Promise.all([
      db
        .select({ status: storageInquiries.status, count: sql<number>`count(*)::int` })
        .from(storageInquiries)
        .groupBy(storageInquiries.status),
      getOccupancy(),
      getInventorySnapshot(),
      getFacilityEvents(8),
      db
        .select({ severity: facilityEvents.severity, count: sql<number>`count(*)::int` })
        .from(facilityEvents)
        .where(gte(facilityEvents.occurredAt, sql`now() - interval '7 days'`))
        .groupBy(facilityEvents.severity),
    ]);

    const tally = (status: InquiryStatus) =>
      statusRows.find((row) => row.status === status)?.count ?? 0;
    const severityTally = (severity: string) =>
      alertRows.find((row) => row.severity === severity)?.count ?? 0;

    return {
      inquiries: {
        new: tally("NEW"),
        contacted: tally("CONTACTED"),
        quoted: tally("QUOTED"),
        approved: tally("APPROVED"),
        total: statusRows.reduce((sum, row) => sum + row.count, 0),
      },
      occupancy,
      activeStorageBatches: inventory.items.filter((item) => item.status === "IN_STORAGE").length,
      alerts: {
        critical: severityTally("CRITICAL"),
        warning: severityTally("WARNING"),
        info: severityTally("INFO") + severityTally("NOTICE"),
      },
      inventory: { batches: inventory.totalBatches, pallets: inventory.totalPallets },
      recentActivity: events,
      simulated: false,
    };
  }

  async function getClientPortal(clientId: string): Promise<ClientPortalSnapshot> {
    const [inventory, requests, documentRows, leaseRows, contractRows] = await Promise.all([
      getInventorySnapshot(clientId),
      getInquiries({ limit: 50 }).then((rows) => rows.filter((row) => row.simulated === false)),
      db
        .select()
        .from(documents)
        .where(and(eq(documents.clientId, clientId), eq(documents.clientVisible, true)))
        .orderBy(desc(documents.createdAt)),
      db
        .select()
        .from(leases)
        .where(eq(leases.clientId, clientId))
        .orderBy(desc(leases.startedAt)),
      db
        .select()
        .from(storageContracts)
        .where(eq(storageContracts.clientId, clientId))
        .orderBy(desc(storageContracts.startAt)),
    ]);

    const zoneReadings = await getZoneReadings();
    const clientZoneCodes = new Set(inventory.items.map((item) => item.zoneCode).filter(Boolean));

    const portalDocuments: DocumentView[] = documentRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      filename: row.filename,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
      simulated: false,
    }));

    const portalLeases: LeaseView[] = leaseRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      zoneCode:
        zoneReadings.find((zone) => zone.zoneId === row.zoneId)?.code ?? null,
      palletPositions: row.palletPositions,
      status: row.status,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt?.toISOString() ?? null,
      simulated: false,
    }));

    // §25 — invoices exist only where a contract carries a confirmed rate.
    // Without one, the portal shows "REQUEST A CUSTOM QUOTE" and no amount.
    const portalInvoices: InvoiceView[] = contractRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      period: row.startAt.toISOString().slice(0, 7),
      amount:
        row.ratePerPalletPerMonth === null || row.palletPositions === null
          ? null
          : Number(row.ratePerPalletPerMonth) * row.palletPositions,
      currency: row.currency,
      status: row.status === "ACTIVE" ? "ISSUED" : "DRAFT",
      issuedAt: row.startAt.toISOString(),
      simulated: false,
    }));

    // Gate passes are modelled as documents of type GATE_PASS.
    const gatePasses: GatePassView[] = documentRows
      .filter((row) => row.type === "GATE_PASS")
      .map((row) => ({
        id: row.id,
        reference: row.filename,
        direction: "OUTBOUND",
        vehicleRegistration: null,
        batchReference: null,
        status: "RELEASED",
        validFrom: row.createdAt.toISOString(),
        simulated: false,
      }));

    const [clientRow] = await db
      .select({ companyName: storageContracts.reference })
      .from(storageContracts)
      .where(eq(storageContracts.clientId, clientId))
      .limit(1);

    return {
      clientId,
      companyName: clientRow?.companyName ?? "Client account",
      contactName: null,
      inventory: inventory.items,
      requests: requests.filter((row) => row.id.length > 0),
      documents: portalDocuments,
      invoices: portalInvoices,
      gatePasses,
      leases: portalLeases,
      telemetry: zoneReadings.filter((zone) => clientZoneCodes.has(zone.code)),
      simulated: inventory.simulated,
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

/** Referenced so tree-shaking keeps the notification table type-check honest. */
export const LIVE_PROVIDER_TABLES = [
  storageZones,
  telemetryLogs,
  facilityEvents,
  inventoryItems,
  storageInquiries,
  storageContracts,
  leases,
  documents,
  notifications,
] as const;
