"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { sendContactAction, type ContactState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-ink-600 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-500";
const labelClass = "mb-1.5 block text-sm font-medium text-ink-800 dark:text-ink-100";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState | null, FormData>(
    sendContactAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-card border border-brand-200 bg-brand-50 p-8 text-center dark:border-brand-800 dark:bg-brand-950/50">
        <p className="text-base font-semibold text-brand-800 dark:text-brand-200">Message sent</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600 dark:text-ink-300">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-card border border-ink-200 bg-white p-6 sm:p-8 dark:border-ink-700 dark:bg-ink-800">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Priya Sharma"
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Your email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-topic" className={labelClass}>
          What is this about?
        </label>
        <select id="contact-topic" name="topic" defaultValue="order" className={inputClass}>
          <option value="order">An order — payment, links, refunds</option>
          <option value="services">Video / collaboration services</option>
          <option value="other">Something else</option>
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          placeholder="Tell us what you need — order numbers and dates help for order queries."
          className={`${inputClass} resize-y`}
        />
      </div>

      {state?.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-md mt-5 w-full sm:w-auto">
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">
        You will receive a copy at the address you enter above.
      </p>
    </form>
  );
}
