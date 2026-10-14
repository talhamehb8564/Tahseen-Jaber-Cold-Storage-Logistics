import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";

import { AdminBlock, AdminPageHeader, EmptyState, StatCard, StatGrid } from "@/components/admin/admin-ui";
import { UserRoleControl } from "@/components/admin/user-role-control";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { clients, users } from "@/lib/db/schema";
import { formatDate, formatRelative, initialsOf } from "@/lib/utilities/format";
import { cn } from "@/lib/utilities/cn";

export const metadata: Metadata = { title: "Users" };

/**
 * /admin/users (§28, §29, §30)
 * ---------------------------------------------------------------------------
 * Who can sign in, at what role, and whether they are active.
 *
 * This screen reads the database directly rather than through the data provider,
 * because user accounts are credentials-adjacent and must never be part of a
 * snapshot that also serves the public site (§38 — no sensitive data in a shared
 * read path). Note what is NOT selected: `passwordHash` is never read here.
 *
 * Role changes and deactivation run through the `updateUser` action, which bumps
 * `tokenVersion` so the affected user's existing sessions die immediately.
 */
export default async function AdminUsersPage() {
  const actor = await requireAdmin("/admin/users");

  if (!isDatabaseConfigured()) {
    return (
      <>
        <AdminPageHeader
          title="Users"
          description="Accounts that may sign in to the command center or the client portal."
        />
        <EmptyState
          icon={<Users size={22} strokeWidth={1.5} aria-hidden />}
          title="No database connected"
          detail="User accounts live in PostgreSQL. Set DATABASE_URL, run the migration and seed, then reload — the seeded fixtures include one ADMIN, one OPERATOR and one CLIENT account."
        />
      </>
    );
  }

  const db = getDb()!;

  const [userRows, clientRows] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        emailVerifiedAt: users.emailVerifiedAt,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .orderBy(users.createdAt),
    db.select({ id: clients.id, userId: clients.userId, companyName: clients.companyName }).from(clients),
  ]);

  const companyByUserId = new Map(
    clientRows
      .filter((client) => client.userId !== null)
      .map((client) => [client.userId as string, client.companyName]),
  );

  const active = userRows.filter((user) => user.isActive).length;
  const admins = userRows.filter((user) => user.role === "ADMIN").length;
  const clientsCount = userRows.filter((user) => user.role === "CLIENT").length;

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Accounts that may sign in to the command center or the client portal. Changing a role or deactivating an account signs that user out everywhere immediately."
      />

      <StatGrid columns={4} className="mb-7">
        <StatCard label="Accounts" value={userRows.length} tone="glow" icon={<Users size={15} strokeWidth={1.6} aria-hidden />} />
        <StatCard label="Active" value={`${active}/${userRows.length}`} tone={active === userRows.length ? "stable" : "caution"} />
        <StatCard label="Administrators" value={admins} tone={admins > 0 ? "default" : "alert"} icon={<ShieldCheck size={15} strokeWidth={1.6} aria-hidden />} hint={admins === 0 ? "No administrator — nobody can manage the console" : undefined} />
        <StatCard label="Client accounts" value={clientsCount} icon={<KeyRound size={15} strokeWidth={1.6} aria-hidden />} />
      </StatGrid>

      <AdminBlock
        title="Accounts"
        description="Passwords are stored hashed and are never read or displayed here."
      >
        {userRows.length === 0 ? (
          <EmptyState
            icon={<Users size={22} strokeWidth={1.5} aria-hidden />}
            title="No accounts"
            detail="Run the seed to create the initial administrator, operator and client accounts."
          />
        ) : (
          <ul className="space-y-2.5">
            {userRows.map((user) => {
              const isSelf = user.id === actor.sub;
              const company = companyByUserId.get(user.id);

              return (
                <li key={user.id}>
                  <article
                    className={cn(
                      "tj-panel tj-corners rounded-[2px] p-5 transition-colors duration-500",
                      !user.isActive && "opacity-65",
                      isSelf && "border-glow/30",
                    )}
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Avatar */}
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-[2px] border font-mono text-[0.75rem] font-semibold tracking-[0.06em]",
                          user.role === "ADMIN"
                            ? "border-glow/45 bg-glow/10 text-glow"
                            : user.role === "OPERATOR"
                              ? "border-ice/40 bg-ice/[0.08] text-ice"
                              : "border-hull-line bg-midnight/50 text-silver",
                        )}
                        aria-hidden
                      >
                        {initialsOf(user.name ?? user.email)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-display text-[0.9375rem] font-bold tracking-[-0.005em] text-frost">
                            {user.name ?? user.email}
                          </h3>
                          <span
                            className={cn(
                              "rounded-[2px] border px-2 py-0.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase",
                              user.role === "ADMIN"
                                ? "border-glow/45 text-glow"
                                : user.role === "OPERATOR"
                                  ? "border-ice/40 text-ice"
                                  : "border-hull-line text-silver-dim",
                            )}
                          >
                            {user.role}
                          </span>
                          {isSelf ? (
                            <span className="font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
                              you
                            </span>
                          ) : null}
                          {!user.isActive ? (
                            <span className="font-mono text-[0.5rem] tracking-[0.14em] text-alert uppercase">
                              deactivated
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 font-mono text-[0.6875rem] text-silver">{user.email}</p>

                        {company ? (
                          <p className="mt-1.5 text-[0.75rem] text-silver-dim">
                            Portal account for <span className="text-silver">{company}</span>
                          </p>
                        ) : null}

                        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
                          <Meta label="Created" value={formatDate(user.createdAt)} />
                          <Meta
                            label="Last sign-in"
                            value={user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
                          />
                          <Meta
                            label="Email verified"
                            value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "No"}
                          />
                          <Meta label="Sessions reset" value={`${user.tokenVersion}×`} />
                        </dl>
                      </div>

                      {/* Controls */}
                      <div className="w-full shrink-0 lg:w-auto">
                        <UserRoleControl
                          userId={user.id}
                          userEmail={user.email}
                          currentRole={user.role}
                          isActive={user.isActive}
                          isSelf={isSelf}
                        />
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </AdminBlock>

      <div className="tj-panel mt-7 flex items-start gap-4 rounded-[2px] p-5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-hull-line bg-midnight/50 text-silver-dim">
          <UserCog size={16} strokeWidth={1.6} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[0.625rem] font-semibold tracking-[0.16em] text-silver uppercase">
            Creating accounts
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-silver-dim">
            There is no public registration — accounts are created by an
            administrator. In this environment they are provisioned through the
            seed script or directly in the database, so a new user's password is
            bcrypt-hashed before it is ever stored (§30). Adding an in-console
            "create user" form is the natural next step once an object store and
            email provider are connected, so invitation mail can actually be sent.
          </p>
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim/70 uppercase">
        {label}
      </dt>
      <dd className="tabular font-mono text-[0.625rem] text-silver">{value}</dd>
    </div>
  );
}
