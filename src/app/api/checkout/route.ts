import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateCoupon } from "@/lib/coupons";
import { computeTotals, createPendingOrder } from "@/lib/orders";
import { createPayment, getAvailableProviders } from "@/lib/payments";
import { normalizePhone } from "@/lib/utils";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/lib/constants";

export const runtime = "nodejs";

const CheckoutSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]{10,20}$/, "Please enter a valid phone number"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty"),
  couponCode: z.string().trim().max(40).optional().nullable(),
  provider: z.enum(PAYMENT_PROVIDERS).optional(),
  shippingAddress: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: first?.message ?? "Invalid checkout details" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const phone = normalizePhone(data.phone);

  // Merge duplicate product ids so a double-submitted cart cannot skew totals.
  const merged = new Map<string, number>();
  for (const item of data.items) {
    merged.set(item.productId, Math.min(99, (merged.get(item.productId) ?? 0) + item.quantity));
  }
  const items = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));

  try {
    const { lines, subtotalPaise, shippingPaise } = await computeTotals({ items, email });

    if (subtotalPaise <= 0) {
      return NextResponse.json(
        { ok: false, error: "This order costs nothing — claim the free item from the store page." },
        { status: 400 },
      );
    }

    // Coupon is re-validated here; the client-side total is never trusted.
    let discountPaise = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;

    if (data.couponCode?.trim()) {
      const result = await validateCoupon({
        code: data.couponCode,
        subtotalPaise,
        email,
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
      }
      discountPaise = result.discountPaise;
      couponId = result.couponId;
      couponCode = result.code;
    }

    const totalPaise = Math.max(0, subtotalPaise + shippingPaise - discountPaise);

    const available = getAvailableProviders();
    const provider = (data.provider ?? available[0]) as PaymentProvider;

    // Reject requests for a gateway that has no credentials configured.
    if (provider !== "mock" && !available.includes(provider)) {
      return NextResponse.json(
        { ok: false, error: "That payment method is not available." },
        { status: 400 },
      );
    }

    // Digital orders need no address, so we avoid storing unnecessary PII.
    const hasPhysical = lines.some((l) => l.productType === "PHYSICAL");

    const order = await createPendingOrder({
      customerName: data.name,
      email,
      phone,
      items,
      couponCode,
      couponId,
      discountPaise,
      shippingAddress: hasPhysical ? data.shippingAddress : undefined,
    });

    const payment = await createPayment({
      provider,
      orderNumber: order.orderNumber,
      orderId: order.id,
      amountPaise: totalPaise,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentProvider: provider, paymentOrderId: payment.gatewayOrderId },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPaise,
      payment,
    });
  } catch (error) {
    console.error("[checkout] failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}