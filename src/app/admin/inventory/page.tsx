import type { Metadata } from "next";
import { Boxes, Search } from "lucide-react";

import {
  AdminPageHeader,
  DataTable,
  EmptyState,
  StatCard,
  StatGrid,
  type Column,
} from "@/components/admin/admin-ui";
import { StatusPill } from "@/components/ui/status-pill";
import { getDataProvider } from "@/lib/data";
import type { InventoryItemView } from "@/lib/data/types";
import { formatDate, formatTemperature, humaniseEnum } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Inventory" };

/**
 * /admin/inventory (§28)
 * ---------------------------------------------------------------------------
 * Every batch in the building: reference, product, zone, location, quantity,
 * status and the client it belongs to. Filterable by status and searchable by
 * batch reference or product, through `searchParams` so the view is shareable.
 */

const STATUS_FILTERS = [
  "all",
  "IN_STORAGE",
  "RECEIVED",
  "RESERVED",
  "PICKING",
  "IN_TRANSIT",
  "ON_HOLD",
  "DISPATCHED",
] as const;

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (STATUS_FILTERS as readonly string[]).includes(params.status ?? "")
    ? params.status!
    : "all";
  const query = (params.q ?? "").trim().slice(0, 120).toLowerCase();

  const provider = await getDataProvider();
  const snapshot = await provider.getInventorySnapshot();

  const filtered = snapshot.items.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesQuery =
      !query ||
      item.batchReference.toLowerCase().includes(query) ||
      item.productName.toLowerCase().includes(query) ||
      (item.clientName ?? "").toLowerCase().includes(query) ||
      (item.zoneCode ?? "").toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const columns: readonly Column<InventoryItemView>[] = [
    {
      key: "batch",
      header: "Batch",
      render: (item) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.75rem] font-medium text-glow">
          {item.batchReference}
        </span>
      ),
    },
    {
      key: "product",
      header: "Product",
      render: (item) => (
        <span className="min-w-0">
          <span className="block truncate text-[0.8125rem] text-frost">{item.productName}</span>
          <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
            {humaniseEnum(item.category)}
          </span>
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      hideBelow: "lg",
      render: (item) => (
        <span className="block max-w-[12rem] truncate text-[0.8125rem] text-silver">
          {item.clientName ?? "—"}
        </span>
      ),
    },
    {
      key: "zone",
      header: "Zone",
      render: (item) => (
        <span className="min-w-0">
          <span className="block font-mono text-[0.6875rem] tracking-[0.08em] text-silver uppercase">
            {item.zoneCode ?? "—"}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[0.5rem] tracking-[0.08em] text-silver-dim">
            {item.locationCode ?? "no location"}
          </span>
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      align: "right",
      render: (item) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.75rem] text-frost">
          {item.quantity.toLocaleString("en-US")}
          <span className="ml-1 text-[0.5rem] tracking-[0.1em] text-silver-dim uppercase">
            {humaniseEnum(item.unit)}
          </span>
        </span>
      ),
    },
    {
      key: "setpoint",
      header: "Set point",
      align: "right",
      hideBelow: "md",
      render: (item) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.6875rem] text-ice">
          {formatTemperature(item.setpointC, "—")}
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
      align: "right",
      hideBelow: "lg",
      render: (item) => (
        <span className="tabular whitespace-nowrap font-mono text-[0.625rem] text-silver-dim">
          {formatDate(item.receivedAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        simulated={snapshot.simulated}
        description="Every batch currently recorded in the facility, with its zone, location and status."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard label="Batches" value={snapshot.totalBatches} tone="glow" icon={<Boxes size={15} strokeWidth={1.6} aria-hidden />} />
        <StatCard label="Pallets held" value={snapshot.totalPallets} tone="ice" />
        <StatCard label="Categories" value={snapshot.byCategory.length} />
        <StatCard
          label="On hold"
          value={snapshot.byStatus.find((entry) => entry.status === "ON_HOLD")?.count ?? 0}
          tone={
            (snapshot.byStatus.find((entry) => entry.status === "ON_HOLD")?.count ?? 0) > 0
              ? "caution"
              : "default"
          }
        />
      </StatGrid>

      {/* ---------------- Distribution ---------------- */}
      <div className="mb-7 grid gap-3 lg:grid-cols-2">
        <div className="tj-panel rounded-[2px] p-5">
          <p className="tj-label">By category</p>
          <ul className="mt-4 space-y-2.5">
            {snapshot.byCategory.map((entry) => (
              <DistributionRow
                key={entry.category}
                label={humaniseEnum(entry.category)}
                count={entry.count}
                total={Math.max(1, snapshot.totalBatches)}
              />
            ))}
          </ul>
        </div>

        <div className="tj-panel rounded-[2px] p-5">
          <p className="tj-label">By status</p>
          <ul className="mt-4 space-y-2.5">
            {snapshot.byStatus.map((entry) => (
              <DistributionRow
                key={entry.status}
                label={humaniseEnum(entry.status)}
                count={entry.count}
                total={Math.max(1, snapshot.totalBatches)}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* ---------------- Filters ---------------- */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => {
            const active = filter === statusFilter;
            const search = new URLSearchParams();
            if (filter !== "all") search.set("status", filter);
            if (query) search.set("q", params.q ?? "");
            const href = search.toString() ? `/admin/inventory?${search}` : "/admin/inventory";

            return (
              <a
                key={filter}
                href={href}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "rounded-[2px] border px-3 py-2 font-mono text-[0.5rem] tracking-[0.14em] uppercase transition-all duration-300",
                  active
                    ? "border-glow/50 bg-glow/12 text-frost"
                    : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                )}
              >
                {filter === "all" ? "All" : humaniseEnum(filter)}
              </a>
            );
          })}
        </div>

        <form action="/admin/inventory" method="get" className="relative w-full lg:w-72">
          {statusFilter !== "all" ? <input type="hidden" name="status" value={statusFilter} /> : null}
          <Search size={14} strokeWidth={1.7} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-silver-dim" />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search batch, product, client, zone"
            aria-label="Search inventory"
            className="w-full rounded-[2px] border border-hull-line bg-midnight/60 py-2.5 pr-3 pl-9 text-[0.8125rem] text-frost transition-colors duration-300 placeholder:text-silver-dim/60 hover:border-hull-raised focus:border-glow/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/35"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Boxes size={22} strokeWidth={1.5} aria-hidden />}
          title="No batches match"
          detail="Adjust the status filter or clear the search."
        />
      ) : (
        <DataTable<InventoryItemView>
          rows={filtered}
          columns={columns}
          rowKey={(item) => item.id}
          dense
          caption="Inventory batches"
        />
      )}
    </>
  );
}

function DistributionRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const percent = Math.round((count / total) * 100);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[0.5625rem] tracking-[0.14em] text-silver uppercase">
          {label}
        </span>
        <span className="tabular font-mono text-[0.6875rem] text-frost">
          {count}
          <span className="ml-1.5 text-[0.5rem] text-silver-dim">{percent}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-hull-line/55">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ice to-glow transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  );
}
