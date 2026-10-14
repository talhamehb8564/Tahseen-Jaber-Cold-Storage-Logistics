import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Database, KeyRound } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { WordmarkGlyph } from "@/components/navigation/wordmark";
import { ColdPool } from "@/components/global/cold-atmosphere";
import { getCurrentUser } from "@/lib/auth/guards";
import { isAuthConfigured } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/client";
import { safeRedirect } from "@/lib/validation/auth";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the Tahseen Jaber Cold Storage & Logistics client portal or administration command center.",
  robots: { index: false, follow: false },
};

/** Must not be cached: an already-signed-in visitor should not see the form. */
export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ from?: string | string[] }>;
}

/**
 * /login (§30)
 * ---------------------------------------------------------------------------
 * A single sign-in for both audiences — the client portal and the admin command
 * center. Role is resolved server-side after authentication and decides the
 * landing area; the visitor never chooses their own privilege level.
 *
 * If AUTH_SECRET or DATABASE_URL is missing the page says so plainly rather than
 * presenting a form that can only fail. That is §39 applied to configuration: a
 * broken environment is a visible state, not a silent one.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const from = safeRedirect(rawFrom);

  // Already signed in — send them where they were going instead of showing a form.
  // A server-side redirect is immediate and needs no client JavaScript; there is
  // nothing to render in the meantime.
  const existing = await getCurrentUser();
  if (existing) {
    const destination =
      from !== "/" ? from : existing.role === "CLIENT" ? "/portal" : "/admin";
    redirect(destination);
  }

  const authReady = isAuthConfigured();
  const dbReady = isDatabaseConfigured();
  const ready = authReady && dbReady;

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-5 py-24 sm:px-8">
      <ColdPool intensity={0.5} hue="ice" className="-z-10" />
      <div aria-hidden className="tj-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-3.5"
            aria-label={`${siteConfig.brand.name} — home`}
          >
            <WordmarkGlyph size={34} className="text-ice transition-colors duration-500 group-hover:text-glow" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.9375rem] font-bold tracking-[0.02em] text-frost uppercase">
                {siteConfig.brand.shortName}
              </span>
              <span className="mt-1.5 font-mono text-[0.5rem] tracking-[0.24em] text-silver-dim uppercase">
                Cold Storage &amp; Logistics
              </span>
            </span>
          </Link>
        </div>

        <div className="tj-panel tj-corners rounded-[2px] p-7 sm:p-9">
          <span className="flex size-11 items-center justify-center rounded-[2px] border border-glow/35 bg-glow/[0.09] text-glow">
            <KeyRound size={19} strokeWidth={1.6} aria-hidden />
          </span>

          <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.025em] text-frost uppercase">
            Sign in
          </h1>
          <p className="mt-2.5 text-[0.875rem] leading-relaxed text-silver-dim">
            Client portal and administration access. Your role decides which area
            opens after sign-in.
          </p>

          {ready ? (
            <div className="mt-8">
              <LoginForm from={from !== "/" ? from : undefined} />
            </div>
          ) : (
            <ConfigurationWarning authReady={authReady} dbReady={dbReady} />
          )}
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase transition-colors duration-300 hover:text-ice"
          >
            <ArrowLeft
              size={13}
              strokeWidth={1.8}
              aria-hidden
              className="transition-transform duration-500 group-hover:-translate-x-0.5"
            />
            Back to site
          </Link>

          <Link
            href="/request-storage"
            className="font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase transition-colors duration-300 hover:text-glow"
          >
            Request storage
          </Link>
        </div>

        <p className="mt-8 text-center font-mono text-[0.5rem] leading-relaxed tracking-[0.1em] text-silver-dim/60 uppercase">
          No public registration — accounts are created by the facility
        </p>
      </div>
    </main>
  );
}

/**
 * Configuration is a visible state, not a silent failure (§39, §03). Naming the
 * exact missing variable turns a dead end into a one-line fix.
 */
function ConfigurationWarning({
  authReady,
  dbReady,
}: {
  authReady: boolean;
  dbReady: boolean;
}) {
  const missing = [
    !authReady ? "AUTH_SECRET" : null,
    !dbReady ? "DATABASE_URL" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mt-8 border border-caution/40 bg-caution/[0.06] p-5">
      <p className="flex items-center gap-2.5 font-mono text-[0.6875rem] font-semibold tracking-[0.14em] text-caution uppercase">
        <Database size={15} strokeWidth={1.7} aria-hidden />
        Sign-in unavailable
      </p>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-silver">
        Authentication is not configured in this environment, so there is no
        account store to check credentials against. Sign-in is disabled rather than
        left to fail silently.
      </p>

      <p className="mt-4 font-mono text-[0.5625rem] leading-relaxed tracking-[0.1em] text-silver-dim uppercase">
        Missing: {missing.join(", ")}
      </p>

      <p className="mt-3 text-[0.8125rem] leading-relaxed text-silver-dim">
        Copy <span className="font-mono text-[0.75rem] text-frost">.env.example</span> to{" "}
        <span className="font-mono text-[0.75rem] text-frost">.env.local</span>, set those
        values, run the migration and the seed, then reload this page.
      </p>
    </div>
  );
}


