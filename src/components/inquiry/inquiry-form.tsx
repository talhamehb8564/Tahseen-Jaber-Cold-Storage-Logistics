"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CircleAlert, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import {
  CheckboxField,
  HoneypotField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { Cta } from "@/components/ui/cta";
import { PRODUCT_CATEGORY_IDS, UNITS, inquirySchema, type InquiryInput, type InquiryPayload } from "@/lib/validation/inquiry";
import { productCategories } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";
import type { InquiryResponse } from "@/types/api";
import { cn } from "@/lib/utilities/cn";

/**
 * STORAGE INQUIRY FORM (§26, §39)
 * ---------------------------------------------------------------------------
 * Collects Name, Company, Email, Phone, Product, Quantity, Storage duration and
 * Message; posts to /api/inquiries; renders exactly the three states §39 names.
 *
 *   loading → "PROCESSING…"
 *   success → "REQUEST RECEIVED" + "REFERENCE: TJ-XXXXX"
 *   error   → "WE COULDN'T COMPLETE YOUR REQUEST. PLEASE TRY AGAIN."
 *
 * The same schema validates here and on the server. Client validation is a
 * courtesy — the server parse is the control (§38).
 *
 * §31 — if the request could be delivered but not stored, the response carries a
 * `caveat` and this form shows it rather than quietly claiming a clean success.
 */

const CATEGORY_OPTIONS = productCategories.map((category) => ({
  value: category.id,
  label: category.name,
}));

const UNIT_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "PALLET", label: "Pallets" },
  { value: "TONNE", label: "Tonnes" },
  { value: "KILOGRAM", label: "Kilograms" },
  { value: "CARTON", label: "Cartons" },
  { value: "BOX", label: "Boxes" },
  { value: "UNIT", label: "Units" },
];

const DURATION_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "7", label: "Up to a week" },
  { value: "30", label: "Up to a month" },
  { value: "90", label: "1–3 months" },
  { value: "180", label: "3–6 months" },
  { value: "365", label: "6–12 months" },
  { value: "730", label: "Over a year" },
];

type FormStatus = "idle" | "submitting" | "success" | "error";

export function InquiryForm({
  source = "WEBSITE",
  compact = false,
  initialValues,
  onSuccess,
}: {
  source?: InquiryInput["source"];
  compact?: boolean;
  /** Prefill from another surface — e.g. the storage calculator (§25). */
  initialValues?: Partial<InquiryInput>;
  onSuccess?: (reference: string) => void;
}) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [result, setResult] = useState<
    { reference: string; persisted: boolean; caveat?: string } | null
  >(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InquiryInput, unknown, InquiryPayload>({
    resolver: zodResolver(inquirySchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      productCategory: "",
      productDescription: "",
      quantity: "",
      unit: "",
      storageDurationDays: "",
      message: "",
      needsTransport: false,
      website: "",
      source,
      ...initialValues,
    },
  });

  const registerField = (name: keyof InquiryInput) =>
    register(name as never) as unknown as Record<string, unknown>;

  useEffect(() => {
    // Re-arm the timing challenge after every submission.
    startedAtRef.current = Date.now();
  }, [status]);

  const onSubmit = handleSubmit(async (payload) => {
    setStatus("submitting");
    setServerMessage(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          formStartedAt: startedAtRef.current,
          source,
        }),
      });

      const data = (await response.json().catch(() => null)) as InquiryResponse | null;

      if (!data) {
        setStatus("error");
        setServerMessage("We couldn't complete your request. Please try again.");
        return;
      }

      if (data.ok) {
        setResult({
          reference: data.reference,
          persisted: data.persisted,
          caveat: data.caveat,
        });
        setStatus("success");
        reset();
        startedAtRef.current = Date.now();
        onSuccess?.(data.reference);
        return;
      }

      // Field-level messages go straight back onto their inputs.
      if (data.fieldErrors) {
        for (const [field, messages] of Object.entries(data.fieldErrors)) {
          const message = messages?.[0];
          if (message) setError(field as never, { type: "server", message });
        }
      }

      setStatus("error");
      setServerMessage(data.message);
    } catch {
      // Network failure — §39 forbids a silent one.
      setStatus("error");
      setServerMessage("We couldn't complete your request. Please try again.");
    }
  });

  /* ------------------------------------------------------- success state --- */
  if (status === "success" && result) {
    return (
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        className="tj-panel tj-corners relative overflow-hidden rounded-[2px] p-7 sm:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 0%, rgba(34,197,94,0.14), transparent 70%)",
          }}
        />
        <div className="relative">
          <span className="flex size-12 items-center justify-center rounded-[2px] border border-stable/45 bg-stable/12 text-stable">
            <Check size={22} strokeWidth={2.2} aria-hidden />
          </span>

          <p className="tj-label tj-label-glow mt-6">Request received</p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-frost uppercase sm:text-3xl">
            Thank you
          </h3>

          <p className="mt-5 border-y border-hull-line/70 py-4">
            <span className="tj-label block">Reference</span>
            <span className="tabular mt-1.5 block font-mono text-2xl font-semibold tracking-[0.06em] text-glow sm:text-3xl">
              {result.reference}
            </span>
          </p>

          <p className="mt-5 text-sm leading-relaxed text-silver">
            Keep this reference — quoting it will let the team find your request
            immediately. {siteConfig.brand.shortName} will respond to arrange the
            details of your requirement.
          </p>

          {/* §31 — an honest caveat when the record could not be stored. */}
          {!result.persisted ? (
            <p className="mt-4 flex items-start gap-2.5 border-l-2 border-caution/50 bg-caution/[0.06] py-3 pl-3 pr-4 text-[0.8125rem] leading-relaxed text-caution/90">
              <CircleAlert size={15} strokeWidth={1.8} aria-hidden className="mt-0.5 shrink-0" />
              {result.caveat ??
                "This request was delivered to the team but could not be stored in the system."}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Cta
              variant="secondary"
              size="sm"
              magnetic={false}
              onClick={() => {
                setResult(null);
                setStatus("idle");
              }}
            >
              <RotateCcw size={14} strokeWidth={1.8} aria-hidden />
              Submit another request
            </Cta>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- the form --- */
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="tj-panel tj-corners relative rounded-[2px] p-6 sm:p-8"
      aria-busy={status === "submitting"}
    >
      {/* §38 — honeypot, invisible to people */}
      <HoneypotField registerProps={registerField("website")} />
      <input type="hidden" {...register("formStartedAt")} value={startedAtRef.current} readOnly />

      <div className={cn("grid gap-5", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <TextField
          label="Full name"
          name="name"
          required
          autoComplete="name"
          placeholder="Your name"
          error={errors.name}
          registerProps={registerField("name")}
        />
        <TextField
          label="Company"
          name="company"
          autoComplete="organization"
          placeholder="Company or organisation"
          error={errors.company}
          registerProps={registerField("company")}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          placeholder="name@company.com"
          error={errors.email}
          registerProps={registerField("email")}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+964 …"
          error={errors.phone}
          hint="Include the country code if you would like a call back."
          registerProps={registerField("phone")}
        />

        <SelectField
          label="Product type"
          name="productCategory"
          options={CATEGORY_OPTIONS}
          error={errors.productCategory}
          registerProps={registerField("productCategory")}
        />
        <TextField
          label="Product description"
          name="productDescription"
          placeholder="What exactly needs storing"
          error={errors.productDescription}
          className="sm:col-span-1"
          registerProps={registerField("productDescription")}
        />

        <TextField
          label="Quantity"
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="0"
          error={errors.quantity}
          registerProps={registerField("quantity")}
        />
        <SelectField
          label="Unit"
          name="unit"
          options={UNIT_OPTIONS}
          error={errors.unit}
          registerProps={registerField("unit")}
        />

        <SelectField
          label="Storage duration"
          name="storageDurationDays"
          options={DURATION_OPTIONS}
          error={errors.storageDurationDays}
          hint="Pricing is quoted per requirement rather than published."
          registerProps={registerField("storageDurationDays")}
        />
        <CheckboxField
          name="needsTransport"
          text="Collection or delivery required"
          hint={
            siteConfig.capabilities.deliveryCoverage
              ? undefined
              : "Coverage is confirmed per request."
          }
          error={errors.needsTransport}
          registerProps={registerField("needsTransport")}
          className="self-end pb-3"
        />

        <TextAreaField
          label="Message"
          name="message"
          rows={5}
          maxLength={4000}
          placeholder="Tell us about the requirement — volumes, timing, handling or anything unusual."
          error={errors.message}
          className="sm:col-span-2"
          registerProps={registerField("message")}
        />
      </div>

      {/* --- Error state (§39) --- */}
      {status === "error" ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-alert/45 bg-alert/[0.07] p-4"
        >
          <CircleAlert size={17} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0 text-alert" />
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] font-semibold tracking-[0.14em] text-alert uppercase">
              We couldn't complete your request
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-silver">
              {serverMessage ?? "Please try again."}
            </p>
          </div>
        </div>
      ) : null}

      {/* --- Actions --- */}
      <div className="mt-7 flex flex-col gap-4 border-t border-hull-line/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
          Details are used only to respond to this request.
        </p>

        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-[2px] px-7 py-3.5",
            "font-display text-[0.8125rem] font-bold tracking-[0.14em] uppercase",
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "bg-glow text-midnight shadow-[0_10px_30px_-12px_rgba(182,106,60,0.8)]",
            "hover:bg-ice hover:shadow-[0_14px_40px_-12px_rgba(126,62,34,0.9)]",
            "active:scale-[0.985]",
            "focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {status === "submitting" ? (
            <>
              <span
                aria-hidden
                className="size-3.5 animate-spin rounded-full border-2 border-midnight/35 border-t-midnight"
              />
              Processing…
            </>
          ) : (
            <>
              Request storage
              <ArrowRight
                size={16}
                strokeWidth={2}
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>

      {/* Live region so screen readers hear the state change (§37). */}
      <div ref={liveRegionRef} aria-live="polite" className="sr-only">
        {status === "submitting"
          ? "Processing your request."
          : status === "error"
            ? (serverMessage ?? "We couldn't complete your request.")
            : ""}
      </div>
    </form>
  );
}

export { PRODUCT_CATEGORY_IDS, UNITS };
