"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Lock,
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
  const count = lines.reduce((n, l) => n + l.quantity, 0);

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
      <div className="rounded-card border border-ink-200 bg-white p-8 dark:border-ink-700 dark:bg-ink-800">
        <p className="text-sm text-ink-500 dark:text-ink-400">Cart is empty.</p>
        <Link href="/products" className="btn btn-primary btn-md mt-5 inline-flex">
          Shop products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
            {count} {count === 1 ? "item" : "items"}
          </h2>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-ink-500 underline hover:text-red-600 dark:text-ink-400"
          >
            Clear cart
          </button>
        </div>

        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li
              key={line.productId}
              className="flex gap-4 rounded-card border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800"
            >
              <Link
                href={`/products/${line.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100 p-1 dark:bg-ink-700"
              >
                {line.coverImage && (
                  <Image
                    src={line.coverImage}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${line.slug}`}
                  className="line-clamp-2 text-sm font-semibold uppercase leading-snug text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
                >
                  {line.title}
                </Link>
                {line.variantLabel ? (
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
                    {line.variantLabel}
                  </p>
                ) : null}
                {line.customization ? (
                  <p className="mt-1 text-[11px] leading-4 text-ink-500 dark:text-ink-400">
                    {line.customization}
                  </p>
                ) : null}
                <p className="mt-1 font-semibold text-brand-700 dark:text-brand-300">
                  {line.isFree ? "Free" : formatINR(line.pricePaise)}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {line.kind === "DIGITAL" ? (
                    <span className="inline-flex items-center gap-1.5 rounded border border-brand-300/60 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200">
                      <Lock size={12} className="shrink-0" />
                      Qty: 1 · Digital
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        className="btn btn-outline btn-sm h-8 w-8 !px-0"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        className="btn btn-outline btn-sm h-8 w-8 !px-0"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    className="ml-3 text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-sm font-semibold text-ink-900 dark:text-white">
                {formatINR(line.pricePaise * line.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
        >
          ← Continue shopping
        </Link>
      </div>

      <aside className="h-fit rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
          Order summary
        </p>

        <div className="mb-4 mt-4 flex gap-2">
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

        <div className="flex justify-between text-sm">
          <span className="text-ink-600 dark:text-ink-300">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="font-semibold text-ink-900 dark:text-white">
            {formatINR(subtotalPaise)}
          </span>
        </div>
        {savings > 0 && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-600 dark:text-ink-300">Product savings</span>
            <span className="font-semibold text-brand-700 dark:text-brand-300">
              −{formatINR(savings)}
            </span>
          </div>
        )}
        <div className="mt-2 flex justify-between text-sm text-ink-500 dark:text-ink-400">
          <span>Delivery</span>
          <span>Instant &amp; free</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-ink-200 pt-4 text-lg font-semibold dark:border-ink-700">
          <span className="text-ink-900 dark:text-white">Total</span>
          <span className="text-brand-700 dark:text-brand-300">{formatINR(subtotalPaise)}</span>
        </div>

        <Link href="/checkout" className="btn btn-primary btn-lg mt-5 block w-full text-center">
          Checkout securely <ArrowRight size={16} />
        </Link>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-ink-500 dark:text-ink-400">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          Secure checkout. Your download links are emailed right after payment.
        </p>
        <Link
          href="/products"
          className="mt-4 block text-center text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
