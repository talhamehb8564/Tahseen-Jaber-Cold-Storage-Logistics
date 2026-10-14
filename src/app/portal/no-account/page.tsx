import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ColdPool } from "@/components/global/cold-atmosphere";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireUser } from "@/lib/auth/guards";
import { ensureCsrfToken } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Account not linked",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * NO LINKED CLIENT RECORD (§30)
 * ---------------------------------------------------------------------------
 * `requireClient` sends a signed-in CLIENT here when their user row has no
 * linked client record. Deliberately NOT under the guarded portal layout — that
 * layout calls the same guard, so nesting this page inside it would redirect to
 * itself forever.
 *
 * §30 is the reason this page exists at all: a client row that cannot be scoped
 * must be shown nothing, rather than being shown every client's records because
 * the scope was missing. Failing closed is the whole point, and this page is the
 * honest explanation of that failure.
 *
 * §38 — no internal identifiers, table names or stack details. The visitor is
 * told what happened in plain terms and given a way forward.
 */
export default async function NoAccountPage() {
  const user = await requireUser("/portal/no-account");
  await ensureCsrfToken();

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-24 sm:px-8">
      <ColdPool intensity={0.5} hue="ice" />

      <div className="glass-strong tj-corners relative w-full max-w-lg rounded-[4px] p-8 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-caution/45 bg-caution/12">
          <ShieldAlert size={20} strokeWidth={1.7} aria-hidden className="text-caution" />
        </span>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em] text-frost uppercase">
          Your account is not linked yet
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-silver sm:text-base">
          You are signed in as{" "}
          <span className="font-mono text-[0.8125rem] text-ice">{user.email}</span>, but this
          account has no storage records attached to it. Until it is linked, the
          portal shows nothing at all rather than risk showing you another
          client&rsquo;s stock.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-silver-dim">
          Contact the facility and the account will be linked to your storage
          record. Reference format for enquiries: TJ-XXXXX.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-[2px] bg-glow px-6 py-3.5 font-display text-[0.75rem] font-bold tracking-[0.16em] text-midnight uppercase shadow-[0_12px_34px_-14px_rgba(182,106,60,0.9)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ice active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none"
          >
            Contact the facility
          </Link>
          <SignOutButton label="Sign out" />
        </div>

        <p className="mt-7 font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
          {siteConfig.location.facility}, {siteConfig.location.city}
        </p>
      </div>
    </main>
  );
}
