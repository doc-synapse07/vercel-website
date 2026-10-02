import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/queries";
import { PackageSearch, ArrowRight } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} PDF notes`,
    description: category.description ?? `Shop ${category.name} exam-preparation PDFs.`,
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || !category.name) notFound();

  const [{ products, total }, categories] = await Promise.all([
    getProducts({ categorySlug: category.slug }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-3 text-sm text-ink-500 dark:text-ink-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800 dark:text-ink-100">{category.name}</span>
      </nav>

      <div className="mb-6 rounded-card border border-ink-200 bg-gradient-to-br from-brand-50 to-white p-6 dark:border-ink-700 dark:from-brand-950 dark:via-ink-900 dark:to-ink-900">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">{category.description}</p>
        )}
        <p className="mt-3 text-sm font-medium text-brand-800 dark:text-brand-300">
          {total} {total === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {categories.map((c) => {
          const active = c.slug === category.slug;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
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
          <h2 className="mb-1 text-lg font-semibold text-ink-900 dark:text-white">Nothing here yet</h2>
          <p className="mb-5 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            Products in {category.name} are being added. Check back soon.
          </p>
          <Link
            href="/products"
            className="btn btn-primary btn-md"
          >
            Browse all products <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}