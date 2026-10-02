/**
 * Points products at the covers already downloaded into public/products.
 *
 * Run after scripts/fetch-images.ts if the catalog was seeded before the images
 * were fetched. Only coverImage is touched — orders, files and coupons are
 * left alone.
 *
 *   npx tsx scripts/localise-cover-images.ts
 */
import { existsSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/db";
import { SEED_PRODUCTS } from "../prisma/data/catalog";
import { localCoverNameFor } from "../prisma/data/cover-images";
import { slugify } from "../src/lib/utils";

const EXTS = [".png", ".jpg", ".jpeg", ".webp"];
const DIR = path.join(process.cwd(), "public", "products");

function findLocalCover(stem: string): string | null {
  for (const ext of EXTS) {
    if (existsSync(path.join(DIR, `${stem}${ext}`))) return `/products/${stem}${ext}`;
  }
  return null;
}

async function main() {
  let local = 0;
  let alreadyLocal = 0;
  const unresolved: string[] = [];

  for (const p of SEED_PRODUCTS) {
    const slug = slugify(p.title);

    const stem = localCoverNameFor(p.sourceImage) ?? slug;
    const file = findLocalCover(stem) ?? findLocalCover(slug);

    if (!file) {
      unresolved.push(`${slug}  (no local file, keeping remote URL)`);
      continue;
    }

    const row = await prisma.product.findUnique({ where: { slug } });
    if (!row) {
      unresolved.push(`${slug}  (not in the database — run the seed)`);
      continue;
    }

    if (row.coverImage === file) {
      alreadyLocal++;
      continue;
    }

    await prisma.product.update({ where: { slug }, data: { coverImage: file } });
    local++;
  }

  console.log(`  updated to local : ${local}`);
  console.log(`  already local    : ${alreadyLocal}`);
  console.log(`  unresolved       : ${unresolved.length}`);
  for (const u of unresolved) console.log(`    - ${u}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());