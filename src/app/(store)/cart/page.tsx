import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

// Cart must be dynamic — it reads from localStorage on the client
export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-3 text-sm text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800">Cart</span>
      </nav>

      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
        Shop / Cart
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-extrabold uppercase tracking-tight text-ink-900 dark:text-white sm:text-3xl">
        Your cart
      </h1>

      <CartView />
    </div>
  );
}