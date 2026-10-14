import { createHash } from "node:crypto";

/**
 * RATE LIMITING & ABUSE PROTECTION (§38)
 * ---------------------------------------------------------------------------
 * A fixed-window counter keyed by a *hashed* client identity. The raw IP is
 * never stored: only a salted SHA-256 digest, which is enough to throttle a
 * single client while keeping the data non-identifying.
 *
 * This store is per-process. It is correct and sufficient for a single
 * deployment, and for multi-instance production deployments the same interface
 * should be backed by Redis/Upstash — swap `store` without touching callers.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const SWEEP_INTERVAL_MS = 60_000;
const MAX_KEYS = 20_000;

let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  // Hard cap: if a flood fills the map, drop the oldest-expiring entries.
  if (store.size > MAX_KEYS) {
    const entries = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of entries.slice(0, Math.floor(MAX_KEYS / 2))) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  resetInSeconds: number;
}

export interface RateLimitOptions {
  /** Maximum requests inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Namespace so different endpoints do not share a counter. */
  key: string;
  /** Client identity — typically the hashed IP, optionally plus a form id. */
  identity: string;
}

export function rateLimit({ limit, windowSeconds, key, identity }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucketKey = `${key}:${identity}`;
  const windowMs = windowSeconds * 1000;
  const existing = store.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetInSeconds: windowSeconds };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(0, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { success: false, limit, remaining: 0, resetInSeconds };
  }

  return { success: true, limit, remaining: limit - existing.count, resetInSeconds };
}

/**
 * Salted digest of a client identity.
 * The salt is per-process and never persisted, so digests cannot be correlated
 * across restarts or used to reconstruct the underlying value.
 */
const SALT = createHash("sha256")
  .update(process.env.AUTH_SECRET ?? "tahseen-jaber-local-dev-salt")
  .digest("hex")
  .slice(0, 16);

export function hashIdentity(value: string): string {
  return createHash("sha256").update(`${SALT}:${value}`).digest("hex").slice(0, 32);
}

/**
 * Client IP extraction.
 * Behind a trusted proxy/platform the forwarded header is authoritative;
 * otherwise fall back to the socket address. Only the first entry of a
 * forwarded chain is used, since later entries are client-controlled.
 */
export function getClientIp(headers: Headers, socketAddress?: string | null): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.trim();
  return socketAddress ?? "unknown";
}

/**
 * Limit budgets, from the environment with sane defaults.
 *
 * Login gets its own, tighter budget than inquiries: a public form is spammed in
 * bursts by bots, whereas sign-in is attacked by slow credential guessing, so the
 * useful defence is a low ceiling over a longer window. Both are per-hashed-IP,
 * which is why `key` is part of the bucket name in `rateLimit()`.
 */
export function limitConfig() {
  const positive = (value: number, fallback: number) =>
    Number.isFinite(value) && value > 0 ? value : fallback;

  const windowSeconds = positive(Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 600), 600);
  const maxInquiries = positive(Number(process.env.RATE_LIMIT_MAX_INQUIRIES ?? 5), 5);
  const maxLogins = positive(Number(process.env.RATE_LIMIT_MAX_LOGINS ?? 8), 8);
  const maxAdminWrites = positive(Number(process.env.RATE_LIMIT_MAX_ADMIN_WRITES ?? 60), 60);

  return { windowSeconds, maxInquiries, maxLogins, maxAdminWrites };
}
