"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CircleAlert, MapPin, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import {
  HoneypotField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { contactSchema, type ContactInput, type ContactPayload } from "@/lib/validation/inquiry";
import { siteConfig } from "@/lib/site";
import type { InquiryResponse } from "@/types/api";
import { cn } from "@/lib/utilities/cn";

/**
 * CONTACT FORM (§26)
 * ---------------------------------------------------------------------------
 * Posts to the SAME /api/inquiries endpoint as the storage request form, with
 * `source: "WEBSITE"` and the subject folded into the message. That is a
 * deliberate choice: one validated contract, one rate limiter, one abuse filter,
 * one notification path and one audit trail, rather than a second pipeline that
 * has to be kept in step with the first (§41).
 *
 * §39 states are identical to the inquiry form — PROCESSING… / REQUEST RECEIVED
 * + reference / a plain-language failure that never stays silent.
 */

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ reference: string; persisted: boolean; caveat?: string } | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput, unknown, ContactPayload>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      website: "",
    },
  });

  const registerField = (name: keyof ContactInput) =>
    register(name as never) as unknown as Record<string, unknown>;

  useEffect(() => {
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
          name: payload.name,
          company: payload.company,
          email: payload.email,
          phone: payload.phone,
          // The subject travels inside the message so one schema serves both
          // forms. It is the first line, which is where a reader looks for it.
          message: `Subject: ${payload.subject}\n\n${payload.message}`,
          productDescription: null,
          website: payload.website,
          formStartedAt: startedAtRef.current,
          source: "WEBSITE",
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
        return;
      }

      if (data.fieldErrors) {
        for (const [field, messages] of Object.entries(data.fieldErrors)) {
          const message = messages?.[0];
          // The server names its fields after the inquiry schema; map the one
          // that differs back onto this form's `message` field.
          if (message) setError((field === "message" ? "message" : field) as never, { type: "server", message });
        }
      }

      setStatus("error");
      setServerMessage(data.message);
    } catch {
      setStatus("error");
      setServerMessage("We couldn't complete your request. Please try again.");
    }
  });

  /* ------------------------------------------------------------ success --- */
  if (status === "success" && result) {
    return (
      <div role="status" aria-live="polite" className="tj-panel tj-corners rounded-[2px] p-7 sm:p-9">
        <span className="flex size-12 items-center justify-center rounded-[2px] border border-stable/45 bg-stable/12 text-stable">
          <Check size={22} strokeWidth={2.2} aria-hidden />
        </span>

        <p className="tj-label tj-label-glow mt-6">Request received</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-frost uppercase">
          Message sent
        </h2>

        <p className="mt-5 border-y border-hull-line/70 py-4">
          <span className="tj-label block">Reference</span>
          <span className="tabular mt-1.5 block font-mono text-2xl font-semibold tracking-[0.06em] text-glow">
            {result.reference}
          </span>
        </p>

        <p className="mt-5 text-sm leading-relaxed text-silver">
          Keep this reference — quoting it will let the team find your message
          immediately.
        </p>

        {!result.persisted ? (
          <p className="mt-4 flex items-start gap-2.5 border-l-2 border-caution/50 bg-caution/[0.06] py-3 pl-3 pr-4 text-[0.8125rem] leading-relaxed text-caution/90">
            <CircleAlert size={15} strokeWidth={1.8} aria-hidden className="mt-0.5 shrink-0" />
            {result.caveat ?? "Delivered to the team but not stored in the system."}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setStatus("idle");
          }}
          className="mt-7 inline-flex items-center gap-2 rounded-[2px] border border-hull-line px-4 py-2.5 font-mono text-[0.5625rem] tracking-[0.16em] text-silver uppercase transition-colors duration-300 hover:border-glow/45 hover:text-glow"
        >
          <RotateCcw size={13} strokeWidth={1.8} aria-hidden />
          Send another message
        </button>
      </div>
    );
  }

  /* --------------------------------------------------------------- form --- */
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="tj-panel tj-corners rounded-[2px] p-6 sm:p-8"
      aria-busy={status === "submitting"}
    >
      <HoneypotField registerProps={registerField("website")} />

      <div className="grid gap-5 sm:grid-cols-2">
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
          registerProps={registerField("phone")}
        />
        <TextField
          label="Subject"
          name="subject"
          required
          placeholder="What is this about"
          error={errors.subject}
          className="sm:col-span-2"
          registerProps={registerField("subject")}
        />
        <TextAreaField
          label="Message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder="Tell us what you need."
          error={errors.message}
          className="sm:col-span-2"
          registerProps={registerField("message")}
        />
      </div>

      {status === "error" ? (
        <div role="alert" className="mt-6 flex items-start gap-3 border border-alert/45 bg-alert/[0.07] p-4">
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

      <div className="mt-7 flex flex-col gap-4 border-t border-hull-line/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
          <MapPin size={12} strokeWidth={1.7} aria-hidden className="mt-px shrink-0" />
          {siteConfig.location.facility}, {siteConfig.location.city}
        </p>

        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "group inline-flex items-center justify-center gap-2.5 rounded-[2px] px-7 py-3.5",
            "font-display text-[0.8125rem] font-bold tracking-[0.14em] uppercase",
            "bg-glow text-midnight shadow-[0_10px_30px_-12px_rgba(0,245,212,0.8)]",
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "hover:bg-ice active:scale-[0.985]",
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
              Send message
              <ArrowRight size={16} strokeWidth={2} aria-hidden className="transition-transform duration-500 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>

      <div aria-live="polite" className="sr-only">
        {status === "submitting"
          ? "Sending your message."
          : status === "error"
            ? (serverMessage ?? "We couldn't complete your request.")
            : ""}
      </div>
    </form>
  );
}
