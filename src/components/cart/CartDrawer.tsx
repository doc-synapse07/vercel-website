"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/utils";

export function CartDrawer() {
  const {
    lines,
    subtotalPaise,
    mrpTotalPaise,
    removeItem,
    setQuantity,
    closeDrawer,
    drawerOpen,
    ready,
  } = useCart();

  if (!drawerOpen) return null;

  const savings = Math.max(0, mrpTotalPaise - subtotalPaise);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeDrawer}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
      />

      <aside className="animate-slide-in relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-ink-800">
        <header className="flex items-center justify-between border-b border-ink-200 px-5 py-4 dark:border-ink-700">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900 dark:text-white">
            <ShoppingBag size={19} /> Your cart
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
            aria-label="Close cart"
          >
            <X size={19} />
          </button>
        </header>

        {!ready ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-500 dark:text-ink-400">
            Loading…
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
              <ShoppingBag size={26} />
            </span>
            <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Your cart is empty</p>
            <p className="max-w-xs text-sm text-ink-500 dark:text-ink-400">
              Browse our exam-preparation PDFs and add what you need.
            </p>
            <Link
              href="/products"
              onClick={closeDrawer}
              className="mt-1 inline-flex items-center gap-1.5 btn btn-primary btn-sm"
            >
              Browse products <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-3.5">
                {lines.map((line) => (
                  <li
                    key={line.productId}
                    className="flex gap-3 border-b border-ink-100 pb-3.5 last:border-0 dark:border-ink-700"
                  >
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={closeDrawer}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100"
                    >
                      {line.coverImage && (
                        <Image
                          src={line.coverImage}
                          alt={line.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={closeDrawer}
                        className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
                      >
                        {line.title}
                      </Link>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-900 dark:text-white">
                          {line.isFree ? "Free" : formatINR(line.pricePaise)}
                        </span>
                        {line.mrpPaise && line.mrpPaise > line.pricePaise && (
                          <span className="text-xs text-ink-400 line-through dark:text-ink-400">
                            {formatINR(line.mrpPaise)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-ink-300 dark:border-ink-600">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.productId, line.quantity - 1)}
                            className="p-1.5 text-ink-600 hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-ink-800"
                            aria-label="Decrease quantity"
                            disabled={line.quantity <= 1}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-7 text-center text-sm font-semibold tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.productId, line.quantity + 1)}
                            className="p-1.5 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(line.productId)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 dark:text-ink-400"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-ink-200 bg-ink-50 px-5 py-4 dark:border-ink-700 dark:bg-ink-800">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-600 dark:text-ink-300">Subtotal</span>
                <span className="text-lg font-bold text-ink-900 dark:text-white">
                  {formatINR(subtotalPaise)}
                </span>
              </div>
              {savings > 0 && (
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-ink-600 dark:text-ink-300">You save</span>
                  <span className="font-semibold text-brand-700 dark:text-brand-300">{formatINR(savings)}</span>
                </div>
              )}

              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="btn btn-primary btn-lg w-full"
              >
                Checkout <ArrowRight size={16} />
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="mt-2 block text-center text-xs font-medium text-ink-600 hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300"
              >
                View full cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}