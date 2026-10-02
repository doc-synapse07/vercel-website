import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "How downloads work, link expiry, payment options, refunds and answers to common questions about SYNAPSE.07 notes.",
};

const FAQ = [
  {
    q: "How do I get my notes after paying?",
    a: "As soon as your payment is confirmed, download links appear on the order confirmation page and are emailed to you. Each product you bought gets its own link. Nothing is attached directly to the email — the links point to a secure page on our site.",
  },
  {
    q: "How long are download links valid?",
    a: "Links stay valid for 24 hours from the moment of payment. You can download each file a few times within that window, which is enough for two devices and a backup copy. Once downloaded, the PDF is yours to keep indefinitely — expiry limits the link, not your copy. Lost the email? Sign in to your account — the same links are waiting on your orders page.",
  },
  {
    q: "My link expired. Can I get it again?",
    a: "Yes. Sign in and open your account — every order on your email is listed there with fresh download links. If you have already used up every download, contact us from the address you purchased with and we will send fresh links.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "UPI, cards and net banking through Razorpay, plus Stripe and Cashfree where available. If no gateway is configured yet, the store runs in sandbox mode and no real money moves — useful for testing.",
  },
  {
    q: "Do you accept coupon codes?",
    a: "Yes. Apply the code in the cart or on the checkout page before paying. Codes can be a percentage or a flat discount, may have a minimum order value, a per-customer limit and an expiry date. An expired or fully used code is rejected at checkout.",
  },
  {
    q: "Are these notes PDFs or printed books?",
    a: "Everything is digital PDF right now. Printed copies and other physical products are planned for later, and the store already supports shipping for them.",
  },
  {
    q: "Can I print the notes?",
    a: "Yes — the PDFs are yours to keep and print for personal study. Please do not resell or redistribute them.",
  },
  {
    q: "What is your refund policy?",
    a: "Digital products are non-refundable once the download links have been generated, because the file has already been delivered. We do refund for genuine problems — a broken or corrupt file, a missing file, or a duplicate charge. Email us from your order address within 7 days and include your order number.",
  },
  {
    q: "The payment went through but I have no links.",
    a: "Bank settlement can take a few minutes. Wait about 10 minutes, then sign in and check your account page. If it still shows pending, contact us with your order number and we will push the links through manually.",
  },
  {
    q: "How do I update my email address or get a receipt?",
    a: "Write to us with your order number and we will resend the confirmation or update the email on file.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
        Frequently asked questions
      </h1>
      <p className="mb-8 mt-2 text-ink-600 dark:text-ink-300">
        Everything about downloads, payments, coupons and refunds. Still stuck?{" "}
        <Link href="/account" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Sign in to your account
        </Link>{" "}
        or contact us from the footer. Refund terms are set out in{" "}
        <Link href="/returns" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Returns, Refund &amp; Cancellation
        </Link>
        .
      </p>

      <div className="flex flex-col gap-3">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-card border border-ink-200 bg-white px-5 py-4 open:border-brand-300 open:bg-brand-50/40 dark:border-ink-700 dark:bg-ink-800 dark:open:border-brand-700 dark:open:bg-brand-950/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900 marker:hidden dark:text-white">
              {item.q}
              <span
                aria-hidden
                className="shrink-0 text-lg font-normal leading-none text-brand-700 transition-transform group-open:rotate-45 dark:text-brand-300"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-card border border-ink-200 bg-ink-50 px-5 py-6 text-center dark:border-ink-700 dark:bg-ink-800">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Can&apos;t find your answer? Send us a message and a human will reply within a working day.
        </p>
        <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
          See also our{" "}
          <Link href="/returns" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
            refund policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
            privacy policy
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="btn btn-primary btn-md"
          >
            Contact us
          </Link>
          <Link
            href="/products"
            className="btn btn-outline btn-md"
          >
            Browse notes
          </Link>
        </div>
      </div>
    </div>
  );
}