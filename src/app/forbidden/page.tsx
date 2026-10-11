import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Access denied",
  description: "You do not have access to this area.",
  robots: { index: false, follow: false },
};

/**
 * /forbidden
 * ---------------------------------------------------------------------------
 * Reached when an authenticated user's role does not permit the route they
 * attempted (§29, §30). Distinct from /login, because sending an already-signed-in
 * user to the login form would loop them straight back.
 *
 * §39 — a clear failure state rather than a silent redirect.
 */
export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-24 sm:px-8">
      <div className="tj-panel tj-corners w-full max-w-lg rounded-[2px] p-8 text-center sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-[2px] border border-alert/40 bg-alert/[0.08] text-alert">
          <ShieldAlert size={26} strokeWidth={1.5} aria-hidden />
        </span>

        <p className="tj-label mt-7 justify-center">Error 403</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-frost uppercase">
          Access denied
        </h1>

        <p className="mt-5 text-[0.9375rem] leading-relaxed text-silver">
          Your account does not have permission to open this area. If you believe
          that is wrong, the facility team can adjust your role.
        </p>

        <p className="mt-4 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim uppercase">
          This attempt was recorded against your account.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[2px] bg-glow px-6 py-3.5 font-display text-[0.8125rem] font-bold tracking-[0.14em] text-midnight uppercase transition-colors duration-300 hover:bg-ice focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-midnight focus-visible:outline-none"
          >
            Return home
          </Link>
          {/* A different account may hold the right role, so offer the login
              route rather than a POST-only sign-out endpoint as a plain link. */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[2px] border border-hull-line px-6 py-3.5 font-display text-[0.8125rem] font-bold tracking-[0.14em] text-silver uppercase transition-colors duration-300 hover:border-glow/45 hover:text-frost"
          >
            Sign in as another user
          </Link>
        </div>
      </div>
    </main>
  );
}
