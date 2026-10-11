"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

import { WordmarkGlyph } from "@/components/navigation/wordmark";
import { Cta } from "@/components/ui/cta";
import { useLockBodyScroll } from "@/hooks";
import { navigation, primaryCta, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

/**
 * MOBILE MENU (§34)
 * ---------------------------------------------------------------------------
 * A full-viewport cold chamber of links. Mobile is treated as its own design,
 * not a collapsed desktop nav: large tap targets, staggered reveal, and the
 * location/CTA kept visible because §34 requires CTA visibility on mobile.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  useLockBodyScroll(open);

  // Close on route change and on Escape; return focus to the toggle.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[90] lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      {/* Backdrop: dark navy + frost blur + a cold pool at the top */}
      <div
        className="absolute inset-0 bg-midnight/96 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(0,245,212,0.20), transparent 70%)",
        }}
      />
      <div aria-hidden className="tj-grid-fine absolute inset-0 opacity-30" />

      <div className="relative flex h-full flex-col overflow-y-auto px-6 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <WordmarkGlyph size={30} className="text-ice" />
            <span className="font-mono text-[0.5625rem] tracking-[0.24em] text-silver-dim uppercase">
              Menu
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-[2px] border border-hull-line bg-hull/40 text-frost transition-colors duration-300 hover:border-glow/50 hover:text-glow"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <nav className="mt-12 flex-1" aria-label="Mobile">
          <ul className="flex flex-col">
            {navigation.map((item, index) => {
              const active =
                item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <motion.li
                  key={item.href}
                  initial={reduced ? false : { opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduced ? 0 : 0.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduced ? 0 : 0.06 + index * 0.055,
                  }}
                  className="border-b border-hull-line/60"
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-baseline justify-between gap-4 py-5",
                      "font-display text-[1.75rem] font-semibold tracking-[-0.02em] uppercase",
                      active ? "text-glow" : "text-frost",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:translate-x-1">
                      {item.label}
                    </span>
                    <span className="tabular font-mono text-[0.625rem] tracking-[0.2em] text-silver-dim">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <Cta href={primaryCta.href} size="lg" className="w-full" magnetic={false}>
            {primaryCta.label}
          </Cta>

          <address className="mt-6 not-italic">
            <p className="tj-label">Facility</p>
            <p className="mt-2 text-sm leading-relaxed text-silver">
              {siteConfig.location.facility}
              <br />
              {siteConfig.location.city}, {siteConfig.location.country}
            </p>
            {siteConfig.contact.phone ? (
              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="mt-3 inline-block font-mono text-sm text-ice"
              >
                {siteConfig.contact.phoneDisplay ?? siteConfig.contact.phone}
              </a>
            ) : (
              <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.1em] text-silver-dim uppercase">
                Contact details pending confirmation
              </p>
            )}
          </address>
        </motion.div>
      </div>
    </motion.div>
  );
}
