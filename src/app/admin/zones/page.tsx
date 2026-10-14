import type { Metadata } from "next";
import { Lock, RadioTower, ThermometerSnowflake, Warehouse } from "lucide-react";

import {
  AdminPageHeader,
  DataTable,
  StatCard,
  StatGrid,
  type Column,
} from "@/components/admin/admin-ui";
import { StatusPill } from "@/components/ui/status-pill";
import { getDataProvider } from "@/lib/data";
import type { ZoneReading } from "@/lib/data/types";
import { facilityZones } from "@/lib/catalog";
import { formatDateTime, formatRelative, formatTemperature } from "@/lib/utilities/format";
import { FALLBACK } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Zones" };

/**
 * /admin/zones (§28)
 * ---------------------------------------------------------------------------
 * The facility's controlled zones: identity, purpose, current reading, monitoring
 * state and access rule. Merges the catalog (what a zone IS — stable content) with
 * the provider (what it is doing RIGHT NOW — state).
 *
 * §45 — `capacityPallets` is null until the business confirms a figure, and renders
 * as "Not supplied". Zone purpose and temperature labels come from the catalog,
 * which holds non-numeric labels for exactly this reason.
 */
export default async function AdminZonesPage() {
  const provider = await getDataProvider();
  const readings = await provider.getZoneReadings();

  const monitored = readings.filter((zone) => zone.monitoringActive).length;
  const unhealthy = readings.filter(
    (zone) => zone.health === "ALERT" || zone.health === "DRIFT",
  ).length;
  const restricted = readings.filter((zone) => zone.restrictedAccess).length;

  const columns: readonly Column<ZoneRow>[] = [
    {
      key: "zone",
      header: "Zone",
      render: (row) => (
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="tabular font-mono text-[0.75rem] font-medium text-glow">
              {row.reading.code}
            </span>
            {row.reading.restrictedAccess ? (
              <Lock size={11} strokeWidth={1.8} aria-hidden className="text-caution" />
            ) : null}
          </span>
          <span className="mt-0.5 block truncate font-display text-[0.75rem] font-bold tracking-[0.02em] text-frost uppercase">
            {row.reading.name}
          </span>
        </span>
      ),
    },
    {
      key: "purpose",
      header: "Purpose",
      hideBelow: "lg",
      render: (row) => (
        <span className="block max-w-[22rem] truncate text-[0.8125rem] text-silver-dim">
          {row.purpose ?? "—"}
        </span>
      ),
    },
    {
      key: "temperature",
      header: "Reading",
      align: "right",
      render: (row) => (
        <span className="min-w-0">
          <span
            className={cn(
              "tabular flex items-center justify-end gap-1.5 font-mono text-[0.8125rem]",
              row.reading.health === "ALERT"
                ? "text-alert"
                : row.reading.health === "DRIFT"
                  ? "text-caution"
                  : "text-frost",
            )}
          >
            <ThermometerSnowflake size={12} strokeWidth={1.7} aria-hidden />
            {formatTemperature(row.reading.temperatureC, "—")}
          </span>
          <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.1em] text-silver-dim uppercase">
            {row.reading.humidityPercent != null ? `${row.reading.humidityPercent}% RH` : "RH n/a"}
          </span>
        </span>
      ),
    },
    {
      key: "setpoint",
      header: "Set point",
      align: "right",
      hideBelow: "md",
      render: (row) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.6875rem] text-ice">
          {formatTemperature(row.reading.setpointC, FALLBACK.temperature)}
        </span>
      ),
    },
    {
      key: "occupancy",
      header: "Occupancy",
      align: "right",
      render: (row) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.6875rem] text-silver">
          {row.reading.occupiedPallets}
          <span className="text-silver-dim">
            {" "}
            / {row.reading.capacityPallets ?? "—"}
          </span>
        </span>
      ),
    },
    {
      key: "monitoring",
      header: "Monitoring",
      hideBelow: "sm",
      render: (row) => (
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase",
            row.reading.monitoringActive ? "text-stable" : "text-caution",
          )}
        >
          <RadioTower size={11} strokeWidth={1.8} aria-hidden />
          {row.reading.monitoringActive ? "Active" : "Silent"}
        </span>
      ),
    },
    {
      key: "health",
      header: "Health",
      align: "right",
      render: (row) => <StatusPill value={row.reading.health} domain="health" compact />,
    },
    {
      key: "recorded",
      header: "Recorded",
      align: "right",
      hideBelow: "lg",
      render: (row) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.625rem] text-silver-dim" title={formatDateTime(row.reading.recordedAt)}>
          {formatRelative(row.reading.recordedAt)}
        </span>
      ),
    },
  ];

  // Merge catalog content into the live readings.
  const rows: ZoneRow[] = readings.map((reading) => {
    const catalogZone = facilityZones.find((zone) => zone.code === reading.code);
    return {
      reading,
      purpose: catalogZone?.purpose ?? null,
      temperatureLabel: catalogZone?.temperatureLabel ?? null,
    };
  });

  return (
    <>
      <AdminPageHeader
        title="Facility zones"
        simulated={rows[0]?.reading.simulated ?? true}
        description="Every controlled zone in the building, its current reading and its access rule."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard label="Zones" value={rows.length} tone="glow" icon={<Warehouse size={15} strokeWidth={1.6} aria-hidden />} />
        <StatCard label="Monitoring" value={`${monitored}/${rows.length}`} tone={monitored === rows.length ? "stable" : "caution"} />
        <StatCard label="Needs attention" value={unhealthy} tone={unhealthy > 0 ? "alert" : "stable"} />
        <StatCard label="Restricted" value={restricted} tone={restricted > 0 ? "caution" : "default"} hint="Pharma and security zones" />
      </StatGrid>

      <DataTable<ZoneRow>
        rows={rows}
        columns={columns}
        rowKey={(row) => row.reading.zoneId}
        dense
        caption="Facility zones and current readings"
      />

      <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
        Capacity shows "—" where a figure has not been confirmed ({FALLBACK.capability}).
        Occupancy is a real count of recorded stock; capacity is not estimated from it.
      </p>
    </>
  );
}

interface ZoneRow {
  reading: ZoneReading;
  purpose: string | null;
  temperatureLabel: string | null;
}
