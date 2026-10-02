"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Loader2, Tag, Minus, Plus, ShieldCheck, Clock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/utils";
import type { CartProduct } from "@/lib/types";

export function ProductPurchasePanel({
  product,
  discountPercent,
  fileCount,
  supportEmail,
}: {
  product: CartProduct;
  discountPercent: number | null;
  fileCount: number;
  supportEmail: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [buyNowBusy, setBuyNowBusy] = useState(false);

  const isDigital = product.productType === "DIGITAL";
  const readyForCheckout = !isDigital || fileCount > 0;

  function handleAddToCart() {
    addItem(product, quantity);
  }

  function handleBuyNow() {
    setBuyNowBusy(true);
    // Buy now jumps straight to checkout with only this item, so the customer's
    // existing cart is not modified behind their back.
    router.push(`/checkout?product=${product.id}&qty=${quantity}`);
  }

  return (
    <div className="rounded-card border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-800">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
          {product.isFree ? "Free" : formatINR(product.pricePaise)}
        </span>
        {product.mrpPaise && product.mrpPaise > product.pricePaise && (
          <>
            <span className="text-base text-ink-400 line-through">
              {formatINR(product.mrpPaise)}
            </span>
            {discountPercent !== null && (
              <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                {discountPercent}% OFF
              </span>
            )}
          </>
        )}
      </div>

      {product.mrpPaise && product.mrpPaise > product.pricePaise && (
        <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200">
          You save {formatINR(product.mrpPaise - product.pricePaise)} on this product
        </p>
      )}

      {!readyForCheckout && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="flex items-start gap-2 text-sm font-medium text-amber-800">
            <Clock size={15} className="mt-0.5 shrink-0" />
            This PDF has not been uploaded yet. You can still add it to your cart, but download
            links will be emailed once the files are live.
          </p>
        </div>
      )}

      {/* Quantity — digital licences are per-seat, so keep it simple */}
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">Quantity</label>
        <div className="flex w-fit items-center rounded-lg border border-ink-300 dark:border-ink-600">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="p-2.5 text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-ink-800"
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>
          <span className="min-w-10 text-center font-semibold tabular-nums text-ink-900 dark:text-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="p-2.5 text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buyNowBusy}
          className="btn btn-primary btn-lg w-full"
        >
          {buyNowBusy ? <Loader2 size={17} className="animate-spin" /> : <Zap size={17} />}
          Buy now
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className="btn btn-outline btn-lg w-full"
        >
          <ShoppingCart size={17} />
          Add to cart
        </button>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2.5 dark:bg-ink-800">
        <Tag size={15} className="mt-0.5 shrink-0 text-ink-500 dark:text-ink-400" />
        <p className="text-[13px] leading-relaxed text-ink-600 dark:text-ink-300">
          Have a coupon? Apply it on the checkout page for instant savings.
        </p>
      </div>

      <ul className="flex flex-col gap-2 border-t border-ink-200 pt-4 text-[13px] text-ink-600 dark:border-ink-700 dark:text-ink-300">
        <li className="flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 text-brand-600" /> Secure payment gateway
        </li>
        <li className="flex items-center gap-2">
          <Clock size={14} className="shrink-0 text-brand-600" /> Lifetime access — keep the PDF forever
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 text-brand-600" /> UPI, card &amp; netbanking
        </li>
      </ul>

      <p className="mt-4 border-t border-ink-200 pt-4 text-center text-xs text-ink-500 dark:border-ink-700 dark:text-ink-400">
        Questions?{" "}
        <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          Email us
        </a>
      </p>
    </div>
  );
}