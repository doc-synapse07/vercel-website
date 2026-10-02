import type { Metadata } from "next";
import Link from "next/link";
import { Download, LogOut, Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getOrderDownloads } from "@/lib/orders";
import { isGoogleConfigured } from "@/lib/google-oauth";
import { formatDate, formatINR } from "@/lib/utils";
import { AccountLogin } from "./AccountLogin";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

// Account page must be dynamic — it uses customer session
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-brand-100 text-brand-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-ink-200 text-ink-700",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const customer = await getCurrentCustomer();

  if (!customer) {
    const { error } = await searchParams;
    return <AccountLogin googleEnabled={isGoogleConfigured()} oauthError={error} />;
  }

  const orders = await prisma.order.findMany({
    where: { email: customer.email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      totalPaise: true,
      items: { select: { title: true, quantity: true, subtotalPaise: true } },
    },
  });

  const downloadsByOrder = new Map<string, Awaited<ReturnType<typeof getOrderDownloads>>>();
  for (const order of orders) {
    if (order.status === "PAID") {
      downloadsByOrder.set(order.id, await getOrderDownloads(order.id));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
            Your account
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
            Hello, {customer.name}
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{customer.email}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="btn btn-outline btn-sm">
            <LogOut size={14} /> Sign out
          </button>
        </form>
      </div>

      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-white">
        <Package size={18} /> Your orders
        <span className="text-sm font-normal text-ink-400">({orders.length})</span>
      </h2>

      {orders.length === 0 ? (
        <div className="rounded-card border border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-800">
          <p className="text-sm text-ink-600 dark:text-ink-300">
            No orders on this email yet. When you check out with {customer.email}, your
            purchases and download links will appear here.
          </p>
          <Link href="/products" className="btn btn-primary btn-md mt-5">
            Browse notes
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const downloads = downloadsByOrder.get(order.id) ?? [];
            return (
              <article
                key={order.id}
                className="rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-ink-900 dark:text-white">
                    {order.orderNumber}
                  </p>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[order.status] ?? "bg-ink-100 text-ink-700"}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  {formatDate(order.createdAt)} · {formatINR(order.totalPaise)}
                </p>
                <ul className="mt-3 flex flex-col gap-1 border-t border-ink-100 pt-3 text-sm text-ink-700 dark:border-ink-700 dark:text-ink-200">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="shrink-0 text-ink-500 dark:text-ink-400">
                        {formatINR(item.subtotalPaise)}
                      </span>
                    </li>
                  ))}
                </ul>
                {downloads.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-100 pt-3 dark:border-ink-700">
                    {downloads.map((d) => (
                      <a
                        key={d.token}
                        href={`/api/download/${d.token}`}
                        className="btn btn-primary btn-sm"
                      >
                        <Download size={14} /> {d.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
