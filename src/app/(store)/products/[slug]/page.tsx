import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { discountPercent, formatBytes, formatINR, truncate } from "@/lib/utils";
import { Clock, Download, FileText, Mail, ShieldCheck, Sparkles, Tag } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  const description =
    truncate(product.shortDescription || product.description || "", 155) ||
    `Buy ${product.title} — instant PDF download.`;

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.coverImage ? [{ url: product.coverImage }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [related, settings] = await Promise.all([
    getRelatedProducts(product.id, product.categorySlug, 4),
    getSettings(),
  ]);

  const off = discountPercent(product.mrpPaise, product.pricePaise);
  const isDigital = product.productType === "DIGITAL";
  const totalSize = product.files.reduce((sum, f) => sum + f.sizeBytes, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-5 text-sm text-ink-500 dark:text-ink-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/products" className="hover:text-brand-700 dark:hover:text-brand-300">
          Products
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
          {product.category.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800 dark:text-ink-100">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* ------------------------------------------------------------ left */}
        <div>
          <div className="mb-6 overflow-hidden rounded-card border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800">
            <div className="relative aspect-square bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-700 dark:to-ink-800">
              {product.coverImage ? (
                <Image
                  src={product.coverImage}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 700px"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-400 dark:text-ink-400">
                  No cover image
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/category/${product.category.slug}`}
              className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-950"
            >
              {product.category.name}
            </Link>
            {isDigital && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <FileText size={12} /> PDF download
              </span>
            )}
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-3 py-1.5 text-xs font-bold text-white">
                <Sparkles size={12} /> Popular
              </span>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            {product.title}
          </h1>

          {product.shortDescription && (
            <p className="mb-6 text-[15px] leading-relaxed text-ink-600 dark:text-ink-300">
              {product.shortDescription}
            </p>
          )}

          {product.files.length > 0 && (
            <section className="mb-7 rounded-card border border-ink-200 bg-ink-50 p-5 dark:border-ink-700 dark:bg-ink-800">
              <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">
                What&apos;s inside ({product.files.length}{" "}
                {product.files.length === 1 ? "file" : "files"})
              </h2>
              <ul className="flex flex-col gap-2">
                {product.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-brand-700 ring-1 ring-ink-200 dark:bg-ink-800 dark:text-brand-300">
                      <FileText size={13} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
                    {f.sizeBytes > 0 && (
                      <span className="shrink-0 text-xs text-ink-400 dark:text-ink-400">
                        {formatBytes(f.sizeBytes)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {totalSize > 0 && (
                <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">
                  Total download size: {formatBytes(totalSize)}
                </p>
              )}
            </section>
          )}

          {product.description && (
            <section className="mb-7">
              <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">About this product</h2>
              <div
                className="rich-text text-[15px]"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </section>
          )}

          <section className="grid gap-4 rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800 sm:grid-cols-2">
            {[
              { icon: Mail, title: "Emailed instantly", text: "Links land in your inbox within seconds of payment." },
              { icon: Clock, title: "Lifetime access", text: "Download within 24 hours and keep the PDF for good." },
              { icon: Download, title: "Instant access", text: "No waiting, no shipping — pure digital delivery." },
              { icon: ShieldCheck, title: "Secure checkout", text: "UPI, cards and netbanking via trusted gateways." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  <f.icon size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{f.title}</h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{f.text}</p>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* ----------------------------------------------------------- right */}
        <div>
          <div className="lg:sticky lg:top-24">
            <ProductPurchasePanel
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                pricePaise: product.pricePaise,
                mrpPaise: product.mrpPaise,
                coverImage: product.coverImage,
                productType: product.productType,
                isFree: product.isFree,
              }}
              discountPercent={off}
              fileCount={product.files.length}
              supportEmail={settings.supportEmail}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14 border-t border-ink-200 pt-10 dark:border-ink-700">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            More in {product.category.name}
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}