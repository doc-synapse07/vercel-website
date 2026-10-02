import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { fulfilOrder, markOrderFailed } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Razorpay webhook — the authoritative fulfilment path.
 * Configure the URL in Razorpay dashboard under Settings > Webhooks.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay:webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!safeEqual(expected, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          amount?: number;
          notes?: Record<string, string>;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const internalOrderId = payment?.notes?.internalOrderId;

  if (!internalOrderId) {
    // Nothing to do (e.g. an unrelated event type) — ack so Razorpay stops retrying.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const order = await prisma.order.findUnique({ where: { id: internalOrderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    if (event.event === "payment.captured") {
      await fulfilOrder({
        orderId: internalOrderId,
        paymentProvider: "razorpay",
        paymentOrderId: payment?.order_id ?? order.paymentOrderId,
        paymentRefId: payment?.id ?? null,
      });
    } else if (event.event === "payment.failed") {
      await markOrderFailed(internalOrderId, payment?.id ?? undefined);
    }
  } catch (error) {
    console.error("[razorpay:webhook] handling failed:", error);
    // 500 makes Razorpay retry, which is what we want for a transient failure.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Constant-time compare so signature checks cannot be timed. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}