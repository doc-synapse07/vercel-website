"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/utils";
import type { CartProduct, ProductKind } from "@/lib/types";

export function ProductPurchase({
  product,
  showPrice = true,
}: {
  product: CartProduct;
  showPrice?: boolean;
}) {
  const { add, has } = useCart();
  const variants = product.kind === "DIGITAL" ? [] : product.variants || [];
  const [variantId, setVariantId] = useState<string | undefined>(
    variants.length ? variants[0].id : undefined
  );
  const inCart = has(product.id, variantId);
  const selected = variants.find((v) => v.id === variantId);
  const price = selected ? selected.pricePaise : product.pricePaise;
  const isDigital = product.kind === "DIGITAL";

  function canAdd(): boolean {
    return variants.length === 0 || variantId !== undefined;
  }

  const inCartLabel = isDigital ? "In library" : inCart ? "In cart" : "Add to cart";

  return (
    <div className="flex flex-col gap-4">
      {showPrice && (
        <div className="flex items-baseline gap-3">
          <p className="text-xl font-bold text-ink-900 dark:text-white">
            {product.isFree ? "Free" : formatINR(price)}
          </p>
          {product.originalPrice && product.originalPrice > price && (
            <p className="text-base text-ink-400 line-through">
              {formatINR(product.originalPrice)}
            </p>
          )}
        </div>
      )}
      {variants.length ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
            Variant{selected ? `: ${selected.label}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Variant">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variantId}
                onClick={() => setVariantId(v.id)}
                disabled={!v.inStock}
                className={`border px-3 py-2 text-sm font-semibold uppercase tracking-[0.1em] transition-colors ${
                  v.id === variantId
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700 dark:border-ink-600 dark:text-ink-300 dark:hover:border-brand-500"
                } ${!v.inStock ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {v.label} · {formatINR(v.pricePaise)}
                {!v.inStock && <span className="ml-1 text-xs">(OOS)</span>}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => add(product, 1, variantId)}
          disabled={!canAdd() || (isDigital && !product.isFree)}
          className={`btn btn-primary btn-sm flex-1 ${isDigital && product.isFree ? "bg-brand-700 hover:bg-brand-800" : ""}`}
        >
          {inCartLabel}
        </button>
        {product.kind === "PHYSICAL" && (
          <button
            type="button"
            onClick={() => add(product, 1, variantId)}
            disabled={!canAdd()}
            className="btn btn-outline btn-sm flex-1"
          >
            Buy now
          </button>
        )}
      </div>
    </div>
  );
}