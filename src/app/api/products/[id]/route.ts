import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Minimal product lookup used by the Buy now flow. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      pricePaise: true,
      mrpPaise: true,
      coverImage: true,
      productType: true,
      isFree: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}