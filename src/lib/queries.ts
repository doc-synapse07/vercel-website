import { unstable_cache } from "next/cache";
import {
  getPublishedProducts,
  getProductBySlug as getProductBySlugRaw,
  getPopularProducts as getPopularProductsRaw,
  getRelatedProducts as getRelatedProductsRaw,
  getCategories as getCategoriesRaw,
  getCategoryBySlug as getCategoryBySlugRaw,
  getStoreStats as getStoreStatsRaw,
} from "./store";
import type { ProductCardData, CategoryNav, Product, Settings } from "./types";

function toCardData(p: Product, names?: Map<string, string>): ProductCardData {
  const key = p.categorySlug;
  // Defensive: rows migrated before the categorySlug fix store the Prisma
  // category *id* (a cuid) instead of the slug. That must never render —
  // show a generic label rather than leaking a database id onto cards.
  const name =
    names?.get(key) ?? (isCuidLike(key) ? "Exam notes" : humanizeSlug(key));
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    coverImage: p.coverImage,
    productType: p.productType,
    isFree: p.isFree,
    isFeatured: p.isFeatured,
    category: { name, slug: key },
    fileCount: p.files?.length ?? 0,
  };
}

/** Looks like a Prisma cuid, not a human-readable slug. */
function isCuidLike(value: string): boolean {
  return /^[a-z0-9]{20,}$/i.test(value) && /[0-9]/.test(value) && /[a-z]/i.test(value);
}

function humanizeSlug(slug: string): string {
  const words = slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return words || "Exam notes";
}

async function categoryNameMap(): Promise<Map<string, string>> {
  const cats = await getCategoriesRaw();
  return new Map(cats.map((c) => [c.slug, c.name]));
}

// Cache tags for revalidation
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  product: (slug: string) => `product:${slug}`,
  category: (slug: string) => `category:${slug}`,
} as const;

// Cached queries with tags
export const getCategories = unstable_cache(
  async (): Promise<CategoryNav[]> => {
    const [items, products] = await Promise.all([getCategoriesRaw(), getPublishedProducts()]);
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
    return items.map((c) => ({
      name: c.name,
      slug: c.slug,
      productCount: counts.get(c.slug) ?? 0,
    }));
  },
  ["categories"],
  { tags: [CACHE_TAGS.categories], revalidate: 3600 }
);

export async function getCategoryBySlug(slug: string): Promise<{ id: string; name: string; slug: string; description: string | null } | null> {
  return unstable_cache(
    async () => {
      const cat = await getCategoryBySlugRaw(slug);
      return cat ? { id: cat.slug, name: cat.name, slug: cat.slug, description: cat.description } : null;
    },
    [slug],
    { tags: [CACHE_TAGS.category(slug)], revalidate: 3600 }
  )();
}

export type ProductListOptions = {
  categorySlug?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  take?: number;
  skip?: number;
  featuredOnly?: boolean;
};

export async function getProducts(opts: ProductListOptions = {}): Promise<{ products: ProductCardData[]; total: number }> {
  const [items0, names] = await Promise.all([getPublishedProducts(), categoryNameMap()]);
  let items = items0;

  if (opts.categorySlug) items = items.filter((p) => p.categorySlug === opts.categorySlug);
  if (opts.featuredOnly) items = items.filter((p) => p.isFeatured);

  const search = opts.search?.trim();
  if (search) {
    const lower = search.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.shortDescription?.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower)
    );
  }

  const orderBy =
    opts.sort === "price_asc"
      ? (a: Product, b: Product) => a.pricePaise - b.pricePaise
      : opts.sort === "price_desc"
        ? (a: Product, b: Product) => b.pricePaise - a.pricePaise
        : (a: Product, b: Product) => new Date(b.id).getTime() - new Date(a.id).getTime();

  items.sort(orderBy);
  const total = items.length;
  if (opts.skip) items = items.slice(opts.skip);
  if (opts.take) items = items.slice(0, opts.take);

  return { products: items.map((p) => toCardData(p, names)), total };
}

export async function getProductBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const [product, names] = await Promise.all([getProductBySlugRaw(slug), categoryNameMap()]);
      if (!product) return null;
      return {
        ...product,
        pricePaise: product.pricePaise,
        mrpPaise: product.mrpPaise,
        category: {
          name: names.get(product.categorySlug) ?? humanizeSlug(product.categorySlug),
          slug: product.categorySlug,
        },
        files: product.files,
      };
    },
    [slug],
    { tags: [CACHE_TAGS.product(slug)], revalidate: 3600 }
  )();
}

/** Products sorted by popularity (featured first, then newest) */
export async function getPopularProducts(take = 4): Promise<ProductCardData[]> {
  const [items, names] = await Promise.all([getPopularProductsRaw(take), categoryNameMap()]);
  return items.map((p) => toCardData(p, names));
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  take = 4,
): Promise<ProductCardData[]> {
  const [items, names] = await Promise.all([
    getRelatedProductsRaw(productId, categorySlug, take),
    categoryNameMap(),
  ]);
  return items.map((p) => toCardData(p, names));
}

export async function getStoreStats() {
  const stats = await getStoreStatsRaw();
  return {
    products: stats.products,
    categories: stats.categories,
    freeProducts: stats.freeProducts,
    customers: stats.customers,
    downloads: stats.downloads,
  };
}

export type { ProductCardData, CategoryNav, Product, Settings };
