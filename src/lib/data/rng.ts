/**
 * DETERMINISTIC PRNG
 * ---------------------------------------------------------------------------
 * The demo data provider must produce the same numbers for the same inputs on
 * every render. `Math.random()` would cause React hydration mismatches and
 * make figures flicker between requests, so everything here is seeded.
 *
 * mulberry32 is tiny, fast and good enough for illustrative telemetry. It is
 * deliberately NOT used for anything security-relevant — reference IDs and
 * tokens use `node:crypto` (see lib/utilities/reference.ts).
 */

/** FNV-1a 32-bit string hash — stable across processes and restarts. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createRng(seed: number | string) {
  let state = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
  if (state === 0) state = 0x9e3779b9;

  /** Uniform float in [0, 1). */
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Float in [min, max). */
    range: (min: number, max: number) => min + next() * (max - min),
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    /** True with probability p. */
    chance: (p: number) => next() < p,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
  };
}

export type Rng = ReturnType<typeof createRng>;

/**
 * Quantises time into buckets so a value derived from "now" stays stable within
 * a bucket. Used to make the demo telemetry feel alive across a refresh without
 * changing between the server render and the client hydration of one request.
 */
export function timeBucket(date: Date = new Date(), seconds = 30): number {
  return Math.floor(date.getTime() / 1000 / seconds);
}

/** Smooth pseudo-noise in [-1, 1] for a seed and a fractional position. */
export function noise(seed: string, position: number): number {
  const floor = Math.floor(position);
  const t = position - floor;
  const a = (createRng(`${seed}:${floor}`).next() - 0.5) * 2;
  const b = (createRng(`${seed}:${floor + 1}`).next() - 0.5) * 2;
  // Smoothstep interpolation avoids visible linear segments in the chart.
  const smooth = t * t * (3 - 2 * t);
  return a + (b - a) * smooth;
}
