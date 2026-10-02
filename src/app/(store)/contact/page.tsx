import type { Metadata } from "next";
import { Clock, MailCheck } from "lucide-react";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch about an order, a refund, or a paid video collaboration. We reply by email.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Get in touch</h1>
      <p className="mb-8 mt-2 text-ink-600 dark:text-ink-300">
        Order trouble, refund request, or a brand collaboration — write it here and it lands
        directly in our inbox.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-card border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Clock size={19} />
          </span>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            <span className="block font-semibold text-ink-900 dark:text-white">Replies within 1–2 days</span>
            Sooner for payment and link issues.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <MailCheck size={19} />
          </span>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            <span className="block font-semibold text-ink-900 dark:text-white">Copy in your inbox</span>
            Whatever you send, you get a copy too.
          </p>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}
