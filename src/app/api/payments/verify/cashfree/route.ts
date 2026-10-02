import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfilOrder } from "@/lib/orders";
import { cashfreeBaseUrl } from "@/lib/payments";
import { z } from "zod";

export const runtime = "nodejs";

const Schema = z.object({
  orderId: z.string().min(1), // Cashfree order id = our orderNumber
  paymentId: z.string().min(1),
  internalOrderId: z.string().min(1),
});

/**
 * Client-side completion step for Cashfree.
 * Before marking an order paid we ask Cashfree's own API whether the payment
 * status is actually PAID — the client response alone is not trusted.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payment response" }, { status: 400 });
  }

  const { orderId: cashfreeOrderId, paymentId, internalOrderId } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: internalOrderId } });
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  if (order.orderNumber !== cashfreeOrderId) {
    return NextResponse.json({ ok: false, error: "Payment does not match this order" }, { status: 400 });
  }

  const status = await fetchCashfreePaymentStatus(cashfreeOrderId, paymentId);
  if (status !== "PAID") {
    return NextResponse.json(
      { ok: false, error: "Payment is not complete yet. If you were charged, contact support." },
      { status: 400 },
    );
  }

  try {
    await fulfilOrder({
      orderId: internalOrderId,
      paymentProvider: "cashfree",
      paymentOrderId: cashfreeOrderId,
      paymentRefId: paymentId,
    });
  } catch (error) {
    console.error("[cashfree:verify] fulfilment failed:", error);
    return NextResponse.json(
      { ok: false, error: "Payment captured but delivery is pending. Our team will email you shortly." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

type CashfreeStatus = "PAID" | "FAILED" | "ACTIVE" | "CANCELLED" | string;

async function fetchCashfreePaymentStatus(
  cashfreeOrderId: string,
  paymentId: string,
): Promise<CashfreeStatus | null> {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) return null;

  const url = new URL(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(cashfreeOrderId)}`);
  url.searchParams.set("order_id", cashfreeOrderId);

  try {
    const res = await fetch(url, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": process.env.CASHFREE_API_VERSION || "2023-08-01",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      payment_status?: string;
      payments?: { cf_payment_id?: string; payment_status?: string }[];
    };

    // Prefer the status of the specific payment id when Cashfree returns a list.
    if (Array.isArray(data.payments) && data.payments.length) {
      const match = data.payments.find((p) => p.cf_payment_id === paymentId) ?? data.payments[0];
      return match.payment_status ?? data.payment_status ?? null;
    }
    return data.payment_status ?? null;
  } catch (error) {
    console.error("[cashfree] status fetch failed:", error);
    return null;
  }
}