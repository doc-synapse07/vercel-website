import { promises as fs } from "fs";
import path from "path";
import postgres from "postgres";
import { neon as createNeon } from "@neondatabase/serverless";
import type { Product, Category } from "./types";

const dataDir = path.join(process.cwd(), "data");
const productsPath = path.join(dataDir, "products.json");
const categoriesPath = path.join(dataDir, "categories.json");
const settingsPath = path.join(dataDir, "settings.json");

let pg: any = null;
let pgIsNeon = false;
let schemaReady = false;

function getPg(): any {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) return null;
  if (pg) return pg;
  const isNeonHost = url.includes("neon.tech");
  const isWorkers = typeof (globalThis as unknown as { caches?: unknown }).caches !== "undefined" || !!process.env.CF_PAGES || !!process.env.CLOUDFLARE;
  if (isNeonHost || isWorkers) {
    pg = createNeon(url);
    pgIsNeon = true;
  } else {
    pg = postgres(url, { max: 4, idle_timeout: 20, connect_timeout: 10, max_lifetime: 60 * 10 });
    pgIsNeon = false;
  }
  return pg;
}

function sqlJson(sql: any, value: unknown): unknown {
  // A bare string (e.g. a store name) is NOT valid JSON — Postgres rejects it
  // with "invalid input syntax for type json". Quote it first so the jsonb
  // column receives a proper JSON string literal.
  if (typeof value === "string") return JSON.stringify(value);
  if (sql && typeof sql.json === "function") return sql.json(value);
  return value;
}

async function ensureSchema(sql: any) {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS s_products (
    id TEXT PRIMARY KEY,
    position INTEGER NOT NULL DEFAULT 0,
    data JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS s_orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    data JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS s_customers (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS s_categories (
    slug TEXT PRIMARY KEY,
    data JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS s_settings (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL
  )`;
  schemaReady = true;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

// ==================== PRODUCTS ====================

export async function getProducts(): Promise<Product[]> {
  const sql = getPg();
  if (!sql) return readJson<Product[]>(productsPath, []);
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_products ORDER BY position ASC, id ASC`;
  return rows.map((row: any) => row.data as Product);
}

export async function getPublishedProducts(): Promise<Product[]> {
  const items = await getProducts();
  return items.filter((p) => p.isActive);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const sql = getPg();
  if (!sql) {
    const items = await getProducts();
    return items.find((p) => p.slug === slug);
  }
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_products WHERE data->>'slug' = ${slug} LIMIT 1`;
  return rows.length ? (rows[0].data as Product) : undefined;
}

export async function getPopularProducts(take = 4): Promise<Product[]> {
  const items = await getPublishedProducts();
  return items.slice(0, take);
}

export async function getRelatedProducts(productId: string, categorySlug: string, take = 4): Promise<Product[]> {
  const items = await getPublishedProducts();
  return items.filter(p => p.categorySlug === categorySlug && p.id !== productId).slice(0, take);
}

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  const sql = getPg();
  if (!sql) return readJson<Category[]>(categoriesPath, []);
  await ensureSchema(sql);
  
  // Get categories with product counts
  const rows = await sql`
    SELECT 
      c.data,
      COALESCE(p.product_count, 0) as product_count
    FROM s_categories c
    LEFT JOIN (
      SELECT (data->>'categorySlug') as category_slug, count(*) as product_count
      FROM s_products
      WHERE (data->>'isActive')::boolean = true
      GROUP BY (data->>'categorySlug')
    ) p ON c.data->>'slug' = p.category_slug
    ORDER BY (c.data->>'sortOrder')::int ASC, (c.data->>'name') ASC
  `;
  
  return rows.map((row: any) => ({
    ...row.data,
    productCount: Number(row.product_count || 0)
  } as Category));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const sql = getPg();
  if (!sql) {
    const items = await getCategories();
    return items.find((c) => c.slug === slug);
  }
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_categories WHERE slug = ${slug} LIMIT 1`;
  return rows.length ? (rows[0].data as Category) : undefined;
}

// ==================== SETTINGS ====================

export async function getSettings(): Promise<Record<string, string>> {
  const sql = getPg();
  if (!sql) return readJson<Record<string, string>>(settingsPath, {});
  await ensureSchema(sql);
  const rows = await sql`SELECT key, data FROM s_settings`;
  const out: Record<string, string> = {};
  for (const row of rows as any[]) {
    out[row.key] = row.data as string;
  }
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const sql = getPg();
  if (!sql) {
    const all = await getSettings();
    all[key] = value;
    await writeJson(settingsPath, all);
    return;
  }
  await ensureSchema(sql);
  await sql`INSERT INTO s_settings (key, data) VALUES (${key}, ${sqlJson(sql, value)})
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`;
}

// ==================== STATS ====================

export async function getStoreStats() {
  const sql = getPg();
  if (!sql) {
    const products = await getProducts();
    const categories = await getCategories();
    return {
      products: products.length,
      categories: categories.length,
      freeProducts: products.filter((p) => p.isFree).length,
      customers: 0,
      downloads: 0,
    };
  }
  await ensureSchema(sql);
  const [productCount, categoryCount, freeProductCount, customerCount, downloadCount] = await Promise.all([
    sql`SELECT count(*)::int as c FROM s_products WHERE (data->>'isActive')::boolean = true`,
    sql`SELECT count(*)::int as c FROM s_categories`,
    sql`SELECT count(*)::int as c FROM s_products WHERE (data->>'isFree')::boolean = true`,
    sql`SELECT count(*)::int as c FROM s_customers`,
    sql`SELECT COALESCE(SUM((item->>'quantity')::int), 0)::int as c FROM s_orders, jsonb_array_elements((data->>'items')::jsonb) as item WHERE (data->>'status')::text = 'paid'`,
  ]);
  return {
    products: productCount[0]?.c || 0,
    categories: categoryCount[0]?.c || 0,
    freeProducts: freeProductCount[0]?.c || 0,
    customers: customerCount[0]?.c || 0,
    downloads: downloadCount[0]?.c || 0,
  };
}

/** Live Postgres size in bytes (Neon dashboard figure). 0 when offline/local. */
export async function getNeonSizeBytes(): Promise<number> {
  const sql = getPg();
  if (!sql) return 0;
  try {
    const [row] = await sql`SELECT pg_database_size(current_database()) AS size_bytes`;
    return Number(row.size_bytes || 0);
  } catch {
    return 0;
  }
}