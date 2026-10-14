"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import {
  auditLogs,
  facilityEvents,
  inquiryStatusEnum,
  storageInquiries,
  users,
} from "@/lib/db/schema";
import { getClientIp, hashIdentity } from "@/lib/utilities/rate-limit";

/**
 * ADMIN MUTATIONS (§28, §29, §30)
 * ---------------------------------------------------------------------------
 * Server Actions rather than route handlers. Two reasons:
 *
 *   1. Next.js verifies the `Origin` header on every Server Action, which gives
 *      CSRF protection without a hand-rolled token round-trip (§30).
 *   2. They are typed end to end and can call `revalidatePath` directly, so the
 *      screen updates from the same request that made the change.
 *
 * EVERY action here follows the same order, and the order matters:
 *   authorize → validate → confirm the database exists → mutate → audit.
 *
 * Authorization is first and unconditional (§29: "Do not rely only on frontend
 * guards"). Nothing below runs for a caller who is not an ADMIN.
 *
 * §39 — the return type is a discriminated union so a caller can never mistake a
 * failure for success, and error copy is safe to display. Technical detail is
 * logged, never returned.
 */

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** The closed set of inquiry statuses (§28). */
export const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

export type InquiryStatusValue = (typeof INQUIRY_STATUSES)[number];

/* ==========================================================================
   SHARED HELPERS
   ========================================================================== */

function failure(message: string, fieldErrors?: Record<string, string[]>): ActionResult {
  return { ok: false, message, fieldErrors };
}

function noDatabase(): ActionResult {
  return failure(
    "No database is connected, so this change cannot be saved. Configure DATABASE_URL and try again.",
  );
}

/** Writes an audit entry. A failed audit must not roll back the user's action. */
async function audit(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const headerList = await headers();
    await db.insert(auditLogs).values({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: (input.before ?? null) as never,
      after: (input.after ?? null) as never,
      ipHash: hashIdentity(getClientIp(headerList)),
      userAgent: headerList.get("user-agent")?.slice(0, 320) ?? null,
    });
  } catch (error) {
    console.error("[admin] audit write failed", error);
  }
}

/* ==========================================================================
   INQUIRY STATUS (§28)
   ========================================================================== */

const statusSchema = z.object({
  inquiryId: z.string().uuid("Invalid inquiry"),
  status: z.enum(INQUIRY_STATUSES),
  internalNotes: z
    .string()
    .trim()
    .max(2_000, "Notes must be under 2,000 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function updateInquiryStatus(input: {
  inquiryId: string;
  status: InquiryStatusValue;
  internalNotes?: string;
}): Promise<ActionResult> {
  const actor = await requireAdmin();

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Some details need correcting.", parsed.error.flatten().fieldErrors);
  }

  const db = getDb();
  if (!db) return noDatabase();

  try {
    const [existing] = await db
      .select({ id: storageInquiries.id, status: storageInquiries.status })
      .from(storageInquiries)
      .where(eq(storageInquiries.id, parsed.data.inquiryId))
      .limit(1);

    if (!existing) return failure("That request no longer exists.");

    if (existing.status === parsed.data.status) {
      return { ok: true, message: `Already marked ${parsed.data.status}.` };
    }

    await db
      .update(storageInquiries)
      .set({
        status: parsed.data.status,
        ...(parsed.data.internalNotes !== undefined
          ? { internalNotes: parsed.data.internalNotes }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(storageInquiries.id, parsed.data.inquiryId));

    await audit({
      actorUserId: actor.sub,
      action: "INQUIRY_STATUS_CHANGED",
      entityType: "STORAGE_INQUIRY",
      entityId: parsed.data.inquiryId,
      before: { status: existing.status },
      after: { status: parsed.data.status, notes: parsed.data.internalNotes ?? null },
    });

    revalidatePath("/admin/requests");
    revalidatePath("/admin");

    return { ok: true, message: `Request marked ${parsed.data.status}.` };
  } catch (error) {
    console.error("[admin] updateInquiryStatus failed", error);
    return failure("We couldn't save that change. Please try again.");
  }
}

/* ==========================================================================
   FACILITY EVENTS — acknowledge (§28)
   ========================================================================== */

const acknowledgeSchema = z.object({ eventId: z.string().uuid("Invalid event") });

export async function acknowledgeEvent(input: { eventId: string }): Promise<ActionResult> {
  const actor = await requireAdmin();

  const parsed = acknowledgeSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid event.");

  const db = getDb();
  if (!db) return noDatabase();

  try {
    const [existing] = await db
      .select({ id: facilityEvents.id, acknowledgedAt: facilityEvents.acknowledgedAt })
      .from(facilityEvents)
      .where(eq(facilityEvents.id, parsed.data.eventId))
      .limit(1);

    if (!existing) return failure("That event no longer exists.");
    if (existing.acknowledgedAt) return { ok: true, message: "Already acknowledged." };

    const at = new Date();
    await db
      .update(facilityEvents)
      .set({ acknowledgedAt: at, acknowledgedById: actor.sub })
      .where(eq(facilityEvents.id, parsed.data.eventId));

    await audit({
      actorUserId: actor.sub,
      action: "EVENT_ACKNOWLEDGED",
      entityType: "FACILITY_EVENT",
      entityId: parsed.data.eventId,
      after: { acknowledgedAt: at.toISOString() },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/telemetry");
    revalidatePath("/admin/security");

    return { ok: true, message: "Event acknowledged." };
  } catch (error) {
    console.error("[admin] acknowledgeEvent failed", error);
    return failure("We couldn't acknowledge that event. Please try again.");
  }
}

/* ==========================================================================
   USERS (§28 — administration)
   ========================================================================== */

const userUpdateSchema = z.object({
  userId: z.string().uuid("Invalid user"),
  role: z.enum(["ADMIN", "OPERATOR", "CLIENT"]).optional(),
  isActive: z.boolean().optional(),
});

export async function updateUser(input: {
  userId: string;
  role?: "ADMIN" | "OPERATOR" | "CLIENT";
  isActive?: boolean;
}): Promise<ActionResult> {
  const actor = await requireAdmin();

  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid user update.", parsed.error.flatten().fieldErrors);

  const db = getDb();
  if (!db) return noDatabase();

  // An administrator must not be able to remove their own access — that is the
  // one change here that can strand the whole console with nobody left to undo it.
  if (parsed.data.userId === actor.sub) {
    if (parsed.data.isActive === false) {
      return failure("You cannot deactivate your own account.");
    }
    if (parsed.data.role && parsed.data.role !== "ADMIN") {
      return failure("You cannot remove your own administrator role.");
    }
  }

  try {
    const [existing] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!existing) return failure("That user no longer exists.");

    // Any change to role or active state must invalidate existing sessions, so a
    // demoted or deactivated user does not keep operating on an old token (§30).
    const securityRelevant =
      parsed.data.role !== undefined || parsed.data.isActive !== undefined;

    await db
      .update(users)
      .set({
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(securityRelevant ? { tokenVersion: existing.tokenVersion + 1 } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, parsed.data.userId));

    await audit({
      actorUserId: actor.sub,
      action: parsed.data.role !== undefined ? "USER_ROLE_UPDATED" : "USER_STATUS_UPDATED",
      entityType: "USER",
      entityId: parsed.data.userId,
      before: { role: existing.role, isActive: existing.isActive },
      after: {
        role: parsed.data.role ?? existing.role,
        isActive: parsed.data.isActive ?? existing.isActive,
        tokenVersion: securityRelevant ? existing.tokenVersion + 1 : existing.tokenVersion,
      },
    });

    revalidatePath("/admin/users");

    return {
      ok: true,
      message: securityRelevant
        ? "User updated. Their existing sessions were signed out."
        : "User updated.",
    };
  } catch (error) {
    console.error("[admin] updateUser failed", error);
    return failure("We couldn't update that user. Please try again.");
  }
}

export { inquiryStatusEnum };
