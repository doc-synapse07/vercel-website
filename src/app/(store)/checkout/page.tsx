import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutClient, type ProviderOption } from "@/components/checkout/CheckoutClient";
import { getAvailableProviders } from "@/lib/payments";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

// Checkout must be dynamic — it uses localStorage cart + customer session
export const dynamic = "force-dynamic";

const PROVIDER_COPY: Record<string, { label: string; description: string }> = {
  razorpay: {
    label: "Razorpay",
    description: "UPI, credit/debit card, netbanking and wallets",
  },
  stripe: {
    label: "Stripe",
    description: "Cards, UPI and other supported methods",
  },
  cashfree: {
    label: "Cashfree",
    description: "UPI, cards, netbanking, EMI and wallets",
  },
  mock: {
    label: "Sandbox payment",
    description: "Simulates a successful payment — no real charge",
  },
};

export default async function CheckoutPage() {
  const available = getAvailableProviders();
  const providers: ProviderOption[] = available.map((id) => ({
    id,
    ...PROVIDER_COPY[id],
  }));
  const customer = await getCurrentCustomer();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/cart"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        ← Back to cart
      </Link>

      <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        Checkout
      </h1>
      <p className="mb-6 text-sm text-ink-500">
        Enter your name, email and phone. That&apos;s all we need — your download links arrive
        by email right after payment.
      </p>

      <Suspense fallback={<div className="h-96" />}>
        <CheckoutClient
          providers={providers}
          account={customer ? { name: customer.name, email: customer.email } : undefined}
        />
      </Suspense>
    </div>
  );
}