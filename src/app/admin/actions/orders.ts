"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { releaseRedemption } from "@/lib/coupons";
import { safeAsync, formatINR } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { orderConfirmationEmail, orderShippingEmail, orderPackedEmail } from "@/lib/order-emails";
import { sendMail } from "@/lib/mail";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "\u0026")
    .replace(/</g, "\u003C")
    .replace(/>/g, "\u003E")
    .replace(/"/g, "\u0022")
    .replace(/'/g, "\u0027");
}

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const previousStatus = String(formData.get("previousStatus") ?? "");

  if (!orderId || !ORDER_STATUSES.includes(status as never)) return;

  // Get the order before updating to get previous status and customer info
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  await prisma.order.update({ where: { id: orderId }, data: { status } });

  // Moving a paid order to a non-paid state should release its coupon usage
  if (previousStatus === "PAID" && status !== "PAID") {
    if (order.couponId) {
      await safeAsync("coupon-release", () =>
        releaseRedemption({ couponId: order.couponId!, orderId }),
      );
    }
  }

  // Send status change emails
  try {
    if (status === "SHIPPED" && previousStatus !== "SHIPPED") {
      await safeAsync("email-shipped", () => sendMail({
        to: order.email,
        subject: `Your order ${order.orderNumber} has shipped`,
        html: orderShippingEmail(order as any),
        text: `Your order ${order.orderNumber} has been shipped.`,
      }));
    } else if (status === "PACKED" && previousStatus !== "PACKED") {
      await safeAsync("email-packed", () => sendMail({
        to: order.email,
        subject: `Your order ${order.orderNumber} is packed`,
        html: orderPackedEmail(order as any),
        text: `Your order ${order.orderNumber} is packed and ready to ship.`,
      }));
    }
  } catch (error) {
    console.error("[order:status-email] failed:", error);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

/**
 * Issues fresh download links for a paid order.
 * Used when a customer's 24-hour window lapsed or they hit the download cap.
 */
export async function resendDownloadsAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  const { newDownloadToken, downloadExpiry, downloadMaxUses } = await import("@/lib/orders");
  const { sendOrderEmail } = await import("@/lib/mail");
  const { absoluteUrl } = await import("@/lib/utils");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { include: { files: true } } } },
    },
  });

  if (!order || order.status !== "PAID") return;

  const expiresAt = downloadExpiry();
  const maxDownloads = downloadMaxUses();
  const titles = new Map(order.items.filter((i) => i.productId).map((i) => [i.productId!, i.title]));

  const toCreate = order.items
    .filter((i) => i.productType === "DIGITAL" && i.product)
    .flatMap((i) =>
      i.product!.files.map((f) => ({
        orderId: order.id,
        productId: i.productId!,
        productFileId: f.id,
        token: newDownloadToken(),
        expiresAt,
        maxDownloads,
      })),
    );

  if (!toCreate.length) return;

  // Replace the old links so the previous ones stop working.
  await prisma.$transaction(async (tx) => {
    await tx.downloadGrant.deleteMany({ where: { orderId: order.id } });
    await tx.downloadGrant.createMany({ data: toCreate });
  });

  const grants = await prisma.downloadGrant.findMany({
    where: { orderId: order.id },
    include: { productFile: true },
  });

  await sendOrderEmail({
    to: order.email,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    totalPaise: order.totalPaise,
    downloads: grants.map((g) => ({
      productTitle: titles.get(g.productId) ?? "Your download",
      fileName: g.productFile.fileName,
      url: absoluteUrl(`/api/download/${g.token}`),
      expiresAt: g.expiresAt,
    })),
    expiresAt,
  });

  // The old grants were deleted above, so the customer only gets the fresh links.
  revalidatePath(`/admin/orders/${orderId}`);
}