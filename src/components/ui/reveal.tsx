"use client";

import { motion, useReducedMotion as useMotionReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utilities/cn";

import {
  fadeIn,
  fadeUp,
  frostReveal,
  revealMask,
  scaleIn,
  slideIn,
  staticPreset,
} from "@/animations/variants";

export type RevealPreset =
  | "fadeUp"
  | "fadeIn"
  | "scaleIn"
  | "slideInLeft"
  | "slideInRight"
  | "revealMask"
  | "frostReveal";

const PRESETS: Record<RevealPreset, (delay: number) => ReturnType<typeof fadeUp>> = {
  fadeUp: (delay) => fadeUp(28, delay),
  fadeIn: (delay) => fadeIn(delay),
  scaleIn: (delay) => scaleIn(0.94, delay),
  slideInLeft: (delay) => slideIn("x", -48, delay),
  slideInRight: (delay) => slideIn("x", 48, delay),
  revealMask: (delay) => revealMask("up", delay),
  frostReveal: (delay) => frostReveal(delay),
};


/**
 * Narrow polymorphic tag set for the reveal family.
 *
 * A loose `ElementType` once worked, but @react-three/fiber augments the
 * global JSX intrinsic elements with three.js tags, which poisons any
 * union-typed JSX tag ("children expects never"). The reveal primitives only
 * ever render HTML flow content, so the union stays deliberately narrow.
 */
export type RevealTag =
  | "div"
  | "span"
  | "section"
  | "header"
  | "footer"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "ul"
  | "ol"
  | "li"
  | "article"
  | "figure"
  | "figcaption"
  | "blockquote";

interface RevealProps {
  children: ReactNode;
  preset?: RevealPreset;
  /** Seconds before the animation starts once in view. */
  delay?: number;
  /** IntersectionObserver threshold. */
  amount?: number;
  className?: string;
  as?: RevealTag;
  /** Skip the animation entirely (renders static markup). */
  disabled?: boolean;
  id?: string;
}

/**
 * The one reveal primitive used across the marketing site (§07, §16).
 *
 * Animation only starts when the element is actually in view, so nothing below
 * the fold burns main-thread time during load. Under `prefers-reduced-motion`
 * the element resolves to its final state with no transition at all.
 */
export function Reveal({
  children,
  preset = "fadeUp",
  delay = 0,
  amount = 0.25,
  className,
  as = "div",
  disabled = false,
  id,
}: RevealProps) {
  const reduced = useMotionReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (disabled || reduced) {
    const Tag = as;
    return (
      <Tag id={id} className={className}>
        {children}
      </Tag>
    );
  }

  const variant = PRESETS[preset](delay);

  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: variant.hidden,
        visible: variant.visible,
      }}
      // Guarantees content is never stranded invisible if the observer misses.
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </MotionTag>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Per-child delay increment, in seconds. */
  stagger?: number;
  preset?: RevealPreset;
  as?: RevealTag;
  amount?: number;
}

/** Staggers its direct children — used for card grids and stage lists. */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
  preset = "fadeUp",
  as = "div",
  amount = 0.2,
}: RevealGroupProps) {
  const reduced = useMotionReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  const items = Array.isArray(children) ? children : [children];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {items.map((child, index) => (
        <motion.div key={index} variants={{ hidden: PRESETS[preset](0).hidden, visible: PRESETS[preset](0).visible }}>
          {child}
        </motion.div>
      ))}
    </MotionTag>
  );
}

/**
 * Line-mask text reveal (§06, §12).
 * Reveals whole lines from behind an overflow mask — never letter by letter.
 */
export function TextReveal({
  lines,
  className,
  lineClassName,
  delay = 0,
  as = "h2",
}: {
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: RevealTag;
}) {
  const reduced = useMotionReducedMotion();
  const Tag = as;

  if (reduced) {
    return (
      <Tag className={className}>
        {lines.map((line, index) => (
          <span key={index} className={cnBlock(lineClassName)}>
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <span key={index} className="tj-mask">
          <motion.span
            className={cnBlock(lineClassName)}
            initial={{ y: "108%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + index * 0.11,
            }}
            style={{ display: "block", willChange: "transform" }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * WORD-BY-WORD REVEAL
 * ---------------------------------------------------------------------------
 * Headlines arrive one word at a time out of a line mask, each word also
 * resolving from a soft blur. The stagger is what makes a headline feel typed by
 * the facility rather than dropped in by a template.
 *
 * Words stay in real DOM text order and are split on whitespace only, so
 * screen readers announce the sentence once, not word by word: the individual
 * word spans are presentational and the whole element carries the accessible
 * text.
 *
 * `start` lets a caller hold the reveal until the right beat in a sequence —
 * the hero waits for the chamber doors, for instance. Under
 * `prefers-reduced-motion` the text renders complete with no transition.
 */
export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  duration = 0.95,
  as = "span",
  start = true,
  inView = false,
  amount = 0.5,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  /** Seconds between successive words. */
  stagger?: number;
  duration?: number;
  as?: RevealTag;
  /**
   * When false the reveal is driven by `start` — used above the fold, where the
   * element is already on screen at load.
   */
  start?: boolean;
  /**
   * When true the reveal fires the first time the heading scrolls into view
   * instead, so nothing below the fold animates before it can be seen.
   */
  inView?: boolean;
  /** IntersectionObserver threshold for `inView`. */
  amount?: number;
}) {
  const reduced = useMotionReducedMotion();
  const Tag = as;
  const words = text.split(/\s+/).filter(Boolean);

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="tj-mask inline-block overflow-hidden align-bottom"
          aria-hidden
        >
          <motion.span
            className={cn("inline-block whitespace-nowrap", wordClassName)}
            initial={{ y: "112%", opacity: 0, filter: "blur(10px)" }}
            animate={
              inView
                ? undefined
                : start
                  ? { y: "0%", opacity: 1, filter: "blur(0px)" }
                  : { y: "112%", opacity: 0, filter: "blur(10px)" }
            }
            whileInView={
              inView ? { y: "0%", opacity: 1, filter: "blur(0px)" } : undefined
            }
            viewport={inView ? { once: true, amount } : undefined}
            transition={{
              duration,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + index * stagger,
            }}
            style={{ willChange: "transform, opacity, filter" }}
          >
            {word}
          </motion.span>
          {/* The trailing space lives outside the mask so wrapping is natural. */}
          {index < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}

function cnBlock(value?: string) {
  return value ?? "block";
}

export { staticPreset };
