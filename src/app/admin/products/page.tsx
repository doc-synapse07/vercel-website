import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { toggleProductActiveAction, deleteProductAction } from "@/app/admin/actions/products";
import { Plus, Search, FileWarning, Eye, EyeOff, Trash2, Pencil } from "lucide-react";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const categorySlug = sp.cat ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search };
  if (categorySlug) where.category = { slug: categorySlug };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { files: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function buildUrl(patch: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categorySlug) params.set("cat", categorySlug);
    if (page !== 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Products</h1>
          <p className="mt-1 text-sm text-ink-500">{total} products in the store</p>
        </div>
        <Link
          href="/admin/products/new"
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Add product
        </Link>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1" action="/admin/products">
          {categorySlug && <input type="hidden" name="cat" value={categorySlug} />}
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search by title…"
            className="w-full rounded-lg border border-ink-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <div className="flex gap-2 overflow-x-auto">
          <Link
            href={buildUrl({ cat: undefined })}
            className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium ${
              !categorySlug
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-ink-300 bg-white text-ink-600 hover:border-brand-400"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={buildUrl({ cat: c.slug })}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium ${
                categorySlug === c.slug
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-ink-300 bg-white text-ink-600 hover:border-brand-400"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink-300 py-16 text-center">
          <p className="mb-4 text-sm text-ink-500">
            {search || categorySlug ? "No products match this filter." : "No products yet."}
          </p>
          <Link
            href="/admin/products/new"
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} /> Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Files</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-ink-100">
                          {p.coverImage && (
                            <Image
                              src={p.coverImage}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-ink-500">/{p.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-ink-600">{p.category.name}</td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-ink-900">
                        {p.isFree ? "Free" : formatINR(p.pricePaise)}
                      </span>
                      {p.mrpPaise && p.mrpPaise > p.pricePaise && (
                        <span className="ml-1.5 text-xs text-ink-400 line-through">
                          {formatINR(p.mrpPaise)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {p._count.files > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                          {p._count.files} PDF{p._count.files === 1 ? "" : "s"}
                        </span>
                      ) : p.productType === "DIGITAL" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <FileWarning size={11} /> None
                        </span>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          p.isActive
                            ? "bg-brand-100 text-brand-800"
                            : "bg-ink-200 text-ink-600"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "HIDDEN"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <form action={toggleProductActiveAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            title={p.isActive ? "Hide from store" : "Show in store"}
                            className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                          >
                            {p.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </form>

                        <Link
                          href={`/admin/products/${p.id}`}
                          title="Edit product"
                          className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 hover:text-brand-700"
                        >
                          <Pencil size={15} />
                        </Link>

                        <form action={deleteProductAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            title="Delete product"
                            className="rounded-md p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildUrl({ page: n === 1 ? undefined : n })}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
                n === page
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-ink-300 bg-white text-ink-600 hover:border-brand-400"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}