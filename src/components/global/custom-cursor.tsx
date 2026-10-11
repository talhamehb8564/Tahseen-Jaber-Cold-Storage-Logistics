"use client";

import { useEffect, useRef, useState } from "react";

import { useCustomCursorEnabled } from "@/hooks";
import { cn } from "@/lib/utilities/cn";

/**
 * CUSTOM CURSOR (§08)
 * ---------------------------------------------------------------------------
 * Desktop only. A small frost/cyan core plus a soft translucent ring that
 * interpolates behind it — the lag between the two is what makes it feel like an
 * instrument rather than a sticker.
 *
 * States are declared in markup, not in code: any element may opt in with
 *   data-cursor="explore" | "inspect" | "view" | "drag" | "none"
 * which keeps this component generic and lets content authors control it.
 *
 * Hard rules honoured here:
 *   - never mounted on touch devices, tablets or narrow viewports (§34)
 *   - never mounted for `prefers-reduced-motion` users (§07, §37)
 *   - the native cursor is only hidden once this component is live, so a JS
 *     failure can never leave the visitor without a pointer
 *   - position updates run in rAF against refs; React never re-renders on move
 */

export type CursorState = "default" | "explore" | "inspect" | "view" | "drag" | "active";

const LABELS: Partial<Record<CursorState, string>> = {
  explore: "EXPLORE",
  inspect: "INSPECT",
  view: "VIEW",
  drag: "DRAG",
};

const SIZES: Record<CursorState, number> = {
  default: 30,
  explore: 54,
  inspect: 68,
  view: 68,
  drag: 60,
  active: 22,
};

export function CustomCursor() {
  const enabled = useCustomCursorEnabled();
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const coreRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  // Pointer target vs. interpolated ring position.
  const target = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const core = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);
  /** The state the element under the pointer asked for, kept across a press. */
  const pending = useRef<CursorState>("default");
  const pressedRef = useRef(false);
  const visibleRef = useRef(false);

  /* --- Mount / unmount the native cursor --------------------------------- */
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("tj-cursor-active");
    return () => root.classList.remove("tj-cursor-active");
  }, [enabled]);

  /* --- Interpolation loop ------------------------------------------------- */
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      // Core tracks almost immediately; the ring lags behind it.
      core.current.x += (target.current.x - core.current.x) * 0.55;
      core.current.y += (target.current.y - core.current.y) * 0.55;
      ring.current.x += (target.current.x - ring.current.x) * 0.16;
      ring.current.y += (target.current.y - ring.current.y) * 0.16;

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${core.current.x}px, ${core.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [enabled]);

  /* Reduced-motion users keep the CSS transition on the ring (it is a hover
     affordance, not decorative motion); the interpolation loop is already
     gated behind `enabled`, which is false for them. */

  /* --- Pointer + state listeners ------------------------------------------ */
  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      target.current = { x: event.clientX, y: event.clientY };
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      const host = (event.target as Element | null)?.closest?.("[data-cursor]");
      const requested = (host?.getAttribute("data-cursor") as CursorState | null) ?? "default";

      // Remember what the element asked for, so releasing a press restores it
      // without re-querying :hover (which is unreliable mid-gesture).
      pending.current = requested;
      if (!pressedRef.current) setState(requested);
    };

    const onDown = () => {
      pressedRef.current = true;
      setPressed(true);
      setState("active");
    };

    const onUp = () => {
      pressedRef.current = false;
      setPressed(false);
      setState(pending.current);
    };

    const hide = () => {
      visibleRef.current = false;
      setVisible(false);
    };
    const show = () => {
      visibleRef.current = true;
      setVisible(true);
    };
    const onLeave = hide;
    const onEnter = show;
    const onBlur = hide;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = SIZES[state];
  const label = LABELS[state];
  const hidden = !visible;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block"
      data-cursor-root
    >
      {/* --- Outer ring ----------------------------------------------------- */}
      <div
        ref={ringRef}
        className={cn(
          "absolute top-0 left-0 flex items-center justify-center rounded-full",
          "border transition-[width,height,background-color,border-color,opacity] duration-[420ms]",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          hidden && "opacity-0",
          label
            ? "border-glow/55 bg-midnight/72 backdrop-blur-[3px] shadow-[0_0_22px_rgba(0,245,212,0.30)]"
            : "border-glow/25 bg-glow/[0.05] shadow-[0_0_14px_rgba(0,245,212,0.14)]",
          pressed && "scale-95",
        )}
        style={{
          width: size,
          height: size,
          opacity: visible ? 1 : 0,
          willChange: "transform, width, height",
        }}
      >
        {label ? (
          <span className="font-mono text-[0.5rem] font-medium tracking-[0.16em] text-glow uppercase select-none">
            {label}
          </span>
        ) : null}
      </div>

      {/* --- Core ----------------------------------------------------------- */}
      <div
        ref={coreRef}
        className={cn(
          "absolute top-0 left-0 rounded-full transition-[width,height,opacity,background-color]",
          "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        )}
        style={{
          width: state === "active" ? 4 : 6,
          height: state === "active" ? 4 : 6,
          opacity: visible ? (label ? 0.25 : 1) : 0,
          background: label
            ? "transparent"
            : "radial-gradient(circle, #eafcff 0%, #00f5d4 52%, rgba(72,202,228,0.35) 100%)",
          boxShadow: label
            ? "none"
            : "0 0 12px rgba(0,245,212,0.9), 0 0 28px rgba(72,202,228,0.45)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
