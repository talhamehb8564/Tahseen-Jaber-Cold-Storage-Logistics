import type { Metadata } from "next";
import { Activity, AlertTriangle, RadioTower } from "lucide-react";

import { TemperatureHistoryChart } from "@/components/admin/charts";
import { AdminBlock, AdminPageHeader, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { AcknowledgeEventButton } from "@/components/admin/acknowledge-event-button";
import { StatusPill } from "@/components/ui/status-pill";
import { ProvenanceNote } from "@/components/ui/provenance-badge";
import { getDataProvider } from "@/lib/data";
import type { FacilityEventView } from "@/lib/data/types";
import { formatDateTime, formatRelative } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Telemetry" };

/**
 * /admin/telemetry (§28, §40)
 * ---------------------------------------------------------------------------
 * Temperature history per zone plus the facility event log, with the ability to
 * acknowledge an open event.
 *
 * §40 IS THE WHOLE POINT OF THIS SCREEN. Telemetry is the one place where a
 * plausible-looking number is most dangerous, because an operator may act on it.
 * So the provenance is stated three ways at once: the badge in the header, the
 * disclosure note under the chart, and the per-zone `source` label beside each
 * reading. When a real sensor feed is connected the provider returns
 * `simulated: false` and all three change without a redesign.
 */
export default async function AdminTelemetryPage() {
  const provider = await getDataProvider();

  const [readings, events] = await Promise.all([
    provider.getZoneReadings(),
    provider.getFacilityEvents(40),
  ]);

  // Only zones that actually report a temperature get a history series.
  const monitoredZones = readings.filter(
    (zone) => zone.temperatureC != null && zone.monitoringActive,
  );

  const histories = await Promise.all(
    monitoredZones.slice(0, 4).map((zone) => provider.getZoneHistory(zone.zoneId, 48)),
  );

  const series = histories
    .filter((history) => history.points.length > 0)
    .map((history) => ({
      zoneCode: history.code,
      points: history.points.map((point) => ({
        at: point.at,
        temperatureC: point.temperatureC,
      })),
    }));

  const openEvents = events.filter((event) => !event.acknowledged);
  const critical = events.filter((event) => event.severity === "CRITICAL");
  const anySimulated = histories.some((history) => history.simulated);

  return (
    <>
      <AdminPageHeader
        title="Telemetry"
        simulated={anySimulated}
        description="Chamber condition history and the facility event log. Acknowledge an event to close it out."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard
          label="Zones reporting"
          value={`${monitoredZones.length}/${readings.length}`}
          tone={monitoredZones.length === readings.length ? "stable" : "caution"}
          icon={<RadioTower size={15} strokeWidth={1.6} aria-hidden />}
          hint={`${readings.length - monitoredZones.length} not reporting a temperature`}
        />
        <StatCard
          label="Open events"
          value={openEvents.length}
          tone={openEvents.length > 0 ? "caution" : "stable"}
          icon={<Activity size={15} strokeWidth={1.6} aria-hidden />}
        />
        <StatCard
          label="Critical"
          value={critical.length}
          tone={critical.length > 0 ? "alert" : "stable"}
          icon={<AlertTriangle size={15} strokeWidth={1.6} aria-hidden />}
        />
        <StatCard
          label="History window"
          value="48"
          unit="hours"
          hint={`${series.reduce((total, entry) => total + entry.points.length, 0)} readings charted`}
        />
      </StatGrid>

      {/* ---------------- Temperature history ---------------- */}
      <AdminBlock
        title="Temperature history"
        description="Each line is one reporting zone over the last 48 hours. The dashed reference is 0 °C."
      >
        <div className="tj-panel rounded-[2px] p-4 sm:p-5">
          <TemperatureHistoryChart series={series} height={300} />
        </div>

        <ProvenanceNote simulated={anySimulated} className="mt-4">
          {anySimulated
            ? "These readings are generated for demonstration. No sensor feed is connected, so they must not be used to make a decision about real stock."
            : "Readings are taken from the connected telemetry source."}
        </ProvenanceNote>
      </AdminBlock>

      {/* ---------------- Current readings ---------------- */}
      <AdminBlock
        title="Current readings"
        description="Latest value per zone, with the source that produced it."
        className="mt-8"
      >
        <ul className="tj-panel divide-y divide-hull-line/50 overflow-hidden rounded-[2px]">
          {readings.map((zone) => (
            <li key={zone.zoneId} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  zone.health === "ALERT"
                    ? "bg-alert"
                    : zone.health === "DRIFT"
                      ? "bg-caution"
                      : zone.health === "MAINTENANCE"
                        ? "bg-silver-dim"
                        : "bg-stable",
                )}
                aria-hidden
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="tabular font-mono text-[0.75rem] font-medium text-frost">
                    {zone.code}
                  </span>
                  <span className="truncate font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim uppercase">
                    {zone.name}
                  </span>
                </span>
                <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.1em] text-silver-dim/75 uppercase">
                  Source {zone.source.toLowerCase()} · {formatRelative(zone.recordedAt)}
                </span>
              </span>

              <span className="tabular shrink-0 font-mono text-[0.8125rem] text-ice">
                {zone.temperatureC != null ? `${zone.temperatureC.toFixed(1)} °C` : "—"}
              </span>
              <span className="tabular hidden shrink-0 font-mono text-[0.6875rem] text-silver-dim sm:block">
                {zone.humidityPercent != null ? `${zone.humidityPercent}% RH` : "—"}
              </span>

              <StatusPill value={zone.health} domain="health" compact />
            </li>
          ))}
        </ul>
      </AdminBlock>

      {/* ---------------- Event log ---------------- */}
      <AdminBlock
        title="Facility events"
        description="Everything the facility has recorded: intake, movement, deviations, access and alarms."
        className="mt-8"
      >
        <ul className="space-y-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      </AdminBlock>
    </>
  );
}

function EventRow({ event }: { event: FacilityEventView }) {
  const tone =
    event.severity === "CRITICAL"
      ? "border-alert/40 bg-alert/[0.05]"
      : event.severity === "WARNING"
        ? "border-caution/35 bg-caution/[0.04]"
        : "border-hull-line/70";

  return (
    <li
      className={cn(
        "tj-panel flex flex-wrap items-start gap-4 rounded-[2px] p-4 transition-colors duration-300",
        tone,
        event.acknowledged && "opacity-65",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill value={event.severity} domain="severity" compact />
          <span className="font-mono text-[0.5rem] tracking-[0.16em] text-silver-dim uppercase">
            {event.type.replace(/_/g, " ")}
          </span>
          {event.zoneCode ? (
            <span className="tabular font-mono text-[0.5625rem] tracking-[0.1em] text-glow uppercase">
              {event.zoneCode}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-[0.875rem] font-medium text-frost">{event.title}</p>
        {event.message ? (
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-silver-dim">{event.message}</p>
        ) : null}

        <p
          className="mt-2 font-mono text-[0.5rem] tracking-[0.12em] text-silver-dim/75 uppercase"
          title={formatDateTime(event.occurredAt)}
        >
          {formatRelative(event.occurredAt)} · {formatDateTime(event.occurredAt)}
        </p>
      </div>

      <div className="shrink-0">
        {event.acknowledged ? (
          <span className="font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
            Acknowledged
          </span>
        ) : (
          <AcknowledgeEventButton eventId={event.id} />
        )}
      </div>
    </li>
  );
}
