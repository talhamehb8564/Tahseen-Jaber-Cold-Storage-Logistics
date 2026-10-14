"use client";

import { Check, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { CatalogIcon } from "@/components/ui/catalog-icon";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { productCategories, type ProductCategory } from "@/lib/catalog";
import { FALLBACK } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

/**
 * PRODUCT VAULT (§19, §20)
 * ---------------------------------------------------------------------------
 * Four interactive environments. Selecting a category expands its panel, swaps
 * the ambient artwork, re-tints the local lighting and opens the information
 * panel — the environment *is* the category, not a card with a label on it.
 *
 * §19 / §45 CONSTRAINTS
 *   - No storage temperature is asserted. The temperature row prints the
 *     configured fallback ("CLIENT CONFIGURED"), because approved ranges have
 *     not been supplied.
 *   - No medical-grade or regulatory compliance claim is made for
 *     pharmaceuticals. The category carries an explicit `complianceNote` that is
 *     rendered verbatim instead.
 *
 * ACCESSIBILITY (§37)
 *   Built as a disclosure group, not a hover toy: every panel is a real button
 *   with aria-expanded/aria-controls, works from the keyboard, and on touch
 *   devices the hover interaction becomes a tap (§34). Hover only *previews* on
 *   fine-pointer devices; the click is what commits.
 */

export function ProductVault() {
  const [activeId, setActiveId] = useState<string>(productCategories[0]?.id ?? "produce");
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Hover previews on pointer devices; tap commits everywhere.
  const shownId = previewId ?? activeId;
  const shown = productCategories.find((category) => category.id === shownId) ?? productCategories[0]!;

  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="relative border-b border-hull-line/60 py-24 sm:py-32"
    >
      {/* Local lighting responds to the selected category (§20). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: 0.55,
          background: `radial-gradient(70% 55% at 50% 42%, ${shown.wash}, transparent 72%)`,
        }}
      />

      <div className="relative mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12">
        <header className="max-w-3xl">
          <p className="tj-eyebrow">
            <span className="text-silver-dim">04</span> Products
          </p>
          <h2
            id="products-heading"
            className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)] font-bold tracking-[-0.035em] uppercase"
          >
            Four environments,
            <br />
            <span className="tj-frost-text">one cold chain</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-silver sm:text-lg">
            Each category is held in conditions suited to it, and each is handled
            against its own batch record. Select a category to open its
            environment.
          </p>
        </header>

        {/* ---------------- The vault ---------------- */}
        <div className="mt-14 flex flex-col gap-3 lg:h-[34rem] lg:flex-row">
          {productCategories.map((category) => {
            const isActive = category.id === shownId;
            const isCommitted = category.id === activeId;

            return (
              <article
                key={category.id}
                className={cn(
                  "group relative overflow-hidden rounded-[2px] border transition-[flex-grow,border-color,background-color]",
                  "duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "lg:min-w-0",
                  isActive
                    ? "border-glow/35 lg:flex-[3.4]"
                    : "border-hull-line/80 hover:border-hull-raised lg:flex-[1]",
                )}
                style={{
                  backgroundColor: isActive
                    ? `color-mix(in oklab, ${category.accent} 9%, #f5f7fa)`
                    : "rgba(255,255,255,0.62)",
                  backdropFilter: isActive ? undefined : "blur(10px)",
                  boxShadow: isActive
                    ? `0 0 40px color-mix(in oklab, ${category.accent} 18%, transparent), inset 0 1px 0 0 rgba(233,243,255,0.10)`
                    : "inset 0 1px 0 0 rgba(233,243,255,0.05)",
                }}
                onMouseEnter={() => setPreviewId(category.id)}
                onMouseLeave={() => setPreviewId(null)}
              >
                {/* Category ambient artwork */}
                <ProductEnvironment category={category} active={isActive} />

                {/* Trigger */}
                <h3>
                  <button
                    type="button"
                    onClick={() => setActiveId(category.id)}
                    aria-expanded={isCommitted}
                    aria-controls={`product-panel-${category.id}`}
                    className="absolute inset-0 z-20 flex w-full cursor-pointer flex-col justify-between p-5 text-left sm:p-6"
                    data-cursor={isActive ? "inspect" : "explore"}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-[2px] border transition-all duration-700",
                          isActive ? "scale-100" : "scale-95",
                        )}
                        style={{
                          borderColor: `${category.accent}${isActive ? "66" : "33"}`,
                          backgroundColor: `${category.accent}${isActive ? "1F" : "0D"}`,
                          color: category.accent,
                        }}
                      >
                        <CatalogIcon name={category.icon} size={20} strokeWidth={1.5} />
                      </span>

                      {/* Expand affordance — vertical on desktop, +/- on mobile */}
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-500 lg:hidden",
                          isCommitted ? "border-glow/50 text-glow" : "border-hull-line text-silver-dim",
                        )}
                        aria-hidden
                      >
                        {isCommitted ? <Minus size={14} /> : <Plus size={14} />}
                      </span>

                      {/* Collapsed vertical label (desktop only) */}
                      <span
                        aria-hidden
                        className={cn(
                          "hidden origin-top font-display text-lg font-bold tracking-[0.06em] whitespace-nowrap uppercase lg:block",
                          "transition-opacity duration-500",
                          isActive ? "opacity-0" : "text-silver",
                        )}
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg) translateX(-0.35rem)",
                        }}
                      >
                        {category.name}
                      </span>
                    </span>

                    <span
                      className={cn(
                        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                      )}
                    >
                      <span className="font-display text-xl font-bold tracking-[-0.01em] text-frost uppercase sm:text-2xl">
                        {category.name}
                      </span>
                    </span>
                  </button>
                </h3>

                {/* Information panel (§20) */}
                <div
                  id={`product-panel-${category.id}`}
                  role="region"
                  aria-label={`${category.name} storage detail`}
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 transition-all sm:p-6",
                    "duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isActive
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-6 opacity-0",
                  )}
                >
                  <div className="pointer-events-auto max-w-lg">
                    <p
                      className="font-mono text-[0.5625rem] tracking-[0.22em] uppercase"
                      style={{ color: category.accent }}
                    >
                      {category.environment}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-silver sm:text-[0.9375rem]">
                      {category.summary}
                    </p>

                    {/* Instrument rows — §20's example layout */}
                    <dl className="mt-5 divide-y divide-hull-line/60 border-y border-hull-line/60">
                      <InstrumentRow
                        label="Temperature"
                        value={category.temperatureLabel}
                        accent={category.accent}
                      />
                      <InstrumentRow label="Monitoring" value="AVAILABLE" accent={category.accent} />
                      <InstrumentRow label="Storage" value="SECURE" accent={category.accent} />
                    </dl>

                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {category.handling.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-[0.8125rem] leading-snug text-silver-dim">
                          <Check
                            size={13}
                            strokeWidth={2}
                            aria-hidden
                            className="mt-0.5 shrink-0"
                            style={{ color: category.accent }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* §19 — compliance guard for pharmaceuticals */}
                    {category.complianceNote ? (
                      <p className="mt-5 border-l border-caution/40 bg-caution/[0.06] py-2 pl-3 pr-3 font-mono text-[0.5625rem] leading-relaxed tracking-[0.06em] text-caution/90 normal-case">
                        {category.complianceNote}
                      </p>
                    ) : null}

                    <div className="mt-5 flex items-center gap-3">
                      <ProvenanceBadge simulated compact />
                      <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-silver-dim/80 uppercase">
                        Conditions configured per client agreement
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-6 font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim/75 uppercase">
          Storage temperatures: {FALLBACK.temperature} — approved ranges pending
          client confirmation
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   INSTRUMENT ROW
   -------------------------------------------------------------------------- */
function InstrumentRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="tj-label">{label}</dt>
      <dd
        className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] uppercase"
        style={{ color: accent }}
      >
        {value}
      </dd>
    </div>
  );
}

/* ==========================================================================
   PRODUCT ENVIRONMENT (§19)
   Each category gets its own ambient artwork so the panel reads as an
   environment rather than a coloured card. Decorative, so aria-hidden.
   ========================================================================== */
function ProductEnvironment({
  category,
  active,
}: {
  category: ProductCategory;
  active: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-[900ms]",
        active ? "opacity-100" : "opacity-45",
      )}
    >
      {/* --- HD plate of the environment --------------------------------
          Pushes in while the category is open, which is what makes the panel
          feel like a window into the chamber rather than a tinted box. */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(max-width: 1023px) 100vw, 34vw"
          className={cn(
            "object-cover transition-all duration-[1600ms]",
            "ease-[cubic-bezier(0.22,1,0.36,1)]",
            active ? "scale-[1.14]" : "scale-100",
          )}
          style={{
            filter: active
              ? `saturate(1.08) contrast(1.06) brightness(0.58)`
              : `saturate(0.55) contrast(1.02) brightness(0.34)`,
          }}
        />
      </div>

      {/* --- Category accent tint + depth falloff ----------------------- */}
      <div
        className="absolute inset-0 transition-opacity duration-[900ms]"
        style={{
          opacity: active ? 0.5 : 0.22,
          background: `linear-gradient(178deg, ${category.accent}2E 0%, transparent 42%, rgba(4,7,29,0.86) 88%, rgba(4,7,29,0.97) 100%)`,
        }}
      />

      {/* --- Frost veil: heavier when the category is closed, so the open
             one reads as clear glass and the others as frosted over ------- */}
      <div
        className="absolute inset-0 backdrop-blur-[2px] transition-all duration-[900ms]"
        style={{
          opacity: active ? 0.12 : 0.5,
          background:
            "radial-gradient(70% 50% at 50% 100%, rgba(233,243,255,0.30), transparent 68%)," +
            "radial-gradient(56% 44% at 0% 0%, rgba(233,243,255,0.16), transparent 70%)",
        }}
      />

      {/* --- Technical linework over the photography -------------------- */}
      <svg
        viewBox="0 0 400 560"
        preserveAspectRatio="xMidYMid slice"
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-[900ms]",
          active ? "opacity-70" : "opacity-45",
        )}
      >
        <defs>
          <linearGradient id={`pe-${category.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={category.accent} stopOpacity="0.16" />
            <stop offset="60%" stopColor={category.accent} stopOpacity="0.04" />
            <stop offset="100%" stopColor="#f2f5f8" stopOpacity="0.6" />
          </linearGradient>
          <filter id={`pe-blur-${category.id}`}>
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <rect width="400" height="560" fill={`url(#pe-${category.id})`} />

        {category.id === "produce" ? <ProduceArt color={category.accent} /> : null}
        {category.id === "meat-poultry" ? <FrostArt color={category.accent} /> : null}
        {category.id === "seafood" ? <MarineArt color={category.accent} /> : null}
        {category.id === "pharmaceuticals" ? <PrecisionArt color={category.accent} /> : null}

        {/* Shared cold pool at the base so panels sit in the same room */}
        <ellipse
          cx="200"
          cy="540"
          rx="220"
          ry="70"
          fill={category.accent}
          opacity={active ? 0.14 : 0.07}
          filter={`url(#pe-blur-${category.id})`}
        />
      </svg>
    </div>
  );
}

/** PRODUCE — freshness and humidity: soft droplet field and leaf venation. */
function ProduceArt({ color }: { color: string }) {
  return (
    <g>
      {/* Humidity droplets */}
      <g fill={color} opacity="0.4">
        {Array.from({ length: 22 }, (_, index) => {
          const x = 24 + ((index * 71) % 356);
          const y = 40 + ((index * 127) % 460);
          const r = 1.4 + ((index * 13) % 22) / 12;
          return <circle key={index} cx={x} cy={y} r={r} opacity={0.25 + ((index * 7) % 40) / 100} />;
        })}
      </g>
      {/* Leaf venation */}
      <g stroke={color} strokeWidth="1.1" fill="none" opacity="0.3">
        <path d="M60 420 Q200 300 340 180" />
        {Array.from({ length: 9 }, (_, index) => {
          const t = (index + 1) / 10;
          const x = 60 + t * 280;
          const y = 420 - t * 240;
          return <path key={index} d={`M${x} ${y} q${26 - index * 2} ${-30} ${44} ${-22}`} />;
        })}
      </g>
      {/* Crate outlines */}
      <g stroke={color} strokeWidth="1.2" fill="none" opacity="0.22">
        <rect x="52" y="452" width="128" height="72" rx="3" />
        <rect x="212" y="452" width="128" height="72" rx="3" />
        <path d="M52 476h128M212 476h128M52 500h128M212 500h128" />
      </g>
    </g>
  );
}

/** MEAT & POULTRY — deep cold: frost crystals and a hard frozen surface. */
function FrostArt({ color }: { color: string }) {
  return (
    <g>
      {/* Frost crystals */}
      <g stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.42">
        {Array.from({ length: 7 }, (_, index) => {
          const x = 50 + ((index * 97) % 310);
          const y = 90 + ((index * 151) % 330);
          const size = 14 + ((index * 7) % 16);
          return (
            <g key={index} transform={`translate(${x},${y})`}>
              {[0, 60, 120].map((angle) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <path d={`M0 ${-size} V${size}`} />
                  <path d={`M0 ${-size * 0.55} l${size * 0.3} ${-size * 0.24}`} />
                  <path d={`M0 ${-size * 0.55} l${-size * 0.3} ${-size * 0.24}`} />
                  <path d={`M0 ${size * 0.55} l${size * 0.3} ${size * 0.24}`} />
                  <path d={`M0 ${size * 0.55} l${-size * 0.3} ${size * 0.24}`} />
                </g>
              ))}
            </g>
          );
        })}
      </g>
      {/* Frozen surface strata */}
      <g stroke={color} strokeWidth="1" opacity="0.2">
        {Array.from({ length: 6 }, (_, index) => (
          <path key={index} d={`M0 ${430 + index * 20} H400`} />
        ))}
      </g>
      {/* Hanging rail — protein storage reads as carcass rail */}
      <g stroke={color} strokeWidth="1.6" opacity="0.3">
        <path d="M20 150 H380" />
        {[80, 160, 240, 320].map((x) => (
          <g key={x}>
            <path d={`M${x} 150 V176`} />
            <path d={`M${x - 13} 176 q13 26 26 0`} fill="none" />
          </g>
        ))}
      </g>
    </g>
  );
}

/** SEAFOOD — marine cold chain: currents, ice shards, a wave field. */
function MarineArt({ color }: { color: string }) {
  return (
    <g>
      {/* Current lines */}
      <g stroke={color} strokeWidth="1.3" fill="none" opacity="0.34">
        {Array.from({ length: 8 }, (_, index) => (
          <path
            key={index}
            d={`M-20 ${120 + index * 46} q100 ${index % 2 ? 34 : -34} 210 0 t230 0`}
          />
        ))}
      </g>
      {/* Ice shards */}
      <g fill={color} opacity="0.2">
        {Array.from({ length: 12 }, (_, index) => {
          const x = 30 + ((index * 83) % 340);
          const y = 60 + ((index * 139) % 420);
          const s = 6 + ((index * 11) % 14);
          return (
            <path
              key={index}
              d={`M${x} ${y} l${s} ${s * 0.5} l${-s * 0.3} ${s} l${-s * 0.9} ${-s * 0.6} Z`}
            />
          );
        })}
      </g>
      {/* Glazed pack outlines */}
      <g stroke={color} strokeWidth="1.2" fill="none" opacity="0.24">
        <rect x="70" y="462" width="120" height="62" rx="3" />
        <rect x="212" y="462" width="120" height="62" rx="3" />
        <path d="M70 486h120M212 486h120" />
      </g>
    </g>
  );
}

/** PHARMACEUTICALS — precision and monitoring: a measurement grid and crosshair. */
function PrecisionArt({ color }: { color: string }) {
  return (
    <g>
      {/* Measurement grid */}
      <g stroke={color} strokeWidth="0.7" opacity="0.2">
        {Array.from({ length: 16 }, (_, index) => (
          <path key={`v${index}`} d={`M${25 * index} 0 V560`} />
        ))}
        {Array.from({ length: 22 }, (_, index) => (
          <path key={`h${index}`} d={`M0 ${25 * index} H400`} />
        ))}
      </g>
      {/* Crosshair reticle — monitoring */}
      <g stroke={color} strokeWidth="1.2" fill="none" opacity="0.45">
        <circle cx="200" cy="250" r="72" />
        <circle cx="200" cy="250" r="46" strokeDasharray="6 8" />
        <path d="M200 152 V196M200 304 V348M104 250 H148M252 250 H296" />
      </g>
      <circle cx="200" cy="250" r="4" fill={color} opacity="0.7" />
      {/* Sealed carton outlines */}
      <g stroke={color} strokeWidth="1.2" fill="none" opacity="0.26">
        <rect x="120" y="440" width="160" height="84" rx="3" />
        <path d="M120 470h160M200 440v84" />
        <path d="M140 452h40" strokeWidth="2" />
      </g>
      {/* Tamper-evident seal */}
      <g stroke={color} strokeWidth="1.4" opacity="0.4" fill="none">
        <path d="M150 500 q50 22 100 0" strokeDasharray="3 5" />
      </g>
    </g>
  );
}
