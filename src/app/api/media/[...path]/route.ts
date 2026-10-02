import { NextResponse } from "next/server";
import { getFile, getStorageDriver, type StorageDriver } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Public image route for product covers uploaded through the admin panel.
 *
 * Only ever used for cover art — purchased PDFs are NOT served here, they go
 * through /api/download/[token] which enforces an entitlement check.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const key = path.join("/");

  // Reject anything that is not a stored cover image path.
  if (!key.startsWith("covers/") || key.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const stream = await getFile(key, getStorageDriver());
    const extension = key.split(".").pop()?.toLowerCase() ?? "";

    const contentType: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
      svg: "image/svg+xml",
    };

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType[extension] ?? "application/octet-stream",
        // Covers are not secret and never change for a given key.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[media] read failed:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}