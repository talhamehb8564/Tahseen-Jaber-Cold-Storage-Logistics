import { z } from "zod";

import { productCategories } from "@/lib/catalog";
import type { InquirySource, ProductCategory, UnitOfMeasure } from "@/lib/db/schema";

/**
 * PUBLIC INQUIRY VALIDATION (§26, §38)
 * ---------------------------------------------------------------------------
 * One schema is the contract for the contact form, the storage calculator and
 * the API route. It is parsed on the SERVER before anything touches the database
 * — client-side use of the same schema is a convenience, never the control.
 *
 * Abuse resistance built into the schema itself:
 *   - `website` is a honeypot: invisible to people, irresistible to bots. Any
 *     value means the submission is dropped.
 *   - `formStartedAt` enforces a minimum human completion time.
 *   - every free-text field is length-capped so a request cannot smuggle an
 *     oversized payload into the database or an email body.
 *   - control characters are stripped from text so nothing can inject newlines
 *     into an email header.
 */

/** Catalog ids → database enum values. One mapping, used everywhere. */
const CATEGORY_TO_DB: Record<string, ProductCategory> = {
  produce: "PRODUCE",
  "meat-poultry": "MEAT_POULTRY",
  seafood: "SEAFOOD",
  pharmaceuticals: "PHARMACEUTICAL",
} as const;

export const PRODUCT_CATEGORY_IDS = productCategories.map(
  (category) => category.id,
) as [string, ...string[]];

export const UNITS = ["PALLET", "TONNE", "KILOGRAM", "CARTON", "BOX", "UNIT"] as const;

/** Loose international phone: digits, spaces and the usual punctuation. */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[0-9\s\-().]{6,32}$/, "Enter a valid telephone number")
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Strips C0/C1 control characters that could be used for header injection. */
const cleanText = z
  .string()
  .transform((value) => value.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").trim());

/**
 * The minimum time, in milliseconds, a human needs to fill the form.
 * Submissions faster than this are automated.
 */
export const MIN_COMPLETION_MS = 3_000;

export const inquirySchema = z
  .object({
    /* --- Honeypot. Rendered off-screen; must arrive empty. --- */
    website: z.string().max(64).optional(),

    /* --- Timing challenge --- */
    formStartedAt: z.coerce.number().int().positive().optional(),

    /* --- Contact details --- */
    name: cleanText.pipe(z.string().min(2, "Enter your full name").max(160, "Name is too long")),
    company: cleanText
      .pipe(z.string().max(200, "Company name is too long"))
      .optional()
      .or(z.literal("").transform(() => undefined)),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address").max(320, "Email is too long")),
    phone: phoneSchema,

    /* --- What needs storing --- */
    productCategory: z
      .enum(PRODUCT_CATEGORY_IDS)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    productDescription: cleanText
      .pipe(z.string().max(400, "Please keep the product description under 400 characters"))
      .optional()
      .or(z.literal("").transform(() => undefined)),
    quantity: z.coerce
      .number({ error: "Enter a number" })
      .positive("Enter a quantity greater than zero")
      .max(1_000_000, "For volumes above this, please contact us directly")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    unit: z
      .enum(UNITS)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    storageDurationDays: z.coerce
      .number({ error: "Enter a number of days" })
      .int("Enter whole days")
      .positive("Enter a duration greater than zero")
      .max(3_650, "For storage beyond ten years, please contact us directly")
      .optional()
      .or(z.literal("").transform(() => undefined)),

    /* --- Calculator-only fields --- */
    requestedSetpointC: z.coerce
      .number({ error: "Enter a temperature" })
      .min(-45, "Below the range this form handles")
      .max(25, "Above the range this form handles")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    needsTransport: z
      .union([z.boolean(), z.enum(["true", "false", "on"]).transform((v) => v !== "false")])
      .optional(),
    preferredStartAt: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined))
      .refine(
        (value) => !value || !Number.isNaN(new Date(value).getTime()),
        "Enter a valid date",
      ),

    /* --- Free text --- */
    message: cleanText
      .pipe(z.string().max(4_000, "Please keep the message under 4,000 characters"))
      .optional()
      .or(z.literal("").transform(() => undefined)),

    source: z.enum(["WEBSITE", "CALCULATOR", "PHONE", "EMAIL", "WHATSAPP", "MANUAL"]).default("WEBSITE"),
  })
  .superRefine((data, context) => {
    // A calculator submission must describe what is being stored.
    if (data.source === "CALCULATOR" && !data.productCategory) {
      context.addIssue({
        code: "custom",
        path: ["productCategory"],
        message: "Select a product type",
      });
    }
    // At least one way to reach the person, beyond email, or a message.
    if (!data.phone && !data.message && data.source === "WEBSITE") {
      context.addIssue({
        code: "custom",
        path: ["message"],
        message: "Add a short message or a telephone number so we can respond",
      });
    }
  });

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryPayload = z.output<typeof inquirySchema>;

/** Result of the abuse checks that are not expressible as field validation. */
export interface AbuseCheck {
  ok: boolean;
  reason?: "honeypot" | "too_fast" | "malformed";
}

export function checkAbuse(payload: {
  website?: string | undefined;
  formStartedAt?: number | undefined;
}): AbuseCheck {
  if (payload.website && payload.website.trim().length > 0) {
    return { ok: false, reason: "honeypot" };
  }
  if (typeof payload.formStartedAt === "number" && Number.isFinite(payload.formStartedAt)) {
    const elapsed = Date.now() - payload.formStartedAt;
    // A negative or absurd elapsed time means the client clock is unusable; do
    // not reject a genuine person because of it.
    if (elapsed >= 0 && elapsed < MIN_COMPLETION_MS) {
      return { ok: false, reason: "too_fast" };
    }
  }
  return { ok: true };
}

/** Map a catalog product id onto the database enum. */
export function toDbCategory(id: string | undefined): ProductCategory | null {
  if (!id) return null;
  return CATEGORY_TO_DB[id] ?? null;
}

/** Map the database enum back to catalog copy. */
export function fromDbCategory(value: ProductCategory | null): string | null {
  if (!value) return null;
  const entry = Object.entries(CATEGORY_TO_DB).find(([, db]) => db === value);
  return entry?.[0] ?? value;
}

export function toDbUnit(value: string | undefined): UnitOfMeasure | null {
  if (!value) return null;
  return (UNITS as readonly string[]).includes(value) ? (value as UnitOfMeasure) : null;
}

/* ==========================================================================
   CONTACT FORM (§26 — the /contact page)
   ========================================================================== */

export const contactSchema = z.object({
  website: z.string().max(64).optional(),
  formStartedAt: z.coerce.number().int().positive().optional(),
  name: cleanText.pipe(z.string().min(2, "Enter your full name").max(160, "Name is too long")),
  company: cleanText.pipe(z.string().max(200)).optional().or(z.literal("").transform(() => undefined)),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(320)),
  phone: phoneSchema,
  subject: cleanText.pipe(z.string().min(2, "Add a subject").max(160, "Subject is too long")),
  message: cleanText.pipe(z.string().min(10, "Please add a little more detail").max(4_000, "Message is too long")),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactPayload = z.output<typeof contactSchema>;

/* ==========================================================================
   STORAGE CALCULATOR (§25)
   ========================================================================== */

/**
 * §25 — pricing rules have NOT been supplied by the business, so the calculator
 * deliberately produces NO price. It collects a requirement and returns a
 * reference. The UI shows "REQUEST A CUSTOM QUOTE" instead of inventing an
 * estimate. `inquirySchema` encodes that decision: there is no rate field at
 * all, so a price cannot be fabricated even by accident.
 *
 * The calculator submits through the SAME endpoint and the SAME schema as the
 * contact form, with `source: "CALCULATOR"`. That is what makes the
 * `superRefine` above able to require a product category on calculator
 * submissions specifically. A separate derived schema would only duplicate the
 * contract — and Zod v4 forbids `.extend()` on a refined object anyway.
 */
export const CALCULATOR_SOURCE = "CALCULATOR" as const;

export type { InquirySource };
