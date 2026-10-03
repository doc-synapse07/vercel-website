import { prisma } from "./db";
import type { DiscountType } from "./constants";

export type CouponValidation =
  | { ok: true; discountPaise: number; couponId: string; code: string; description: string | null }
  | { ok: false; reason: string };

/** Percentage coupons are capped so a 90%-off coupon cannot wipe out a large cart. */
const DEFAULT_PERCENT_CAP_PCT = 70;

export type CouponInput = {
  code: string;
  subtotalPaise: number;
  email?: string | null;
  now?: Date;
};

/**
 * Validates a coupon against a cart subtotal.
 * Returns the discount in paise, or a human-readable reason it cannot be used.
 */
export async function validateCoupon(input: CouponInput): Promise<CouponValidation> {
  const now = input.now ?? new Date();
  const email = input.email?.trim().toLowerCase();

  if (input.subtotalPaise <= 0) {
    return { ok: false, reason: "Add something to the cart before applying a coupon." };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: input.code.trim().toUpperCase() },
  });

  if (!coupon) return { ok: false, reason: "This coupon code does not exist." };
  if (!coupon.isActive) return { ok: false, reason: "This coupon is no longer active." };

  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: `This coupon becomes valid on ${coupon.startsAt.toDateString()}.` };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, reason: `This coupon expired on ${coupon.expiresAt.toDateString()}.` };
  }

  if (coupon.minOrderPaise && input.subtotalPaise < coupon.minOrderPaise) {
    const need = `₹${Math.round(coupon.minOrderPaise / 100).toLocaleString("en-IN")}`;
    return { ok: false, reason: `Minimum cart value for this coupon is ${need}.` };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: "This coupon has reached its usage limit." };
  }

  if (coupon.perUserLimit !== null && email) {
    const usedByEmail = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, email },
    });
    if (usedByEmail >= coupon.perUserLimit) {
      return {
        ok: false,
        reason: `You have already used this coupon ${usedByEmail} time${usedByEmail === 1 ? "" : "s"}.`,
      };
    }
  }

  const type = coupon.discountType as DiscountType;
  let discountPaise: number;

  if (type === "PERCENT") {
    const pct = Math.min(Math.max(coupon.discountValue, 0), 100);
    discountPaise = Math.floor((input.subtotalPaise * pct) / 100);
    if (coupon.maxDiscountPaise) {
      discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
    } else {
      // An uncapped percentage coupon could otherwise take a cart to zero and
      // create a Rs.0 payment order, which gateways reject outright.
      discountPaise = Math.min(
        discountPaise,
        Math.floor((input.subtotalPaise * DEFAULT_PERCENT_CAP_PCT) / 100),
      );
    }
  } else {
    discountPaise = coupon.discountValue;
  }

  // Never discount below zero.
  discountPaise = Math.max(0, Math.min(discountPaise, input.subtotalPaise));

  if (discountPaise === 0) {
    return { ok: false, reason: "This coupon gives no discount on the current cart." };
  }

  return {
    ok: true,
    discountPaise,
    couponId: coupon.id,
    code: coupon.code,
    description: coupon.description,
  };
}

/** Atomically records a redemption and bumps the counter. Called after payment succeeds. */
export async function recordRedemption(params: {
  couponId: string;
  orderId: string;
  email: string;
}) {
  const email = params.email.trim().toLowerCase();
  await prisma.$transaction(async (tx) => {
    const already = await tx.couponRedemption.findUnique({
      where: { couponId_orderId: { couponId: params.couponId, orderId: params.orderId } },
    });
    if (already) return;

    await tx.couponRedemption.create({
      data: { couponId: params.couponId, orderId: params.orderId, email },
    });
    await tx.coupon.update({
      where: { id: params.couponId },
      data: { usedCount: { increment: 1 } },
    });
  });
}

/** Refunds the usage count when an order is cancelled/refunded. */
export async function releaseRedemption(params: { couponId: string; orderId: string }) {
  await prisma.$transaction(async (tx) => {
    const removed = await tx.couponRedemption.deleteMany({
      where: { couponId: params.couponId, orderId: params.orderId },
    });
    if (removed.count > 0) {
      await tx.coupon.update({
        where: { id: params.couponId },
        data: { usedCount: { decrement: removed.count } },
      });
    }
  });
}