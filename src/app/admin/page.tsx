import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Gauge,
  Inbox,
  RadioTower,
  ThermometerSnowflake,
} from "lucide-react";

import {
  AdminBlock,
  AdminPageHeader,
  DataTable,
  StatCard,
  StatGrid,
  type Column,
} from "@/components/admin/admin-ui";
import { StatusPill } from "@/components/ui/status-pill";
import { getDataProvider, getDataSourceInfo } from "@/lib/data";
import type { FacilityEventView, ZoneReading } from "@/lib/data/types";
import { formatRelative, formatTemperature } from "@/lib/utilities/format";
import { FALLBACK } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Overview" };

/**
 * /admin — COMMAND CENTER OVERVIEW (§28)
 * ---------------------------------------------------------------------------
 * The landing screen after staff sign-in: the numbers that decide what needs
 * attention today, the alert queue, and zone health. Everything here is read
 * from the data provider, so the same screen renders real data the moment a
 * database is connected — and until then it is badged SIMULATION rather than
 * quietly implying otherwise (§40).
 *
 * §45 — capacity figures arrive as `null` from the provider when unconfirmed, and
 * are rendered as "Not supplied" instead of zero. A zero would read as a
 * measurement of an empty facility, which is a different claim.
 */
export default async function AdminOverviewPage() {
  const [provider, source] = await Promise.all([
    getDataProvider(),
    getDataSourceInfo(),
  ]);

  const [overview, zoneReadings, events] = await Promise.all([
    provider.getOverview(),
    provider.getZoneReadings(),
    provider.getFacilityEvents(12),
  ]);

  const simulated = source.badge !== "LIVE";
  const unacknowledged = events.filter((event) => !event.acknowledged);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        simulated={overview.simulated}
        description="Facility state at a glance. Alert queue first, because that is the only part that needs a decision."
        meta={
          <p className="font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
            Data source: {source.mode} · {source.badge}
            {source.reason ? ` · ${source.reason}` : ""}
          </p>
        }
        actions={
          <>
            <AdminLink href="/admin/requests" icon={<Inbox size={13} strokeWidth={1.8} aria-hidden />}>
              Requests
            </AdminLink>
            <AdminLink href="/admin/reports" icon={<Activity size={13} strokeWidth={1.8} aria-hidden />}>
              Reports
            </AdminLink>
          </>
        }
      />

      {/* ---------------- KPIs ---------------- */}
      <StatGrid columns={4}>
        <StatCard
          label="New requests"
          value={overview.inquiries.new}
          tone={overview.inquiries.new > 0 ? "glow" : "default"}
          icon={<Inbox size={15} strokeWidth={1.6} aria-hidden />}
          hint={`${overview.inquiries.total} total · ${overview.inquiries.quoted} quoted`}
        />
        <StatCard
          label="Unacknowledged alerts"
          value={unacknowledged.length}
          tone={
            overview.alerts.critical > 0
              ? "alert"
              : overview.alerts.warning > 0
                ? "caution"
                : "stable"
          }
          icon={<AlertTriangle size={15} strokeWidth={1.6} aria-hidden />}
          hint={`${overview.alerts.critical} critical · ${overview.alerts.warning} warning`}
        />
        <StatCard
          label="Batches in storage"
          value={overview.inventory.batches}
          tone="ice"
          icon={<Boxes size={15} strokeWidth={1.6} aria-hidden />}
          hint={`${overview.inventory.pallets} pallet positions held`}
        />
        <StatCard
          label="Facility utilisation"
          value={
            overview.occupancy.utilisationPercent != null
              ? `${overview.occupancy.utilisationPercent}%`
              : "—"
          }
          tone="default"
          icon={<Gauge size={15} strokeWidth={1.6} aria-hidden />}
          // §45 — utilisation cannot be computed without a confirmed capacity.
          unavailable={overview.occupancy.utilisationPercent == null}
          unavailableLabel={FALLBACK.capability}
          hint={`${overview.occupancy.totalOccupied} pallets occupied`}
        />
      </StatGrid>

      {/* ---------------- Alert queue + zone health ---------------- */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <AdminBlock
          title="Alert queue"
          description="Most recent facility events. Unacknowledged items are the ones still open."
          aside={
            <Link
              href="/admin/telemetry"
              className="group inline-flex items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase transition-colors duration-300 hover:text-glow"
            >
              Full log
              <ArrowUpRight
                size={12}
                strokeWidth={1.8}
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          }
        >
          <DataTable<FacilityEventView>
            rows={events}
            rowKey={(event) => event.id}
            dense
            caption="Recent facility events"
            empty={
              <p className="font-mono text-[0.625rem] tracking-[0.18em] text-silver-dim uppercase">
                No events recorded
              </p>
            }
            columns={eventColumns}
          />
        </AdminBlock>

        <AdminBlock
          title="Zone health"
          description="Current state of every controlled zone."
          aside={
            <Link
              href="/admin/zones"
              className="group inline-flex items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase transition-colors duration-300 hover:text-glow"
            >
              Manage
              <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          }
        >
          <ul className="tj-panel divide-y divide-hull-line/50 overflow-hidden rounded-[2px]">
            {zoneReadings.map((zone) => (
              <ZoneHealthRow key={zone.zoneId} zone={zone} />
            ))}
          </ul>
        </AdminBlock>
      </div>

      {/* ---------------- Inquiry pipeline ---------------- */}
      <div className="mt-8">
        <AdminBlock
          title="Request pipeline"
          description="Where the open storage requests currently sit."
          aside={
            <Link
              href="/admin/requests"
              className="group inline-flex items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase transition-colors duration-300 hover:text-glow"
            >
              Open requests
              <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          }
        >
          <PipelineBar inquiries={overview.inquiries} />
        </AdminBlock>
      </div>
    </>
  );
}

/* --------------------------------------------------------------------------
   EVENT TABLE COLUMNS
   -------------------------------------------------------------------------- */

const eventColumns: readonly Column<FacilityEventView>[] = [
  {
    key: "severity",
    header: "Severity",
    render: (event) => <StatusPill value={event.severity} domain="severity" compact />,
  },
  {
    key: "title",
    header: "Event",
    render: (event) => (
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] text-frost">{event.title}</span>
        <span className="mt-0.5 block truncate font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim uppercase">
          {event.type.replace(/_/g, " ")}
          {event.zoneCode ? ` · ${event.zoneCode}` : ""}
        </span>
      </span>
    ),
  },
  {
    key: "occurredAt",
    header: "When",
    align: "right",
    render: (event) => (
      <span className="tabular whitespace-nowrap font-mono text-[0.6875rem] text-silver-dim">
        {formatRelative(event.occurredAt)}
      </span>
    ),
  },
  {
    key: "acknowledged",
    header: "State",
    align: "right",
    hideBelow: "sm",
    render: (event) =>
      event.acknowledged ? (
        <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim uppercase">
          Acknowledged
        </span>
      ) : (
        <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-caution uppercase">
          Open
        </span>
      ),
  },
];

/* --------------------------------------------------------------------------
   ZONE HEALTH ROW
   -------------------------------------------------------------------------- */

function ZoneHealthRow({ zone }: { zone: ZoneReading }) {
  const healthTone =
    zone.health === "ALERT"
      ? "text-alert"
      : zone.health === "DRIFT"
        ? "text-caution"
        : zone.health === "MAINTENANCE"
          ? "text-silver-dim"
          : "text-stable";

  return (
    <li className="flex items-center gap-4 px-4 py-3 transition-colors duration-300 hover:bg-hull/25">
      {/* Health dot */}
      <span className="relative flex size-2 shrink-0">
        <span
          className={cn(
            "size-2 rounded-full",
            zone.health === "ALERT"
              ? "bg-alert"
              : zone.health === "DRIFT"
                ? "bg-caution"
                : zone.health === "MAINTENANCE"
                  ? "bg-silver-dim"
                  : "bg-stable",
          )}
        />
        {zone.health === "ALERT" || zone.health === "DRIFT" ? (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full",
              zone.health === "ALERT" ? "bg-alert/60" : "bg-caution/50",
            )}
            aria-hidden
          />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[0.6875rem] tracking-[0.1em] text-frost uppercase">
          {zone.code}
          <span className="ml-2 tracking-normal text-silver-dim normal-case">{zone.name}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim uppercase">
          {zone.monitoringActive ? (
            <>
              <RadioTower size={10} strokeWidth={1.8} aria-hidden />
              Monitoring
            </>
          ) : (
            <>
              <RadioTower size={10} strokeWidth={1.8} aria-hidden className="text-caution" />
              Not reporting
            </>
          )}
          {zone.restrictedAccess ? <span className="text-caution">· restricted</span> : null}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn("tabular flex items-center justify-end gap-1.5 font-mono text-[0.8125rem]", healthTone)}>
          <ThermometerSnowflake size={12} strokeWidth={1.7} aria-hidden />
          {formatTemperature(zone.temperatureC, "—")}
        </p>
        <p className="tabular mt-0.5 font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim uppercase">
          {zone.occupiedPallets} pallets
          {zone.capacityPallets != null ? ` / ${zone.capacityPallets}` : ""}
        </p>
      </div>
    </li>
  );
}

/* --------------------------------------------------------------------------
   PIPELINE BAR
   A single proportional bar rather than five separate counters — the shape of
   the pipeline is the information, not each individual total.
   -------------------------------------------------------------------------- */

const PIPELINE_STAGES = [
  { key: "new", label: "New", className: "bg-glow" },
  { key: "contacted", label: "Contacted", className: "bg-ice" },
  { key: "quoted", label: "Quoted", className: "bg-caution" },
  { key: "approved", label: "Approved", className: "bg-stable" },
] as const;

function PipelineBar({
  inquiries,
}: {
  inquiries: { new: number; contacted: number; quoted: number; approved: number; total: number };
}) {
  const denominator = Math.max(1, inquiries.total);

  return (
    <div className="tj-panel rounded-[2px] p-5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-hull-line/50">
        {PIPELINE_STAGES.map((stage) => {
          const count = inquiries[stage.key];
          const percent = (count / denominator) * 100;
          if (percent <= 0) return null;
          return (
            <div
              key={stage.key}
              className={cn("h-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]", stage.className)}
              style={{ width: `${percent}%` }}
              title={`${stage.label}: ${count}`}
            />
          );
        })}
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {PIPELINE_STAGES.map((stage) => (
          <li key={stage.key} className="flex items-center gap-2.5">
            <span className={cn("size-2 shrink-0 rounded-full", stage.className)} aria-hidden />
            <span className="min-w-0">
              <span className="tabular block font-mono text-[0.9375rem] font-medium text-frost">
                {inquiries[stage.key]}
              </span>
              <span className="block font-mono text-[0.5rem] tracking-[0.16em] text-silver-dim uppercase">
                {stage.label}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------------------------
   SMALL CONSOLE LINK
   -------------------------------------------------------------------------- */

function AdminLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-[2px] border border-hull-line px-3.5 py-2.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver uppercase transition-all duration-300 hover:border-glow/45 hover:text-glow"
    >
      {icon}
      {children}
    </Link>
  );
}
