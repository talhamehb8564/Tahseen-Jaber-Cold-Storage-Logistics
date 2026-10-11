"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utilities/cn";
import { siteConfig } from "@/lib/site";

/**
 * WHATSAPP HAND-OFF (§25, §31, §45)
 * ---------------------------------------------------------------------------
 * The "send this inquiry on WhatsApp" action beside the lease calculator.
 *
 * §45 IS THE CONSTRAINT THAT SHAPES THIS COMPONENT. The business has not
 * supplied a WhatsApp number, and inventing one would send a real visitor's
 * enquiry to a stranger's phone. So the number is read from `siteConfig` and the
 * component has exactly two honest behaviours:
 *
 *   NUMBER SUPPLIED  → a real `https://wa.me/<number>?text=…` deep link that
 *                      opens WhatsApp with the requirement already written out.
 *                      Nothing else changes when the client confirms the number;
 *                      this branch goes live on its own.
 *
 *   NUMBER ABSENT    → the same button, routed to `/request-storage` with the
 *                      requirement carried across in the query string, and a
 *                      visible line saying the WhatsApp channel is pending
 *                      confirmation. The visitor is never told a channel exists
 *                      when it does not, and never handed a fabricated number.
 *
 * The requirement is encoded into the URL either way, so switching channels
 * costs the visitor nothing — they do not retype it.
 */

interface WhatsappCtaProps {
  /** Plain-language summary of the requirement, built from visitor input. */
  message: string;
  /** Key/value pairs carried to the inquiry form when WhatsApp is unavailable. */
  carry?: Record<string, string | number | boolean | null | undefined>;
  disabled?: boolean;
  className?: string;
}

/** Digits only, with a leading zero dropped — wa.me wants an E.164-ish body. */
function normaliseNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "").replace(/^0+/, "");
}

export function WhatsappCta({ message, carry, disabled, className }: WhatsappCtaProps) {
  const configured = siteConfig.contact.whatsapp?.trim() || null;
  const number = configured ? normaliseNumber(configured) : "";
  const available = Boolean(number);

  const shared = cn(
    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden",
    "rounded-[2px] px-5 py-3.5 text-center",
    "font-display text-[0.75rem] font-bold tracking-[0.14em] uppercase",
    "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2",
    "focus-visible:ring-offset-midnight focus-visible:outline-none",
    disabled && "pointer-events-none opacity-40",
    available
      ? "border border-glow/50 bg-glow/12 text-glow backdrop-blur-md hover:bg-glow hover:text-midnight hover:shadow-[0_0_30px_rgba(0,245,212,0.45)] active:scale-[0.985]"
      : "border border-hull-line bg-midnight/40 text-silver backdrop-blur-md hover:border-ice/50 hover:text-ice",
    className,
  );

  const icon = (
    <MessageCircle
      size={16}
      strokeWidth={2}
      aria-hidden
      className="shrink-0 transition-transform duration-500 group-hover:scale-110"
    />
  );

  /* ---------------- WhatsApp is configured: deep link ---------------- */
  if (available) {
    return (
      <a
        href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={shared}
        aria-label="Send this inquiry on WhatsApp (opens in a new tab)"
      >
        {icon}
        Send inquiry on WhatsApp
      </a>
    );
  }

  /* ---------------- Not configured: carry it to the form -------------- */
  const params = new URLSearchParams();
  if (carry) {
    for (const [key, value] of Object.entries(carry)) {
      if (value === null || value === undefined || value === "") continue;
      params.set(key, String(value));
    }
  }
  const query = params.toString();

  return (
    <div className={cn("flex flex-col gap-2", disabled && "opacity-40")}>
      <Link
        href={`/request-storage${query ? `?${query}` : ""}`}
        className={shared}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={(event) => {
          if (disabled) event.preventDefault();
        }}
      >
        {icon}
        Send inquiry
      </Link>
      {/* §45 — state the gap plainly instead of implying a live channel. */}
      <p className="max-w-xs font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
        WhatsApp line pending confirmation — your requirement opens in the
        inquiry form instead.
      </p>
    </div>
  );
}
