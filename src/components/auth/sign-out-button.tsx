"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CSRF_HEADER } from "@/lib/auth/csrf";
import { cn } from "@/lib/utilities/cn";

/**
 * SIGN OUT (§30)
 * ---------------------------------------------------------------------------
 * POSTs to /api/auth/logout with the CSRF header. The token lives in a
 * non-httpOnly cookie by design — the whole point of double-submit is that the
 * page can read it, while a cross-origin attacker cannot.
 *
 * On success the client cache is refreshed so the server components re-render
 * without the session; there is no stale authenticated UI left on screen.
 */
export function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setPending(true);
    setFailed(false);

    try {
      // Read the CSRF cookie rather than trusting a prop, so a stale page cannot
      // submit with an expired token.
      const token = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("tj_csrf="))
        ?.split("=")[1];

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { [CSRF_HEADER]: token } : {},
      });

      if (!response.ok) {
        // 403 means the CSRF pair did not match — usually a stale tab. A plain
        // navigation to /login still ends the session from the user's point of
        // view, and is better than a dead button (§39: no silent failures).
        setFailed(true);
        router.push("/login");
        router.refresh();
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-[2px] border border-hull-line px-3.5 py-2.5",
        "font-mono text-[0.5625rem] tracking-[0.16em] text-silver-dim uppercase",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:border-alert/45 hover:text-alert",
        "focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <LogOut
        size={13}
        strokeWidth={1.8}
        aria-hidden
        className="transition-transform duration-500 group-hover:translate-x-0.5"
      />
      {pending ? "Signing out…" : label}
      {failed ? <span className="sr-only">Sign out failed — returning to the sign-in page.</span> : null}
    </button>
  );
}
