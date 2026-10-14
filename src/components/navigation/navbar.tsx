"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ScrollProgress } from "@/components/navigation/scroll-progress";
import { Wordmark } from "@/components/navigation/wordmark";
import { Cta } from "@/components/ui/cta";
import { navigation, primaryCta, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utilities/cn";

/**
 * NAVBAR (§15)
 * ---------------------------------------------------------------------------
 * Transparent and frosted over the hero, then transitions on scroll into a
 * darker glass with blur, reduced height and a subtle border.
 *
 * The transition is a single CSS transition on the same elements — height,
 * backdrop and border all animate on the `cold` curve, so there is no abrupt
 * jump and no layout shift (the bar is `fixed`, and the page reserves its space
 * with padding rather than relying on the bar's height).
 *
 * Scroll state is read in rAF and only sets React state when the boolean
 * actually flips, so scrolling does not re-render the tree.
 */

const SCROLL_THRESHOLD = 24;

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const next = window.scrollY > SCROLL_THRESHOLD;
      if (next !== scrolledRef.current) {
        scrolledRef.current = next;
        setScrolled(next);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Correct on first paint (e.g. a restored scroll position or a reload
    // part-way down the page).
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    // Return focus to the toggle so keyboard users are not stranded.
    window.setTimeout(() => toggleRef.current?.focus(), 60);
  }, []);

  const isActive = (href: string, match: string) =>
    match === "exact" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <a href="#main" className="sr-focusable">
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[80] transition-[background-color,backdrop-filter,border-color,height]",
          "duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "h-16 border-b border-glow/18 bg-midnight/72 backdrop-blur-xl backdrop-saturate-150 shadow-[0_14px_44px_-24px_rgba(143,123,255,0.35)]"
            : "h-20 border-b border-transparent bg-gradient-to-b from-midnight/62 to-transparent backdrop-blur-[3px]",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[86rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          {/* --- Wordmark -------------------------------------------------- */}
          <Link
            href="/"
            aria-label={`${siteConfig.brand.name} — home`}
            className="group -ml-1 flex items-center rounded-[2px] py-1 pr-2 pl-1 transition-opacity duration-300 hover:opacity-90"
            data-cursor="explore"
          >
            <Wordmark
              size={scrolled ? 28 : 34}
              className="transition-all duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
          </Link>

          {/* --- Desktop navigation ---------------------------------------- */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navigation.map((item) => {
                const active = isActive(item.href, item.match);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative block px-3.5 py-2 font-mono text-[0.625rem] font-medium",
                        "tracking-[0.2em] uppercase transition-colors duration-300",
                        active ? "text-frost" : "text-silver hover:text-frost",
                      )}
                    >
                      {item.label}
                      {/* Active indicator: a rule that draws in from the left */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-3.5 -bottom-px h-px origin-left transition-transform",
                          "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          active ? "scale-x-100 bg-glow" : "scale-x-0 bg-silver/45 group-hover:scale-x-100",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* --- Actions ---------------------------------------------------- */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:block">
              <Cta href={primaryCta.href} size="sm" variant="primary">
                {primaryCta.label}
              </Cta>
            </div>

            {/* Sign-in opens the frosted modal in place, so the visitor never
                loses their position on the page (§33). */}
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className={cn(
                "hidden h-9 items-center rounded-[2px] border border-hull-line px-3.5",
                "font-mono text-[0.625rem] tracking-[0.18em] text-silver uppercase",
                "transition-all duration-300 hover:border-glow/45 hover:text-frost",
                "focus-visible:ring-2 focus-visible:ring-glow focus-visible:outline-none lg:inline-flex",
              )}
              aria-haspopup="dialog"
              aria-expanded={authOpen}
            >
              Portal
            </button>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={cn(
                "flex size-11 items-center justify-center rounded-[2px] border transition-colors duration-300 lg:hidden",
                menuOpen
                  ? "border-glow/50 text-glow"
                  : "border-hull-line bg-hull/35 text-frost hover:border-glow/45",
              )}
            >
              <Menu size={19} strokeWidth={1.6} aria-hidden />
            </button>
          </div>
        </div>

        <ScrollProgress className="absolute inset-x-0 bottom-0" />
      </header>

      <div id="mobile-menu">
        <MobileMenu open={menuOpen} onClose={closeMenu} />
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        from={pathname === "/login" ? undefined : pathname}
      />
    </>
  );
}
