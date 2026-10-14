import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { canAcceptInquiries, submitInquiry } from "@/lib/services/inquiries";
import { inquirySchema, checkAbuse } from "@/lib/validation/inquiry";
import type { InquiryResponse } from "@/types/api";
import {
  getClientIp,
  hashIdentity,
  limitConfig,
  rateLimit,
} from "@/lib/utilities/rate-limit";

/**
 * POST /api/inquiries (§26, §38, §39)
 * ---------------------------------------------------------------------------
 * The public inquiry endpoint. No authentication required.
 *
 * Defence in depth, in the order it is applied:
 *   1. method + content-type gate
 *   2. rate limit per hashed client IP (§38)
 *   3. payload size cap before parsing
 *   4. Zod parse — the only shape that reaches the service (§38)
 *   5. honeypot + completion-time abuse checks (§38)
 *   6. service write + notification (§31)
 *
 * Nothing here exposes database or transport detail. Technical failures are
 * logged server-side and the caller receives a stable code plus safe copy (§39).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse<InquiryResponse>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "invalid",
        message: "We couldn't complete your request. Please try again.",
      },
      { status: 415 },
    );
  }

  /* --- 2. Rate limit ------------------------------------------------------ */
  const headerList = await headers();
  const clientIp = getClientIp(headerList);
  const { windowSeconds, maxInquiries } = limitConfig();
  const limit = rateLimit({
    key: "inquiry",
    identity: hashIdentity(clientIp),
    limit: maxInquiries,
    windowSeconds,
  });

  if (!limit.success) {
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "rate_limited",
        message: `Too many requests from this connection. Please try again in ${limit.resetInSeconds} seconds.`,
        retryAfterSeconds: limit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } },
    );
  }

  /* --- 3. Body size cap ---------------------------------------------------- */
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "invalid",
        message: "We couldn't complete your request. Please try again.",
      },
      { status: 413 },
    );
  }

  /* --- 4. Parse ------------------------------------------------------------ */
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "invalid",
        message: "We couldn't complete your request. Please try again.",
      },
      { status: 400 },
    );
  }

  const parsed = inquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "invalid",
        message: "Some details need correcting.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  /* --- 5. Abuse checks ----------------------------------------------------- */
  const abuse = checkAbuse(parsed.data);
  if (!abuse.ok) {
    // A bot is told the same thing a human would be on a bad submission.
    // Revealing which check tripped only helps the next attempt.
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "invalid",
        message: "We couldn't complete your request. Please try again.",
      },
      { status: 400 },
    );
  }

  /* --- 6. Capacity gate ---------------------------------------------------- */
  if (!canAcceptInquiries()) {
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "unavailable",
        message:
          "This request cannot be recorded right now because no submission channel is connected. Please contact the facility directly.",
      },
      { status: 503 },
    );
  }

  /* --- 7. Submit ----------------------------------------------------------- */
  try {
    const result = await submitInquiry({ payload: parsed.data, clientIp });

    if (!result.ok) {
      const status =
        result.code === "rate_limited"
          ? 429
          : result.code === "unavailable"
            ? 503
            : result.code === "invalid"
              ? 422
              : 500;

      return NextResponse.json<InquiryResponse>(
        {
          ok: false,
          code: result.code,
          message: result.message,
          fieldErrors: result.fieldErrors,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status },
      );
    }

    return NextResponse.json<InquiryResponse>(
      {
        ok: true,
        reference: result.reference,
        persisted: result.persisted,
        caveat: result.caveat,
        notified: result.notified,
      },
      { status: 201 },
    );
  } catch (error) {
    // §39 — technical detail is logged here and nowhere else.
    console.error("[api/inquiries] unhandled failure", error);
    return NextResponse.json<InquiryResponse>(
      {
        ok: false,
        code: "error",
        message: "We couldn't complete your request. Please try again.",
      },
      { status: 500 },
    );
  }
}

/** Useful for a connection check from the client without submitting. */
export async function GET(): Promise<NextResponse<{ accepting: boolean }>> {
  return NextResponse.json({ accepting: canAcceptInquiries() });
}
