import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/storage";
import type { StorageDriver } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Streams a purchased file after validating its one-time token.
 *
 * Nothing is served from a public URL — a customer must hold a valid,
 * unexpired DownloadGrant and must have download attempts remaining.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const grant = await prisma.downloadGrant.findUnique({
    where: { token },
    include: { productFile: true },
  });

  if (!grant) {
    return NextResponse.json({ error: "This download link is not valid." }, { status: 404 });
  }

  if (grant.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This download link has expired. Links are valid for 24 hours." },
      { status: 410 },
    );
  }

  if (grant.downloadCount >= grant.maxDownloads) {
    return NextResponse.json(
      { error: "This link has reached its download limit." },
      { status: 429 },
    );
  }

  let stream: NodeJS.ReadableStream;
  try {
    stream = await getFile(
      grant.productFile.storageKey,
      (grant.productFile.storageDriver || "r2") as StorageDriver,
    );
  } catch (error) {
    console.error("[download] storage read failed:", error);
    return NextResponse.json(
      { error: "The file is temporarily unavailable. Please contact support." },
      { status: 502 },
    );
  }

  // Count the attempt before streaming so a failed transfer cannot be retried forever.
  await prisma.downloadGrant.update({
    where: { id: grant.id },
    data: { downloadCount: { increment: 1 }, lastUsedAt: new Date() },
  });

  const fileName = grant.productFile.fileName.replace(/["\r\n]/g, "");

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": grant.productFile.contentType || "application/pdf",
      "Content-Length": String(grant.productFile.sizeBytes || 0),
      // Force a download rather than rendering the PDF in the browser.
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}