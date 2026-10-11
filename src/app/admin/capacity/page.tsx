import type { Metadata } from "next";
import { CircleAlert, Gauge } from "lucide-react";

import { AdminBlock, AdminPageHeader, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { StatusPill } from "@/components/ui/status-pill";
import { getDataProvider } from "@/lib/data";
import { formatPercent } from "@/lib/utilities/format";
import { FALLBACK } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Capacity" };

/**
 * /admin/capacity (§28)
 * ---------------------------------------------------------------------------
 * Utilisation per zone and across the facility.
 *
 * THE §45 RULE, APPLIED TO A DASHBOARD
 *   Utilisation is a RATIO, and a ratio needs a denominator. Where capacity has
 *   not been confirmed, the denominator does not exist — so this screen shows
 *   occupancy as a real count and renders utilisation as "not supplied" rather
 *   than inventing a capacity to divide by. A dashboard that shows a confident
 *   percentage built on a made-up denominator is worse than one that admits the
 *   gap, because it will be acted on.
 *
 *   The provider enforces the same rule: `utilisationPercent` is null whenever any
 *   contributing capacity is unknown.
 */
export default async function AdminCapacityPage() {
  const provider = await getDataProvider();
  const occupancy = await provider.getOccupancy();

  const withCapacity = occupancy.zones.filter((zone) => zone.capacity != null);
  const withoutCapacity = occupancy.zones.filter((zone) => zone.capacity == null);

  return (
    <>
      <AdminPageHeader
        title="Capacity"
        simulated={occupancy.simulated}
        description="Occupancy per zone. Utilisation is only computed where a capacity figure has actually been confirmed."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard
          label="Facility utilisation"
          value={formatPercent(occupancy.utilisationPercent)}
          tone="glow"
          icon={<Gauge size={15} strokeWidth={1.6} aria-hidden />}
          unavailable={occupancy.utilisationPercent == null}
          unavailableLabel={FALLBACK.capability}
          hint={
            occupancy.totalCapacity != null
              ? `${occupancy.totalOccupied} of ${occupancy.totalCapacity} pallet positions`
              : `${occupancy.totalOccupied} pallets occupied · capacity unconfirmed`
          }
        />
        <StatCard label="Pallets occupied" value={occupancy.totalOccupied} tone="ice" />
        <StatCard label="Total capacity" value={occupancy.totalCapacity ?? "—"} unavailable={occupancy.totalCapacity == null} unavailableLabel={FALLBACK.capability} />
        <StatCard
          label="Zones reporting"
          value={`${withCapacity.length}/${occupancy.zones.length}`}
          tone={withoutCapacity.length > 0 ? "caution" : "stable"}
          hint={withoutCapacity.length > 0 ? `${withoutCapacity.length} without a confirmed capacity` : "All zones have a capacity figure"}
        />
      </StatGrid>

      {/* ---------------- Per-zone occupancy ---------------- */}
      <AdminBlock
        title="By zone"
        description="Occupied pallet positions against confirmed capacity. Zones without a capacity figure show their count alone."
      >
        <ul className="tj-panel divide-y divide-hull-line/50 overflow-hidden rounded-[2px]">
          {occupancy.zones.map((zone) => {
            const percent =
              zone.capacity != null && zone.capacity > 0
                ? Math.min(100, Math.round((zone.occupied / zone.capacity) * 100))
                : null;

            return (
              <li key={zone.code} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2.5">
                      <span className="tabular font-mono text-[0.75rem] font-medium text-glow">
                        {zone.code}
                      </span>
                      <span className="font-display text-[0.8125rem] font-bold tracking-[0.01em] text-frost uppercase">
                        {zone.name}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="tabular font-mono text-[0.75rem] text-silver">
                      {zone.occupied}
                      <span className="text-silver-dim">
                        {" "}
                        / {zone.capacity ?? "—"} pallets
                      </span>
                    </span>
                    <StatusPill value={zone.health} domain="health" compact />
                  </div>
                </div>

                {/* Bar. Without a capacity the bar has no meaningful scale, so it
                    is omitted rather than drawn against an invented maximum. */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-hull-line/50">
                  {percent != null ? (
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        percent > 90
                          ? "bg-alert"
                          : percent > 75
                            ? "bg-caution"
                            : "bg-gradient-to-r from-ice to-glow",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="h-full w-full opacity-30"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgba(148,163,184,0.5) 0 6px, transparent 6px 12px)",
                      }}
                    />
                  )}
                </div>

                <p className="mt-2 font-mono text-[0.5rem] tracking-[0.12em] text-silver-dim uppercase">
                  {percent != null
                    ? `${percent}% utilised`
                    : `Utilisation unavailable — capacity ${FALLBACK.capability.toLowerCase()}`}
                </p>
              </li>
            );
          })}
        </ul>
      </AdminBlock>

      {/* ---------------- The honest gap ---------------- */}
      {withoutCapacity.length > 0 ? (
        <div className="tj-panel mt-7 rounded-[2px] border-caution/30 p-6">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-caution/40 bg-caution/[0.08] text-caution">
              <CircleAlert size={18} strokeWidth={1.7} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold tracking-[0.01em] text-frost uppercase">
                Capacity not confirmed for {withoutCapacity.length}{" "}
                {withoutCapacity.length === 1 ? "zone" : "zones"}
              </h2>
              <p className="mt-2.5 max-w-2xl text-[0.875rem] leading-relaxed text-silver">
                Utilisation cannot be calculated without a denominator. Rather than
                assume one, those zones report occupancy only. Enter confirmed pallet
                capacities in Settings to enable utilisation reporting — the figures
                will then flow through this screen and the public site automatically.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {withoutCapacity.map((zone) => (
                  <li
                    key={zone.code}
                    className="rounded-[2px] border border-hull-line bg-midnight/50 px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] text-silver uppercase"
                  >
                    {zone.code} · {zone.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
