/**
 * MOTION PRESETS — the reusable animation library required by §07.
 * ---------------------------------------------------------------------------
 *   fadeUp · fadeIn · revealMask · textReveal · scaleIn · slideIn
 *   parallax · magnetic · hoverLift · frostReveal · temperatureShift
 *
 * Types come from `motion/react` as *type-only* imports, which are erased at
 * compile time — so this module stays safe to reference from server components
 * while still being checked against the real motion API.
 *
 * `Preset` is a type ALIAS rather than an interface on purpose: TypeScript only
 * grants an implicit index signature to aliases, and motion's `Variants` prop
 * requires one. Declaring it as an interface makes every `variants={preset}`
 * call site a type error.
 */

import type { Variant } from "motion/react";

import { DURATION, EASE, STAGGER, type Bezier } from "@/animations/tokens";

export type MotionState = Variant;

export type Preset = {
  hidden: Variant;
  visible: Variant;
};

const enter = (duration: number, ease: Bezier = EASE.cold, delay = 0) => ({
  duration,
  ease,
  delay,
});

/* --- fadeUp --------------------------------------------------------------- */
export const fadeUp = (distance = 28, delay = 0): Preset => ({
  hidden: { opacity: 0, y: distance },
  visible: { opacity: 1, y: 0, transition: enter(DURATION.slow, EASE.cold, delay) },
});

/* --- fadeIn --------------------------------------------------------------- */
export const fadeIn = (delay = 0): Preset => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: enter(DURATION.slow, EASE.frost, delay) },
});

/* --- revealMask ----------------------------------------------------------- */
/** Wipes a panel open from a chosen edge using clip-path — no layout shift. */
export const revealMask = (
  direction: "up" | "down" | "left" | "right" = "up",
  delay = 0,
): Preset => {
  const closed = {
    up: "inset(0 0 100% 0)",
    down: "inset(100% 0 0 0)",
    left: "inset(0 100% 0 0)",
    right: "inset(0 0 0 100%)",
  } as const;

  return {
    hidden: { clipPath: closed[direction] },
    visible: {
      clipPath: "inset(0 0 0 0)",
      transition: enter(DURATION.cinematic, EASE.cold, delay),
    },
  };
};

/* --- textReveal ----------------------------------------------------------- */
/**
 * Line-mask reveal: a parent staggers its children, each child slides up from
 * behind an `overflow: hidden` line. Reveals whole lines — §06/§12 explicitly
 * warn against animating every letter.
 */
export const textRevealContainer = (delay = 0): Preset => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER.relaxed, delayChildren: delay },
  },
});

export const textRevealLine: Preset = {
  hidden: { y: "108%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: enter(DURATION.cinematic, EASE.cold),
  },
};

/* --- scaleIn -------------------------------------------------------------- */
export const scaleIn = (from = 0.94, delay = 0): Preset => ({
  hidden: { opacity: 0, scale: from },
  visible: {
    opacity: 1,
    scale: 1,
    transition: enter(DURATION.slow, EASE.frost, delay),
  },
});

/* --- slideIn -------------------------------------------------------------- */
export const slideIn = (
  axis: "x" | "y" = "x",
  distance = 48,
  delay = 0,
): Preset => {
  // Written as explicit branches rather than a computed `[axis]` key: a computed
  // key widens the object to a `string` index signature, which motion's
  // `--${string}` CSS-variable signature rejects.
  const offset = axis === "x" ? { x: distance } : { y: distance };
  const settle = axis === "x" ? { x: 0 } : { y: 0 };

  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      ...settle,
      transition: enter(DURATION.slow, EASE.cold, delay),
    },
  };
};

/* --- parallax ------------------------------------------------------------- */
/**
 * Values are handed to a scroll-linked transform. Amplitudes stay small:
 * heavy parallax reads as a template, and §34 requires it to be reduced or
 * disabled on mobile and for reduced-motion users.
 */
export const parallaxRange = {
  subtle: [-12, 12],
  base: [-28, 28],
  deep: [-56, 56],
} as const;

/* --- magnetic ------------------------------------------------------------- */
/** Pointer-follow strength for MagneticButton, in pixels of travel. */
export const magnetic = {
  /** Cursor proximity that starts attracting the button. */
  radius: 110,
  /** Maximum travel of the button itself. */
  strength: 0.28,
  /** Maximum travel of the inner label (moves further — reads as depth). */
  labelStrength: 0.42,
  returnDuration: DURATION.slow,
  returnEase: EASE.cold,
} as const;

/* --- hoverLift ------------------------------------------------------------ */
export const hoverLift: Variant = {
  y: -4,
  transition: enter(DURATION.base, EASE.frost),
};

/* --- frostReveal ---------------------------------------------------------- */
/**
 * The signature surface transition: a panel arrives blurred and frosted, then
 * clears as if the glass warmed. Used for cards, panels and image reveals.
 */
export const frostReveal = (delay = 0): Preset => ({
  hidden: { opacity: 0, filter: "blur(14px)", scale: 1.03 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: enter(DURATION.cinematic, EASE.frost, delay),
  },
});

/* --- temperatureShift ----------------------------------------------------- */
/**
 * Drives the hero temperature interaction (§13). Maps a Celsius value to the
 * visual properties that should respond: frost density, light temperature,
 * condensation and mist. Pure function — no side effects, trivially testable.
 */
export interface TemperatureLook {
  /** 0–1 frost/condensation intensity. */
  frost: number;
  /** 0–1 mist density. */
  mist: number;
  /** Light colour, shifted warmer as temperature rises. */
  light: string;
  /** Ambient wash behind the scene. */
  wash: string;
  /** 0–1 — how "awake" the HUD looks. */
  hudIntensity: number;
  label: string;
}

export const TEMPERATURE_STOPS = [10, 0, -10, -20, -30] as const;
export const TEMPERATURE_MIN = -30;
export const TEMPERATURE_MAX = 10;

export function temperatureShift(celsius: number): TemperatureLook {
  const clamped = Math.min(TEMPERATURE_MAX, Math.max(TEMPERATURE_MIN, celsius));
  /** 0 at +10 °C, 1 at −30 °C. */
  const cold = (TEMPERATURE_MAX - clamped) / (TEMPERATURE_MAX - TEMPERATURE_MIN);

  const lerp = (a: number, b: number) => a + (b - a) * cold;
  const mix = (warm: [number, number, number], cool: [number, number, number]) => {
    const channel = (index: number) => Math.round(lerp(warm[index] ?? 0, cool[index] ?? 0));
    return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
  };

  return {
    frost: Number(cold.toFixed(3)),
    mist: Number((0.18 + cold * 0.72).toFixed(3)),
    // Warm steel above freezing -> ice blue -> electric cyan at deep freeze.
    light: mix([167, 180, 197], [34, 211, 238]),
    wash: mix([21, 34, 53], [8, 20, 38]),
    hudIntensity: Number((0.55 + cold * 0.45).toFixed(3)),
    label:
      clamped >= 8
        ? "CHILLED"
        : clamped >= 0
          ? "COOL"
          : clamped >= -12
            ? "COLD"
            : clamped >= -22
              ? "FROZEN"
              : "DEEP FROZEN",
  };
}

/* --- Reduced-motion equivalents ------------------------------------------- */
/**
 * Everything resolves to "already visible" so no JS branch is needed at the
 * call site — the hook returns these and the component animates nothing.
 */
export const staticPreset: Preset = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0 } },
};
