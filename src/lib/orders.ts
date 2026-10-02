import { randomBytes } from "crypto";
import { prisma } from "./db";
import { recordRedemption } from "./coupons";
import { sendOrderEmail, type MailResult } from "./mail";
import { absoluteUrl, generateOrderNumber, safeAsync } from "./utils";
import type { PaymentProvider } from "./constants";

function downloadTtlHours(): number {
  const n = Number(process.env.DOWNLOAD_TTL_HOURS ?? 24);
  return Number.isFinite(n) && n > 0 ? n : 24;
}

function downloadMaxUses(): number {
  const n = Number(process.env.DOWNLOAD_MAX_USES ?? 3);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

export { downloadMaxUses, downloadTtlHours };

export function downloadExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + downloadTtlHours() * 3_600_000);
}

export function newDownloadToken(): string {
  // 32 bytes -> 43 chars, unguessable and URL safe
  return randomBytes(32).toString("base64url");
}

export type PreparedOrderInput = {
  customerName: string;
  email: string;
  phone: string;
  items: { productId: string; quantity: number }[];
  couponCode?: string | null;
  shippingAddress?: unknown;
};

/**
 * Re-reads products from the database and recomputes every price server-side.
 * Never trust totals coming from the browser.
 */
export async function computeTotals(input: {
  items: { productId: string; quantity: number }[];
  couponCode?: string | null;
  email?: string;
}) {
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, title: true, pricePaise: true, productType: true, isFree: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotalPaise = 0;
  const lines: {
    productId: string;
    title: string;
    productType: string;
    unitPricePaise: number;
    quantity: number;
    subtotalPaise: number;
  }[] = [];

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new Error("One of the products in your cart is no longer available.");

    const quantity = Math.max(1, Math.floor(item.quantity || 1));
    const unitPricePaise = product.isFree ? 0 : product.pricePaise;
    const lineTotal = unitPricePaise * quantity;

    subtotalPaise += lineTotal;
    lines.push({
      productId: product.id,
      title: product.title,
      productType: product.productType,
      unitPricePaise,
      quantity,
      subtotalPaise: lineTotal,
    });
  }

  // Shipping is flat and free above a threshold — physical goods come later,
  // so today only physical lines contribute shipping.
  const hasPhysical = lines.some((l) => l.productType === "PHYSICAL");
  const FREE_SHIPPING_THRESHOLD_PAISES = 99900; // ₹999
  const FLAT_SHIPPING_PAISES = 7900; // ₹79
  const shippingPaise =
    hasPhysical && subtotalPaise > 0 && subtotalPaise < FREE_SHIPPING_THRESHOLD_PAISES
      ? FLAT_SHIPPING_PAISES
      : 0;

  return { lines, subtotalPaise, shippingPaise };
}

export async function createPendingOrder(input: PreparedOrderInput & { discountPaise: number; couponId?: string | null }) {
  const { lines, subtotalPaise, shippingPaise } = await computeTotals({
    items: input.items,
    email: input.email,
  });

  const totalPaise = Math.max(0, subtotalPaise + shippingPaise - input.discountPaise);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName: input.customerName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      subtotalPaise,
      discountPaise: input.discountPaise,
      shippingPaise,
      totalPaise,
      couponId: input.couponId ?? null,
      couponCode: input.couponId ? input.couponCode?.trim().toUpperCase() ?? null : null,
      status: "PENDING",
      shippingAddress: (input.shippingAddress ?? undefined) as never,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          title: l.title,
          productType: l.productType,
          unitPricePaise: l.unitPricePaise,
          quantity: l.quantity,
          subtotalPaise: l.subtotalPaise,
        })),
      },
    },
    include: { items: true },
  });

  return order;
}

/**
 * Marks an order paid and fulfils it:
 *  - creates one DownloadGrant per file of every DIGITAL item
 *  - records the coupon redemption
 *  - emails the customer their links
 *
 * Safe to call more than once (webhooks can retry) — grants are created with
 * skipDuplicates-like behaviour by checking existing rows first.
 */
export async function fulfilOrder(params: {
  orderId: string;
  paymentProvider: PaymentProvider;
  paymentOrderId?: string | null;
  paymentRefId?: string | null;
  paymentSignature?: string | null;
}): Promise<{ granted: number; emailed: MailResult }> {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: { include: { product: { include: { files: true } } } },
    },
  });

  if (!order) throw new Error("Order not found");

  const now = new Date();
  const expiresAt = downloadExpiry(now);

  // Already fulfilled (duplicate webhook) — don't mint new links.
  if (order.status === "PAID" && order.paidAt) {
    const existing = await prisma.downloadGrant.findMany({ where: { orderId: order.id } });
    return { granted: existing.length, emailed: { sent: false, reason: "Already fulfilled" } };
  }

  const paidAt = order.paidAt ?? now;

  // Collect every file belonging to digital line items.
  const grantsToCreate: {
    orderId: string;
    productId: string;
    productFileId: string;
    token: string;
    expiresAt: Date;
    maxDownloads: number;
  }[] = [];

  for (const item of order.items) {
    if (item.productType !== "DIGITAL" || !item.product) continue;
    for (const file of item.product.files) {
      grantsToCreate.push({
        orderId: order.id,
        productId: item.productId!,
        productFileId: file.id,
        token: newDownloadToken(),
        expiresAt,
        maxDownloads: downloadMaxUses(),
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt,
        paymentProvider: params.paymentProvider,
        paymentOrderId: params.paymentOrderId ?? order.paymentOrderId,
        paymentRefId: params.paymentRefId ?? order.paymentRefId,
        paymentSignature: params.paymentSignature ?? order.paymentSignature,
      },
    });

    if (grantsToCreate.length) {
      await tx.downloadGrant.createMany({ data: grantsToCreate });
    }
  });

  if (order.couponId) {
    await safeAsync("coupon-redemption", () =>
      recordRedemption({ couponId: order.couponId!, orderId: order.id, email: order.email }),
    );
  }

  const grants = await prisma.downloadGrant.findMany({
    where: { orderId: order.id },
    include: { productFile: true },
  });

  // Map file -> parent product title for a friendlier email
  const productTitles = new Map<string, string>();
  for (const item of order.items) {
    if (item.productId) productTitles.set(item.productId, item.title);
  }

  const downloadLines = grants.map((g) => ({
    productTitle: productTitles.get(g.productId) ?? "Your download",
    fileName: g.productFile.fileName,
    url: absoluteUrl(`/api/download/${g.token}`),
    expiresAt: g.expiresAt,
  }));

  const emailed = await sendOrderEmail({
    to: order.email,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    totalPaise: order.totalPaise,
    downloads: downloadLines,
    expiresAt,
  });

  return { granted: grants.length, emailed };
}

/** Links shown on the thank-you page when SMTP is not configured. */
export async function getOrderDownloads(orderId: string) {
  const grants = await prisma.downloadGrant.findMany({
    where: { orderId },
    include: { productFile: true },
    orderBy: { createdAt: "asc" },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { items: true },
  });

  const titles = new Map<string, string>();
  for (const item of order?.items ?? []) {
    if (item.productId) titles.set(item.productId, item.title);
  }

  return grants.map((g) => ({
    token: g.token,
    productTitle: titles.get(g.productId) ?? "Your download",
    fileName: g.productFile.fileName,
    expiresAt: g.expiresAt,
    downloadCount: g.downloadCount,
    maxDownloads: g.maxDownloads,
    isExpired: g.expiresAt < new Date(),
    isExhausted: g.downloadCount >= g.maxDownloads,
  }));
}

/** Marks an order failed. Does not touch coupon counters (nothing was consumed). */
export async function markOrderFailed(orderId: string, note?: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "FAILED",
      notes: note ? `Payment failed: ${note}` : undefined,
    },
  });
}