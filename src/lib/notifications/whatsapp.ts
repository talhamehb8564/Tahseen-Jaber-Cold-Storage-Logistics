/**
 * WHATSAPP NOTIFICATIONS (§31)
 * ---------------------------------------------------------------------------
 * Optional admin alerting through the WhatsApp Business Cloud API. Credentials
 * come from the environment only.
 *
 * §31 CONSTRAINT: delivery is only reported when the provider confirms it. The
 * Cloud API returns a `messages[0].id` on acceptance; anything else is a failure
 * and is recorded as such rather than silently treated as sent.
 *
 * When no credentials are configured the channel returns `skipped`, so the
 * inquiry pipeline still completes — email and database are unaffected.
 */

export type NotificationOutcome =
  | { status: "sent"; providerMessageId: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

const GRAPH_VERSION = "v21.0";
const REQUEST_TIMEOUT_MS = 12_000;

function config() {
  return {
    token: process.env.WHATSAPP_API_KEY?.trim() || null,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null,
    adminRecipient: process.env.WHATSAPP_ADMIN_RECIPIENT?.replace(/\D/g, "") || null,
  };
}

export function isWhatsappConfigured(): boolean {
  const { token, phoneNumberId, adminRecipient } = config();
  return Boolean(token && phoneNumberId && adminRecipient);
}

/** Sends a plain-text WhatsApp message to the configured admin recipient. */
export async function sendAdminWhatsapp(body: string): Promise<NotificationOutcome> {
  const { token, phoneNumberId, adminRecipient } = config();

  if (!token || !phoneNumberId || !adminRecipient) {
    return { status: "skipped", reason: "WhatsApp credentials are not configured" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: adminRecipient,
          type: "text",
          text: { preview_url: false, body: body.slice(0, 4096) },
        }),
      },
    );

    const payload = (await response.json().catch(() => null)) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      const reason = payload?.error?.message ?? `HTTP ${response.status}`;
      console.error("[whatsapp] send failed", reason);
      return { status: "failed", reason };
    }

    const providerMessageId = payload?.messages?.[0]?.id;
    if (!providerMessageId) {
      return { status: "failed", reason: "Provider returned no message id" };
    }

    return { status: "sent", providerMessageId };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Timed out after ${REQUEST_TIMEOUT_MS}ms`
          : error.message
        : "Unknown error";
    console.error("[whatsapp] send error", reason);
    return { status: "failed", reason };
  } finally {
    clearTimeout(timer);
  }
}

/** Compact alert body — WhatsApp is a glance channel, not a document. */
export function inquiryAlertBody(input: {
  reference: string;
  name: string;
  company?: string | null;
  product?: string | null;
  quantity?: number | null;
  unit?: string | null;
  durationDays?: number | null;
  phone?: string | null;
  email: string;
}): string {
  const lines = [
    `*New storage inquiry — ${input.reference}*`,
    `${input.name}${input.company ? ` · ${input.company}` : ""}`,
    input.product ? `Product: ${input.product}` : null,
    input.quantity != null ? `Quantity: ${input.quantity} ${input.unit ?? ""}`.trim() : null,
    input.durationDays != null ? `Duration: ${input.durationDays} days` : null,
    `Email: ${input.email}`,
    input.phone ? `Phone: ${input.phone}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}
