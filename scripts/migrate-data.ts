import { PrismaClient } from "@prisma/client";
import postgres from "postgres";

const prisma = new PrismaClient();
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

function sqlJson(sql: any, value: unknown): unknown {
  if (sql && typeof sql.json === "function") return sql.json(value);
  return value;
}

async function migrate() {
  console.log("Starting migration...");

  // 1. Migrate Categories
  console.log("Migrating categories...");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });
  
  for (const cat of categories) {
    await sql`
      INSERT INTO s_categories (slug, data)
      VALUES (${cat.slug}, ${sqlJson(sql, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive
      })})
      ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data
    `;
  }
  console.log(`Migrated ${categories.length} categories`);

  // 2. Migrate Products
  console.log("Migrating products...");
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      files: { orderBy: { sortOrder: "asc" } }
    },
    orderBy: { createdAt: "asc" }
  });

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const variants = p.productType === "PHYSICAL" 
      ? [{ id: "default", label: "Default", pricePaise: p.pricePaise, inStock: true }]
      : [];

    const files = p.files.map((f, idx) => ({
      id: f.id,
      fileName: f.fileName,
      sizeBytes: f.sizeBytes,
      sortOrder: f.sortOrder
    }));

    const productData = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDescription: p.shortDescription,
      description: p.description,
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      coverImage: p.coverImage,
      productType: p.productType,
      kind: p.productType,
      variants,
      files,
      categorySlug: p.categoryId,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      inStock: p.isFree ? true : (p.productType === "PHYSICAL" ? (p.stockQty ?? 0) > 0 : true),
      isFree: p.isFree
    };

    await sql`
      INSERT INTO s_products (id, position, data)
      VALUES (${p.id}, ${i}, ${sqlJson(sql, productData)})
      ON CONFLICT (id) DO UPDATE SET position = EXCLUDED.position, data = EXCLUDED.data
    `;
  }
  console.log(`Migrated ${products.length} products`);

  // 3. Migrate Orders
  console.log("Migrating orders...");
  const orders = await prisma.order.findMany({
    include: { items: true }
  });

  for (const order of orders) {
    const orderItems = order.items.map(item => ({
      id: item.id,
      name: item.title,
      pricePaise: item.unitPricePaise,
      mrpPaise: item.unitPricePaise,
      productType: item.productType,
      quantity: item.quantity,
      kind: item.productType
    }));

    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status.toLowerCase(),
      items: orderItems,
      subtotalPaise: order.subtotalPaise,
      discountPaise: order.discountPaise,
      shippingPaise: order.shippingPaise,
      totalPaise: order.totalPaise,
      total: order.totalPaise,
      contact: {
        name: order.customerName,
        email: order.email,
        phone: order.phone
      },
      shippingAddress: order.shippingAddress,
      courier: undefined,
      trackingNumber: undefined,
      paymentProvider: order.paymentProvider,
      paymentOrderId: order.paymentOrderId,
      paymentRefId: order.paymentRefId,
      paymentSignature: order.paymentSignature,
      paidAt: order.paidAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      shipping: order.shippingPaise
    };

    await sql`
      INSERT INTO s_orders (id, created_at, data)
      VALUES (${order.id}, ${order.createdAt.toISOString()}, ${sqlJson(sql, orderData)})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
  }
  console.log(`Migrated ${orders.length} orders`);

  // 4. Migrate Customers
  console.log("Migrating customers...");
  const customers = await prisma.customer.findMany();

  for (const customer of customers) {
    const customerData = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      googleId: customer.googleId,
      passwordHash: customer.passwordHash,
      createdAt: customer.createdAt.toISOString()
    };

    await sql`
      INSERT INTO s_customers (id, data)
      VALUES (${customer.id}, ${sqlJson(sql, customerData)})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
  }
  console.log(`Migrated ${customers.length} customers`);

  // 5. Migrate Settings
  console.log("Migrating settings...");
  const settings = await prisma.setting.findMany();

  for (const setting of settings) {
    await sql`
      INSERT INTO s_settings (key, data)
      VALUES (${setting.key}, ${sqlJson(sql, setting.value)})
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data
    `;
  }
  console.log(`Migrated ${settings.length} settings`);

  console.log("Migration complete!");
  await sql.end();
  await prisma.$disconnect();
}

migrate().catch(async (e) => {
  console.error(e);
  await sql.end();
  await prisma.$disconnect();
  process.exit(1);
});