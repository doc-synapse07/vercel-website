import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { fulfilOrder } from "@/lib/orders";

export const runtime = "nodejs";

type CashfreeWebhookPayload = {
  type?: string;
  data?: {
    order_id?: string;
    order_status?: string;
    payment_status?: string;
    cf_payment_id?: string;
  };
};

/**
 * Cashfree webhook — the authoritative fulfilment path.
 * Cashfree signs the raw request body with the client secret (base64 HMAC-SHA256).
 */
export async function POST(request: Request) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) {
    console.error("[cashfree:webhook] CASHFREE_SECRET_KEY is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  // Cashfree signs the raw body with base64 HMAC-SHA256 using the client secret.
  // Compared in constant time so the check cannot be timed.
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature ?? "");
  if (!signature || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: CashfreeWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data;
  if (!data?.order_id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Cashfree order ids are our orderNumber.
  const order = await prisma.order.findUnique({ where: { orderNumber: data.order_id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (data.payment_status === "PAID") {
    try {
      await fulfilOrder({
        orderId: order.id,
        paymentProvider: "cashfree",
        paymentOrderId: data.order_id,
        paymentRefId: data.cf_payment_id ?? null,
      });
    } catch (error) {
      console.error("[cashfree:webhook] fulfilment failed:", error);
      return NextResponse.json({ error: "Handler error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}