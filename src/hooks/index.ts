"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared media-query hook. SSR-safe: the server value is always the
 * non-matching default, and the real value is resolved on first paint.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * §07 / §34 / §37 — `prefers-reduced-motion`.
 * Every parallax, pinned section, particle field and the custom cursor gate on
 * this. It is reactive so a change in OS settings is picked up live.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}

/**
 * §08 — the custom cursor is desktop-only.
 * A fine pointer plus hover capability plus a wide viewport. Touch devices,
 * tablets and reduced-motion users never receive it.
 */
export function useCustomCursorEnabled(): boolean {
  const fine = useMediaQuery("(pointer: fine) and (hover: hover)", false);
  const wide = useMediaQuery("(min-width: 1024px)", false);
  const reduced = useReducedMotion();
  return fine && wide && !reduced;
}

/** True on viewports where hover interactions must become tap interactions. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)", false);
}

/** Locks background scroll (menus, modals) and restores the previous offset. */
export function useLockBodyScroll(locked: boolean) {
  const offset = useRef(0);

  useEffect(() => {
    if (!locked) return;
    offset.current = window.scrollY;
    const { body } = document;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${offset.current}px`;
    body.style.width = "100%";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo({ top: offset.current, behavior: "instant" as ScrollBehavior });
    };
  }, [locked]);
}

/**
 * §32 — number transitions. Eases a value toward its target with rAF so
 * telemetry and analytics figures count instead of snapping.
 */
export function useCountUp(
  target: number,
  { duration = 900, decimals = 0, enabled = true }: { duration?: number; decimals?: number; enabled?: boolean } = {},
): string {
  const [value, setValue] = useState(enabled ? 0 : target);
  const reduced = useReducedMotion();
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || reduced) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = value;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutExpo — matches the `cold` curve used elsewhere.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // `value` and `reduced` intentionally excluded to avoid restart loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  return value.toFixed(decimals);
}

/**
 * Tracks normalised scroll progress (0 → 1) of an element through the viewport.
 * Lightweight replacement for a ScrollTrigger instance where only a progress
 * number is needed.
 */
export function useElementProgress<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = node.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const seen = window.innerHeight - rect.top;
      setProgress(Math.min(1, Math.max(0, seen / total)));
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
  }, [enabled]);

  return { ref, progress };
}

/** Fires once when an element first enters the viewport. */
export function useInView<T extends HTMLElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean; enabled?: boolean } = {},
) {
  const { threshold = 0.25, rootMargin = "0px 0px -10% 0px", once = true, enabled = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setInView(true);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        if (visible) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, enabled]);

  return { ref, inView };
}

/** Debounced pointer position, used by the cursor and magnetic elements. */
export function usePointer(enabled = true) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    let ticking = false;
    let latest = { x: 0, y: 0 };

    const onMove = (event: PointerEvent) => {
      latest = { x: event.clientX, y: event.clientY };
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setPointer(latest);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  return pointer;
}

/** Copy-to-clipboard with transient state, for reference IDs and batch codes. */
export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), timeout);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [timeout],
  );

  return { copied, copy };
}
