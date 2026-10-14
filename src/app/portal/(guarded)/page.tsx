import {
  ClipboardList,
  FileText,
  PackageOpen,
  Snowflake,
  ThermometerSnowflake,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";

import {
  AdminBlock,
  AdminPageHeader,
  DataTable,
  EmptyState,
  StatCard,
  StatGrid,
  type Column,
} from "@/components/admin/admin-ui";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { StatusPill } from "@/components/ui/status-pill";
import { requireClient } from "@/lib/auth/guards";
import { getDataProvider } from "@/lib/data";
import type {
  DocumentView,
  GatePassView,
  InventoryItemView,
  InvoiceView,
  InquiryView,
  LeaseView,
} from "@/lib/data/types";
import { FALLBACK } from "@/lib/site";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatTemperature,
  humaniseEnum,
} from "@/lib/utilities/format";

export const metadata: Metadata = {
  title: "Overview",
};

/**
 * CLIENT PORTAL — OVERVIEW (§27)
 * ---------------------------------------------------------------------------
 * Everything on this page is scoped to the signed-in client by the layout's
 * `requireClient` guard, and the snapshot itself is fetched with that client id,
 * so a visitor can only ever see their own records (§30).
 *
 * §40 — the SIMULATION badge is rendered from the snapshot's own `simulated`
 * flag. Nothing here is labelled live unless the provider says it is.
 *
 * §25 — invoice amounts are null until the business supplies pricing rules, so
 * the amount column prints the fallback rather than a number that was never
 * agreed.
 *
 * The admin primitives (header, stat cards, data table) are reused deliberately:
 * one implementation of a table, not two that drift apart (§41).
 */
export default async function PortalPage() {
  const { clientId } = await requireClient("/portal");
  const provider = await getDataProvider();
  const portal = await provider.getClientPortal(clientId);

  const activeRequests = portal.requests.filter(
    (request) => request.status !== "COMPLETED" && request.status !== "REJECTED",
  );
  const openInvoices = portal.invoices.filter(
    (invoice) => invoice.status === "ISSUED" || invoice.status === "OVERDUE",
  );
  const pallets = portal.inventory.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <AdminPageHeader
        title={portal.companyName}
        simulated={portal.simulated}
        description={
          <>
            Storage records, documents and environmental monitoring for your
            account.
            {portal.contactName ? ` Primary contact: ${portal.contactName}.` : ""}
          </>
        }
        meta={
          <p className="font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase">
            Account {clientId}
          </p>
        }
      />

      {/* ---------------- Headline figures ---------------- */}
      <StatGrid columns={4} className="mb-8">
        <StatCard
          label="Units held"
          value={formatNumber(pallets)}
          hint={`${formatNumber(portal.inventory.length)} batches on record`}
          tone="ice"
          icon={<PackageOpen size={15} strokeWidth={1.7} aria-hidden />}
        />
        <StatCard
          label="Active requests"
          value={formatNumber(activeRequests.length)}
          hint={`${formatNumber(portal.requests.length)} total submitted`}
          tone={activeRequests.length > 0 ? "glow" : "default"}
          icon={<ClipboardList size={15} strokeWidth={1.7} aria-hidden />}
        />
        <StatCard
          label="Open invoices"
          value={formatNumber(openInvoices.length)}
          hint={FALLBACK.pricing}
          tone={openInvoices.some((invoice) => invoice.status === "OVERDUE") ? "alert" : "default"}
          icon={<FileText size={15} strokeWidth={1.7} aria-hidden />}
        />
        <StatCard
          label="Zones monitored"
          value={formatNumber(portal.telemetry.length)}
          hint="Environmental readings for your storage areas"
          tone="stable"
          icon={<ThermometerSnowflake size={15} strokeWidth={1.7} aria-hidden />}
        />
      </StatGrid>

      {/* ---------------- Environmental monitoring ---------------- */}
      {/* §40 — these readings carry the provider's provenance, and the SIMULATION
          badge travels with them so they can never be mistaken for a live feed. */}
      <AdminBlock
        title="Environmental monitoring"
        description="Current conditions recorded for the zones holding your stock."
        aside={<ProvenanceBadge simulated={portal.simulated} compact />}
        className="mb-8"
      >
        {portal.telemetry.length === 0 ? (
          <EmptyState
            title="No monitored zones"
            detail="Once stock is received into a chamber, its environmental readings appear here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {portal.telemetry.map((zone) => (
              <div key={zone.zoneId} className="tj-panel frost-edge rounded-[3px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[0.5625rem] tracking-[0.2em] text-glow uppercase">
                      Zone {zone.code}
                    </p>
                    <p className="mt-1 truncate font-display text-[0.8125rem] font-bold tracking-[0.02em] text-frost uppercase">
                      {zone.name}
                    </p>
                  </div>
                  <StatusPill value={zone.health} domain="health" compact />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="tj-label">Temperature</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-ice tabular-nums">
                      {formatTemperature(zone.temperatureC)}
                    </dd>
                  </div>
                  <div>
                    <dt className="tj-label">Humidity</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-frost tabular-nums">
                      {zone.humidityPercent === null ? "—" : `${zone.humidityPercent}%`}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3.5 flex items-center gap-2 border-t border-hull-line/60 pt-3 font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
                  <Snowflake size={11} strokeWidth={1.8} aria-hidden className="text-ice" />
                  {zone.monitoringActive ? "Monitoring active" : "Monitoring inactive"}
                  <span aria-hidden className="text-hull-line">·</span>
                  {formatDateTime(zone.recordedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </AdminBlock>

      {/* ---------------- Inventory ---------------- */}
      <AdminBlock
        title="Inventory"
        description="Batches currently held against your account."
        className="mb-8"
      >
        <DataTable<InventoryItemView>
          rows={portal.inventory}
          rowKey={(item) => item.id}
          caption="Inventory batches held for this account"
          empty={
            <EmptyState
              title="No stock on record"
              detail="Batches appear here once they are received into the facility."
            />
          }
          columns={
            [
              {
                key: "batch",
                header: "Batch",
                render: (item) => (
                  <span className="font-mono text-[0.75rem] text-ice">{item.batchReference}</span>
                ),
              },
              {
                key: "product",
                header: "Product",
                render: (item) => (
                  <span className="text-[0.8125rem] text-frost">{item.productName}</span>
                ),
              },
              {
                key: "category",
                header: "Category",
                hideBelow: "md",
                render: (item) => (
                  <span className="font-mono text-[0.625rem] tracking-[0.1em] text-silver-dim uppercase">
                    {humaniseEnum(item.category)}
                  </span>
                ),
              },
              {
                key: "zone",
                header: "Zone",
                hideBelow: "sm",
                render: (item) => (
                  <span className="font-mono text-[0.75rem] text-silver">
                    {item.zoneCode ?? "—"}
                    {item.locationCode ? ` · ${item.locationCode}` : ""}
                  </span>
                ),
              },
              {
                key: "quantity",
                header: "Quantity",
                align: "right",
                render: (item) => (
                  <span className="font-mono text-[0.8125rem] text-frost tabular-nums">
                    {formatNumber(item.quantity)} {item.unit.toLowerCase()}
                  </span>
                ),
              },
              {
                key: "setpoint",
                header: "Set point",
                align: "right",
                hideBelow: "lg",
                // §45 — a null set point means it was never confirmed, not zero.
                render: (item) => (
                  <span className="font-mono text-[0.75rem] text-silver tabular-nums">
                    {formatTemperature(item.setpointC)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusPill value={item.status} domain="inventory" compact />,
              },
              {
                key: "received",
                header: "Received",
                hideBelow: "lg",
                render: (item) => (
                  <span className="font-mono text-[0.6875rem] text-silver-dim">
                    {formatDate(item.receivedAt)}
                  </span>
                ),
              },
            ] satisfies Column<InventoryItemView>[]
          }
        />
      </AdminBlock>

      {/* ---------------- Storage requests ---------------- */}
      <AdminBlock
        title="Storage requests"
        description="Enquiries you have submitted and where each one stands."
        className="mb-8"
      >
        <DataTable<InquiryView>
          rows={portal.requests}
          rowKey={(request) => request.id}
          caption="Storage requests submitted by this account"
          empty={
            <EmptyState
              title="No requests yet"
              detail="Submit a storage requirement and it will appear here with its reference."
            />
          }
          columns={
            [
              {
                key: "reference",
                header: "Reference",
                render: (request) => (
                  <span className="font-mono text-[0.75rem] text-ice">{request.reference}</span>
                ),
              },
              {
                key: "category",
                header: "Category",
                hideBelow: "sm",
                render: (request) => (
                  <span className="font-mono text-[0.625rem] tracking-[0.1em] text-silver-dim uppercase">
                    {request.category ? humaniseEnum(request.category) : "—"}
                  </span>
                ),
              },
              {
                key: "quantity",
                header: "Quantity",
                align: "right",
                hideBelow: "md",
                render: (request) => (
                  <span className="font-mono text-[0.75rem] text-frost tabular-nums">
                    {request.quantity === null
                      ? "—"
                      : `${formatNumber(request.quantity)} ${(request.unit ?? "").toLowerCase()}`}
                  </span>
                ),
              },
              {
                key: "duration",
                header: "Duration",
                align: "right",
                hideBelow: "lg",
                render: (request) => (
                  <span className="font-mono text-[0.75rem] text-silver tabular-nums">
                    {request.storageDurationDays === null
                      ? "—"
                      : `${formatNumber(request.storageDurationDays)} days`}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (request) => (
                  <StatusPill
                    value={request.status}
                    domain="inquiry"
                    compact
                    pulse={request.status === "NEW" || request.status === "CONTACTED"}
                  />
                ),
              },
              {
                key: "submitted",
                header: "Submitted",
                hideBelow: "sm",
                render: (request) => (
                  <span className="font-mono text-[0.6875rem] text-silver-dim">
                    {formatDate(request.createdAt)}
                  </span>
                ),
              },
            ] satisfies Column<InquiryView>[]
          }
        />
      </AdminBlock>

      {/* ---------------- Leases + gate passes ---------------- */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <AdminBlock
          title="Storage agreements"
          description="Positions held under agreement."
        >
          <DataTable<LeaseView>
            rows={portal.leases}
            rowKey={(lease) => lease.id}
            caption="Storage agreements for this account"
            dense
            empty={
              <EmptyState
                title="No agreements on record"
                detail="Agreed storage positions appear here once confirmed."
              />
            }
            columns={
              [
                {
                  key: "reference",
                  header: "Reference",
                  render: (lease) => (
                    <span className="font-mono text-[0.75rem] text-ice">{lease.reference}</span>
                  ),
                },
                {
                  key: "zone",
                  header: "Zone",
                  render: (lease) => (
                    <span className="font-mono text-[0.75rem] text-silver">
                      {lease.zoneCode ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "positions",
                  header: "Positions",
                  align: "right",
                  render: (lease) => (
                    <span className="font-mono text-[0.75rem] text-frost tabular-nums">
                      {formatNumber(lease.palletPositions)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (lease) => (
                    <StatusPill value={lease.status} domain="contract" compact />
                  ),
                },
              ] satisfies Column<LeaseView>[]
            }
          />
        </AdminBlock>

        <AdminBlock
          title="Gate passes"
          description="Vehicles authorised to collect or deliver against your account."
        >
          <DataTable<GatePassView>
            rows={portal.gatePasses}
            rowKey={(pass) => pass.id}
            caption="Gate passes issued for this account"
            dense
            empty={
              <EmptyState
                title="No gate passes"
                detail="Passes appear here when a collection or delivery is authorised."
              />
            }
            columns={
              [
                {
                  key: "reference",
                  header: "Reference",
                  render: (pass) => (
                    <span className="font-mono text-[0.75rem] text-ice">{pass.reference}</span>
                  ),
                },
                {
                  key: "direction",
                  header: "Direction",
                  render: (pass) => (
                    <span className="flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.1em] text-silver uppercase">
                      <Truck size={12} strokeWidth={1.8} aria-hidden className="text-silver-dim" />
                      {humaniseEnum(pass.direction)}
                    </span>
                  ),
                },
                {
                  key: "vehicle",
                  header: "Vehicle",
                  hideBelow: "sm",
                  render: (pass) => (
                    <span className="font-mono text-[0.75rem] text-silver">
                      {pass.vehicleRegistration ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "valid",
                  header: "Valid from",
                  hideBelow: "md",
                  render: (pass) => (
                    <span className="font-mono text-[0.6875rem] text-silver-dim">
                      {formatDate(pass.validFrom)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (pass) => <StatusPill value={pass.status} compact />,
                },
              ] satisfies Column<GatePassView>[]
            }
          />
        </AdminBlock>
      </div>

      {/* ---------------- Documents + invoices ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminBlock
          title="Documents"
          description="Records issued against your account."
        >
          <DataTable<DocumentView>
            rows={portal.documents}
            rowKey={(document) => document.id}
            caption="Documents for this account"
            dense
            empty={
              <EmptyState
                title="No documents"
                detail="Storage records and certificates appear here as they are issued."
              />
            }
            columns={
              [
                {
                  key: "title",
                  header: "Document",
                  render: (document) => (
                    <span className="text-[0.8125rem] text-frost">{document.title}</span>
                  ),
                },
                {
                  key: "type",
                  header: "Type",
                  hideBelow: "sm",
                  render: (document) => (
                    <span className="font-mono text-[0.625rem] tracking-[0.1em] text-silver-dim uppercase">
                      {humaniseEnum(document.type)}
                    </span>
                  ),
                },
                {
                  key: "issued",
                  header: "Issued",
                  hideBelow: "md",
                  render: (document) => (
                    <span className="font-mono text-[0.6875rem] text-silver-dim">
                      {formatDate(document.createdAt)}
                    </span>
                  ),
                },
              ] satisfies Column<DocumentView>[]
            }
          />
        </AdminBlock>

        <AdminBlock
          title="Invoices"
          description="Billing records. Amounts are confirmed per agreement."
        >
          <DataTable<InvoiceView>
            rows={portal.invoices}
            rowKey={(invoice) => invoice.id}
            caption="Invoices for this account"
            dense
            empty={
              <EmptyState
                title="No invoices"
                detail="Invoices appear here once storage has been billed."
              />
            }
            columns={
              [
                {
                  key: "reference",
                  header: "Reference",
                  render: (invoice) => (
                    <span className="font-mono text-[0.75rem] text-ice">{invoice.reference}</span>
                  ),
                },
                {
                  key: "period",
                  header: "Period",
                  hideBelow: "sm",
                  render: (invoice) => (
                    <span className="font-mono text-[0.75rem] text-silver">{invoice.period}</span>
                  ),
                },
                {
                  key: "amount",
                  header: "Amount",
                  align: "right",
                  // §25 — no pricing rule has been supplied, so no figure is shown.
                  render: (invoice) => (
                    <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-silver-dim uppercase">
                      {invoice.amount === null
                        ? FALLBACK.pricing
                        : `${formatNumber(invoice.amount)} ${invoice.currency}`}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (invoice) => <StatusPill value={invoice.status} compact />,
                },
              ] satisfies Column<InvoiceView>[]
            }
          />
        </AdminBlock>
      </div>
    </>
  );
}
