import { randomBytes, randomInt } from "node:crypto";

import { siteConfig } from "@/lib/site";

/**
 * REFERENCE ID GENERATION
 * ---------------------------------------------------------------------------
 * Format from §26 / §39: `TJ-XXXXX`.
 *
 * The alphabet excludes I, L, O and U so an ID read aloud over the phone or
 * copied from a gate pass cannot be mis-transcribed. Generation uses the Node
 * CSPRNG — never Math.random — because these identifiers appear on documents.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const BODY_LENGTH = 5;

export function generateReference(prefix: string = siteConfig.brand.referencePrefix): string {
  const bytes = randomBytes(BODY_LENGTH);
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i += 1) {
    body += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  }
  return `${prefix}-${body}`;
}

/** Batch references use the same alphabet with a longer body (TJ-20481 style). */
export function generateBatchReference(
  prefix: string = siteConfig.brand.referencePrefix,
): string {
  return `${prefix}-${randomInt(10_000, 99_999)}`;
}

export function isReference(value: string): boolean {
  return new RegExp(`^${siteConfig.brand.referencePrefix}-[${ALPHABET}]{${BODY_LENGTH}}$`).test(
    value,
  );
}

/** A short, human-safe identifier for non-document rows (telemetry, events). */
export function generateShortId(length = 12): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  }
  return out;
}
