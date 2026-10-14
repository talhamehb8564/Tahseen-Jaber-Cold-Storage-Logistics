import nodemailer, { type Transporter } from "nodemailer";

/**
 * EMAIL NOTIFICATIONS (§31)
 * ---------------------------------------------------------------------------
 * Credentials come from EMAIL_SERVER in the environment — never hardcoded, never
 * exposed to the client. This module is imported only from server code.
 *
 * §31 CONSTRAINT: "Do not claim notification delivery unless the provider
 * confirms it." So every send returns an explicit outcome. A transport that is
 * not configured returns `skipped`, not `sent` — and the caller records that in
 * the notifications table rather than pretending the admin was told.
 */

export type EmailOutcome =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

let transporter: Transporter | null = null;
let resolvedFrom: string | null = null;

function config() {
  const server = process.env.EMAIL_SERVER?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return { server: server || null, from: from || null };
}

export function isEmailConfigured(): boolean {
  const { server } = config();
  return Boolean(server);
}

function getTransporter(): Transporter | null {
  const { server, from } = config();
  if (!server) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport(server);
    resolvedFrom = from ?? null;
  }
  return transporter;
}

interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** Sends mail and reports what the provider actually confirmed. */
export async function sendEmail({ to, subject, text, html, replyTo }: SendOptions): Promise<EmailOutcome> {
  const transport = getTransporter();
  if (!transport) {
    return { status: "skipped", reason: "EMAIL_SERVER is not configured" };
  }
  if (!resolvedFrom) {
    return { status: "skipped", reason: "EMAIL_FROM is not configured" };
  }

  try {
    const info = await transport.sendMail({
      from: resolvedFrom,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    // Only a provider-issued message id counts as confirmation (§31).
    const messageId = typeof info.messageId === "string" ? info.messageId : null;
    if (!messageId) {
      return { status: "failed", reason: "Provider accepted the message but returned no id" };
    }
    return { status: "sent", messageId };
  } catch (error) {
    // Technical detail stays in the server log; §39 forbids surfacing it.
    console.error("[email] send failed", error);
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown transport error",
    };
  }
}

/** Verifies the transport at startup of a job, used by the health endpoint. */
export async function verifyEmailTransport(): Promise<EmailOutcome> {
  const transport = getTransporter();
  if (!transport) return { status: "skipped", reason: "EMAIL_SERVER is not configured" };
  try {
    await transport.verify();
    return { status: "sent", messageId: "transport-verified" };
  } catch (error) {
    console.error("[email] transport verification failed", error);
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Verification failed",
    };
  };
}

/* ==========================================================================
   TEMPLATES
   Plain, information-dense mail. No marketing chrome — an operations alert
   should read like an operations alert.
   ========================================================================== */

export function inquiryAdminEmail(input: {
  reference: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  product?: string | null;
  quantity?: number | null;
  unit?: string | null;
  durationDays?: number | null;
  setpointC?: number | null;
  needsTransport?: boolean | null;
  message?: string | null;
  source: string;
  receivedAt: Date;
}): { subject: string; text: string; html: string } {
  const lines: [string, string][] = [
    ["Reference", input.reference],
    ["Received", input.receivedAt.toISOString()],
    ["Source", input.source],
    ["Name", input.name],
    ["Company", input.company ?? "—"],
    ["Email", input.email],
    ["Phone", input.phone ?? "—"],
    ["Product", input.product ?? "—"],
    ["Quantity", input.quantity != null ? `${input.quantity} ${input.unit ?? ""}`.trim() : "—"],
    ["Duration", input.durationDays != null ? `${input.durationDays} days` : "—"],
    ["Requested set point", input.setpointC != null ? `${input.setpointC} °C` : "—"],
    ["Transport requested", input.needsTransport ? "Yes" : "No"],
  ];

  const text = [
    `NEW STORAGE INQUIRY — ${input.reference}`,
    "",
    ...lines.map(([label, value]) => `${label.padEnd(22, ".")} ${value}`),
    "",
    "MESSAGE",
    "-------",
    input.message?.trim() || "(none)",
    "",
    "--",
    "Sent by the Tahseen Jaber Cold Storage & Logistics website.",
  ].join("\n");

  const html = `
<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#04071d;color:#97a6cc;padding:28px">
  <div style="border:1px solid #263a7a;background:#0b1034;padding:24px;max-width:640px;margin:0 auto">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8f7bff">New storage inquiry</p>
    <p style="margin:0 0 24px;font-size:22px;color:#e9f3ff;font-weight:700">${escapeHtml(input.reference)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${lines
        .map(
          ([label, value]) => `<tr>
            <td style="padding:7px 12px 7px 0;border-bottom:1px solid #121d48;color:#6d7aa8;text-transform:uppercase;font-size:10px;letter-spacing:.14em;white-space:nowrap">${escapeHtml(label)}</td>
            <td style="padding:7px 0;border-bottom:1px solid #121d48;color:#e9f3ff;text-align:right">${escapeHtml(value)}</td>
          </tr>`,
        )
        .join("")}
    </table>
    <p style="margin:24px 0 6px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#6d7aa8">Message</p>
    <p style="margin:0;font-size:13px;line-height:1.65;color:#dbe2f8;white-space:pre-wrap">${escapeHtml(input.message?.trim() || "(none)")}</p>
  </div>
</div>`.trim();

  return { subject: `Storage inquiry ${input.reference} — ${input.name}`, text, html };
}

export function inquiryReceiptEmail(input: {
  reference: string;
  name: string;
  facility: string;
}): { subject: string; text: string; html: string } {
  const text = [
    `Hello ${input.name},`,
    "",
    `Your storage request has been received.`,
    "",
    `Reference: ${input.reference}`,
    `Facility:  ${input.facility}`,
    "",
    "Keep this reference — quoting it will let us find your request immediately.",
    "Our team will respond to arrange the details of your requirement.",
    "",
    "Tahseen Jaber Cold Storage & Logistics",
  ].join("\n");

  const html = `
<div style="font-family:ui-sans-serif,system-ui,sans-serif;background:#04071d;color:#97a6cc;padding:28px">
  <div style="border:1px solid #263a7a;background:#0b1034;padding:28px;max-width:560px;margin:0 auto">
    <p style="margin:0 0 18px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8f7bff">Request received</p>
    <p style="margin:0 0 10px;font-size:26px;color:#e9f3ff;font-weight:700;letter-spacing:-.02em">${escapeHtml(input.reference)}</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7">Hello ${escapeHtml(input.name)}, your storage request has been received and recorded against the reference above.</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7">Keep this reference — quoting it will let us find your request immediately. Our team will respond to arrange the details of your requirement.</p>
    <p style="margin:0;font-size:12px;color:#6d7aa8">${escapeHtml(input.facility)}</p>
  </div>
</div>`.trim();

  return { subject: `Request received — ${input.reference}`, text, html };
}

/** Escapes user content before it reaches an email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
