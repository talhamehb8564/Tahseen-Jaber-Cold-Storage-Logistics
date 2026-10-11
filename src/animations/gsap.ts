"use client";

/**
 * GSAP bootstrap — client-only, registered exactly once.
 * ---------------------------------------------------------------------------
 * §35: GSAP is only imported by components that actually need scroll-driven or
 * timeline animation. Nothing here is reachable from a server component.
 *
 * `ScrollTrigger` lives in its own module and is NOT a property of the `gsap`
 * default export, so destructuring `{ gsap, ScrollTrigger }` from `registerGsap()`
 * cannot type-check. `getGsap()` is the single accessor that returns both with
 * their correct types.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Idempotent plugin registration. Returns gsap for timeline construction. */
export function registerGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", overwrite: "auto" });
    registered = true;
  }
  return gsap;
}

/**
 * The accessor client components should use inside an effect.
 * Registering on every call is cheap (a boolean guard) and removes the easy
 * mistake of using ScrollTrigger before it has been registered.
 */
export function getGsap(): { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger } {
  registerGsap();
  return { gsap, ScrollTrigger };
}

/** Convenience aliases for annotations. */
export type GsapTimeline = ReturnType<typeof gsap.timeline>;
export type GsapScrollTrigger = ScrollTrigger;

export { gsap, ScrollTrigger };
