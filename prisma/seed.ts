import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync } from "fs";
import path from "path";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_COUPONS } from "./data/catalog";
import { localCoverNameFor } from "./data/cover-images";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

/** Extension order used when probing public/products for a downloaded cover. */
const COVER_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

function findLocalCover(stem: string): string | null {
  const dir = path.join(process.cwd(), "public", "products");
  for (const ext of COVER_EXTS) {
    if (existsSync(path.join(dir, `${stem}${ext}`))) return `/products/${stem}${ext}`;
  }
  return null;
}

/**
 * Prefer a downloaded local cover, otherwise fall back to the source URL.
 *
 * The local filename stem comes from the cover manifest keyed on the source
 * URL — it is NOT the product slug, so match on the image's origin instead.
 */
function resolveCover(sourceImage: string, slug: string): string | null {
  const stem = localCoverNameFor(sourceImage);
  if (stem) {
    const found = findLocalCover(stem);
    if (found) return found;
  }
  // Some covers happen to be stored under the product slug.
  return findLocalCover(slug) ?? sourceImage;
}

async function main() {
  console.log("Seeding database…\n");

  // ---------------------------------------------------------------- categories
  // upsert keyed on slug so re-running is idempotent
  const categoryBySlug = new Map<string, string>();

  for (const c of SEED_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
      },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
    });
    categoryBySlug.set(c.slug, row.id);
  }
  console.log(`  categories: ${SEED_CATEGORIES.length}`);

  // ----------------------------------------------------------------- products
  let created = 0;
  for (const p of SEED_PRODUCTS) {
    const slug = slugify(p.title);
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${p.categorySlug}`);

    await prisma.product.upsert({
      where: { slug },
      create: {
        title: p.title,
        slug,
        shortDescription: p.shortDescription,
        description: p.description,
        pricePaise: Math.round(p.price * 100),
        mrpPaise: p.mrp ? Math.round(p.mrp * 100) : null,
        productType: "DIGITAL",
        coverImage: resolveCover(p.sourceImage, slug),
        isActive: true,
        isFeatured: Boolean(p.isFeatured),
        isFree: Boolean(p.isFree),
        categoryId,
      },
      update: {
        title: p.title,
        shortDescription: p.shortDescription,
        description: p.description,
        pricePaise: Math.round(p.price * 100),
        mrpPaise: p.mrp ? Math.round(p.mrp * 100) : null,
        coverImage: resolveCover(p.sourceImage, slug),
        isFeatured: Boolean(p.isFeatured),
        categoryId,
      },
    });
    created++;
  }
  console.log(`  products:   ${created}`);

  // ------------------------------------------------------------------ coupons
  for (const c of SEED_COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxDiscountPaise: c.maxDiscountPaise ?? null,
        minOrderPaise: c.minOrderPaise ?? null,
        usageLimit: c.usageLimit ?? null,
        perUserLimit: c.perUserLimit ?? null,
        startsAt: new Date(),
        expiresAt: c.expiresInDays
          ? new Date(Date.now() + c.expiresInDays * 24 * 60 * 60 * 1000)
          : null,
        isActive: true,
      },
      // Intentionally not updating counters/limits so re-seeding does not
      // resurrect a coupon's expiry or reset usage on a live store.
      update: { description: c.description, isActive: true },
    });
  }
  console.log(`  coupons:    ${SEED_COUPONS.length}`);

  // --------------------------------------------------------------- admin user
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@synapse07.store").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        name: "Store Admin",
        role: "ADMIN",
      },
    });
    console.log(`  admin user: created ${adminEmail}`);
  } else {
    console.log(`  admin user: ${adminEmail} already exists (password unchanged)`);
  }

  // ------------------------------------------------------------------ settings
  await prisma.setting.upsert({
    where: { key: "tagline" },
    create: {
      key: "tagline",
      value: "Learn Smart. Revise Fast. Crack Exams. UPSC CMS | INI-CET | NEET PG | FMGE",
    },
    update: {},
  });

  const productCount = await prisma.product.count();
  const fileCount = await prisma.productFile.count();

  console.log(`\nSeeded. products in DB: ${productCount}`);
  console.log(`Files attached: ${fileCount} (upload PDFs from Admin > Products)`);
  console.log(`\nAdmin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Run \`npm run dev\` and open http://localhost:3000/admin\n`);
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });