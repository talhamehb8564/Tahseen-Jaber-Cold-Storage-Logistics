import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

/**
 * DATABASE CLIENT
 * ---------------------------------------------------------------------------
 * §03 — the connection string is read from `process.env.DATABASE_URL` at run
 * time and is never prefixed with NEXT_PUBLIC_, so it can never reach the
 * browser bundle. Only server-only modules import this file.
 *
 * The client is created lazily. This matters: Next.js evaluates route modules
 * during `next build` to prerender static pages, and importing a driver that
 * eagerly opens a socket would fail every build that has no database attached.
 *
 * The site is designed to run without a database (§40). When DATABASE_URL is
 * absent, `getDb()` returns null and the data layer transparently serves the
 * clearly-labelled demo provider instead of throwing at render time.
 */

export type Database = PostgresJsDatabase<typeof schema>;

let instance: Database | null = null;
let client: postgres.Sql | null = null;

/** True when a usable connection string is present in the environment. */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && url.trim().length > 0;
}

/** Returns the shared client, or `null` when no database is configured. */
export function getDb(): Database | null {
  if (!isDatabaseConfigured()) return null;
  if (instance) return instance;

  client = postgres(process.env.DATABASE_URL as string, {
    // Connection pool sized for a serverless/edge-ish deployment.
    max: Number(process.env.DATABASE_POOL_MAX ?? 8),
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    // Prepared statements break behind most transaction-mode poolers.
    prepare: false,
    // Fail fast rather than hanging a request on an unreachable host.
    onnotice: () => {},
    transform: { undefined: null },
  });

  instance = drizzle(client, { schema, logger: false });
  return instance;
}

export class DatabaseNotConfiguredError extends Error {
  readonly code = "DATABASE_NOT_CONFIGURED";

  constructor() {
    super(
      "DATABASE_URL is not configured. Set it in .env.local, or run in demo mode by leaving it unset.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/** For writes that genuinely cannot proceed without a database. */
export function requireDb(): Database {
  const db = getDb();
  if (!db) throw new DatabaseNotConfiguredError();
  return db;
}

/**
 * Cheap liveness probe used by the admin command center and /api/health so an
 * operator can tell "database unreachable" apart from "database not configured".
 */
export async function checkDatabase(): Promise<
  { status: "connected" } | { status: "not_configured" } | { status: "unreachable"; message: string }
> {
  if (!isDatabaseConfigured()) return { status: "not_configured" };
  const db = getDb();
  if (!db) return { status: "not_configured" };

  try {
    await db.execute(sql`select 1`);
    return { status: "connected" };
  } catch (error) {
    // Technical detail is logged server-side only; §39 forbids leaking it.
    console.error("[db] health check failed", error);
    return {
      status: "unreachable",
      message: error instanceof Error ? error.message : "unknown error",
    };
  }
}

/** Close the pool — used by the seed script and graceful shutdown. */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    instance = null;
  }
}

// Re-exported so callers do not need a second drizzle-orm import.
export { sql, and, or, eq, ne, desc, asc, inArray, gte, lte, gt, lt, count, isNull } from "drizzle-orm";
export { schema };
