import { promises as fs } from "fs";
import path from "path";
import postgres from "postgres";
import { neon as createNeon } from "@neondatabase/serverless";
import type { Product, Order, Customer, Category } from "./types";

const dataDir = path.join(process.cwd(), "data");
const productsPath = path.join(dataDir, "products.json");
const ordersPath = path.join(dataDir, "orders.json");
const customersPath = path.join(dataDir, "customers.json");
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

export async function getProduct(id: string): Promise<Product | undefined> {
  const sql = getPg();
  if (!sql) {
    const items = await getProducts();
    return items.find((p) => p.id === id);
  }
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_products WHERE id = ${id} LIMIT 1`;
  return rows.length ? (rows[0].data as Product) : undefined;
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

export async function getFeaturedProducts(take = 8): Promise<Product[]> {
  const items = await getPublishedProducts();
  return items.filter(p => p.isFeatured).slice(0, take);
}

export async function getPopularProducts(take = 4): Promise<Product[]> {
  const items = await getPublishedProducts();
  return items.slice(0, take);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const items = await getPublishedProducts();
  return items.filter(p => p.categorySlug === categorySlug);
}

export async function getRelatedProducts(productId: string, categorySlug: string, take = 4): Promise<Product[]> {
  const items = await getPublishedProducts();
  return items.filter(p => p.categorySlug === categorySlug && p.id !== productId).slice(0, take);
}

export async function saveProducts(items: Product[]) {
  const sql = getPg();
  if (!sql) {
    await writeJson(productsPath, items);
    return;
  }
  await ensureSchema(sql);
  if (pgIsNeon || !sql.begin) {
    for (let i = 0; i < items.length; i++) {
      await sql`INSERT INTO s_products (id, position, data) VALUES (${items[i].id}, ${i}, ${sqlJson(sql, items[i])})
        ON CONFLICT (id) DO UPDATE SET position = EXCLUDED.position, data = EXCLUDED.data`;
    }
    if (items.length === 0) {
      await sql`DELETE FROM s_products`;
    } else {
      await sql`DELETE FROM s_products WHERE NOT (id = ANY(${items.map((item) => item.id)}))`;
    }
    return;
  }
  await sql.begin(async (tx: any) => {
    for (let i = 0; i < items.length; i++) {
      await tx`INSERT INTO s_products (id, position, data) VALUES (${items[i].id}, ${i}, ${tx.json(items[i])})
        ON CONFLICT (id) DO UPDATE SET position = EXCLUDED.position, data = EXCLUDED.data`;
    }
    if (items.length === 0) {
      await tx`DELETE FROM s_products`;
    } else {
      await tx`DELETE FROM s_products WHERE NOT (id = ANY(${items.map((item) => item.id)}))`;
    }
  });
}

export async function saveProduct(product: Product): Promise<void> {
  const sql = getPg();
  if (!sql) {
    const items = await getProducts();
    const index = items.findIndex((p) => p.id === product.id);
    if (index === -1) items.unshift(product);
    else items[index] = product;
    await writeJson(productsPath, items);
    return;
  }
  await ensureSchema(sql);
  await sql`
    INSERT INTO s_products (id, position, data)
    VALUES (
      ${product.id},
      COALESCE((SELECT MIN(position) - 1 FROM s_products), 0),
      ${sqlJson(sql, product)}
    )
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}

export async function deleteProduct(id: string): Promise<void> {
  const sql = getPg();
  if (!sql) {
    const items = await getProducts();
    await writeJson(productsPath, items.filter((p) => p.id !== id));
    return;
  }
  await ensureSchema(sql);
  await sql`DELETE FROM s_products WHERE id = ${id}`;
}

export async function bulkSetProductStatus(ids: string[], status: "active" | "inactive"): Promise<number> {
  if (!ids.length) return 0;
  const sql = getPg();
  if (!sql) {
    const items = await getProducts();
    let changed = 0;
    const next = items.map((p) => {
      if (ids.includes(p.id) && p.isActive !== (status === "active")) {
        changed++;
        return { ...p, isActive: status === "active" };
      }
      return p;
    });
    if (changed) await writeJson(productsPath, next);
    return changed;
  }
  await ensureSchema(sql);
  const rows = await sql`
    UPDATE s_products
    SET data = jsonb_set(data, '{isActive}', ${sqlJson(sql, status === "active")})
    WHERE id = ANY(${ids}) AND (data->>'isActive')::boolean IS DISTINCT FROM ${status === "active"}
    RETURNING id
  `;
  return rows.length;
}

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  const sql = getPg();
  if (!sql) return readJson<Category[]>(categoriesPath, []);
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_categories ORDER BY (data->>'sortOrder')::int ASC, (data->>'name') ASC`;
  return rows.map((row: any) => row.data as Category);
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

export async function saveCategories(items: Category[]) {
  const sql = getPg();
  if (!sql) {
    await writeJson(categoriesPath, items);
    return;
  }
  await ensureSchema(sql);
  for (const item of items) {
    await sql`INSERT INTO s_categories (slug, data) VALUES (${item.slug}, ${sqlJson(sql, item)})
      ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data`;
  }
}

// ==================== ORDERS ====================

export async function getOrders(): Promise<Order[]> {
  const sql = getPg();
  if (!sql) return readJson<Order[]>(ordersPath, []);
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_orders ORDER BY created_at DESC, id ASC`;
  return rows.map((row: any) => row.data as Order);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const sql = getPg();
  if (!sql) {
    const orders = await getOrders();
    return orders.find((order) => order.id === id);
  }
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_orders WHERE id = ${id} LIMIT 1`;
  return rows.length ? (rows[0].data as Order) : undefined;
}

export async function addOrder(order: Order): Promise<void> {
  const sql = getPg();
  if (!sql) {
    const orders = await getOrders();
    await writeJson(ordersPath, [order, ...orders]);
    return;
  }
  await ensureSchema(sql);
  await sql`INSERT INTO s_orders (id, created_at, data) VALUES (${order.id}, ${order.createdAt}, ${sqlJson(sql, order)})`;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "trackingNumber" | "contact" | "shippingAddress" | "paymentProvider" | "paymentOrderId" | "paymentRefId" | "paymentSignature" | "paidAt">>
): Promise<Order | null> {
  const sql = getPg();
  if (!sql) {
    const orders = await getOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) return null;
    orders[index] = { ...orders[index], ...patch };
    await writeJson(ordersPath, orders);
    return orders[index];
  }
  await ensureSchema(sql);
  const rows = await sql`
    UPDATE s_orders
    SET data = data || ${sqlJson(sql, patch)}::jsonb
    WHERE id = ${id}
    RETURNING data
  `;
  return rows.length ? (rows[0].data as Order) : null;
}

// ==================== CUSTOMERS ====================

export async function getCustomers(): Promise<Customer[]> {
  const sql = getPg();
  if (!sql) return readJson<Customer[]>(customersPath, []);
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_customers ORDER BY (data->>'createdAt') DESC`;
  return rows.map((row: any) => row.data as Customer);
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const sql = getPg();
  const target = email.trim().toLowerCase();
  if (!sql) {
    const all = await getCustomers();
    return all.find((c) => c.email.toLowerCase() === target);
  }
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_customers WHERE data->>'email' = ${target} LIMIT 1`;
  return rows.length ? (rows[0].data as Customer) : undefined;
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const sql = getPg();
  if (!sql) {
    const all = await getCustomers();
    return all.find((c) => c.id === id);
  }
  await ensureSchema(sql);
  const rows = await sql`SELECT data FROM s_customers WHERE id = ${id} LIMIT 1`;
  return rows.length ? (rows[0].data as Customer) : undefined;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  googleId?: string;
  passwordHash?: string;
}): Promise<Customer> {
  const customer: Customer = {
    id: newId("cus-"),
    name: input.name,
    email: input.email,
    googleId: input.googleId,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  const sql = getPg();
  if (!sql) {
    const all = await getCustomers();
    await writeJson(customersPath, [customer, ...all]);
    return customer;
  }
  await ensureSchema(sql);
  await sql`INSERT INTO s_customers (id, data) VALUES (${customer.id}, ${sqlJson(sql, customer)})`;
  return customer;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "name" | "passwordHash" | "googleId">>
): Promise<void> {
  const sql = getPg();
  if (!sql) {
    const all = await getCustomers();
    await writeJson(
      customersPath,
      all.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    return;
  }
  await ensureSchema(sql);
  await sql`UPDATE s_customers SET data = data || ${sqlJson(sql, patch)} WHERE id = ${id}`;
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

// ==================== UTILITIES ====================

export function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

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