import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfilOrder } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Sandbox payment completion.
 *
 * Only available when NO real gateway is configured — guarded below so this
 * route cannot be used to mark an order paid on a live store.
 */
export async function POST(request: Request) {
  const { razorpayConfigured, stripeConfigured, cashfreeConfigured } = await import(
    "@/lib/payments"
  );

  if (razorpayConfigured() || stripeConfigured() || cashfreeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Sandbox payments are disabled because a real gateway is configured." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const orderId =
    typeof body === "object" && body !== null && "orderId" in body
      ? String((body as { orderId: unknown }).orderId)
      : "";

  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  if (order.paymentProvider !== "mock") {
    return NextResponse.json(
      { ok: false, error: "This order is not a sandbox order." },
      { status: 400 },
    );
  }

  try {
    await fulfilOrder({
      orderId: order.id,
      paymentProvider: "mock",
      paymentRefId: `mock_pay_${Date.now()}`,
    });
  } catch (error) {
    console.error("[mock:pay] fulfilment failed:", error);
    return NextResponse.json(
      { ok: false, error: "Payment recorded but delivery failed. Check the server logs." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}