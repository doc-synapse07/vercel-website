"use server";

import { z } from "zod";
import { getSettings } from "@/lib/settings";
import { isSmtpConfigured, sendMail } from "@/lib/mail";

export type ContactState = { ok: boolean; error?: string; success?: string };

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(100),
  email: z.string().trim().email("That email address does not look valid.").max(200),
  topic: z.enum(["order", "services", "other"]),
  message: z.string().trim().min(10, "Give us a little more detail — at least 10 characters.").max(4000),
});

const TOPIC_LABEL: Record<string, string> = {
  order: "Order support",
  services: "Video / collaboration services",
  other: "Something else",
};

/**
 * Sends the visitor's message to the store's support inbox and CCs the visitor,
 * so they get their own copy as proof it was sent. Runs entirely server-side so
 * the support address is never exposed to the browser.
 */
export async function sendContactAction(_prev: ContactState | null, formData: FormData): Promise<ContactState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const settings = await getSettings();
  const inbox = settings.supportEmail.trim();
  if (!inbox) {
    return { ok: false, error: "Our inbox is not set up yet. Please try again later." };
  }

  if (!(await isSmtpConfigured())) {
    return {
      ok: false,
      error: "Email delivery is not switched on right now. Please try again later.",
    };
  }

  const { name, email, topic, message } = parsed.data;
  const subject = `[Contact · ${TOPIC_LABEL[topic]}] ${name}`;

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const result = await sendMail({
    to: inbox,
    cc: email,
    subject,
    html: `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;">
        <p style="color:#475569;font-size:13px;">New message from the store contact form</p>
        <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;<br>
        <strong>Topic:</strong> ${escape(TOPIC_LABEL[topic])}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;">
        <p style="white-space:pre-wrap;color:#1e293b;">${escape(message)}</p>
      </div>`,
    text: `New message from the store contact form\n\nFrom: ${name} <${email}>\nTopic: ${TOPIC_LABEL[topic]}\n\n${message}`,
  });

  if (!result.sent) {
    return {
      ok: false,
      error: `We could not send your message just now (${result.reason ?? "unknown error"}). Please try again in a bit.`,
    };
  }

  return {
    ok: true,
    success: `Thanks ${name} — your message is on its way. A copy has been sent to ${email}.`,
  };
}
