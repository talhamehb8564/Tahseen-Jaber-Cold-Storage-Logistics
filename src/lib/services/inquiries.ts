import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { notifications, storageInquiries, type InquirySource } from "@/lib/db/schema";
import { inquiryAdminEmail, inquiryReceiptEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { inquiryAlertBody, isWhatsappConfigured, sendAdminWhatsapp } from "@/lib/notifications/whatsapp";
import { fromDbCategory, type InquiryPayload } from "@/lib/validation/inquiry";
import { siteConfig } from "@/lib/site";
import { generateReference } from "@/lib/utilities/reference";
import { hashIdentity } from "@/lib/utilities/rate-limit";

/**
 * INQUIRY SERVICE (§26, §31, §39)
 * ---------------------------------------------------------------------------
 * The single write path for public storage requests.
 *
 * §39 — NEVER ALLOW SILENT FAILURES, AND NEVER FAKE A SUCCESS.
 * The result is a discriminated union that states exactly what happened:
 *
 *   persisted + notified → "REQUEST RECEIVED" with a real reference
 *   notified only        → reference issued, but the UI must say the request was
 *                          sent by notification and not stored in the system
 *   neither              → an honest error. No reference is invented, because a
 *                          reference that resolves to nothing is worse than none.
 *
 * A fabricated "REQUEST RECEIVED / TJ-XXXXX" for a request that was never
 * recorded anywhere would be the exact failure mode §39 and §40 exist to prevent.
 *
 * §38 — the submitter's IP is stored only as a salted hash, technical errors are
 * logged server-side, and no database detail reaches the caller.
 */

export type InquiryResult =
  | {
      ok: true;
      reference: string;
      persisted: boolean;
      notified: { adminEmail: boolean; receiptEmail: boolean; whatsapp: boolean };
      /** Copy the UI should show when the record could not be stored. */
      caveat?: string;
    }
  | {
      ok: false;
      code: "unavailable" | "rate_limited" | "invalid" | "error";
      message: string;
      /** Field-level messages for the form, when validation failed. */
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    };

export interface SubmitInquiryOptions {
  payload: InquiryPayload;
  /** Raw client identifier; hashed before storage. */
  clientIp: string;
}

export function canAcceptInquiries(): boolean {
  return isDatabaseConfigured() || isEmailConfigured() || isWhatsappConfigured();
}

export async function submitInquiry({
  payload,
  clientIp,
}: SubmitInquiryOptions): Promise<InquiryResult> {
  if (!canAcceptInquiries()) {
    console.error(
      "[inquiry] no delivery path configured — DATABASE_URL, EMAIL_SERVER and WhatsApp are all unset",
    );
    return {
      ok: false,
      code: "unavailable",
      message:
        "This request cannot be recorded right now because no submission channel is connected. Please contact the facility directly.",
    };
  }

  const reference = generateReference();
  const ipHash = hashIdentity(clientIp);
  const now = new Date();
  const category = fromDbCategory(null); // display copy is derived below
  const productLabel = payload.productCategory
    ? productCategoryLabel(payload.productCategory)
    : payload.productDescription ?? null;

  /* ---------------------------------------------------------- persist ---- */
  let persisted = false;
  const db = getDb();

  if (db) {
    try {
      const inserted = await db
        .insert(storageInquiries)
        .values({
          reference,
          source: payload.source as InquirySource,
          status: "NEW",
          name: payload.name,
          company: payload.company ?? null,
          email: payload.email,
          phone: payload.phone ?? null,
          productCategory: dbCategoryOf(payload.productCategory),
          productDescription: payload.productDescription ?? null,
          quantity: payload.quantity != null ? String(payload.quantity) : null,
          unit: payload.unit ?? null,
          storageDurationDays: payload.storageDurationDays ?? null,
          message: payload.message ?? null,
          requestedSetpointC:
            payload.requestedSetpointC != null ? String(payload.requestedSetpointC) : null,
          needsTransport: payload.needsTransport ?? null,
          preferredStartAt: payload.preferredStartAt ? new Date(payload.preferredStartAt) : null,
          ipHash,
        })
        .returning({ id: storageInquiries.id });

      persisted = inserted.length > 0;
    } catch (error) {
      // §39 — log the technical detail, never surface it.
      console.error("[inquiry] database insert failed", error);
    }
  }

  const inquiryId = persisted ? await lookupInquiryId(db, reference) : null;

  /* --------------------------------------------------------- notify ------ */
  const adminRecipient = process.env.ADMIN_NOTIFY_EMAIL?.trim() || siteConfig.contact.email;

  const adminTemplate = inquiryAdminEmail({
    reference,
    name: payload.name,
    company: payload.company,
    email: payload.email,
    phone: payload.phone,
    product: productLabel ?? category,
    quantity: payload.quantity ?? null,
    unit: payload.unit ?? null,
    durationDays: payload.storageDurationDays ?? null,
    setpointC: payload.requestedSetpointC ?? null,
    needsTransport: payload.needsTransport ?? null,
    message: payload.message,
    source: payload.source,
    receivedAt: now,
  });

  const adminEmailOutcome = adminRecipient
    ? await sendEmail({
        to: adminRecipient,
        subject: adminTemplate.subject,
        text: adminTemplate.text,
        html: adminTemplate.html,
        // Lets the admin reply straight back to the person who asked.
        replyTo: payload.email,
      })
    : { status: "skipped" as const, reason: "No admin recipient configured" };

  const whatsappOutcome = isWhatsappConfigured()
    ? await sendAdminWhatsapp(
        inquiryAlertBody({
          reference,
          name: payload.name,
          company: payload.company,
          product: productLabel,
          quantity: payload.quantity ?? null,
          unit: payload.unit ?? null,
          durationDays: payload.storageDurationDays ?? null,
          phone: payload.phone ?? null,
          email: payload.email,
        }),
      )
    : { status: "skipped" as const, reason: "WhatsApp not configured" };

  // Receipt to the submitter. Only sent when we can actually reach them.
  const receiptTemplate = inquiryReceiptEmail({
    reference,
    name: payload.name,
    facility: siteConfig.location.addressLine,
  });
  const receiptOutcome = await sendEmail({
    to: payload.email,
    subject: receiptTemplate.subject,
    text: receiptTemplate.text,
    html: receiptTemplate.html,
  });

  /* ------------------------------------------- record what was attempted -- */
  if (db) {
    await recordNotification(db, {
      channel: "EMAIL",
      recipient: adminRecipient ?? "(not configured)",
      subject: adminTemplate.subject,
      body: adminTemplate.text,
      outcome: adminEmailOutcome,
      inquiryId,
    });
    await recordNotification(db, {
      channel: "WHATSAPP",
      recipient: process.env.WHATSAPP_ADMIN_RECIPIENT ?? "(not configured)",
      subject: `Inquiry ${reference}`,
      body: inquiryAlertBody({ reference, name: payload.name, email: payload.email }),
      outcome: whatsappOutcome,
      inquiryId,
    });
    await recordNotification(db, {
      channel: "EMAIL",
      recipient: payload.email,
      subject: receiptTemplate.subject,
      body: receiptTemplate.text,
      outcome: receiptOutcome,
      inquiryId,
    });
  }

  const notified = {
    adminEmail: adminEmailOutcome.status === "sent",
    receiptEmail: receiptOutcome.status === "sent",
    whatsapp: whatsappOutcome.status === "sent",
  };

  /* --------------------------------------------------------- outcome ----- */
  if (!persisted && !notified.adminEmail && !notified.whatsapp) {
    // Nothing was stored and nothing was delivered. Saying "received" would be
    // a lie, so this is reported as a failure with a retry path (§39).
    console.error("[inquiry] neither persisted nor delivered for", reference);
    return {
      ok: false,
      code: "error",
      message: "We couldn't complete your request. Please try again.",
    };
  }

  return {
    ok: true,
    reference,
    persisted,
    notified,
    caveat: persisted
      ? undefined
      : "Your request has been sent to the facility team but could not be stored in the system, so quoting the reference may not resolve it automatically.",
  };
}

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

async function lookupInquiryId(
  db: ReturnType<typeof getDb>,
  reference: string,
): Promise<string | null> {
  if (!db) return null;
  try {
    const [row] = await db
      .select({ id: storageInquiries.id })
      .from(storageInquiries)
      .where(eq(storageInquiries.reference, reference))
      .limit(1);
    return row?.id ?? null;
  } catch (error) {
    console.error("[inquiry] reference lookup failed", error);
    return null;
  }
}

async function recordNotification(
  db: NonNullable<ReturnType<typeof getDb>>,
  input: {
    channel: "EMAIL" | "WHATSAPP";
    recipient: string;
    subject: string;
    body: string;
    outcome:
      | { status: "sent"; messageId: string }
      | { status: "sent"; providerMessageId: string }
      | { status: "skipped"; reason: string }
      | { status: "failed"; reason: string };
    inquiryId: string | null;
  },
): Promise<void> {
  try {
    const providerMessageId =
      "messageId" in input.outcome
        ? input.outcome.messageId
        : "providerMessageId" in input.outcome
          ? input.outcome.providerMessageId
          : null;

    await db.insert(notifications).values({
      channel: input.channel,
      // §31 — SENT only when the provider confirmed it.
      status:
        input.outcome.status === "sent"
          ? "SENT"
          : input.outcome.status === "skipped"
            ? "SKIPPED"
            : "FAILED",
      recipient: input.recipient,
      subject: input.subject,
      body: input.body.slice(0, 8_000),
      providerMessageId,
      sentAt: input.outcome.status === "sent" ? new Date() : null,
      error:
        input.outcome.status === "sent"
          ? null
          : "reason" in input.outcome
            ? input.outcome.reason.slice(0, 1_000)
            : null,
      inquiryId: input.inquiryId,
    });
  } catch (error) {
    // A failed audit write must not fail the user's submission.
    console.error("[inquiry] notification record failed", error);
  }
}

function dbCategoryOf(id: string | undefined) {
  switch (id) {
    case "produce":
      return "PRODUCE" as const;
    case "meat-poultry":
      return "MEAT_POULTRY" as const;
    case "seafood":
      return "SEAFOOD" as const;
    case "pharmaceuticals":
      return "PHARMACEUTICAL" as const;
    default:
      return null;
  }
}

function productCategoryLabel(id: string): string | null {
  switch (id) {
    case "produce":
      return "Produce";
    case "meat-poultry":
      return "Meat & poultry";
    case "seafood":
      return "Seafood";
    case "pharmaceuticals":
      return "Pharmaceuticals";
    default:
      return null;
  }
}
