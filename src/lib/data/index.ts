import { cache } from "react";

import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { createDemoProvider } from "@/lib/data/demo";
import { createLiveProvider } from "@/lib/data/live";
import type { DataProvider, DataSourceInfo, DataSourceMode } from "@/lib/data/types";

/**
 * DATA PROVIDER RESOLVER (§40)
 * ---------------------------------------------------------------------------
 * Server-only. Every screen reads facility data through `getDataProvider()` and
 * never touches Drizzle directly, which is what makes the demo → live switch a
 * configuration change rather than a redesign.
 *
 * Resolution order:
 *   1. DATA_SOURCE_MODE=live AND a reachable database AND a migrated schema
 *      -> live provider (badge: LIVE)
 *   2. anything else
 *      -> demo provider (badge: SIMULATION) plus a human-readable reason
 *
 * A failure in live mode never throws to the visitor: it degrades to a labelled
 * simulation and logs the technical detail server-side (§39).
 */

const DEMO_REASONS = {
  noMode: "DATA_SOURCE_MODE is not set to \"live\". Showing the illustrative dataset.",
  noDatabase: "No database is attached (DATABASE_URL is unset). Showing the illustrative dataset.",
  unreachable: "The database could not be reached. Showing the illustrative dataset.",
  notMigrated: "The database schema has not been migrated yet. Showing the illustrative dataset.",
} as const;

export function configuredMode(): DataSourceMode {
  return process.env.DATA_SOURCE_MODE === "live" ? "live" : "demo";
}

export function isDatabaseAvailable(): boolean {
  return isDatabaseConfigured();
}

/**
 * Per-request memoised resolver. `cache` deduplicates across all server
 * components in one render pass, so a page with eight instrumented panels issues
 * one resolution, not eight.
 */
export const getDataProvider = cache(async (): Promise<DataProvider> => {
  const mode = configuredMode();

  if (mode !== "live") {
    return createDemoProvider(isDatabaseAvailable(), DEMO_REASONS.noMode);
  }

  if (!isDatabaseAvailable()) {
    console.warn("[data] DATA_SOURCE_MODE=live but DATABASE_URL is unset — using demo provider.");
    return createDemoProvider(false, DEMO_REASONS.noDatabase);
  }

  const db = getDb();
  if (!db) {
    return createDemoProvider(false, DEMO_REASONS.noDatabase);
  }

  try {
    const live = createLiveProvider(db);
    // Probe with the cheapest real read. If the schema is missing this throws
    // here rather than half-way through rendering a page.
    await live.getZoneReadings();
    return live;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[data] live provider failed, falling back to demo:", message);

    const reason = /relation .* does not exist|column .* does not exist/i.test(message)
      ? DEMO_REASONS.notMigrated
      : DEMO_REASONS.unreachable;

    return createDemoProvider(true, reason);
  }
});

/** The badge/label a component should render next to any figure it displays. */
export const getDataSourceInfo = cache(async (): Promise<DataSourceInfo> => {
  const provider = await getDataProvider();
  return provider.info;
});

/**
 * Convenience guard for server components that must never claim liveness.
 * Returns the wording the UI is allowed to use for this data source.
 */
export const getProvenanceWording = cache(
  async (): Promise<{
    badge: "SIMULATION" | "LIVE";
    /** Prohibited words are listed so a reviewer can grep for them. */
    allowedAdjectives: readonly string[];
    prohibitedAdjectives: readonly string[];
  }> => {
    const info = await getDataSourceInfo();
    return info.mode === "live"
      ? {
          badge: "LIVE",
          allowedAdjectives: ["LIVE", "CURRENT"],
          prohibitedAdjectives: [],
        }
      : {
          badge: "SIMULATION",
          allowedAdjectives: ["DEMO", "SIMULATION", "ILLUSTRATIVE", "SAMPLE"],
          // §40 — these words must never describe demo data.
          prohibitedAdjectives: ["LIVE", "REAL-TIME", "CURRENT", "ACTUAL", "OPERATIONAL"],
        };
  },
);

export type { DataProvider, DataSourceInfo, DataSourceMode };
export * from "@/lib/data/types";
