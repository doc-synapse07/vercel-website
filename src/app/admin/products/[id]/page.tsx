import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { getStorageDriver } from "@/lib/storage";
import { ProductForm } from "../ProductForm";
import { deleteProductAction } from "@/app/admin/actions/products";
import { formatBytes, formatDate } from "@/lib/utils";
import { ArrowLeft, Trash2, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; detail?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const sp = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { files: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const stats = await prisma.orderItem.aggregate({
    where: { productId: product.id },
    _sum: { subtotalPaise: true, quantity: true },
    _count: true,
  });

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> Back to products
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Edit product</h1>
          <p className="mt-1 text-sm text-ink-500">
            Last updated {formatDate(product.updatedAt)} · {stats._count} sale
            {stats._count === 1 ? "" : "s"} ·{" "}
            {stats._sum.quantity ?? 0} unit{(stats._sum.quantity ?? 0) === 1 ? "" : "s"} sold
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="btn btn-outline btn-sm"
          >
            <Eye size={15} /> Preview
          </Link>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={15} /> Delete
            </button>
          </form>
        </div>
      </div>

      {sp.created === "1" && (
        <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          {sp.detail || "Product created."} Attach your PDFs below so customers can download
          them.
        </p>
      )}

      {product.productType === "DIGITAL" && product.files.length === 0 && (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          No PDFs are attached yet. Customers who buy this product will not receive anything to
          download — upload at least one PDF below.
        </p>
      )}

      <ProductForm
        categories={categories}
        storageDriver={getStorageDriver()}
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          categoryId: product.categoryId,
          pricePaise: product.pricePaise,
          mrpPaise: product.mrpPaise,
          productType: product.productType,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isFree: product.isFree,
          stockQty: product.stockQty,
          weightGrams: product.weightGrams,
          coverImage: product.coverImage,
          files: product.files.map((f) => ({
            id: f.id,
            fileName: f.fileName,
            sizeBytes: f.sizeBytes,
          })),
        }}
      />

      {product.files.length > 0 && (
        <section className="mt-8 rounded-card border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-ink-900">Attached files</h2>
          <ul className="flex flex-col gap-2">
            {product.files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <span className="text-ink-500">#{f.sortOrder + 1}</span>
                <span className="min-w-0 flex-1 truncate text-ink-900">{f.fileName}</span>
                <span className="text-xs text-ink-400">{formatBytes(f.sizeBytes)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            Revenue from this product:{" "}
            <span className="font-semibold text-ink-900">
              ₹{((stats._sum.subtotalPaise ?? 0) / 100).toFixed(2)}
            </span>
          </p>
        </section>
      )}
    </div>
  );
}