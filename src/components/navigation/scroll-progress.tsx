"use client";

import { useEffect, useRef } from "react";

/**
 * SCROLL PROGRESS
 * ---------------------------------------------------------------------------
 * A 1px line under the navbar showing document progress. Pure transform work in
 * rAF — no React state, so scrolling never triggers a re-render (§35).
 */
export function ScrollProgress({ className }: { className?: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = barRef.current;
    if (!node) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      node.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={className}
      style={{ height: 1, background: "rgba(0,245,212,0.10)" }}
    >
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{
          transform: "scaleX(0)",
          background: "linear-gradient(90deg, #48cae4, #00f5d4)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
