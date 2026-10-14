"use client";

import { useCallback, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utilities/cn";

/**
 * TiltCard — a 3D perspective tilt wrapper.
 * ---------------------------------------------------------------------------
 * The card leans toward the pointer on two spring-damped axes and carries an
 * aurora-violet glare that tracks the cursor across its surface. Only engages
 * for fine pointers (mouse); touch and `prefers-reduced-motion` visitors get
 * a completely still card (§34, §37) — the wrapper is then a plain div.
 *
 * Pass the corner radius through `className` (e.g. `rounded-3xl`) so the
 * glare layer inherits it.
 */
export function TiltCard({
  children,
  className,
  intensity = 7,
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum lean in degrees. */
  intensity?: number;
}) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement | null>(null);

  const rotateXValue = useMotionValue(0);
  const rotateYValue = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const rotateX = useSpring(rotateXValue, { stiffness: 160, damping: 18, mass: 0.6 });
  const rotateY = useSpring(rotateYValue, { stiffness: 160, damping: 18, mass: 0.6 });
  const glare = useMotionTemplate`radial-gradient(460px circle at ${glareX}% ${glareY}%, rgba(182, 106, 60, 0.16), transparent 58%)`;

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = frameRef.current;
      if (!el || reduced || event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      rotateYValue.set((px - 0.5) * 2 * intensity);
      rotateXValue.set(-(py - 0.5) * 2 * intensity);
      glareX.set(px * 100);
      glareY.set(py * 100);
    },
    [intensity, reduced, rotateXValue, rotateYValue, glareX, glareY],
  );

  const onLeave = useCallback(() => {
    rotateXValue.set(0);
    rotateYValue.set(0);
  }, [rotateXValue, rotateYValue]);

  return (
    <motion.div
      ref={frameRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={cn("relative", className)}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: glare }}
      />
    </motion.div>
  );
}
