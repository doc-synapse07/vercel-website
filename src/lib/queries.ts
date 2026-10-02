import { unstable_cache } from "next/cache";
import {
  getProducts as getProductsRaw,
  getPublishedProducts,
  getProductBySlug as getProductBySlugRaw,
  getFeaturedProducts as getFeaturedProductsRaw,
  getRelatedProducts as getRelatedProductsRaw,
  getProductsByCategory as getProductsByCategoryRaw,
  getCategories as getCategoriesRaw,
  getCategoryBySlug as getCategoryBySlugRaw,
  getOrders,
  getOrder,
  getCustomers,
  getCustomerByEmail,
  getCustomerById,
  getSettings as getSettingsRaw,
  getStoreStats as getStoreStatsRaw,
} from "./store";
import { prisma } from "./db";
import type { ProductCardData, CategoryNav, Product, Category, Order, Customer, Settings } from "./types";
import { formatINR } from "./utils";

function toCardData(p: Product): ProductCardData {
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
    category: { name: p.categorySlug, slug: p.categorySlug },
    fileCount: p.files?.length ?? 0,
  };
}

function toCategoryNav(c: Category): CategoryNav {
  return { name: c.name, slug: c.slug, productCount: 0 };
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
    const items = await getCategoriesRaw();
    return items.map(toCategoryNav);
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
  let items = await getPublishedProducts();

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

  return { products: items.map(toCardData), total };
}

export async function getProductBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const product = await getProductBySlugRaw(slug);
      if (!product) return null;
      return {
        ...product,
        pricePaise: product.pricePaise,
        mrpPaise: product.mrpPaise,
        category: { name: product.categorySlug, slug: product.categorySlug },
        files: product.files,
      };
    },
    [slug],
    { tags: [CACHE_TAGS.product(slug)], revalidate: 3600 }
  )();
}

export async function getFeaturedProducts(take = 8): Promise<ProductCardData[]> {
  const items = await getFeaturedProductsRaw(take);
  return items.map(toCardData);
}

/** Products sorted by popularity (featured first, then newest) */
export async function getPopularProducts(take = 4): Promise<ProductCardData[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: CARD_SELECT,
        take,
      });
      return rows.map(toCardData);
    },
    [`popular-${take}`],
    { tags: [CACHE_TAGS.products], revalidate: 3600 }
  )();
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductCardData[]> {
  const items = await getProductsByCategoryRaw(categorySlug);
  return items.map(toCardData);
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  take = 4,
): Promise<ProductCardData[]> {
  const items = await getRelatedProductsRaw(productId, categorySlug, take);
  return items.map(toCardData);
}

export async function getActiveCouponCodes(): Promise<string[]> {
  const rows = await prisma.coupon.findMany({
    where: { isActive: true },
    select: { code: true },
  });
  return rows.map((r) => r.code);
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

export async function getSettings(): Promise<Settings> {
  const raw = await getSettingsRaw();
  return {
    siteName: raw.siteName || "SYNAPSE.07",
    siteTagline: raw.siteTagline || "Learn Smart. Revise Fast. Crack Exams.",
    supportEmail: raw.supportEmail || "support@synapse07.store",
    supportPhone: raw.supportPhone || "+91 7041169494",
    instagramUrl: raw.instagramUrl || "",
    youtubeUrl: raw.youtubeUrl || "",
    telegramUrl: raw.telegramUrl || "",
    whatsappUrl: raw.whatsappUrl || "",
    aboutText: raw.aboutText || "",
    heroTitle: raw.heroTitle || "Learn Smart. Revise Fast.",
    heroSubtitle: raw.heroSubtitle || "Crack Exams.",
    upiId: raw.upiId || "",
  };
}

export type { ProductCardData, CategoryNav, Product, Category, Order, Customer, Settings };