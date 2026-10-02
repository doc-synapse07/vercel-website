import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MockPayClient } from "./MockPayClient";

export const metadata: Metadata = {
  title: "Sandbox payment",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { coverImage: true } } } } },
  });

  // Never leak another customer's order to a guessed id.
  if (!order || order.paymentProvider !== "mock") notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        ← Back to store
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        Complete your payment
      </h1>

      <MockPayClient
        orderNumber={order.orderNumber}
        totalPaise={order.totalPaise}
        customerEmail={order.email}
        items={order.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          subtotalPaise: i.subtotalPaise,
          coverImage: i.product?.coverImage ?? null,
        }))}
      />
    </div>
  );
}