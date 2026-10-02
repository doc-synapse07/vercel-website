import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { getStorageDriver } from "@/lib/storage";
import { ProductForm } from "../ProductForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> Back to products
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink-900">Add product</h1>
      <p className="mb-6 text-sm text-ink-500">
        Create the listing first, then attach one or more PDFs in the next step.
      </p>

      <ProductForm categories={categories} storageDriver={getStorageDriver()} />
    </div>
  );
}