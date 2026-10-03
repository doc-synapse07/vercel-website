import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

/**
 * Storage adapter for product files.
 *
 * Primary driver is Cloudflare R2 (S3-compatible). If R2 credentials are absent
 * it falls back to writing into ./storage so local development needs no account.
 *
 * IMPORTANT: files are served only through /api/download/[token] after a
 * DownloadGrant is validated. Nothing here is made publicly readable — that is
 * deliberate, otherwise purchased PDFs would be enumerable by URL.
 */

export type StorageDriver = "r2" | "local";

export const LOCAL_STORAGE_DIR = path.join(process.cwd(), "storage");

export function getStorageDriver(): StorageDriver {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET) return "r2";
  return "local";
}

export function isR2Configured(): boolean {
  return getStorageDriver() === "r2";
}

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (client) return client;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.");
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

/** Unique, collision-proof key that keeps a readable prefix for debugging. */
export function buildStorageKey(params: {
  productSlug: string;
  originalFileName: string;
}): string {
  const safeName = params.originalFileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-100);
  const hash = createHash("sha256").update(randomUUID()).digest("hex").slice(0, 12);
  return `products/${params.productSlug}/${Date.now()}-${hash}-${safeName}`;
}

/** Blocks path traversal before we touch the filesystem. */
function assertSafeLocalKey(key: string) {
  const resolved = path.resolve(LOCAL_STORAGE_DIR, key);
  const base = path.resolve(LOCAL_STORAGE_DIR);
  if (!resolved.startsWith(base + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export async function putFile(params: {
  key: string;
  body: Buffer;
  contentType: string;
  driver?: StorageDriver;
}): Promise<StorageDriver> {
  const driver = params.driver ?? getStorageDriver();

  if (driver === "r2") {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
    return "r2";
  }

  const target = assertSafeLocalKey(params.key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, params.body);
  return "local";
}

export async function getFile(key: string, driver: StorageDriver = "r2"): Promise<NodeJS.ReadableStream> {
  if (driver === "r2") {
    const res = await getR2Client().send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }),
    );
    if (!res.Body) throw new Error("Empty body returned from storage");
    return res.Body as NodeJS.ReadableStream;
  }

  const target = assertSafeLocalKey(key);
  await fs.access(target);
  const { createReadStream } = await import("fs");
  return createReadStream(target);
}

export async function deleteFile(key: string, driver: StorageDriver = "r2"): Promise<void> {
  if (driver === "r2") {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
    return;
  }
  const target = assertSafeLocalKey(key);
  await fs.rm(target, { force: true });
}

/** Bucket totals for the admin usage card. Zeroed when R2 is not configured. */
export async function getR2Stats(): Promise<{ objectCount: number; totalBytes: number }> {
  if (!isR2Configured()) return { objectCount: 0, totalBytes: 0 };
  let objectCount = 0;
  let totalBytes = 0;
  let continuationToken: string | undefined;
  try {
    do {
      const res = await getR2Client().send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET!,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of res.Contents ?? []) {
        objectCount += 1;
        totalBytes += obj.Size ?? 0;
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);
  } catch {
    return { objectCount: 0, totalBytes: 0 };
  }
  return { objectCount, totalBytes };
}