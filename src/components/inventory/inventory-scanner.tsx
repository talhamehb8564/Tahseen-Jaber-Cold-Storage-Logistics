"use client";

import { Check, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProvenanceBadge, ProvenanceNote } from "@/components/ui/provenance-badge";
import { StatusPill } from "@/components/ui/status-pill";
import type { InventoryItemView } from "@/lib/data/types";
import { useReducedMotion } from "@/hooks";
import { formatDate } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

/**
 * INVENTORY SCANNER (§22)
 * ---------------------------------------------------------------------------
 * A WMS-style verification bay. Select a batch, the scanner head travels the
 * barcode, and the item is verified. Alongside it, the stock list renders in the
 * tabular form an operator would recognise: batch, product, zone, quantity,
 * status, tracking.
 *
 * §22 CONSTRAINT
 *   This is a visual demonstration. No barcode hardware or WMS is connected, so
 *   the panel says so explicitly rather than implying a scan actually happened.
 *   The same component renders real rows unchanged once the provider is live —
 *   only the badge and the note flip (§40).
 */

type ScanState = "idle" | "scanning" | "verified";

interface InventoryScannerProps {
  items: readonly InventoryItemView[];
  simulated: boolean;
}

export function InventoryScanner({ items, simulated }: InventoryScannerProps) {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? "");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const timers = useRef<number[]>([]);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  // Clear any pending timers on unmount so a route change cannot setState late.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!selected) return;

    // Reset, then run the scan. Reduced motion skips straight to verified.
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    if (reduced) {
      setScanState("verified");
      return;
    }

    setScanState("idle");
    timers.current.push(window.setTimeout(() => setScanState("scanning"), 140));
    timers.current.push(window.setTimeout(() => setScanState("verified"), 1900));
  }, [selectedId, reduced, selected]);

  if (!selected) {
    return (
      <p className="tj-panel rounded-[2px] p-8 text-center font-mono text-xs tracking-[0.14em] text-silver-dim uppercase">
        No inventory records available
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8">
      {/* ---------------- Scan bay ---------------- */}
      <div className="tj-panel tj-corners relative overflow-hidden rounded-[2px] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tj-label tj-label-glow flex items-center gap-2">
              <ScanLine size={13} strokeWidth={1.7} aria-hidden />
              Verification bay
            </p>
            <p className="tabular mt-2 font-mono text-2xl font-semibold tracking-tight text-frost">
              {selected.batchReference}
            </p>
          </div>
          <ProvenanceBadge simulated={simulated} />
        </div>

        {/* --- Barcode + travelling scan head --- */}
        <div className="relative mt-7 overflow-hidden rounded-[2px] border border-hull-line/70 bg-midnight/70 px-5 py-7">
          <Barcode value={selected.batchReference} />

          {/* Scan head */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-3 top-0 h-full",
              scanState === "scanning" && !reduced && "tj-scan-active",
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-glow shadow-[0_0_14px_2px_rgba(182,106,60,0.65)]" />
            <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(to_bottom,rgba(182,106,60,0.20),transparent)]" />
          </div>

          {/* Verified stamp */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center",
              "transition-opacity duration-500",
              scanState === "verified" ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="flex items-center gap-2.5 border border-stable/50 bg-midnight/88 px-4 py-2.5 backdrop-blur-sm">
              <Check size={16} strokeWidth={2.4} className="text-stable" aria-hidden />
              <span className="font-mono text-[0.6875rem] font-semibold tracking-[0.2em] text-stable uppercase">
                Item verified
              </span>
            </span>
          </div>
        </div>

        {/* --- Verified record --- */}
        <dl className="mt-6 divide-y divide-hull-line/60 border-y border-hull-line/60">
          <RecordRow label="Product" value={selected.productName} />
          <RecordRow label="Category" value={selected.category.replace("_", " & ")} />
          <RecordRow label="Zone" value={selected.zoneCode ?? "—"} />
          <RecordRow
            label="Location"
            value={selected.locationCode ?? "—"}
            mono
          />
          <RecordRow
            label="Quantity"
            value={`${selected.quantity} ${selected.unit.toLowerCase()}`}
            mono
          />
          <RecordRow
            label="Status"
            value={<StatusPill value={selected.status} domain="inventory" />}
          />
          <RecordRow
            label="Tracking"
            value={
              <span
                className={cn(
                  "flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.12em] uppercase",
                  selected.trackingActive ? "text-stable" : "text-silver-dim",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    selected.trackingActive ? "bg-stable" : "bg-silver-dim",
                  )}
                  aria-hidden
                />
                {selected.trackingActive ? "Active" : "Closed"}
              </span>
            }
          />
          <RecordRow label="Received" value={formatDate(selected.receivedAt)} />
        </dl>

        <ProvenanceNote simulated={simulated} className="mt-5">
          Demonstration of the verification interface. No barcode hardware or
          warehouse management system is connected, so this scan is illustrative.
        </ProvenanceNote>

        {/* Local keyframes for the scan head, scoped to this component. */}
        <style>{`
          @keyframes tj-scan-travel {
            0%   { transform: translateY(-10%); opacity: 0; }
            12%  { opacity: 1; }
            88%  { opacity: 1; }
            100% { transform: translateY(105%); opacity: 0; }
          }
          .tj-scan-active { animation: tj-scan-travel 1.7s cubic-bezier(0.65,0,0.35,1) 1; }
          @media (prefers-reduced-motion: reduce) {
            .tj-scan-active { animation: none !important; }
          }
        `}</style>
      </div>

      {/* ---------------- Stock list ---------------- */}
      <div className="tj-panel rounded-[2px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 border-b border-hull-line/70 px-2 pb-3">
          <p className="tj-label">Stock on hand</p>
          <p className="tabular font-mono text-[0.625rem] tracking-[0.12em] text-silver-dim uppercase">
            {items.length} {items.length === 1 ? "batch" : "batches"}
          </p>
        </div>

        {/* Header row */}
        <div className="hidden grid-cols-[7.5rem_minmax(0,1fr)_5rem_6.5rem_7.5rem] gap-3 px-2 pt-3 pb-2 sm:grid">
          {["Batch", "Product", "Zone", "Qty", "Status"].map((heading) => (
            <span key={heading} className="tj-label">
              {heading}
            </span>
          ))}
        </div>

        <ul className="mt-1 max-h-[34rem] space-y-0.5 overflow-y-auto pr-1">
          {items.map((item) => {
            const isActive = item.id === selected.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-current={isActive}
                  className={cn(
                    "grid w-full grid-cols-1 gap-1 rounded-[2px] border px-3 py-3 text-left transition-all duration-300 sm:grid-cols-[7.5rem_minmax(0,1fr)_5rem_6.5rem_7.5rem] sm:items-center sm:gap-3",
                    isActive
                      ? "border-glow/45 bg-glow/[0.07]"
                      : "border-transparent hover:border-hull-line hover:bg-hull/35",
                  )}
                >
                  <span
                    className={cn(
                      "tabular font-mono text-[0.75rem] font-medium",
                      isActive ? "text-glow" : "text-frost",
                    )}
                  >
                    {item.batchReference}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] text-silver">
                      {item.productName}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim/75 uppercase sm:hidden">
                      {item.zoneCode ?? "—"} · {item.quantity} {item.unit.toLowerCase()}
                    </span>
                  </span>

                  <span className="hidden font-mono text-[0.6875rem] tracking-[0.1em] text-silver-dim uppercase sm:block">
                    {item.zoneCode ?? "—"}
                  </span>

                  <span className="tabular hidden font-mono text-[0.6875rem] text-silver sm:block">
                    {item.quantity}
                  </span>

                  <span className="hidden sm:block">
                    <StatusPill value={item.status} domain="inventory" compact />
                  </span>
                  <span className="sm:hidden">
                    <StatusPill value={item.status} domain="inventory" compact />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   BARCODE — deterministic bar widths derived from the reference string, so the
   same batch always renders the same symbol (server and client agree).
   -------------------------------------------------------------------------- */
function Barcode({ value }: { value: string }) {
  const bars: { x: number; w: number }[] = [];
  let cursor = 0;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    // Quiet zone + a group of bars per character.
    for (let bar = 0; bar < 4; bar += 1) {
      const width = 1 + ((code + bar * 7) % 3);
      bars.push({ x: cursor, w: width });
      cursor += width + 1 + ((code + bar * 3) % 3);
    }
  }

  const totalWidth = cursor;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 56`}
      className="h-16 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Barcode for batch ${value}`}
    >
      <g fill="#0f141c">
        {bars.map((bar, index) => (
          <rect key={index} x={bar.x} y="0" width={bar.w} height="44" />
        ))}
      </g>
      <text
        x={totalWidth / 2}
        y="55"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="9"
        letterSpacing="3"
        fill="#64778d"
      >
        {value}
      </text>
    </svg>
  );
}

function RecordRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="tj-label shrink-0">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right text-[0.8125rem] text-frost",
          mono && "tabular font-mono text-[0.75rem] tracking-[0.06em]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
