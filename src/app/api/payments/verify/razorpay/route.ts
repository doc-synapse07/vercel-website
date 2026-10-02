import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfilOrder } from "@/lib/orders";
import { verifyRazorpaySignature } from "@/lib/payments";
import { z } from "zod";

export const runtime = "nodejs";

const Schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  internalOrderId: z.string().min(1),
});

/**
 * Client-side completion step for Razorpay.
 * The signature is verified server-side against RAZORPAY_KEY_SECRET, so a tampered
 * client cannot mark an order paid. The webhook in /api/webhooks/razorpay is the
 * authoritative path; this exists so the customer is not left waiting on email.
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

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } =
    parsed.data;

  const order = await prisma.order.findUnique({ where: { id: internalOrderId } });
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  // The gateway order id must match the one we created, otherwise a valid
  // signature for someone else's payment could be replayed here.
  if (order.paymentOrderId && order.paymentOrderId !== razorpay_order_id) {
    return NextResponse.json({ ok: false, error: "Payment does not match this order" }, { status: 400 });
  }

  if (!verifyRazorpaySignature({ razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature })) {
    return NextResponse.json({ ok: false, error: "Payment verification failed" }, { status: 400 });
  }

  try {
    await fulfilOrder({
      orderId: internalOrderId,
      paymentProvider: "razorpay",
      paymentOrderId: razorpay_order_id,
      paymentRefId: razorpay_payment_id,
      paymentSignature: razorpay_signature,
    });
  } catch (error) {
    console.error("[razorpay:verify] fulfilment failed:", error);
    return NextResponse.json(
      { ok: false, error: "Payment captured but delivery is pending. Our team will email you shortly." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}