import { prisma } from "./db";
import type { ProductCardData, CategoryNav } from "./types";

/** Maps a Prisma product row (with category + file count) to the card view model. */
type ProductRow = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  coverImage: string | null;
  productType: string;
  isFree: boolean;
  isFeatured: boolean;
  category: { name: string; slug: string };
  _count?: { files: number };
  files?: { id: string }[];
};

export function toCardData(p: ProductRow): ProductCardData {
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
    category: p.category,
    fileCount: p._count?.files ?? p.files?.length ?? 0,
  };
}

const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  pricePaise: true,
  mrpPaise: true,
  coverImage: true,
  productType: true,
  isFree: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
  _count: { select: { files: true } },
} as const;

export async function getCategories(): Promise<CategoryNav[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  return rows.map((r) => ({ name: r.name, slug: r.slug, productCount: r._count.products }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true },
  });
}

export type ProductListOptions = {
  categorySlug?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  take?: number;
  skip?: number;
  featuredOnly?: boolean;
};

export async function getProducts(opts: ProductListOptions = {}) {
  const where: Record<string, unknown> = { isActive: true };

  if (opts.categorySlug) where.category = { slug: opts.categorySlug, isActive: true };
  if (opts.featuredOnly) where.isFeatured = true;

  const search = opts.search?.trim();
  if (search) {
    // SQLite `contains` is case-insensitive for ASCII, which is fine here.
    where.OR = [
      { title: { contains: search } },
      { shortDescription: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const orderBy =
    opts.sort === "price_asc"
      ? [{ pricePaise: "asc" as const }]
      : opts.sort === "price_desc"
        ? [{ pricePaise: "desc" as const }]
        : [{ createdAt: "desc" as const }];

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      select: CARD_SELECT,
      take: opts.take,
      skip: opts.skip,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: rows.map(toCardData), total };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      files: { orderBy: { sortOrder: "asc" }, select: { id: true, fileName: true, sizeBytes: true } },
    },
  });
}

export async function getFeaturedProducts(take = 8): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    select: CARD_SELECT,
    take,
  });
  return rows.map(toCardData);
}

/** Products sorted by popularity (featured first, then newest) */
export async function getPopularProducts(take = 4): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: CARD_SELECT,
    take,
  });
  return rows.map(toCardData);
}

/**
 * Products a customer can actually buy right now — a PDF is attached.
 * The homepage featured row uses this so it never advertises a "Coming soon"
 * card as the face of the store. Hides itself when nothing is ready.
 */
export async function getReadyProducts(take = 4): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, files: { some: {} } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: CARD_SELECT,
    take,
  });
  return rows.map(toCardData);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  take = 4,
): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    orderBy: { createdAt: "desc" },
    select: CARD_SELECT,
    take,
  });
  return rows.map(toCardData);
}

export async function getActiveCouponCodes(): Promise<string[]> {
  const rows = await prisma.coupon.findMany({
    where: { isActive: true },
    select: { code: true },
  });
  return rows.map((r) => r.code);
}

export async function getStoreStats() {
  const [products, categories, freeProducts, customers, downloads] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, isFree: true } }),
    prisma.customer.count(),
    prisma.downloadGrant.count(),
  ]);
  return { products, categories, freeProducts, customers, downloads };
}

export type { ProductRow };