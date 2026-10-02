import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { formatINR, formatDate } from "@/lib/utils";
import { isSmtpConfigured } from "@/lib/mail";
import { getAvailableProviders, isLiveMode } from "@/lib/payments";
import { getStorageDriver } from "@/lib/storage";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";
import {
  Package,
  ShoppingCart,
  Wallet,
  Users,
  Ticket,
  Download,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    paidAgg,
    revenueAgg,
    recentOrders,
    totalCustomers,
    activeCoupons,
    downloadsAgg,
    digitalWithoutFiles,
    revenueRecentAgg,
    ordersRecent,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalPaise: true } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        email: true,
        totalPaise: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.findMany({ distinct: ["email"], select: { email: true } }).then((r) => r.length),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.downloadGrant.aggregate({ _sum: { downloadCount: true } }),
    prisma.product.count({
      where: { isActive: true, productType: "DIGITAL", files: { none: {} } },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
      _sum: { totalPaise: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const providers = getAvailableProviders();
  const storageDriver = getStorageDriver();
  const smtpReady = await isSmtpConfigured();
  const live = isLiveMode();

  const setupWarnings: { label: string; ok: boolean; hint: string }[] = [
    {
      label: "Payment gateway",
      ok: providers[0] !== "mock",
      hint:
        providers[0] === "mock"
          ? "No gateway configured — sandbox payments are active. Add Razorpay/Stripe/Cashfree keys."
          : `Active: ${providers.filter((p) => p !== "mock").join(", ")} (${live ? "LIVE" : "test mode"})`,
    },
    {
      label: "SMTP email",
      ok: smtpReady,
      hint: smtpReady
        ? "Download emails will be sent automatically."
        : "Not configured — download links will only appear on the success page.",
    },
    {
      label: "File storage",
      ok: storageDriver === "r2",
      hint:
        storageDriver === "r2"
          ? "Cloudflare R2 is active."
          : "Using local ./storage — fine for development, set R2 credentials before deploying.",
    },
    {
      label: "Auth secret",
      ok: Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32),
      hint: "AUTH_SECRET must be at least 32 characters.",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Store performance at a glance. Revenue counts paid orders only.
        </p>
      </div>

      {/* -------------------------------------------------------------- stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total revenue"
          value={formatINR(revenueAgg._sum.totalPaise ?? 0)}
          sub={`${formatINR(revenueRecentAgg._sum.totalPaise ?? 0)} in last 30 days`}
          accent="brand"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total orders"
          value={String(totalOrders)}
          sub={`${ordersRecent} in last 30 days · ${paidAgg} paid`}
          accent="blue"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={String(totalProducts)}
          sub={`${activeProducts} active`}
          accent="violet"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={String(totalCustomers)}
          sub="Unique email addresses"
          accent="amber"
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Ticket}
          label="Active coupons"
          value={String(activeCoupons)}
          sub="Live discount codes"
          accent="amber"
          small
        />
        <StatCard
          icon={Download}
          label="Total downloads"
          value={String(downloadsAgg._sum.downloadCount ?? 0)}
          sub="Across all orders"
          accent="blue"
          small
        />
        <StatCard
          icon={AlertTriangle}
          label="Digital products missing PDFs"
          value={String(digitalWithoutFiles)}
          sub={
            digitalWithoutFiles > 0
              ? "Upload files so customers can download"
              : "All digital products have files"
          }
          accent={digitalWithoutFiles > 0 ? "red" : "brand"}
          small
        />
      </div>

      {/* -------------------------------------------------------- setup panel */}
      <section className="mb-6 rounded-card border border-ink-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-ink-900">Store configuration</h2>
        <ul className="flex flex-col gap-2.5">
          {setupWarnings.map((w) => (
            <li key={w.label} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  w.ok ? "bg-brand-600" : "bg-amber-500"
                }`}
              >
                {w.ok ? "✓" : "!"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">{w.label}</p>
                <p className="text-[13px] leading-relaxed text-ink-500">{w.hint}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------ recent orders */}
      <section className="rounded-card border border-ink-200 bg-white">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-500">
            No orders yet. Place a test order from the store to see it appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-2.5 font-medium">Order</th>
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-5 py-2.5 font-medium">Items</th>
                  <th className="px-5 py-2.5 font-medium">Total</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-ink-100 last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{o.customerName}</p>
                      <p className="text-xs text-ink-500">{o.email}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{o._count.items}</td>
                    <td className="px-5 py-3 font-semibold text-ink-900">
                      {formatINR(o.totalPaise)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}