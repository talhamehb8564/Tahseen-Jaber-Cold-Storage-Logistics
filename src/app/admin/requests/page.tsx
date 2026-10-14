import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Mail, Phone, Search } from "lucide-react";

import { InquiryStatusControl } from "@/components/admin/inquiry-status-control";
import {
  AdminBlock,
  AdminPageHeader,
  EmptyState,
  StatCard,
  StatGrid,
} from "@/components/admin/admin-ui";
import { StatusPill } from "@/components/ui/status-pill";
import { getDataProvider } from "@/lib/data";
import type { InquiryView } from "@/lib/data/types";
import { formatDate, humaniseEnum } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Storage Requests" };

/**
 * /admin/requests (§28)
 * ---------------------------------------------------------------------------
 * Every storage inquiry with the NEW → CONTACTED → QUOTED → APPROVED / REJECTED →
 * COMPLETED workflow.
 *
 * Filtering runs through `searchParams` rather than client state, so a filtered
 * view is a shareable URL and the server renders the correct rows on first paint
 * — no flash of an unfiltered list while hydration catches up (§35).
 */

const FILTERS = [
  { value: "all", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUOTED", label: "Quoted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
] as const;

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = FILTERS.some((filter) => filter.value === params.status)
    ? params.status!
    : "all";
  const query = (params.q ?? "").trim().slice(0, 120);

  const provider = await getDataProvider();
  const inquiries = await provider.getInquiries({
    status: statusFilter === "all" ? undefined : (statusFilter as InquiryView["status"]),
    limit: 200,
    search: query || undefined,
  });

  // Counts for the summary come from the unfiltered set so the badges stay stable
  // while a filter is applied.
  const all =
    statusFilter === "all" && !query
      ? inquiries
      : await provider.getInquiries({ limit: 500 });

  const counts = all.reduce<Record<string, number>>((accumulator, inquiry) => {
    accumulator[inquiry.status] = (accumulator[inquiry.status] ?? 0) + 1;
    return accumulator;
  }, {});

  const simulated = inquiries[0]?.simulated ?? all[0]?.simulated ?? true;

  return (
    <>
      <AdminPageHeader
        title="Storage requests"
        simulated={simulated}
        description="Public submissions from the website and calculator. Move each one through the workflow; every change is audited against your account."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard label="New" value={counts.NEW ?? 0} tone={(counts.NEW ?? 0) > 0 ? "glow" : "default"} icon={<Inbox size={15} strokeWidth={1.6} aria-hidden />} />
        <StatCard label="In progress" value={(counts.CONTACTED ?? 0) + (counts.QUOTED ?? 0)} tone="ice" />
        <StatCard label="Approved" value={counts.APPROVED ?? 0} tone="stable" />
        <StatCard label="Rejected" value={counts.REJECTED ?? 0} tone={(counts.REJECTED ?? 0) > 0 ? "alert" : "default"} />
      </StatGrid>

      {/* ---------------- Filters ---------------- */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => {
            const active = filter.value === statusFilter;
            const href = buildHref({ status: filter.value, q: query });
            return (
              <Link
                key={filter.value}
                href={href}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "rounded-[2px] border px-3 py-2 font-mono text-[0.5rem] tracking-[0.16em] uppercase transition-all duration-300",
                  active
                    ? "border-glow/50 bg-glow/12 text-frost"
                    : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                )}
              >
                {filter.label}
                {filter.value !== "all" && (counts[filter.value] ?? 0) > 0 ? (
                  <span className="tabular ml-2 text-silver-dim">{counts[filter.value]}</span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Search is a GET form so it stays in the URL and works without JS. */}
        <form action="/admin/requests" method="get" className="relative w-full lg:w-72">
          {statusFilter !== "all" ? (
            <input type="hidden" name="status" value={statusFilter} />
          ) : null}
          <Search
            size={14}
            strokeWidth={1.7}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-silver-dim"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search reference, name, company"
            aria-label="Search requests"
            className="w-full rounded-[2px] border border-hull-line bg-midnight/60 py-2.5 pr-3 pl-9 text-[0.8125rem] text-frost transition-colors duration-300 placeholder:text-silver-dim/60 hover:border-hull-raised focus:border-glow/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/35"
          />
        </form>
      </div>

      {/* ---------------- The list ---------------- */}
      {inquiries.length === 0 ? (
        <EmptyState
          icon={<Inbox size={22} strokeWidth={1.5} aria-hidden />}
          title={query || statusFilter !== "all" ? "No matching requests" : "No requests yet"}
          detail={
            query || statusFilter !== "all"
              ? "Try a different status or clear the search."
              : "Submissions from the public website and the storage calculator appear here."
          }
          action={
            query || statusFilter !== "all" ? (
              <Link
                href="/admin/requests"
                className="inline-flex items-center rounded-[2px] border border-hull-line px-4 py-2.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver uppercase transition-colors duration-300 hover:border-glow/45 hover:text-glow"
              >
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => (
            <RequestCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </ul>
      )}
    </>
  );
}

/* --------------------------------------------------------------------------
   REQUEST CARD
   -------------------------------------------------------------------------- */

function RequestCard({ inquiry }: { inquiry: InquiryView }) {
  return (
    <li>
      <article className="tj-panel tj-corners rounded-[2px] p-5 transition-colors duration-500 hover:border-hull-raised sm:p-6">
        {/* --- Headline row --- */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tabular font-mono text-[0.9375rem] font-semibold tracking-[0.04em] text-glow">
                {inquiry.reference}
              </span>
              <StatusPill value={inquiry.status} domain="inquiry" />
              <span className="font-mono text-[0.5rem] tracking-[0.16em] text-silver-dim uppercase">
                via {humaniseEnum(inquiry.source)}
              </span>
            </div>

            <h3 className="mt-2.5 font-display text-base font-bold tracking-[-0.005em] text-frost">
              {inquiry.name}
              {inquiry.company ? (
                <span className="ml-2 font-sans text-[0.8125rem] font-normal text-silver-dim">
                  · {inquiry.company}
                </span>
              ) : null}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <a
                href={`mailto:${inquiry.email}`}
                className="flex items-center gap-1.5 font-mono text-[0.625rem] text-silver transition-colors duration-300 hover:text-ice"
              >
                <Mail size={11} strokeWidth={1.7} aria-hidden />
                {inquiry.email}
              </a>
              {inquiry.phone ? (
                <a
                  href={`tel:${inquiry.phone}`}
                  className="flex items-center gap-1.5 font-mono text-[0.625rem] text-silver transition-colors duration-300 hover:text-ice"
                >
                  <Phone size={11} strokeWidth={1.7} aria-hidden />
                  {inquiry.phone}
                </a>
              ) : null}
              <span className="tabular font-mono text-[0.625rem] text-silver-dim">
                {formatDate(inquiry.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* --- Requirement --- */}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-hull-line/60 py-4 sm:grid-cols-4">
          <Datum label="Product" value={inquiry.category ? humaniseEnum(inquiry.category) : "—"} />
          <Datum
            label="Quantity"
            value={
              inquiry.quantity != null
                ? `${inquiry.quantity}${inquiry.unit ? ` ${humaniseEnum(inquiry.unit)}` : ""}`
                : "—"
            }
          />
          <Datum
            label="Duration"
            value={
              inquiry.storageDurationDays != null ? `${inquiry.storageDurationDays} days` : "—"
            }
          />
          <Datum label="Received" value={formatDate(inquiry.createdAt)} />
        </dl>

        {inquiry.message ? (
          <div className="mt-4">
            <p className="tj-label">Message</p>
            <p className="mt-2 max-w-3xl text-[0.8125rem] leading-relaxed whitespace-pre-wrap text-silver">
              {inquiry.message}
            </p>
          </div>
        ) : null}

        {/* --- Workflow --- */}
        <div className="mt-5 border-t border-hull-line/60 pt-4">
          <InquiryStatusControl
            inquiryId={inquiry.id}
            reference={inquiry.reference}
            currentStatus={inquiry.status}
            initialNotes={inquiry.internalNotes}
          />
        </div>
      </article>
    </li>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="tj-label">{label}</dt>
      <dd className="mt-1 truncate font-mono text-[0.75rem] tracking-[0.04em] text-frost">
        {value}
      </dd>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Query-string builder that keeps the URL clean.
   -------------------------------------------------------------------------- */
function buildHref(params: { status: string; q: string }): string {
  const search = new URLSearchParams();
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `/admin/requests?${query}` : "/admin/requests";
}
