import type { Metadata } from "next";
import { Camera, DoorClosed, Fingerprint, RadioTower, ShieldCheck } from "lucide-react";

import { AdminBlock, AdminPageHeader, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { SecurityMatrix } from "@/components/security/security-matrix";
import { ProvenanceNote } from "@/components/ui/provenance-badge";
import { getDataProvider } from "@/lib/data";
import { formatRelative } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Security" };

/**
 * /admin/security (§28, §23)
 * ---------------------------------------------------------------------------
 * Reuses the public `SecurityMatrix` component rather than building a second
 * camera grid (§41), then adds what only an operator needs: the offline cameras
 * called out explicitly, restricted-zone access state, and the security-relevant
 * events from the log.
 *
 * §23/§40 — the matrix already renders its own SIMULATION badge and disclosure.
 * That matters more here than on the marketing page: an operator must never
 * mistake an illustrative camera tile for a working feed.
 */
export default async function AdminSecurityPage() {
  const provider = await getDataProvider();

  const [security, events, readings] = await Promise.all([
    provider.getSecurityStatus(),
    provider.getFacilityEvents(60),
    provider.getZoneReadings(),
  ]);

  const offline = security.cameras.filter((camera) => !camera.online);
  const restrictedZones = readings.filter((zone) => zone.restrictedAccess);

  const securityEvents = events.filter((event) =>
    ["ACCESS_GRANTED", "ACCESS_DENIED", "DOOR_HELD_OPEN", "DOOR_OPENED", "PERIMETER"].some(
      (type) => event.type.includes(type),
    ),
  );

  return (
    <>
      <AdminPageHeader
        title="Security"
        simulated={security.simulated}
        description="Camera matrix, access control and restricted-zone state. Offline cameras are listed first because they are the actionable part."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard
          label="Cameras online"
          value={`${security.camerasOnline}/${security.camerasTotal}`}
          tone={security.camerasOnline === security.camerasTotal ? "stable" : "alert"}
          icon={<Camera size={15} strokeWidth={1.6} aria-hidden />}
          hint={offline.length > 0 ? `${offline.length} not reporting` : "All reporting"}
        />
        <StatCard
          label="Access state"
          value={security.accessSecured ? "SECURED" : "OPEN"}
          tone={security.accessSecured ? "stable" : "alert"}
          icon={<DoorClosed size={15} strokeWidth={1.6} aria-hidden />}
        />
        <StatCard
          label="Monitoring"
          value={security.monitoringActive ? "ACTIVE" : "INACTIVE"}
          tone={security.monitoringActive ? "stable" : "alert"}
          icon={<RadioTower size={15} strokeWidth={1.6} aria-hidden />}
          hint={
            security.lastPatrolAt ? `Last patrol ${formatRelative(security.lastPatrolAt)}` : undefined
          }
        />
        <StatCard
          label="Restricted zones"
          value={restrictedZones.length}
          tone={restrictedZones.length > 0 ? "caution" : "default"}
          icon={<Fingerprint size={15} strokeWidth={1.6} aria-hidden />}
          hint={restrictedZones.map((zone) => zone.code).join(" · ") || "None"}
        />
      </StatGrid>

      {/* ---------------- Offline cameras, called out ---------------- */}
      {offline.length > 0 ? (
        <div className="tj-panel mb-7 rounded-[2px] border-alert/35 p-5">
          <p className="flex items-center gap-2.5 font-mono text-[0.625rem] font-semibold tracking-[0.16em] text-alert uppercase">
            <Camera size={14} strokeWidth={1.8} aria-hidden />
            {offline.length} {offline.length === 1 ? "camera is" : "cameras are"} not reporting
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {offline.map((camera) => (
              <li
                key={camera.id}
                className="rounded-[2px] border border-alert/35 bg-alert/[0.06] px-3 py-2"
              >
                <span className="tabular block font-mono text-[0.6875rem] text-frost">
                  {camera.id}
                </span>
                <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.12em] text-silver-dim uppercase">
                  {camera.zone}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ---------------- The matrix ---------------- */}
      <AdminBlock
        title="Console"
        description="The operator view: camera matrix, credential scanner and door state."
      >
        <SecurityMatrix status={security} simulated={security.simulated} />
      </AdminBlock>

      {/* ---------------- Security events ---------------- */}
      <AdminBlock
        title="Security events"
        description="Access and door events from the facility log."
        className="mt-8"
      >
        {securityEvents.length === 0 ? (
          <div className="tj-panel rounded-[2px] px-6 py-12 text-center">
            <ShieldCheck size={22} strokeWidth={1.5} aria-hidden className="mx-auto text-silver-dim" />
            <p className="mt-4 font-mono text-[0.5625rem] tracking-[0.18em] text-silver-dim uppercase">
              No security events recorded
            </p>
          </div>
        ) : (
          <ul className="tj-panel divide-y divide-hull-line/50 overflow-hidden rounded-[2px]">
            {securityEvents.slice(0, 20).map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    event.severity === "CRITICAL"
                      ? "bg-alert"
                      : event.severity === "WARNING"
                        ? "bg-caution"
                        : "bg-stable",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] text-frost">{event.title}</span>
                  <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.12em] text-silver-dim uppercase">
                    {event.type.replace(/_/g, " ")}
                    {event.zoneCode ? ` · ${event.zoneCode}` : ""}
                  </span>
                </span>
                <span className="tabular shrink-0 font-mono text-[0.5625rem] text-silver-dim">
                  {formatRelative(event.occurredAt)}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[0.5rem] tracking-[0.12em] uppercase",
                    event.acknowledged ? "text-silver-dim" : "text-caution",
                  )}
                >
                  {event.acknowledged ? "closed" : "open"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminBlock>

      <ProvenanceNote simulated={security.simulated} className="mt-6">
        {security.simulated
          ? "No camera system, access controller or thermal sensor is connected to this installation. Everything on this screen is illustrative and must not be treated as the state of real equipment."
          : "Security state is read from the connected systems."}
      </ProvenanceNote>
    </>
  );
}
