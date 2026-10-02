import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrderDownloads } from "@/lib/orders";
import { isSmtpConfigured } from "@/lib/mail";
import { SuccessView } from "./SuccessView";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  // A guessed internal id must not expose someone else's order.
  if (!order) notFound();

  const downloads = order.status === "PAID" ? await getOrderDownloads(order.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SuccessView
        orderNumber={order.orderNumber}
        email={order.email}
        customerName={order.customerName}
        totalPaise={order.totalPaise}
        items={order.items.map((i) => ({ title: i.title, quantity: i.quantity }))}
        downloads={downloads.map((d) => ({
          token: d.token,
          productTitle: d.productTitle,
          fileName: d.fileName,
          expiresAt: d.expiresAt.toISOString(),
          downloadCount: d.downloadCount,
          maxDownloads: d.maxDownloads,
          isExpired: d.isExpired,
          isExhausted: d.isExhausted,
        }))}
        emailed={await isSmtpConfigured()}
        status={order.status}
        providerNote={order.notes}
      />
    </div>
  );
}