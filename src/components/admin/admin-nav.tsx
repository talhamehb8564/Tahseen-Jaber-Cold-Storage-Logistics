"use client";

import {
  Activity,
  BarChart3,
  Boxes,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { WordmarkGlyph } from "@/components/navigation/wordmark";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useLockBodyScroll } from "@/hooks";
import { cn } from "@/lib/utilities/cn";

/**
 * ADMIN NAVIGATION (§28)
 * ---------------------------------------------------------------------------
 * The command center's own shell. Deliberately NOT the marketing navbar: an
 * operations console needs dense, always-visible navigation to eleven areas, and
 * reusing the public bar would force a compromise that serves neither.
 *
 * The active item is derived from the pathname rather than passed in, so it can
 * never disagree with the route actually rendered.
 */

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Badge text, e.g. a count of items needing attention. */
  badge?: string | null;
  tone?: "default" | "alert";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface AdminNavProps {
  userName: string | null;
  userEmail: string;
  role: string;
  /** Count of unacknowledged critical/warning events, shown on the Overview item. */
  alertCount?: number;
  /** Count of NEW inquiries, shown on the Requests item. */
  newRequestCount?: number;
}

export function AdminNav({
  userName,
  userEmail,
  role,
  alertCount = 0,
  newRequestCount = 0,
}: AdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useLockBodyScroll(open);

  const groups: NavGroup[] = [
    {
      title: "Operations",
      items: [
        {
          href: "/admin",
          label: "Overview",
          icon: LayoutDashboard,
          badge: alertCount > 0 ? String(alertCount) : null,
          tone: alertCount > 0 ? "alert" : "default",
        },
        {
          href: "/admin/requests",
          label: "Storage requests",
          icon: Inbox,
          badge: newRequestCount > 0 ? String(newRequestCount) : null,
        },
        { href: "/admin/inventory", label: "Inventory", icon: Boxes },
        { href: "/admin/telemetry", label: "Telemetry", icon: Activity },
      ],
    },
    {
      title: "Facility",
      items: [
        { href: "/admin/zones", label: "Zones", icon: Warehouse },
        { href: "/admin/capacity", label: "Capacity", icon: Gauge },
        { href: "/admin/security", label: "Security", icon: ShieldCheck },
      ],
    },
    {
      title: "Insight",
      items: [
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
        { href: "/admin/documents", label: "Documents", icon: FileText },
      ],
    },
    {
      title: "Administration",
      items: [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* ---------------- Mobile top bar ---------------- */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-hull-line/70 bg-midnight/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <WordmarkGlyph size={26} className="text-glow" />
          <span className="font-display text-[0.75rem] font-bold tracking-[0.14em] text-frost uppercase">
            Command Center
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="flex size-10 items-center justify-center rounded-[2px] border border-hull-line text-silver transition-colors duration-300 hover:border-glow/45 hover:text-glow focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none"
        >
          {open ? <X size={17} aria-hidden /> : <Menu size={17} aria-hidden />}
        </button>
      </div>

      {/* ---------------- Mobile drawer ---------------- */}
      {open ? (
        <div
          id="admin-mobile-nav"
          className="fixed inset-0 top-[3.5rem] z-40 overflow-y-auto border-t border-hull-line/70 bg-midnight/97 px-4 py-6 backdrop-blur-xl lg:hidden"
        >
          <NavGroups groups={groups} isActive={isActive} onNavigate={() => setOpen(false)} />
          <div className="mt-8 border-t border-hull-line/70 pt-6">
            <SignedInAs userName={userName} userEmail={userEmail} role={role} />
            <SignOutButton className="mt-4 w-full justify-center" />
          </div>
        </div>
      ) : null}

      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="sticky top-0 hidden h-svh w-[15.5rem] shrink-0 flex-col border-r border-hull-line/70 bg-navy/45 lg:flex">
        <div className="flex items-center gap-3 border-b border-hull-line/70 px-5 py-5">
          <WordmarkGlyph size={30} className="text-glow" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[0.75rem] font-bold tracking-[0.12em] text-frost uppercase">
              Command
            </span>
            <span className="mt-1 font-mono text-[0.5rem] tracking-[0.22em] text-silver-dim uppercase">
              Center
            </span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Admin">
          <NavGroups groups={groups} isActive={isActive} />
        </nav>

        <div className="border-t border-hull-line/70 px-4 py-4">
          <SignedInAs userName={userName} userEmail={userEmail} role={role} />
          <SignOutButton className="mt-3.5 w-full justify-center" />
          <Link
            href="/"
            className="mt-3 block text-center font-mono text-[0.5rem] tracking-[0.16em] text-silver-dim/70 uppercase transition-colors duration-300 hover:text-ice"
          >
            View public site
          </Link>
        </div>
      </aside>
    </>
  );
}

function NavGroups({
  groups,
  isActive,
  onNavigate,
}: {
  groups: NavGroup[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2.5 font-mono text-[0.5rem] tracking-[0.22em] text-silver-dim/60 uppercase">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-[2px] px-3 py-2.5",
                      "text-[0.8125rem] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active
                        ? "bg-glow/[0.09] text-frost"
                        : "text-silver-dim hover:bg-hull/40 hover:text-silver",
                    )}
                  >
                    {/* Active rule */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-glow transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        active ? "opacity-100" : "scale-y-0 opacity-0",
                      )}
                    />
                    <Icon
                      size={16}
                      strokeWidth={1.6}
                      aria-hidden
                      className={cn(
                        "shrink-0 transition-colors duration-300",
                        active ? "text-glow" : "text-silver-dim group-hover:text-ice",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>

                    {item.badge ? (
                      <span
                        className={cn(
                          "tabular shrink-0 rounded-[2px] px-1.5 py-0.5 font-mono text-[0.5rem] font-semibold tracking-[0.08em]",
                          item.tone === "alert"
                            ? "bg-alert/18 text-alert"
                            : "bg-glow/15 text-glow",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SignedInAs({
  userName,
  userEmail,
  role,
}: {
  userName: string | null;
  userEmail: string;
  role: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-display text-[0.8125rem] font-bold tracking-[-0.005em] text-frost">
        {userName ?? userEmail}
      </p>
      <p className="mt-1 truncate font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim uppercase">
        {role}
      </p>
      {userName ? (
        <p className="mt-0.5 truncate font-mono text-[0.5rem] text-silver-dim/70">{userEmail}</p>
      ) : null}
    </div>
  );
}
