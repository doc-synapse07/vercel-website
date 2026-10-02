/**
 * Attaches a generated sample PDF to the first N products.
 *
 * The 32 seeded products ship without PDFs on purpose — the real notes are
 * added by the store owner through the admin panel. This script exists purely
 * so the download pipeline (grant -> token -> /api/download) can be exercised
 * end to end before any real files exist.
 *
 *   npx tsx scripts/attach-sample-pdf.ts [count]
 */
import { promises as fs } from "fs";
import path from "path";
import { randomUUID, createHash } from "crypto";
import { prisma } from "../src/lib/db";
import { buildStorageKey, getStorageDriver, putFile } from "../src/lib/storage";

/** Minimal, valid single-page PDF. */
function makeSamplePdf(title: string): Buffer {
  const text = title.replace(/[()\\]/g, "");
  const stream = `BT /F1 18 Tf 60 700 Td (Synapse 07) Tj 0 -30 Td /F1 12 Tf (${text}) Tj 0 -24 Td (Sample file - replace with real notes.) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

async function main() {
  const count = Number(process.argv[2] ?? 3);
  const driver = getStorageDriver();

  const products = await prisma.product.findMany({
    where: { isActive: true, productType: "DIGITAL" },
    orderBy: { createdAt: "asc" },
    take: count,
  });

  if (!products.length) {
    console.log("No digital products found. Run `npm run db:seed` first.");
    return;
  }

  for (const product of products) {
    const existing = await prisma.productFile.count({ where: { productId: product.id } });
    if (existing > 0) {
      console.log(`· ${product.title} — already has ${existing} file(s), skipped`);
      continue;
    }

    const fileName = `${product.slug.slice(0, 40)}-sample.pdf`;
    const body = makeSamplePdf(product.title);
    const key = buildStorageKey({ productSlug: product.slug, originalFileName: fileName });

    await putFile({ key, body, contentType: "application/pdf" });

    await prisma.productFile.create({
      data: {
        productId: product.id,
        fileName,
        storageKey: key,
        storageDriver: driver,
        sizeBytes: body.length,
        contentType: "application/pdf",
      },
    });

    console.log(`✓ ${product.title} -> ${key} (${driver}, ${body.length} bytes)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());