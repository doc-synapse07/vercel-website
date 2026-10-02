import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function setup() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
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
  
  await sql`CREATE INDEX IF NOT EXISTS idx_products_position ON s_products(position)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created ON s_orders(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON s_customers((data->>'email'))`;
  
  console.log('Schema created successfully');
  await sql.end();
}

setup().catch(console.error);