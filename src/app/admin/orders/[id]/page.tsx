import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Mail,
  Package,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { formatINR, formatDate, formatBytes } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { isSmtpConfigured } from "@/lib/mail";
import { StatusBadge } from "../../StatusBadge";
import { updateOrderStatusAction, resendDownloadsAction } from "@/app/admin/actions/orders";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  return { title: order ? `Order ${order.orderNumber}` : "Order not found" };
}

const STATUS_COPY: Record<string, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { slug: true, files: { select: { id: true, fileName: true } } } },
        },
      },
      downloads: {
        include: { productFile: { select: { fileName: true, sizeBytes: true } } },
        orderBy: { createdAt: "asc" },
      },
      redemptions: true,
    },
  });

  if (!order) notFound();

  const now = new Date();
  const hasDigital = order.items.some((i) => i.productType === "DIGITAL");
  const canResend = order.status === "PAID" && hasDigital;
  const smtpReady = await isSmtpConfigured();
  const activeGrants = order.downloads.filter(
    (g) => g.expiresAt > now && g.downloadCount < g.maxDownloads,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft size={15} /> All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">Placed {formatDate(order.createdAt)}</p>
        </div>

        <div className="rounded-card border border-ink-200 bg-white px-5 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-ink-500">Total</p>
          <p className="text-xl font-bold text-ink-900">{formatINR(order.totalPaise)}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- items */}
      <section className="mb-6 overflow-hidden rounded-card border border-ink-200 bg-white">
        <h2 className="border-b border-ink-200 px-5 py-3.5 text-base font-semibold text-ink-900">
          Items ({order.items.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Price</th>
                <th className="px-5 py-2.5 font-medium">Qty</th>
                <th className="px-5 py-2.5 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3">
                    {item.product ? (
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink-900">{item.title}</span>
                    )}
                    {item.product && item.product.files.length > 0 && (
                      <p className="text-xs text-ink-500">
                        {item.product.files.length} file
                        {item.product.files.length === 1 ? "" : "s"} attached
                      </p>
                    )}
                    {item.product && item.product.files.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No PDF attached — customer cannot download this
                      </p>
                    )}
                    {!item.product && (
                      <p className="text-xs text-ink-400">Product was deleted</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                      {item.productType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {item.unitPricePaise === 0 ? (
                      <span className="text-ink-500">Free</span>
                    ) : (
                      formatINR(item.unitPricePaise)
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-600">{item.quantity}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {item.subtotalPaise === 0 ? "Free" : formatINR(item.subtotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ----------------------------------------------------------- totals */}
      <section className="mb-6 rounded-card border border-ink-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-ink-900">Payment summary</h2>
        <dl className="ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Subtotal</dt>
            <dd className="font-medium text-ink-900">{formatINR(order.subtotalPaise)}</dd>
          </div>
          {order.discountPaise > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-600">
                Discount
                {order.couponCode && (
                  <span className="ml-1 rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-800">
                    {order.couponCode}
                  </span>
                )}
              </dt>
              <dd className="font-medium text-brand-700">
                −{formatINR(order.discountPaise)}
              </dd>
            </div>
          )}
          {order.shippingPaise > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-600">Shipping</dt>
              <dd className="font-medium text-ink-900">{formatINR(order.shippingPaise)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base">
            <dt className="font-semibold text-ink-900">Total paid</dt>
            <dd className="font-bold text-ink-900">{formatINR(order.totalPaise)}</dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 border-t border-ink-100 pt-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Gateway</p>
            <p className="font-medium text-ink-900">
              {order.paymentProvider ?? "—"}
              {order.paidAt && (
                <span className="ml-2 text-xs font-normal text-ink-500">
                  paid {formatDate(order.paidAt)}
                </span>
              )}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ink-500">Gateway reference</p>
            <p className="truncate font-mono text-xs text-ink-600">
              {order.paymentOrderId ?? "—"}
              {order.paymentRefId ? ` / ${order.paymentRefId}` : ""}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- customer */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-ink-900">Customer</h2>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <User size={15} className="shrink-0 text-ink-400" />
              <span className="font-medium text-ink-900">{order.customerName}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="shrink-0 text-ink-400" />
              <a
                href={`mailto:${order.email}`}
                className="break-all text-brand-700 hover:underline"
              >
                {order.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-ink-400" />
              <a
                href={`tel:${order.phone}`}
                className="text-brand-700 hover:underline"
              >
                {order.phone}
              </a>
            </li>
          </ul>
          {order.redemptions.length > 0 && (
            <p className="mt-3 text-xs text-ink-500">
              Redeemed {order.redemptions.length} coupon
              {order.redemptions.length === 1 ? "" : "s"}.
            </p>
          )}
        </div>

        <div className="rounded-card border border-ink-200 bg-white p-5">
          <h2 className="mb-1 text-base font-semibold text-ink-900">Order status</h2>
          <p className="mb-3 text-xs text-ink-500">
            Moving a paid order to another state releases its coupon usage.
          </p>
          <form action={updateOrderStatusAction} className="flex gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="previousStatus" value={order.status} />
            <select
              name="status"
              defaultValue={order.status}
              className="flex-1 rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_COPY[s]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              Update
            </button>
          </form>

          {canResend && (
            <form action={resendDownloadsAction} className="mt-3">
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                disabled={activeGrants.length > 0}
                title={
                  activeGrants.length > 0
                    ? "The customer still has valid links — resending would invalidate them."
                    : "Issue fresh links and email them to the customer"
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-ink-300 disabled:bg-ink-50 disabled:text-ink-400"
              >
                <RefreshCw size={15} />
                {activeGrants.length > 0
                  ? "Links still active"
                  : smtpReady
                    ? "Resend download links"
                    : "Issue fresh download links"}
              </button>
            </form>
          )}
          {!smtpReady && canResend && (
            <p className="mt-2 text-xs text-amber-600">
              SMTP is not configured — links will be regenerated but no email is sent.
            </p>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- downloads */}
      <section className="mb-6 overflow-hidden rounded-card border border-ink-200 bg-white">
        <h2 className="border-b border-ink-200 px-5 py-3.5 text-base font-semibold text-ink-900">
          Download links ({order.downloads.length})
        </h2>

        {order.downloads.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">
            No download links on this order.
            {order.status === "PENDING" && " They are created once payment is confirmed."}
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {order.downloads.map((g) => {
              const expired = g.expiresAt < now;
              const exhausted = g.downloadCount >= g.maxDownloads;
              return (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                      <Download size={14} className="shrink-0 text-ink-400" />
                      <span className="truncate">{g.productFile.fileName}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatBytes(g.productFile.sizeBytes)} · {g.downloadCount}/
                      {g.maxDownloads} used · expires {formatDate(g.expiresAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      expired
                        ? "bg-red-100 text-red-700"
                        : exhausted
                          ? "bg-amber-100 text-amber-800"
                          : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    {expired ? "Expired" : exhausted ? "Limit reached" : "Active"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {order.notes && (
        <section className="rounded-card border border-ink-200 bg-white p-5">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-ink-900">
            <Package size={16} /> Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm text-ink-600">{order.notes}</p>
        </section>
      )}
    </div>
  );
}