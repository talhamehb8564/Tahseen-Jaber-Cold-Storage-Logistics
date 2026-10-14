"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useRef, type ReactNode } from "react";

import { magnetic } from "@/animations/variants";
import { useMediaQuery } from "@/hooks";

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Attraction strength multiplier. 1 is the design-system default. */
  strength?: number;
  /** Disable magnetism (touch, reduced motion) — element still renders. */
  disabled?: boolean;
}

/**
 * MAGNETIC WRAPPER (§14, §32)
 * ---------------------------------------------------------------------------
 * The element drifts toward the cursor inside a small radius and springs back.
 * The inner content travels further than the shell, which is what makes it read
 * as depth rather than as a sliding box.
 *
 * Disabled for coarse pointers and reduced-motion users (§08, §34, §37):
 * the component renders its children untouched in those cases.
 */
export function Magnetic({ children, className, strength = 1, disabled = false }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)", false);
  const active = !disabled && !reduced && !coarse;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const shellX = useSpring(x, { stiffness: 220, damping: 22, mass: 0.4 });
  const shellY = useSpring(y, { stiffness: 220, damping: 22, mass: 0.4 });
  const labelX = useTransform(shellX, (value) => value * 0.45);
  const labelY = useTransform(shellY, (value) => value * 0.45);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!active) return;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

      if (distance > rect.width / 2 + magnetic.radius) {
        x.set(0);
        y.set(0);
        return;
      }

      const falloff = Math.max(0, 1 - distance / (rect.width / 2 + magnetic.radius));
      x.set((event.clientX - centerX) * magnetic.strength * strength * (0.45 + falloff * 0.55));
      y.set((event.clientY - centerY) * magnetic.strength * strength * (0.45 + falloff * 0.55));
    },
    [active, strength, x, y],
  );

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onBlur={reset}
      style={{ x: shellX, y: shellY }}
    >
      <motion.div style={{ x: labelX, y: labelY }}>{children}</motion.div>
    </motion.div>
  );
}
