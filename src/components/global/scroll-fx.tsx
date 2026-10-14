"use client";

import { useEffect, useRef } from "react";

import { getGsap } from "@/animations/gsap";

/**
 * ScrollFx — the site-wide scroll nervous system.
 * ---------------------------------------------------------------------------
 *   1. PROGRESS RAIL  a hairline at the very top of the viewport, gradient
 *                     azure → aurora violet, tracking total page progress.
 *   2. PARALLAX       any element carrying `data-parallax="<0.1..1.2>"` drifts
 *                     against the scroll inside its clipped frame. The image
 *                     plates are over-scaled by their owners (scale ~1.2) so
 *                     the drift never exposes an edge.
 *
 * Nothing here ever hides content: without JS, or under
 * `prefers-reduced-motion`, every element simply sits still, fully visible
 * (§37). The engine re-scans when the DOM changes (client-side navigation)
 * so parallax survives route transitions without remounting the layout.
 */

export function ScrollFx() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    /* ------------------------------------------------------ progress rail --- */
    let raf = 0;
    let scheduled = false;

    const updateBar = () => {
      scheduled = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        raf = window.requestAnimationFrame(updateBar);
      }
    };

    updateBar();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* ---------------------------------------------------- parallax engine --- */
    const cleanups: Array<() => void> = [];
    let scanTimer: number | undefined;
    let tweens: Array<{ kill: () => void; scrollTrigger?: { kill: () => void } }> = [];

    const killTweens = () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      tweens = [];
    };

    const scan = () => {
      killTweens();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const { gsap } = getGsap();
      const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

      for (const el of targets) {
        const raw = Number.parseFloat(el.dataset.parallax ?? "0.35");
        const speed = Math.min(1.2, Math.max(0.1, Number.isFinite(raw) ? raw : 0.35));
        const scope = el.parentElement ?? el;
        const tween = gsap.fromTo(
          el,
          { y: 84 * speed },
          {
            y: -84 * speed,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.65,
            },
          },
        );
        tweens.push(tween);
      }

      updateBar();
    };

    scan();

    /* Re-scan (debounced) when the route content changes underneath us. */
    const scheduleScan = () => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 250);
    };
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(scanTimer);
      observer.disconnect();
      killTweens();
      for (const fn of cleanups) fn();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[2px]">
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-ice via-[#7db4ff] to-glow shadow-[0_0_14px_rgba(143,123,255,0.75)]"
      />
    </div>
  );
}
