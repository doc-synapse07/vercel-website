/**
 * Downloads every product cover referenced by the manifest into
 * public/products/ so the storefront is self-contained and deployable.
 *
 * Re-running is safe: files that already exist are skipped.
 *
 *   npx tsx scripts/fetch-images.ts
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { COVER_IMAGES } from "../prisma/data/cover-images";

const OUT_DIR = path.join(process.cwd(), "public", "products");

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
};

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const failed: [string, string][] = [];

  for (const { name, url } of COVER_IMAGES) {
    // Any extension will do — we only need to know we already have this one.
    const already =
      (await exists(path.join(OUT_DIR, `${name}.png`))) ||
      (await exists(path.join(OUT_DIR, `${name}.jpg`))) ||
      (await exists(path.join(OUT_DIR, `${name}.jpeg`))) ||
      (await exists(path.join(OUT_DIR, `${name}.webp`)));

    if (already) {
      skipped++;
      continue;
    }

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SynapseStore/1.0)" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
      const ext = EXT_BY_MIME[mime] ?? ".png";
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(path.join(OUT_DIR, `${name}${ext}`), buf);

      downloaded++;
      console.log(`  ok  ${name}${ext} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (error) {
      failed.push([name, (error as Error).message]);
      console.log(`  ERR ${name}: ${(error as Error).message}`);
    }
  }

  console.log(
    `\ndownloaded=${downloaded} skipped=${skipped} failed=${failed.length}\noutput: ${OUT_DIR}`,
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});