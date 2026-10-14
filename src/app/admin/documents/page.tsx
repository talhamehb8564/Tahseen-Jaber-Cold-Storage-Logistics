import type { Metadata } from "next";
import { FileText, Paperclip } from "lucide-react";

import { AdminBlock, AdminPageHeader, EmptyState, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { getDataProvider } from "@/lib/data";
import { formatDate, humaniseEnum } from "@/lib/utilities/format";

export const metadata: Metadata = { title: "Documents" };

/**
 * /admin/documents (§28)
 * ---------------------------------------------------------------------------
 * The document register: contracts, invoices, gate passes, certificates,
 * photographs and reports.
 *
 * WHY THERE IS NO UPLOAD OR DOWNLOAD HERE YET
 *   Documents are pointers into object storage — the schema stores a `storageKey`,
 *   not bytes, and nothing in this deployment has an object store configured. So
 *   this screen lists the register and states plainly that no storage backend is
 *   connected. Rendering a download button that 404s, or an upload form that
 *   silently discards the file, would both be worse (§39: no silent failures).
 */
export default async function AdminDocumentsPage() {
  const provider = await getDataProvider();

  // The provider exposes documents through the portal snapshot; the admin view
  // aggregates across clients. Where no client context exists it returns the
  // full register.
  const portal = await provider.getClientPortal("");
  const documents = portal.documents;

  const byType = documents.reduce<Record<string, number>>((accumulator, document) => {
    accumulator[document.type] = (accumulator[document.type] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <>
      <AdminPageHeader
        title="Documents"
        simulated={documents[0]?.simulated ?? true}
        description="Contracts, invoices, gate passes, certificates and reports held against clients and consignments."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard label="Documents" value={documents.length} tone="glow" icon={<FileText size={15} strokeWidth={1.6} aria-hidden />} />
        <StatCard label="Types" value={Object.keys(byType).length} />
        <StatCard
          label="Total size"
          value={
            documents.some((document) => document.sizeBytes != null)
              ? formatBytes(documents.reduce((total, document) => total + (document.sizeBytes ?? 0), 0))
              : "—"
          }
          unavailable={!documents.some((document) => document.sizeBytes != null)}
          unavailableLabel="Not recorded"
        />
        <StatCard label="Storage backend" value="None" tone="caution" hint="Object storage not configured" />
      </StatGrid>

      <AdminBlock
        title="Register"
        description="Metadata only — file bytes live in object storage, which is not connected in this environment."
      >
        {documents.length === 0 ? (
          <EmptyState
            icon={<Paperclip size={22} strokeWidth={1.5} aria-hidden />}
            title="No documents recorded"
            detail="Documents appear here once they are attached to a client, contract, inquiry or consignment."
          />
        ) : (
          <ul className="tj-panel divide-y divide-hull-line/50 overflow-hidden rounded-[2px]">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-hull-line bg-midnight/50 text-silver-dim">
                  <FileText size={15} strokeWidth={1.6} aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.875rem] text-frost">{document.title}</span>
                  <span className="mt-0.5 block truncate font-mono text-[0.5625rem] tracking-[0.08em] text-silver-dim">
                    {document.filename}
                    {document.sizeBytes != null ? ` · ${formatBytes(document.sizeBytes)}` : ""}
                  </span>
                </span>

                <span className="shrink-0 rounded-[2px] border border-hull-line px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.14em] text-silver uppercase">
                  {humaniseEnum(document.type)}
                </span>

                <span className="tabular shrink-0 font-mono text-[0.5625rem] text-silver-dim">
                  {formatDate(document.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminBlock>

      <div className="tj-panel mt-7 rounded-[2px] border-caution/25 p-5">
        <p className="font-mono text-[0.625rem] font-semibold tracking-[0.16em] text-caution uppercase">
          Storage backend not connected
        </p>
        <p className="mt-3 max-w-3xl text-[0.875rem] leading-relaxed text-silver">
          Upload and download are not available because no object store is
          configured. The schema stores a pointer (<code className="font-mono text-[0.8125rem] text-frost">storage_key</code>)
          rather than file bytes, so connecting S3-compatible storage later needs no
          schema change — set the bucket credentials and the register becomes
          actionable.
        </p>
      </div>
    </>
  );
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
