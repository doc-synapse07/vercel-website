import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { formatINR, formatDate } from "@/lib/utils";
import { isSmtpConfigured } from "@/lib/mail";
import { getAvailableProviders, isLiveMode } from "@/lib/payments";
import { getStorageDriver, getR2Stats } from "@/lib/storage";
import { getNeonSizeBytes } from "@/lib/store";
import {
  getR2MonthlyOps,
  R2_CLASS_A_CAP,
  R2_CLASS_B_CAP,
  R2_STORAGE_CAP_BYTES,
  NEON_STORAGE_CAP_BYTES,
  type R2MonthlyOps,
} from "@/lib/r2-usage";
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
    neonSizeBytes,
    r2Stats,
    r2Ops,
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
    getNeonSizeBytes(),
    getR2Stats(),
    getR2MonthlyOps(),
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

      {/* ------------------------------------------------- infrastructure usage */}
      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ink-900">Infrastructure usage</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StorageCard
            label="Neon database"
            usedBytes={neonSizeBytes}
            capBytes={NEON_STORAGE_CAP_BYTES}
            caption="Postgres storage · 0.5 GB free tier"
            emptyText="Local JSON mode — no Postgres connected"
            accentClass="bg-sky-500"
          />
          <StorageCard
            label="Cloudflare R2"
            usedBytes={r2Stats.totalBytes}
            capBytes={R2_STORAGE_CAP_BYTES}
            caption={`${r2Stats.objectCount.toLocaleString("en-IN")} files · PDFs + covers`}
            emptyText="R2 not configured — uploads disabled"
            accentClass="bg-brand-600"
            ops={r2Ops}
          />
        </div>

        <div className="mt-4 rounded-card border border-ink-200 bg-white">
          <div className="border-b border-ink-200 px-5 py-3.5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
              Service dashboards
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Quick links to the database and storage consoles behind this store.
            </p>
          </div>
          <div className="grid sm:grid-cols-2">
            <a
              href="https://console.neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-ink-50"
            >
              <div>
                <p className="text-sm font-bold text-ink-900">Neon dashboard</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  console.neon.tech — Postgres database, SQL editor, storage
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700 opacity-60 transition-opacity group-hover:opacity-100">
                Open ↗
              </span>
            </a>
            <a
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 border-t border-ink-200 px-5 py-3.5 transition-colors hover:bg-ink-50 sm:border-l sm:border-t-0"
            >
              <div>
                <p className="text-sm font-bold text-ink-900">Cloudflare dashboard</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  dash.cloudflare.com — R2 bucket, uploads, downloads
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700 opacity-60 transition-opacity group-hover:opacity-100">
                Open ↗
              </span>
            </a>
          </div>
        </div>
      </section>

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

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function StorageCard({
  label,
  usedBytes,
  capBytes,
  caption,
  emptyText,
  accentClass,
  ops,
}: {
  label: string;
  usedBytes: number;
  capBytes: number;
  caption: string;
  emptyText: string;
  accentClass: string;
  ops?: R2MonthlyOps | null;
}) {
  const percent = usedBytes > 0 ? Math.min(100, (usedBytes / capBytes) * 100) : 0;
  return (
    <div className="relative overflow-hidden rounded-card border border-ink-200 bg-white p-5">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${accentClass}`} />
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
        <p className="text-right text-[11px] uppercase tracking-wide text-ink-400">{caption}</p>
      </div>
      {usedBytes === 0 ? (
        <p className="mt-3 text-lg font-extrabold text-ink-400">{emptyText}</p>
      ) : (
        <>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">
            {formatSize(usedBytes)}{" "}
            <span className="text-sm font-semibold text-ink-400">/ {formatSize(capBytes)}</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div className={`h-full rounded-full transition-all ${accentClass}`} style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-ink-500">{percent.toFixed(1)}% used</p>
          {ops ? (
            <div className="mt-4 border-t border-ink-100 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
                {ops.monthLabel} cycle · free tier
              </p>
              <OpsRow label="Writes (Class A)" used={ops.writes} cap={R2_CLASS_A_CAP} accentClass={accentClass} />
              <OpsRow label="Reads (Class B)" used={ops.reads} cap={R2_CLASS_B_CAP} accentClass={accentClass} />
            </div>
          ) : label === "Cloudflare R2" ? (
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Monthly uploads/downloads need a <span className="font-mono">CLOUDFLARE_API_TOKEN</span> —
              see Cloudflare dashboard.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function OpsRow({
  label,
  used,
  cap,
  accentClass,
}: {
  label: string;
  used: number;
  cap: number;
  accentClass: string;
}) {
  const percent = used > 0 ? Math.min(100, (used / cap) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-ink-600">{label}</p>
        <p className="font-mono text-[11px] text-ink-900">
          {used.toLocaleString("en-IN")} <span className="text-ink-400">/ {(cap / 1_000_000).toFixed(0)}M</span>
        </p>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${accentClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}