import type { Metadata } from "next";
import { CircleAlert, Database, Globe, KeyRound, Mail, MessageCircle, Settings } from "lucide-react";

import { AdminBlock, AdminPageHeader, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { isAuthConfigured } from "@/lib/auth/session";
import { isEmailConfigured } from "@/lib/email";
import { isWhatsappConfigured } from "@/lib/notifications/whatsapp";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getDataSourceInfo } from "@/lib/data";
import { CONTENT_GAPS, FALLBACK, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Settings" };

/** Display order for the content-gap groups. */
const GAP_AREAS = [
  "Contact",
  "Location",
  "Capability",
  "Operations",
  "Commercial",
  "Trust",
  "Assets",
] as const;

/**
 * /admin/settings (§28, §45)
 * ---------------------------------------------------------------------------
 * Two things an operator actually needs from a settings screen on this project:
 *
 *   1. INTEGRATION STATE — which channels are connected. A form that cannot email
 *      anyone, or a console with no database, must say so here rather than fail
 *      later in front of a client (§39).
 *   2. THE CONTENT GAP LIST — everything §45 says must not be invented, and which
 *      is therefore still unpublished. Keeping it inside the product means the
 *      gaps are visible to whoever runs the site, not only to whoever built it.
 *
 * No secrets are rendered. Each row reports whether a variable is SET, never its
 * value — an admin screen is still a screen, and §03 applies to it too.
 */
export default async function AdminSettingsPage() {
  const source = await getDataSourceInfo();

  const integrations = [
    {
      id: "database",
      label: "PostgreSQL",
      connected: isDatabaseConfigured(),
      variable: "DATABASE_URL",
      icon: Database,
      detail: "Storage for inquiries, inventory, telemetry, users and the audit trail.",
      consequence: "Without it the site runs on the simulation provider and nothing submitted is recorded.",
    },
    {
      id: "auth",
      label: "Session signing",
      connected: isAuthConfigured(),
      variable: "AUTH_SECRET",
      icon: KeyRound,
      detail: "Signs the httpOnly session cookie. Must be at least 32 characters.",
      consequence: "Without it nobody can sign in, and this console is unreachable.",
    },
    {
      id: "email",
      label: "Email",
      connected: isEmailConfigured(),
      variable: "EMAIL_SERVER · EMAIL_FROM",
      icon: Mail,
      detail: "Sends inquiry alerts to the team and a reference receipt to the submitter.",
      consequence: "Without it, inquiries can only be recorded — not notified.",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      connected: isWhatsappConfigured(),
      variable: "WHATSAPP_API_KEY · PHONE_NUMBER_ID · ADMIN_RECIPIENT",
      icon: MessageCircle,
      detail: "Optional glance-alert to the team when a request arrives.",
      consequence: "Optional. Email and the database cover the requirement without it.",
    },
    {
      id: "site",
      label: "Public site URL",
      connected: Boolean(siteConfig.seo.url.startsWith("https://")),
      variable: "NEXT_PUBLIC_SITE_URL",
      icon: Globe,
      detail: "Used for canonical URLs, the sitemap and Open Graph metadata.",
      consequence: "A placeholder URL means search engines are told the wrong address.",
    },
  ] as const;

  const connectedCount = integrations.filter((item) => item.connected).length;

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Integration state and the outstanding content gaps. Neither is decorative: both decide what this site is able to claim."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard
          label="Integrations connected"
          value={`${connectedCount}/${integrations.length}`}
          tone={connectedCount === integrations.length ? "stable" : "caution"}
          icon={<Settings size={15} strokeWidth={1.6} aria-hidden />}
        />
        <StatCard
          label="Data source"
          value={source.mode.toUpperCase()}
          tone={source.mode === "live" ? "stable" : "caution"}
          hint={source.badge}
        />
        <StatCard label="Content gaps" value={CONTENT_GAPS.length} tone={CONTENT_GAPS.length > 0 ? "caution" : "stable"} />
        <StatCard label="Rate limit" value={`${siteConfig.brand.shortName ? "on" : "on"}`} hint="Per hashed IP, fixed window" />
      </StatGrid>

      {/* ---------------- Integrations ---------------- */}
      <AdminBlock
        title="Integrations"
        description="Whether each channel is configured. Values are never shown — only presence."
      >
        <ul className="tj-panel divide-y divide-hull-line/50 overflow-hidden rounded-[2px]">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <li key={integration.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[2px] border",
                    integration.connected
                      ? "border-stable/40 bg-stable/[0.08] text-stable"
                      : "border-caution/40 bg-caution/[0.07] text-caution",
                  )}
                >
                  <Icon size={17} strokeWidth={1.6} aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-[0.9375rem] font-bold tracking-[0.005em] text-frost uppercase">
                      {integration.label}
                    </h3>
                    <span
                      className={cn(
                        "rounded-[2px] border px-2 py-0.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase",
                        integration.connected
                          ? "border-stable/45 text-stable"
                          : "border-caution/45 text-caution",
                      )}
                    >
                      {integration.connected ? "Connected" : "Not configured"}
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-[0.8125rem] leading-relaxed text-silver-dim">
                    {integration.detail}
                  </p>

                  {!integration.connected ? (
                    <p className="mt-2 max-w-2xl text-[0.8125rem] leading-relaxed text-caution/85">
                      {integration.consequence}
                    </p>
                  ) : null}

                  <p className="mt-2.5 font-mono text-[0.5rem] tracking-[0.12em] text-silver-dim/70 uppercase">
                    {integration.variable}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </AdminBlock>

      {/* ---------------- Data source ---------------- */}
      <AdminBlock
        title="Data source"
        description="What the provider resolved to for this request, and why."
        className="mt-8"
      >
        <div className="tj-panel rounded-[2px] p-5">
          <dl className="grid gap-4 sm:grid-cols-3">
            <SettingRow label="Mode" value={source.mode.toUpperCase()} />
            <SettingRow label="Badge shown to users" value={source.badge} />
            <SettingRow label="Reason" value={source.reason ?? "—"} />
          </dl>

          <p className="mt-5 border-t border-hull-line/70 pt-4 text-[0.8125rem] leading-relaxed text-silver-dim">
            The badge is derived from the provider, never chosen by whoever writes
            the screen. It reads{" "}
            <span className="font-mono text-[0.75rem] tracking-[0.1em] text-stable uppercase">
              LIVE
            </span>{" "}
            only when the mode is live, a database is configured and the schema
            probe succeeds — so no screen can accidentally claim live data it does
            not have.
          </p>
        </div>
      </AdminBlock>

      {/* ---------------- Content gaps (§45) ---------------- */}
      <AdminBlock
        title="Content gaps"
        description="Business information that has not been supplied. Each of these is rendered as a fallback on the public site and must not be filled in with an estimate."
        className="mt-8"
      >
        <div className="tj-panel rounded-[2px] border-caution/25 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert size={16} strokeWidth={1.8} aria-hidden className="mt-0.5 shrink-0 text-caution" />
            <p className="text-[0.8125rem] leading-relaxed text-silver">
              Supplying any of these makes it publishable. Until then the site shows
              the configured fallback —{" "}
              <span className="font-mono text-[0.75rem] text-frost uppercase">
                {FALLBACK.capability}
              </span>
              ,{" "}
              <span className="font-mono text-[0.75rem] text-frost uppercase">
                {FALLBACK.temperature}
              </span>
              ,{" "}
              <span className="font-mono text-[0.75rem] text-frost uppercase">
                {FALLBACK.pricing}
              </span>{" "}
              — rather than inventing a figure.
            </p>
          </div>

          {/* Grouped by area, so the list reads as a work plan rather than a
              flat wall of missing items. */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GAP_AREAS.map((area) => {
              const gaps = CONTENT_GAPS.filter((gap) => gap.area === area);
              if (gaps.length === 0) return null;
              return (
                <div key={area}>
                  <p className="tj-label mb-2.5">
                    {area}
                    <span className="tabular ml-2 text-silver-dim/70">{gaps.length}</span>
                  </p>
                  <ul className="space-y-1.5">
                    {gaps.map((gap) => (
                      <li
                        key={gap.id}
                        className="flex items-start gap-2.5 rounded-[2px] border border-hull-line/70 bg-midnight/40 px-3 py-2"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.4rem] size-1.5 shrink-0 rounded-full bg-caution/70"
                        />
                        <span className="text-[0.75rem] leading-snug text-silver">{gap.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </AdminBlock>
    </>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="tj-label">{label}</dt>
      <dd className="mt-1.5 truncate font-mono text-[0.75rem] tracking-[0.08em] text-frost uppercase">
        {value}
      </dd>
    </div>
  );
}
