"use client";

import Image from "next/image";
import Link from "next/link";
import { Info, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { discountPercent, formatINR } from "@/lib/utils";
import type { ProductCardData } from "@/lib/types";

/**
 * Product card, mirroring the reference store:
 * cover → category eyebrow → title → price → More info / Add to cart.
 */
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
  const notReady = product.fileCount === 0 && isDigital;
  const priceLabel = product.isFree ? "Free" : formatINR(product.pricePaise);

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
          {notReady && (
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

        <h3 className="mb-2 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug text-ink-900 dark:text-white">
          <Link href={`/products/${product.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
            {product.title}
          </Link>
        </h3>

        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-bold text-ink-900 dark:text-white">{priceLabel}</span>
          {product.mrpPaise && product.mrpPaise > product.pricePaise && (
            <span className="text-sm text-ink-400 line-through">
              {formatINR(product.mrpPaise)}
            </span>
          )}
        </div>

        {/*
          PDFs are attached after launch: the customer can still reserve the
          product now, and download links are emailed once the files go live.
        */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="btn btn-outline btn-sm flex-1"
          >
            <Info size={14} /> More info
          </Link>
          <button
            type="button"
            onClick={() => addItem(cartProduct)}
            title={
              notReady
                ? "PDF not uploaded yet — download links will be emailed once live"
                : undefined
            }
            className="btn btn-outline btn-sm flex-1"
          >
            <ShoppingCart size={14} /> {inCart ? "In cart" : "Add to cart"}
          </button>
        </div>
        {notReady && (
          <p className="mt-2 text-[11px] font-medium leading-relaxed text-ink-400">
            PDF coming soon — links will be emailed once live
          </p>
        )}
      </div>
    </div>
  );
}
