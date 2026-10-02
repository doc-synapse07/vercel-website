import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { fulfilOrder, markOrderFailed } from "@/lib/orders";
import { getStripeClient } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Stripe webhook — the authoritative fulfilment path.
 * The raw body is required for signature verification, so do not parse it early.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret) {
    console.error("[stripe:webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe:webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const internalOrderId = intent.metadata?.internalOrderId;
      if (!internalOrderId) return NextResponse.json({ ok: true, ignored: true });

      const order = await prisma.order.findUnique({ where: { id: internalOrderId } });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      await fulfilOrder({
        orderId: internalOrderId,
        paymentProvider: "stripe",
        paymentOrderId: intent.id,
        paymentRefId: typeof intent.latest_charge === "string" ? intent.latest_charge : null,
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const internalOrderId = intent.metadata?.internalOrderId;
      if (internalOrderId) {
        await markOrderFailed(internalOrderId, intent.last_payment_error?.message ?? undefined);
      }
      break;
    }

    default:
      // Acknowledge everything else so Stripe stops retrying.
      return NextResponse.json({ ok: true, ignored: event.type });
  }

  return NextResponse.json({ ok: true });
}