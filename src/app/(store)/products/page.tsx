import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { getCategories, getProducts } from "@/lib/queries";
import { PackageSearch } from "lucide-react";
import type { ProductListOptions } from "@/lib/queries";
import { SortDropdown } from "./SortDropdown";

export const metadata: Metadata = {
  title: "All products",
  description:
    "Browse every exam-preparation PDF in the store — UPSC CMS, NEET PG, INI-CET, FMGE and state exams.",
};

const PER_PAGE = 24;

const SORTS: { key: NonNullable<ProductListOptions["sort"]>; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "popular", label: "Popular" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const categories = await getCategories();

  type SortKey = NonNullable<ProductListOptions["sort"]>;
  const sortParam = sp.sort;
  const sort: SortKey =
    sortParam === "price_asc" || sortParam === "price_desc" || sortParam === "popular"
      ? sortParam
      : "newest";

  const { products, total } = await getProducts({
    search: search || undefined,
    sort,
    take: PER_PAGE,
    skip: (page - 1) * PER_PAGE,
    categorySlug: sp.cat,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function buildUrl(patch: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (sort !== "newest") params.set("sort", sort);
    if (page !== 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-3 text-sm text-ink-500 dark:text-ink-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800 dark:text-ink-100">All products</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            {search ? `Results for “${search}”` : "All products"}
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {total} {total === 1 ? "product" : "products"} available
          </p>
        </div>
        <div className="flex items-center gap-3 w-full max-w-xl">
          <div className="w-full max-w-md flex-1">
            <Suspense fallback={<div className="h-[50px]" />}>
              <SearchBar initialQuery={search} />
            </Suspense>
          </div>
          <SortDropdown />
        </div>
      </div>

      {/* Categories rail */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        <Link
          href={buildUrl({ cat: undefined })}
          className={`btn btn-sm ${!sp.cat ? "btn-primary" : "btn-outline"}`}
        >
          All
        </Link>
        {categories.map((c) => {
          const active = sp.cat === c.slug;
          return (
            <Link
              key={c.slug}
              href={buildUrl({ cat: c.slug })}
              className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
            >
              {c.name}
              <span className="ml-1.5 text-xs opacity-70">{c.productCount}</span>
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 py-20 text-center dark:border-ink-600">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-400">
            <PackageSearch size={26} />
          </span>
          <h2 className="mb-1 text-lg font-semibold text-ink-900 dark:text-white">No products found</h2>
          <p className="mb-5 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            {search
              ? `Nothing matched “${search}”. Try a different keyword or browse a category.`
              : "There are no products in this category yet."}
          </p>
          <Link
            href="/products"
            className="btn btn-primary btn-md"
          >
            View all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildUrl({ page: n === 1 ? undefined : n })}
              aria-current={n === page ? "page" : undefined}
              className={`btn ${n === page ? "btn-primary" : "btn-outline"} btn-sm min-w-10`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}