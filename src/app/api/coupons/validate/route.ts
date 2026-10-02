import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/coupons";

export const runtime = "nodejs";

const Schema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code").max(40),
  subtotalPaise: z.number().int().min(0),
  email: z.string().trim().email().optional(),
});

/**
 * Validates a coupon for the given cart subtotal.
 * Returns the discount so the UI can preview it before checkout.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid request" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: parsed.error.issues[0]?.message ?? "Invalid coupon code" },
      { status: 400 },
    );
  }

  const { code, subtotalPaise, email } = parsed.data;
  const result = await validateCoupon({ code, subtotalPaise, email });

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    discountPaise: result.discountPaise,
    code: result.code,
    description: result.description,
  });
}