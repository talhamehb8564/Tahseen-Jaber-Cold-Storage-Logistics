import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/admin-nav";
import { ensureCsrfToken } from "@/lib/auth/session";
import { requireStaff } from "@/lib/auth/guards";
import { getDataProvider } from "@/lib/data";

export const metadata: Metadata = {
  title: {
    default: "Command Center",
    template: "%s · Command Center",
  },
  description:
    "Administration command center for Tahseen Jaber Cold Storage & Logistics.",
  // An internal console must never be indexed (§29, §36).
  robots: { index: false, follow: false },
};

/** Never cached: the guard has to run against the live session on every request. */
export const dynamic = "force-dynamic";

/**
 * /admin LAYOUT (§28, §29, §30)
 * ---------------------------------------------------------------------------
 * The guard lives HERE, in the layout, so it runs before any nested route
 * renders. That is the difference between server-side protection and a client
 * check: no admin page can emit a fragment of privileged markup on its way to a
 * redirect, and there is no route under /admin that can be added later and
 * forget to be protected.
 *
 * `requireStaff` also re-reads the user from the database, so deactivating an
 * account or bumping its tokenVersion takes effect on the next request rather
 * than at token expiry.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff("/admin");

  // Issues the double-submit CSRF cookie so state-changing admin actions and
  // sign-out can be verified (§30).
  await ensureCsrfToken();

  // Nav badges. Best-effort: a provider failure must not take the whole console
  // down, so the counts degrade to nothing rather than throwing.
  let alertCount = 0;
  let newRequestCount = 0;
  try {
    const provider = await getDataProvider();
    const overview = await provider.getOverview();
    alertCount = overview.alerts.critical + overview.alerts.warning;
    newRequestCount = overview.inquiries.new;
  } catch (error) {
    console.error("[admin] could not load nav counts", error);
  }

  return (
    <div className="flex min-h-svh bg-midnight">
      <AdminNav
        userName={user.name}
        userEmail={user.email}
        role={user.role}
        alertCount={alertCount}
        newRequestCount={newRequestCount}
      />

      <div className="min-w-0 flex-1">
        {/* Console content is denser than the marketing site on purpose. */}
        <div className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-6 sm:py-9 lg:px-9">
          {children}
        </div>
      </div>
    </div>
  );
}
