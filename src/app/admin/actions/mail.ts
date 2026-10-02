"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import {
  clearSmtpConfig,
  getSmtpConfig,
  saveSmtpConfig,
  type SmtpConfig,
} from "@/lib/mail-config";
import { sendMail } from "@/lib/mail";
import type { ActionState } from "./auth";

const SmtpSchema = z.object({
  host: z.string().trim().min(1, "SMTP host is required").max(200),
  port: z.coerce
    .number({ invalid_type_error: "Port must be a number" })
    .int("Port must be a whole number")
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535"),
  // Already a real boolean by the time it reaches the schema.
  secure: z.boolean(),
  user: z.string().trim().min(1, "SMTP username is required").max(200),
  // Blank means "keep the saved password", so it must not fail validation here.
  password: z.string().max(300).optional(),
  fromName: z.string().trim().max(120).default("SYNAPSE.07"),
  fromEmail: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "From address is not a valid email"),
});

export async function saveSmtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const parsed = SmtpSchema.safeParse({
    host: formData.get("host"),
    port: formData.get("port"),
    // A checkbox is absent from FormData when unticked.
    secure: formData.get("secure") === "on" || formData.get("secure") === "true",
    user: formData.get("user"),
    password: formData.get("password") || undefined,
    fromName: formData.get("fromName") ?? "SYNAPSE.07",
    fromEmail: formData.get("fromEmail") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!parsed.data.fromEmail) parsed.data.fromEmail = parsed.data.user;

  const result = await saveSmtpConfig(parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath("/admin");

  return {
    ok: true,
    success: "SMTP saved. Order emails with download links will now be delivered automatically.",
  };
}

/** Removes the admin-stored settings, falling back to the environment if set. */
export async function disconnectSmtpAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  await clearSmtpConfig();

  revalidatePath("/admin/settings");
  revalidatePath("/admin");

  const fallback = await getSmtpConfig();
  return {
    ok: true,
    success: fallback
      ? "Removed the saved settings. Falling back to the SMTP_* environment variables."
      : "Removed. Email delivery is now switched off — download links will only appear on the success page.",
  };
}

/**
 * Sends a real message through the saved configuration. This is the only way to
 * be sure credentials work — a saved config proves nothing about whether the
 * provider accepts the login.
 */
export async function sendTestEmailAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const requested = String(formData.get("to") ?? "").trim();
  const to = requested || admin.email;

  if (!z.string().email().safeParse(to).success) {
    return { ok: false, error: "Enter a valid email address to send the test to." };
  }

  const config: SmtpConfig | null = await getSmtpConfig();
  if (!config) {
    return { ok: false, error: "SMTP is not configured yet. Save your settings first." };
  }

  const result = await sendMail({
    to,
    subject: `Test email from ${config.fromName}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#0f766e;padding:20px 24px;color:#fff;">
    <h1 style="margin:0;font-size:18px;">SMTP is working</h1>
  </div>
  <div style="padding:24px;font-size:14px;color:#374151;line-height:1.7;">
    <p style="margin:0 0 12px;">This message was sent from your store's admin panel, so order emails with download links will reach customers too.</p>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      Sent via <strong>${escapeText(config.host)}:${config.port}</strong>
      ${config.secure ? "(SSL/TLS)" : "(STARTTLS)"}<br>
      As <strong>${escapeText(config.user)}</strong><br>
      From <strong>${escapeText(config.fromName)} &lt;${escapeText(config.fromEmail)}&gt;</strong>
    </p>
  </div>
</div>`,
    text: `SMTP is working.\n\nSent via ${config.host}:${config.port}\nAs ${config.user}\nFrom ${config.fromName} <${config.fromEmail}>\n\nOrder emails with download links will now be delivered.`,
  });

  if (!result.sent) {
    return {
      ok: false,
      error: `Could not send: ${result.reason ?? "unknown error"}. Check the host, port and credentials.`,
    };
  }

  return { ok: true, success: `Test email sent to ${to}.` };
}

function escapeText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}