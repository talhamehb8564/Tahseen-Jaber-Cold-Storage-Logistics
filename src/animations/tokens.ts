/**
 * MOTION TOKENS — the shared timing vocabulary.
 * ---------------------------------------------------------------------------
 * §07 requires consistent easing and forbids "dozens of unrelated animation
 * timings". Nothing in the product defines its own duration or curve; it takes
 * one of these. If a new feel is genuinely needed, add it here so it stays
 * reviewable in one place.
 */

/** Seconds. Used by Framer Motion (`motion/react`). */
export const DURATION = {
  instant: 0.15,
  fast: 0.3,
  base: 0.5,
  slow: 0.8,
  cinematic: 1.4,
  hero: 2.2,
} as const;

/** Milliseconds. Used by CSS transitions and GSAP timelines. */
export const DURATION_MS = {
  instant: 150,
  fast: 300,
  base: 500,
  slow: 800,
  cinematic: 1400,
} as const;

/**
 * Cubic-bezier control points, as an array for `motion` and as a string for CSS.
 *
 * Declared as mutable 4-tuples rather than `as const`: motion's `Easing` type
 * requires a writable tuple, and a readonly one is not assignable to it.
 *
 * cold    — the signature curve. Fast out, long settle. Used for reveals.
 * frost   — softer settle. Used for panels, hover lifts, page transitions.
 * machine — symmetric in/out. Used for machinery: doors, docks, trucks.
 * dock    — neutral UI curve. Used for menus, tooltips, small state changes.
 */
export type Bezier = [number, number, number, number];

export const EASE: Record<string, Bezier> & {
  cold: Bezier;
  frost: Bezier;
  machine: Bezier;
  dock: Bezier;
} = {
  cold: [0.22, 1, 0.36, 1],
  frost: [0.16, 1, 0.3, 1],
  machine: [0.65, 0, 0.35, 1],
  dock: [0.4, 0, 0.2, 1],
};

export type EaseName = keyof typeof EASE;

export const EASE_CSS: Record<EaseName, string> = {
  cold: "cubic-bezier(0.22, 1, 0.36, 1)",
  frost: "cubic-bezier(0.16, 1, 0.3, 1)",
  machine: "cubic-bezier(0.65, 0, 0.35, 1)",
  dock: "cubic-bezier(0.4, 0, 0.2, 1)",
};

/** GSAP accepts the same control points as a "cubic-bezier" style string. */
export const EASE_GSAP: Record<EaseName, string> = {
  cold: "power4.out",
  frost: "power3.out",
  machine: "power2.inOut",
  dock: "power2.out",
};

/**
 * Stagger values. Kept deliberately short: a long stagger reads as decorative
 * rather than engineered.
 */
export const STAGGER = {
  tight: 0.04,
  base: 0.07,
  relaxed: 0.12,
} as const;

/** Page-transition envelope (§33 — 300ms to 800ms, never longer). */
export const PAGE_TRANSITION = {
  out: DURATION.fast,
  in: DURATION.slow,
  hold: 0.12,
} as const;
