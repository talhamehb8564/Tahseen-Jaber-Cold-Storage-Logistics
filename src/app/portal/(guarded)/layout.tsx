import { Snowflake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireClient } from "@/lib/auth/guards";
import { ensureCsrfToken } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site";
import { initialsOf } from "@/lib/utilities/format";

export const metadata: Metadata = {
  title: {
    default: "Client Portal",
    template: "%s · Client Portal",
  },
  description:
    "Client portal for Tahseen Jaber Cold Storage & Logistics — inventory, storage records, documents and monitoring.",
  // An authenticated area must never be indexed (§29, §36).
  robots: { index: false, follow: false },
};

/** Never cached: the guard runs against the live session on every request. */
export const dynamic = "force-dynamic";

/**
 * /portal LAYOUT (§27, §29, §30)
 * ---------------------------------------------------------------------------
 * The guard lives in the layout so it runs before any nested route renders —
 * server-side protection, not a client check. `requireClient` enforces two
 * things at once: the visitor is signed in, AND they hold the CLIENT role with a
 * linked client record. A staff member who tries this area is sent to
 * /forbidden; a client row with nothing linked is sent to /portal/no-account
 * rather than being shown an unscoped view (§30 — fail closed, never show
 * everything because the scope was missing).
 *
 * Every page under here inherits that, so a route added later cannot forget to
 * be protected.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clientId } = await requireClient("/portal");

  // Double-submit CSRF cookie, needed by the sign-out control (§30).
  await ensureCsrfToken();

  return (
    <div className="flex min-h-svh flex-col bg-midnight">
      {/* ---------------- Portal bar ---------------- */}
      <header className="sticky top-0 z-40 border-b border-glow/18 bg-midnight/78 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex w-full max-w-[86rem] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[3px] border border-glow/30 bg-glow/10">
              <Snowflake size={16} strokeWidth={1.7} aria-hidden className="text-glow" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[0.5rem] tracking-[0.24em] text-glow uppercase">
                Client portal
              </p>
              <p className="truncate font-display text-[0.8125rem] font-bold tracking-[0.02em] text-frost uppercase">
                {siteConfig.brand.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden font-mono text-[0.5625rem] tracking-[0.18em] text-silver-dim uppercase transition-colors duration-300 hover:text-ice sm:inline"
            >
              Public site
            </Link>

            {/* Who is signed in — the account this view is scoped to. */}
            <div className="flex items-center gap-2.5 rounded-[3px] border border-hull-line/70 bg-navy/50 py-1.5 pr-3 pl-1.5">
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-[2px] bg-glow/15 font-mono text-[0.625rem] font-semibold tracking-[0.06em] text-glow uppercase"
              >
                {initialsOf(user.name ?? user.email)}
              </span>
              <span className="min-w-0">
                <span className="block max-w-[9rem] truncate text-[0.75rem] leading-tight text-frost">
                  {user.name ?? user.email}
                </span>
                <span className="block font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
                  Account {clientId.slice(0, 8)}
                </span>
              </span>
            </div>

            <SignOutButton label="Sign out" />
          </div>
        </div>
      </header>

      {/* ---------------- Content ---------------- */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[86rem] px-4 py-7 sm:px-6 sm:py-9 lg:px-9">
          {children}
        </div>
      </main>

      <footer className="border-t border-hull-line/60 px-4 py-5 sm:px-6 lg:px-9">
        <p className="mx-auto w-full max-w-[86rem] font-mono text-[0.5625rem] leading-relaxed tracking-[0.14em] text-silver-dim uppercase">
          This portal shows only records belonging to your account. {siteConfig.location.facility},{" "}
          {siteConfig.location.city}.
        </p>
      </footer>
    </div>
  );
}
