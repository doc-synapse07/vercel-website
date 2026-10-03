/**
 * One-time repair: rows migrated by scripts/migrate-data.ts stored the Prisma
 * category *id* (a cuid like cmurda5w60000q6bkgwc9hqmv) in
 * s_products.data->>'categorySlug' instead of the category slug. That cuid
 * leaked onto product cards and broke category filtering.
 *
 * This rewrites those values to the real slugs. Safe to re-run (idempotent).
 *
 * Run with: npx tsx scripts/repair-category-slugs.ts
 */
import { PrismaClient } from "@prisma/client";
import postgres from "postgres";

const prisma = new PrismaClient();
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  console.log(`Categories in Prisma: ${cats.length}`);

  let fixed = 0;
  for (const c of cats) {
    const rows: Array<{ count: number }> =
      await sql`UPDATE s_products SET data = jsonb_set(data, '{categorySlug}', to_jsonb(${c.slug}::text)) WHERE data->>'categorySlug' = ${c.id}`;
    // postgres lib returns row count on the result array for UPDATE
    const n = (rows as unknown as { count: number }).count ?? 0;
    if (n > 0) console.log(`  ${c.slug}: fixed ${n}`);
    fixed += n;
  }
  console.log(`Fixed ${fixed} product rows`);

  const leftover = (await sql`
    SELECT id, data->>'categorySlug' AS cs FROM s_products
    WHERE data->>'categorySlug' NOT IN (SELECT slug FROM s_categories)
    LIMIT 20
  `) as Array<{ id: string; cs: string }>;
  if (leftover.length === 0) {
    console.log("All product categorySlug values now match s_categories slugs.");
  } else {
    console.log("Still unmatched rows:");
    for (const r of leftover) console.log(`  ${r.id} -> ${r.cs}`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
    await prisma.$disconnect();
  });
