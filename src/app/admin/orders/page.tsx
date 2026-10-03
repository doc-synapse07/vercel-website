import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Search, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { StatusBadge } from "../StatusBadge";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

const STATUS_COPY: Record<string, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? sp.status!
    : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { customerName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (status) where.status = status;

  const [orders, total, revenueAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        email: true,
        phone: true,
        totalPaise: true,
        status: true,
        paymentProvider: true,
        couponCode: true,
        createdAt: true,
        _count: { select: { items: true, downloads: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, status: "PAID" },
      _sum: { totalPaise: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const collected = revenueAgg._sum.totalPaise ?? 0;

  function buildUrl(patch: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (page !== 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Orders</h1>
        <p className="mt-1 text-sm text-ink-500">
          {total} order{total === 1 ? "" : "s"} matching this view
          {collected > 0 ? ` · ${formatINR(collected)} collected` : ""}
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search order number, name, email or phone…"
            className="w-full rounded-lg border border-ink-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href={buildUrl({ status: undefined })}
            className={`btn btn-sm ${!status ? "btn-primary" : "btn-outline"}`}
          >
            All
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s })}
              className={`btn btn-sm ${status === s ? "btn-primary" : "btn-outline"}`}
            >
              {STATUS_COPY[s]}
            </Link>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink-300 py-16 text-center">
          <ShoppingCart size={26} className="mx-auto mb-3 text-ink-400" />
          <p className="mb-4 text-sm text-ink-500">
            {search || status ? "No orders match this filter." : "No orders yet."}
          </p>
          {!search && !status && (
            <Link
              href="/products"
              className="btn btn-primary btn-sm"
            >
              Place a test order
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      {o.couponCode && (
                        <p className="text-xs text-ink-500">{o.couponCode}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{o.customerName}</p>
                      <p className="text-xs text-ink-500">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{o.phone}</td>
                    <td className="px-4 py-3 text-ink-600">{o._count.items}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {formatINR(o.totalPaise)}
                    </td>
                    <td className="px-4 py-3 text-xs uppercase text-ink-500">
                      {o.paymentProvider ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
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
              className={`btn btn-sm min-w-10 ${n === page ? "btn-primary" : "btn-outline"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}