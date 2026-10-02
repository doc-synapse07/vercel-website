import nodemailer, { type Transporter } from "nodemailer";
import { formatINR } from "./utils";
import { getSmtpConfig, type SmtpConfig } from "./mail-config";

/**
 * Email delivery via SMTP.
 *
 * Settings come from the admin panel (Admin > Settings > Email delivery), with
 * the SMTP_* environment variables as a fallback. They are resolved per send so
 * a change takes effect without a restart.
 *
 * If SMTP is not configured we deliberately do NOT throw — the caller falls back
 * to showing download links on the success page, so a missing SMTP config can
 * never block a paid order from being fulfilled.
 */

export { isSmtpConfigured } from "./mail-config";

/**
 * Cached transporter, keyed on a fingerprint of the config so an admin edit
 * rebuilds it instead of silently reusing the old credentials.
 */
let cached: { fingerprint: string; transporter: Transporter } | null = null;

function buildTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
}

function fingerprint(config: SmtpConfig): string {
  return [
    config.host,
    config.port,
    config.secure,
    config.user,
    // Only the length is included — the value itself never needs comparing.
    config.password.length,
    config.fromName,
    config.fromEmail,
  ].join("|");
}

async function getTransporter(): Promise<Transporter | null> {
  const config = await getSmtpConfig();
  if (!config) return null;

  const key = fingerprint(config);
  if (cached && cached.fingerprint === key) return cached.transporter;

  const transporter = buildTransporter(config);
  cached = { fingerprint: key, transporter };
  return transporter;
}

export type MailResult = { sent: boolean; reason?: string; messageId?: string };

export async function sendMail(params: {
  to: string;
  /** Carbon-copy recipients, e.g. echoing a contact-form message back to its sender. */
  cc?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<MailResult> {
  const config = await getSmtpConfig();
  if (!config) return { sent: false, reason: "SMTP not configured" };

  try {
    const t = await getTransporter();
    if (!t) return { sent: false, reason: "SMTP not configured" };

    const info = await t.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.to,
      cc: params.cc || undefined,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("[mail] send failed:", error);
    return { sent: false, reason: error instanceof Error ? error.message : "unknown" };
  }
}

type DownloadLine = {
  productTitle: string;
  fileName: string;
  url: string;
  expiresAt: Date;
};

function downloadRows(lines: DownloadLine[]) {
  return lines
    .map(
      (l, i) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;color:#111827;">${escapeHtml(l.productTitle)}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:2px;">${escapeHtml(l.fileName)}</div>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">
          <a href="${l.url}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:14px;font-weight:600;">Download</a>
        </td>
      </tr>`,
    )
    .join("");
}

function textRows(lines: DownloadLine[]) {
  return lines
    .map(
      (l) =>
        `${l.productTitle} — ${l.fileName}\n  ${l.url}`,
    )
    .join("\n\n");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Order confirmation + per-file download links for digital purchases. */
export async function sendOrderEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalPaise: number;
  downloads: DownloadLine[];
  expiresAt: Date;
}): Promise<MailResult> {
  const { to, customerName, orderNumber, totalPaise, downloads, expiresAt } = params;
  const subject = `Your order ${orderNumber} — download links inside`;

  if (!downloads.length) {
    return sendPhysicalOnlyEmail({ ...params, subject });
  }

  const hours = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 3_600_000));
  const html = `
<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f766e;padding:26px 28px;color:#ffffff;">
      <h1 style="margin:0;font-size:20px;">Thank you, ${escapeHtml(customerName)}</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Order <strong>${escapeHtml(orderNumber)}</strong> · ${formatINR(totalPaise)}</p>
    </div>

    <div style="padding:28px;">
      <h2 style="margin:0 0 6px;font-size:17px;color:#111827;">Your downloads</h2>
      <p style="margin:0 0 18px;font-size:14px;color:#6b7280;">
        Each link can be used up to 3 times and expires in <strong>${hours} hours</strong>
        (${expiresAt.toUTCString()}).
      </p>

      <table style="width:100%;border-collapse:collapse;">
        ${downloadRows(downloads)}
      </table>

      <div style="margin-top:24px;padding:14px 16px;background:#f9fafb;border-radius:10px;font-size:13px;color:#4b5563;">
        Tip: save your files somewhere safe now — links stop working after the expiry window.
      </div>
    </div>

    <div style="padding:18px 28px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center;">
      Sent automatically by your store. Please do not reply to this email.
    </div>
  </div>
</body></html>`;

  const text = `Hello ${customerName},

Thanks for your order ${orderNumber} (${formatINR(totalPaise)}).

Download your files below. Each link can be used up to 3 times and expires in ${hours} hours (${expiresAt.toUTCString()}).

${textRows(downloads)}

Please save your files somewhere safe now.
`;

  return sendMail({ to, subject, html, text });
}

async function sendPhysicalOnlyEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalPaise: number;
  subject: string;
}) {
  const { to, customerName, orderNumber, totalPaise } = params;
  const html = `
<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f766e;padding:26px 28px;color:#ffffff;">
      <h1 style="margin:0;font-size:20px;">Order confirmed</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Order <strong>${escapeHtml(orderNumber)}</strong> · ${formatINR(totalPaise)}</p>
    </div>
    <div style="padding:28px;font-size:14px;color:#374151;line-height:1.7;">
      Hello ${escapeHtml(customerName)},<br><br>
      We have received your order and will contact you shortly with shipping details.
    </div>
  </div>
</body></html>`;

  return sendMail({
    to,
    subject: params.subject,
    html,
    text: `Hello ${customerName},\n\nOrder ${orderNumber} confirmed. We will contact you shortly with shipping details.`,
  });
}