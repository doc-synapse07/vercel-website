"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/utils";

export function CartView() {
  const { lines, subtotalPaise, mrpTotalPaise, setQuantity, removeItem, clear, ready } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const savings = Math.max(0, mrpTotalPaise - subtotalPaise);

  async function quickCouponCheck() {
    if (!couponInput.trim()) return;
    setChecking(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotalPaise }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reason?: string;
        description?: string;
        discountPaise?: number;
      };
      setMessage(
        data.ok
          ? {
              ok: true,
              text: `Coupon valid — you save ${formatINR(data.discountPaise ?? 0)}. Apply it at checkout.`,
            }
          : { ok: false, text: data.reason ?? "Invalid coupon" },
      );
    } catch {
      setMessage({ ok: false, text: "Could not check that coupon. Try again." });
    } finally {
      setChecking(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="animate-spin text-brand-700 dark:text-brand-300" size={28} />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 py-24 text-center dark:border-ink-600">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <ShoppingBag size={30} />
        </span>
        <h2 className="mb-1.5 text-xl font-semibold text-ink-900 dark:text-white">Your cart is empty</h2>
        <p className="mb-6 max-w-sm text-sm text-ink-500 dark:text-ink-400">
          Add exam-preparation PDFs and bundles to get started. You will only need your name,
          email and phone at checkout.
        </p>
        <Link
          href="/products"
          className="btn btn-primary btn-md"
        >
          Browse products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
            {lines.length} {lines.length === 1 ? "item" : "items"}
          </h2>
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-ink-500 hover:text-red-600 dark:text-ink-400"
          >
            Clear cart
          </button>
        </div>

        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <li
              key={line.productId}
              className="flex gap-4 rounded-card border border-ink-200 bg-white p-3.5 dark:border-ink-700 dark:bg-ink-800"
            >
              <Link
                href={`/products/${line.slug}`}
                className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100"
              >
                {line.coverImage && (
                  <Image
                    src={line.coverImage}
                    alt={line.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/products/${line.slug}`}
                  className="line-clamp-2 font-semibold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
                >
                  {line.title}
                </Link>

                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="font-bold text-ink-900 dark:text-white">
                    {line.isFree ? "Free" : formatINR(line.pricePaise)}
                  </span>
                  {line.mrpPaise && line.mrpPaise > line.pricePaise && (
                    <>
                      <span className="text-ink-400 line-through dark:text-ink-400">
                        {formatINR(line.mrpPaise)}
                      </span>
                      <span className="text-xs font-medium text-accent-600">
                        −{formatINR(line.mrpPaise - line.pricePaise)}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between pt-2.5">
                  <div className="flex items-center rounded-lg border border-ink-300 dark:border-ink-600">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="p-2 text-ink-600 hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-ink-800"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      className="p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 dark:text-ink-400"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>

              <div className="hidden shrink-0 self-end text-right sm:block">
                <p className="text-base font-bold text-ink-900 dark:text-white">
                  {formatINR(line.pricePaise * line.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-300"
        >
          ← Continue shopping
        </Link>
      </div>

      {/* ------------------------------------------------------------ summary */}
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-card border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-800">
          <h2 className="mb-4 text-lg font-semibold text-ink-900 dark:text-white">Order summary</h2>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && quickCouponCheck()}
              placeholder="Coupon code"
              aria-label="Coupon code"
              className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm uppercase outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-ink-600"
            />
            <button
              type="button"
              onClick={quickCouponCheck}
              disabled={checking || !couponInput.trim()}
              className="btn btn-outline btn-sm shrink-0"
            >
              {checking ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
            </button>
          </div>

          {message && (
            <p
              className={`mb-4 rounded-lg px-3 py-2 text-[13px] ${
                message.ok
                  ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </p>
          )}

          <dl className="flex flex-col gap-2.5 border-t border-ink-200 pt-4 text-sm dark:border-ink-700">
            <div className="flex justify-between">
              <dt className="text-ink-600 dark:text-ink-300">Subtotal</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">{formatINR(subtotalPaise)}</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-600 dark:text-ink-300">Product savings</dt>
                <dd className="font-semibold text-brand-700 dark:text-brand-300">−{formatINR(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-600 dark:text-ink-300">Delivery</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">Instant &amp; free</dd>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-2.5 text-base dark:border-ink-700">
              <dt className="font-semibold text-ink-900 dark:text-white">Total</dt>
              <dd className="text-lg font-bold text-ink-900 dark:text-white">{formatINR(subtotalPaise)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-4 btn btn-primary btn-lg w-full"
          >
            Proceed to checkout <ArrowRight size={16} />
          </Link>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <ShieldCheck size={13} className="mt-0.5 shrink-0" />
            Secure checkout. Your download links are emailed right after payment.
          </p>
        </div>
      </div>
    </div>
  );
}