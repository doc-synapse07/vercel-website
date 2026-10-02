"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { discountPercent, formatINR } from "@/lib/utils";
import type { ProductCardData } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem, has } = useCart();
  const off = discountPercent(product.mrpPaise, product.pricePaise);

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    pricePaise: product.pricePaise,
    mrpPaise: product.mrpPaise,
    coverImage: product.coverImage,
    productType: product.productType,
    isFree: product.isFree,
  };

  const inCart = has(product.id);
  const isDigital = product.productType === "DIGITAL";

  return (
    <div className="group card-glow relative flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500 dark:hover:shadow-black/40">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-700 dark:to-ink-800"
      >
        {product.coverImage ? (
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-400">
            <span className="text-sm font-medium">No cover</span>
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {off !== null && (
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {off}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="rounded-md bg-brand-700 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              POPULAR
            </span>
          )}
          {product.fileCount === 0 && isDigital && (
            <span className="rounded-md bg-ink-900/75 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              Coming soon
            </span>
          )}
        </div>

        {isDigital && product.fileCount > 0 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-ink-900/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            PDF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
          {product.category.name}
        </p>

        <h3 className="mb-2 line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900 dark:text-white">
          <Link href={`/products/${product.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
            {product.title}
          </Link>
        </h3>

        {product.shortDescription && (
          <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-lg font-bold text-ink-900 dark:text-white">
              {product.isFree ? "Free" : formatINR(product.pricePaise)}
            </span>
            {product.mrpPaise && product.mrpPaise > product.pricePaise && (
              <>
                <span className="text-sm text-ink-400 line-through">
                  {formatINR(product.mrpPaise)}
                </span>
                <span className="text-[11px] font-medium text-accent-600">
                  Save {formatINR(product.mrpPaise - product.pricePaise)}
                </span>
              </>
            )}
          </div>

          {/*
            Nothing attached yet is a launch blocker, not a selling point. Rather
            than a loud amber warning on every card, we mute the whole card and
            stop the customer buying something that cannot be delivered.
          */}
          {product.fileCount === 0 && isDigital ? (
            <>
              <p className="mb-2 text-[11px] font-medium text-ink-400">
                PDF not uploaded yet
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem(cartProduct)}
                  disabled
                  className="btn btn-ghost btn-sm flex-1 text-ink-400"
                >
                  <Clock size={14} /> Coming soon
                </button>
                <Link
                  href={`/products/${product.slug}`}
                  className="btn btn-outline btn-sm flex-1"
                >
                  Details
                </Link>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addItem(cartProduct)}
                disabled={!isDigital && product.isFree}
                className="btn btn-outline btn-sm flex-1"
              >
                {inCart ? (
                  <>
                    <ShoppingCart size={14} /> In cart
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} /> Add
                  </>
                )}
              </button>

              <Link
                href={`/checkout?product=${product.id}`}
                className="btn btn-primary btn-sm flex-1"
              >
                <Zap size={14} /> Buy now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}