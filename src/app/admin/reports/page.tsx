import type { Metadata } from "next";
import { BarChart3, Download } from "lucide-react";

import {
  InquiryVolumeChart,
  InventoryDistributionChart,
  TemperatureHistoryChart,
  UtilisationTrendChart,
} from "@/components/admin/charts";
import { AdminBlock, AdminPageHeader, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { ProvenanceNote } from "@/components/ui/provenance-badge";
import { getDataProvider } from "@/lib/data";
import { humaniseEnum } from "@/lib/utilities/format";

export const metadata: Metadata = { title: "Reports" };

/**
 * /admin/reports (§28, §02 — Recharts)
 * ---------------------------------------------------------------------------
 * Four charts over the provider's analytics snapshot: request volume, inventory
 * distribution, utilisation trend and temperature history.
 *
 * The data is fetched server-side and passed to the chart components as plain
 * arrays (§40 — the provider never runs in the browser). Each chart handles its
 * own empty state, and the utilisation chart refuses to plot anything when no
 * capacity has been confirmed rather than drawing a misleading flat line (§45).
 */
export default async function AdminReportsPage() {
  const provider = await getDataProvider();

  const [analytics, overview, readings] = await Promise.all([
    provider.getAnalytics(),
    provider.getOverview(),
    provider.getZoneReadings(),
  ]);

  const monitored = readings.filter((zone) => zone.temperatureC != null).slice(0, 4);
  const histories = await Promise.all(
    monitored.map((zone) => provider.getZoneHistory(zone.zoneId, 48)),
  );

  const temperatureSeries = histories
    .filter((history) => history.points.length > 0)
    .map((history) => ({
      zoneCode: history.code,
      points: history.points.map((point) => ({
        at: point.at,
        temperatureC: point.temperatureC,
      })),
    }));

  const inventoryDistribution = analytics.inventoryDistribution.map((entry) => ({
    category: humaniseEnum(entry.category),
    pallets: entry.pallets,
  }));

  const totalInquiries = analytics.inquiryVolume.reduce((total, entry) => total + entry.count, 0);
  const peak = analytics.inquiryVolume.reduce<{ period: string; count: number } | null>(
    (best, entry) => (!best || entry.count > best.count ? entry : best),
    null,
  );

  return (
    <>
      <AdminPageHeader
        title="Reports"
        simulated={analytics.simulated}
        description="Trends across requests, stock, utilisation and chamber conditions."
        actions={
          <span className="inline-flex items-center gap-2 rounded-[2px] border border-hull-line px-3.5 py-2.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase">
            <Download size={13} strokeWidth={1.8} aria-hidden />
            Export not connected
          </span>
        }
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard label="Requests in period" value={totalInquiries} tone="glow" icon={<BarChart3 size={15} strokeWidth={1.6} aria-hidden />} />
        <StatCard
          label="Peak period"
          value={peak?.period ?? "—"}
          tone="ice"
          hint={peak ? `${peak.count} requests` : undefined}
        />
        <StatCard label="Pallets held" value={overview.inventory.pallets} />
        <StatCard
          label="Facility utilisation"
          value={overview.occupancy.utilisationPercent != null ? `${overview.occupancy.utilisationPercent}%` : "—"}
          unavailable={overview.occupancy.utilisationPercent == null}
          unavailableLabel="Not supplied"
        />
      </StatGrid>

      <div className="grid gap-8 xl:grid-cols-2">
        <AdminBlock
          title="Request volume"
          description="Public submissions by period, from the website and the calculator."
        >
          <div className="tj-panel rounded-[2px] p-4 sm:p-5">
            <InquiryVolumeChart data={analytics.inquiryVolume} height={260} />
          </div>
        </AdminBlock>

        <AdminBlock
          title="Inventory distribution"
          description="Pallet positions held, by product category."
        >
          <div className="tj-panel rounded-[2px] p-4 sm:p-5">
            <InventoryDistributionChart data={inventoryDistribution} height={260} />
          </div>
        </AdminBlock>

        <AdminBlock
          title="Utilisation trend"
          description="Facility occupancy over time. Requires confirmed capacity figures."
        >
          <div className="tj-panel rounded-[2px] p-4 sm:p-5">
            <UtilisationTrendChart data={analytics.utilisationTrend} height={260} />
          </div>
        </AdminBlock>

        <AdminBlock
          title="Temperature history"
          description="Reporting zones over the last 48 hours, with a 0 °C reference."
        >
          <div className="tj-panel rounded-[2px] p-4 sm:p-5">
            <TemperatureHistoryChart series={temperatureSeries} height={260} />
          </div>
        </AdminBlock>
      </div>

      <ProvenanceNote simulated={analytics.simulated} className="mt-7">
        {analytics.simulated
          ? "Every figure on this screen is generated for demonstration. Trends, volumes and utilisation are illustrative patterns, not the facility's trading history, and must not be quoted externally."
          : "Figures are drawn from the connected data source."}
      </ProvenanceNote>
    </>
  );
}
