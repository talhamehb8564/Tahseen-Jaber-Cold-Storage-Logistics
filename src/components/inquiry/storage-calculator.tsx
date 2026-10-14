"use client";

import { WhatsappCta } from "@/components/inquiry/whatsapp-cta";
import { ArrowRight, Calculator, Layers, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { CatalogIcon } from "@/components/ui/catalog-icon";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { productCategories } from "@/lib/catalog";
import { FALLBACK } from "@/lib/site";
import { formatTemperature } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

/**
 * STORAGE CALCULATOR (§25)
 * ---------------------------------------------------------------------------
 * Public — no login, no gate. The visitor builds a requirement and the system
 * turns it into a quote request.
 *
 * §25 CONSTRAINT, AND WHY THERE IS NO NUMBER ON THE OUTPUT
 *   Pricing rules have not been supplied by the business. A calculator that
 *   invents a rate would be fabricating a commercial claim, so the price row
 *   prints "REQUEST A CUSTOM QUOTE" and nothing else. What the calculator *can*
 *   legitimately compute is the shape of the requirement — quantity, unit,
 *   duration, set point, footprint — and that is what it visualises. It is still
 *   satisfying to use, because the pallet field fills as you type, but every
 *   figure on screen is derived from the visitor's own input rather than from an
 *   invented tariff.
 *
 * On "Continue" the requirement is handed to the inquiry form as prefill, so the
 * submission path stays single and the server contract is unchanged (§41).
 */

type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

interface Requirement {
  productCategory: string;
  quantity: string;
  /** Narrowed to the real unit union so it drops straight into InquiryInput. */
  unit: UnitValue;
  storageDurationDays: string;
  setpointC: number | null;
  needsTransport: boolean;
  notes: string;
}

const EMPTY: Requirement = {
  productCategory: "",
  quantity: "",
  unit: "PALLET",
  storageDurationDays: "",
  setpointC: null,
  needsTransport: false,
  notes: "",
};

const UNIT_OPTIONS = [
  { value: "PALLET", label: "Pallets", noun: "pallet" },
  { value: "TONNE", label: "Tonnes", noun: "tonne" },
  { value: "KILOGRAM", label: "Kilograms", noun: "kg" },
  { value: "CARTON", label: "Cartons", noun: "carton" },
  { value: "BOX", label: "Boxes", noun: "box" },
  { value: "UNIT", label: "Units", noun: "unit" },
] as const;

const DURATION_OPTIONS = [
  { value: "7", label: "Up to a week" },
  { value: "30", label: "Up to a month" },
  { value: "90", label: "1–3 months" },
  { value: "180", label: "3–6 months" },
  { value: "365", label: "6–12 months" },
  { value: "730", label: "Over a year" },
] as const;

const SETPOINT_OPTIONS = [
  { value: 4, label: "Chilled", detail: "Above freezing" },
  { value: -1, label: "Sub-zero", detail: "Just below freezing" },
  { value: -18, label: "Frozen", detail: "Standard frozen holding" },
  { value: -25, label: "Deep frozen", detail: "Extended frozen holding" },
  { value: null, label: "To be agreed", detail: "Confirmed per product" },
] as const;

export function StorageCalculator() {
  const [requirement, setRequirement] = useState<Requirement>(EMPTY);
  const [stage, setStage] = useState<"build" | "submit">("build");

  const set = <K extends keyof Requirement>(key: K, value: Requirement[K]) =>
    setRequirement((current) => ({ ...current, [key]: value }));

  const quantity = Number(requirement.quantity);
  const quantityValid = Number.isFinite(quantity) && quantity > 0;

  const category = productCategories.find(
    (item) => item.id === requirement.productCategory,
  );

  const duration = DURATION_OPTIONS.find(
    (option) => option.value === requirement.storageDurationDays,
  );

  const setpoint = SETPOINT_OPTIONS.find(
    (option) => String(option.value) === String(requirement.setpointC),
  );

  // How complete the requirement is, for the progress readout.
  const completeness = useMemo(() => {
    const checks = [
      Boolean(requirement.productCategory),
      quantityValid,
      Boolean(requirement.storageDurationDays),
      requirement.setpointC !== null || requirement.setpointC === null, // always resolvable
      true,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [requirement, quantityValid]);

  const readyToSubmit =
    Boolean(requirement.productCategory) && quantityValid && Boolean(requirement.storageDurationDays);

  /**
   * The requirement written out in plain language, so the visitor never has to
   * retype it whichever channel they leave by (§25 hand-off).
   */
  const handoffMessage = useMemo(() => {
    const lines = [
      "*Cold storage requirement — Tahseen Jaber*",
      category ? `Category: ${category.name}` : null,
      quantityValid
        ? `Quantity: ${requirement.quantity} ${UNIT_OPTIONS.find((o) => o.value === requirement.unit)?.label ?? requirement.unit}`
        : null,
      duration ? `Duration: ${duration.label}` : null,
      setpoint ? `Set point: ${setpoint.label}${setpoint.detail ? ` (${setpoint.detail})` : ""}` : null,
      requirement.needsTransport ? "Transport: collection or delivery required" : null,
      requirement.notes.trim() ? `Notes: ${requirement.notes.trim()}` : null,
      "Pricing: to be quoted per requirement.",
    ].filter(Boolean);
    return lines.join("\n");
  }, [category, duration, quantityValid, requirement, setpoint]);

  /* ---------------------------------------------------------- submit stage -- */
  if (stage === "submit") {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
        <RequirementSummary requirement={requirement} quantityValid={quantityValid} />

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="tj-label tj-label-glow">Contact details</p>
            <button
              type="button"
              onClick={() => setStage("build")}
              className="inline-flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase transition-colors duration-300 hover:text-ice"
            >
              <RotateCcw size={12} strokeWidth={1.8} aria-hidden />
              Edit requirement
            </button>
          </div>

          <InquiryForm
            source="CALCULATOR"
            compact
            initialValues={{
              productCategory: requirement.productCategory,
              quantity: requirement.quantity,
              unit: requirement.unit,
              storageDurationDays: requirement.storageDurationDays,
              needsTransport: requirement.needsTransport,
              productDescription: requirement.notes || undefined,
              message: buildMessage(requirement),
            }}
            onSuccess={() => setStage("build")}
          />
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ build stage -- */
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
      {/* ---------------- Inputs ---------------- */}
      <div className="tj-panel tj-corners rounded-[2px] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tj-label tj-label-glow flex items-center gap-2">
              <Calculator size={13} strokeWidth={1.7} aria-hidden />
              Build your requirement
            </p>
            <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.01em] text-frost uppercase sm:text-2xl">
              Storage calculator
            </h3>
          </div>
          <span className="tabular shrink-0 rounded-[2px] border border-hull-line bg-midnight/50 px-2.5 py-1.5 font-mono text-[0.625rem] text-silver-dim">
            {completeness}%
          </span>
        </div>

        <div className="mt-7 space-y-6">
          {/* --- Product type --- */}
          <fieldset>
            <legend className="tj-label mb-3">Product type</legend>
            <div className="grid grid-cols-2 gap-2">
              {productCategories.map((item) => {
                const selected = item.id === requirement.productCategory;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => set("productCategory", item.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[2px] border px-3 py-3 text-left transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      selected
                        ? "border-glow/50 bg-glow/[0.09] text-frost"
                        : "border-hull-line text-silver hover:border-hull-raised hover:bg-hull/30",
                    )}
                  >
                    <span style={{ color: item.accent }} aria-hidden>
                      <CatalogIcon name={item.icon} size={17} strokeWidth={1.5} />
                    </span>
                    <span className="font-mono text-[0.5625rem] leading-tight tracking-[0.12em] uppercase">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* --- Quantity + unit --- */}
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <label className="block">
              <span className="tj-label mb-2 block">Quantity</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={requirement.quantity}
                onChange={(event) => set("quantity", event.target.value)}
                placeholder="0"
                className={cn(
                  "tabular w-full rounded-[2px] border bg-midnight/60 px-3.5 py-3 font-mono text-sm text-frost transition-colors duration-300",
                  "placeholder:text-silver-dim/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/35",
                  requirement.quantity && !quantityValid
                    ? "border-alert/70"
                    : "border-hull-line hover:border-hull-raised focus:border-glow/70",
                )}
              />
            </label>

            <label className="block">
              <span className="tj-label mb-2 block">Unit</span>
              <div className="relative">
                <select
                  value={requirement.unit}
                  onChange={(event) => {
                    // Narrow to the real union rather than casting blindly.
                    const next = UNIT_OPTIONS.find(
                      (option) => option.value === event.target.value,
                    );
                    if (next) set("unit", next.value);
                  }}
                  className="w-full appearance-none rounded-[2px] border border-hull-line bg-midnight/60 px-3.5 py-3 pr-9 font-mono text-[0.6875rem] tracking-[0.1em] text-frost uppercase transition-colors duration-300 hover:border-hull-raised focus:border-glow/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/35"
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden
                  viewBox="0 0 12 8"
                  className="pointer-events-none absolute top-1/2 right-3 w-3 -translate-y-1/2 text-silver-dim"
                >
                  <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
            </label>
          </div>

          {/* --- Duration --- */}
          <fieldset>
            <legend className="tj-label mb-3">Storage duration</legend>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option) => {
                const selected = option.value === requirement.storageDurationDays;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set("storageDurationDays", option.value)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-[2px] border px-3 py-2 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-all duration-400",
                      selected
                        ? "border-glow/50 bg-glow/[0.09] text-frost"
                        : "border-hull-line text-silver-dim hover:border-hull-raised hover:text-silver",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* --- Set point --- */}
          <fieldset>
            <legend className="tj-label mb-3">Target temperature</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SETPOINT_OPTIONS.map((option) => {
                const selected = String(option.value) === String(requirement.setpointC);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => set("setpointC", option.value)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-baseline justify-between gap-3 rounded-[2px] border px-3.5 py-2.5 text-left transition-all duration-400",
                      selected
                        ? "border-glow/50 bg-glow/[0.09]"
                        : "border-hull-line hover:border-hull-raised",
                    )}
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block font-mono text-[0.625rem] tracking-[0.14em] uppercase",
                          selected ? "text-frost" : "text-silver",
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.6875rem] text-silver-dim">
                        {option.detail}
                      </span>
                    </span>
                    <span className="tabular shrink-0 font-mono text-[0.6875rem] text-ice">
                      {option.value === null ? "TBC" : formatTemperature(option.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* --- Transport --- */}
          <label className="flex cursor-pointer items-start gap-3 rounded-[2px] border border-hull-line bg-midnight/40 p-4 transition-colors duration-300 hover:border-hull-raised">
            <input
              type="checkbox"
              checked={requirement.needsTransport}
              onChange={(event) => set("needsTransport", event.target.checked)}
              className="peer mt-0.5 size-[18px] shrink-0 cursor-pointer appearance-none rounded-[2px] border border-hull-line bg-midnight/60 transition-colors duration-300 checked:border-glow checked:bg-glow/20 focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none"
            />
            <span className="min-w-0">
              <span className="block text-sm text-frost">Collection or delivery required</span>
              <span className="mt-1 block text-[0.75rem] leading-relaxed text-silver-dim">
                {FALLBACK.coverage} — service area is confirmed per request.
              </span>
            </span>
          </label>

          {/* --- Notes --- */}
          <label className="block">
            <span className="tj-label mb-2 block">
              Handling notes <span className="normal-case opacity-60">optional</span>
            </span>
            <textarea
              rows={3}
              value={requirement.notes}
              onChange={(event) => set("notes", event.target.value.slice(0, 400))}
              placeholder="Packaging, access needs, unusual handling…"
              className="w-full resize-y rounded-[2px] border border-hull-line bg-midnight/60 px-3.5 py-3 text-sm leading-relaxed text-frost transition-colors duration-300 placeholder:text-silver-dim/55 hover:border-hull-raised focus:border-glow/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/35"
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-hull-line/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
            No account needed
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {/* WhatsApp hand-off — §45: honest about the channel's state. */}
            <WhatsappCta
              message={handoffMessage}
              disabled={!readyToSubmit}
              carry={{
                product: requirement.productCategory,
                quantity: requirement.quantity,
                unit: requirement.unit,
                duration: requirement.storageDurationDays,
                notes: requirement.notes,
              }}
            />
          <button
            type="button"
            disabled={!readyToSubmit}
            onClick={() => setStage("submit")}
            className={cn(
              "group inline-flex items-center justify-center gap-2.5 rounded-[2px] px-6 py-3.5",
              "font-display text-[0.8125rem] font-bold tracking-[0.14em] uppercase",
              "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              readyToSubmit
                ? "bg-glow text-midnight shadow-[0_10px_30px_-12px_rgba(182,106,60,0.8)] hover:bg-ice active:scale-[0.985]"
                : "cursor-not-allowed border border-hull-line bg-transparent text-silver-dim",
              "focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none",
            )}
          >
            Request a custom quote
            <ArrowRight
              size={16}
              strokeWidth={2}
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </button>
          </div>
        </div>
      </div>

      {/* ---------------- Live summary ---------------- */}
      <RequirementSummary requirement={requirement} quantityValid={quantityValid} />
    </div>
  );
}

/* ==========================================================================
   REQUIREMENT SUMMARY
   Everything here is derived from the visitor's own input. The only line the
   business must supply — price — is explicitly deferred (§25).
   ========================================================================== */
function RequirementSummary({
  requirement,
  quantityValid,
}: {
  requirement: Requirement;
  quantityValid: boolean;
}) {
  const category = productCategories.find((item) => item.id === requirement.productCategory);
  const duration = DURATION_OPTIONS.find((option) => option.value === requirement.storageDurationDays);
  const unit = UNIT_OPTIONS.find((option) => option.value === requirement.unit);
  const setpoint = SETPOINT_OPTIONS.find(
    (option) => String(option.value) === String(requirement.setpointC),
  );

  const quantity = Number(requirement.quantity);
  const slots = quantityValid ? Math.min(96, Math.ceil(quantity)) : 0;

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="tj-panel tj-corners relative overflow-hidden rounded-[2px] p-6 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-700"
          style={{
            background: category
              ? `radial-gradient(80% 55% at 50% 0%, ${category.accent}1A, transparent 70%)`
              : "radial-gradient(80% 55% at 50% 0%, rgba(182,106,60,0.10), transparent 70%)",
          }}
        />

        <div className="relative">
          <p className="tj-label tj-label-glow">Requirement summary</p>

          {/* Footprint visualisation — one slot per unit, capped for legibility */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="tj-label flex items-center gap-2">
                <Layers size={12} strokeWidth={1.7} aria-hidden />
                Footprint
              </span>
              <span className="tabular font-mono text-[0.625rem] text-silver-dim">
                {quantityValid
                  ? `${quantity.toLocaleString("en-US")} ${unit?.noun ?? ""}${quantity > 96 ? " · showing first 96" : ""}`
                  : "awaiting quantity"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-16 gap-[3px]" aria-hidden>
              {Array.from({ length: 96 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "aspect-square rounded-[1px] border transition-all duration-500",
                    index < slots
                      ? "border-glow/55 bg-glow/28"
                      : "border-hull-line/70 bg-midnight/45",
                  )}
                  style={{ transitionDelay: `${Math.min(index, 40) * 6}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Spec rows */}
          <dl className="mt-6 divide-y divide-hull-line/60 border-y border-hull-line/60">
            <SummaryRow label="Product" value={category?.name ?? "—"} accent={category?.accent} />
            <SummaryRow
              label="Quantity"
              value={quantityValid ? `${quantity.toLocaleString("en-US")} ${unit?.label ?? ""}` : "—"}
            />
            <SummaryRow label="Duration" value={duration?.label ?? "—"} />
            <SummaryRow
              label="Target temperature"
              value={
                setpoint
                  ? setpoint.value === null
                    ? FALLBACK.temperature
                    : `${setpoint.label} · ${formatTemperature(setpoint.value)}`
                  : FALLBACK.temperature
              }
            />
            <SummaryRow
              label="Transport"
              value={requirement.needsTransport ? "Required" : "Not required"}
            />

            {/* §25 — the row that must never carry an invented number. */}
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="tj-label">Estimated price</dt>
              <dd className="text-right">
                <span className="block font-mono text-[0.6875rem] font-semibold tracking-[0.14em] text-caution uppercase">
                  {FALLBACK.pricing}
                </span>
                <span className="mt-1 block text-[0.6875rem] leading-relaxed text-silver-dim">
                  Quoted per requirement
                </span>
              </dd>
            </div>
          </dl>

          <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/80 uppercase">
            Published rates have not been supplied for this facility, so no figure
            is estimated here. Submitting sends the requirement above to the team
            for a written quote.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="tj-label shrink-0">{label}</dt>
      <dd
        className="min-w-0 truncate text-right font-mono text-[0.6875rem] tracking-[0.08em] uppercase"
        style={{ color: accent ?? (value === "—" ? "#64778d" : "#122033") }}
      >
        {value}
      </dd>
    </div>
  );
}

/** Folds the requirement into a message so the admin email is self-contained. */
function buildMessage(requirement: Requirement): string {
  const category = productCategories.find((item) => item.id === requirement.productCategory);
  const duration = DURATION_OPTIONS.find((option) => option.value === requirement.storageDurationDays);
  const unit = UNIT_OPTIONS.find((option) => option.value === requirement.unit);
  const setpoint = SETPOINT_OPTIONS.find(
    (option) => String(option.value) === String(requirement.setpointC),
  );

  const lines = [
    "Requirement built with the storage calculator:",
    `Product: ${category?.name ?? "—"}`,
    `Quantity: ${requirement.quantity || "—"} ${unit?.label ?? ""}`.trim(),
    `Duration: ${duration?.label ?? "—"}`,
    `Target temperature: ${setpoint ? (setpoint.value === null ? "to be agreed" : `${setpoint.label} (${formatTemperature(setpoint.value)})`) : "to be agreed"}`,
    `Transport: ${requirement.needsTransport ? "required" : "not required"}`,
  ];

  if (requirement.notes.trim()) {
    lines.push("", "Handling notes:", requirement.notes.trim());
  }

  return lines.join("\n");
}
