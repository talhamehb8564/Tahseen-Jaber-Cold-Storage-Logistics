import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit reads DATABASE_URL from the environment at run time.
 * The credential is never written into source or committed to Git.
 * Supply it via `.env.local` (git-ignored) or your platform's secret manager.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
