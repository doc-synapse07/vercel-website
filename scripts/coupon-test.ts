/**
 * Coupon rule-engine tests. Creates throwaway coupons, exercises every branch of
 * validateCoupon, then deletes everything it created.
 *
 *   npx tsx scripts/coupon-test.ts
 */
import { prisma } from "../src/lib/db";
import { validateCoupon } from "../src/lib/coupons";

const PREFIX = "ZZTEST";
let failures = 0;
const created: string[] = [];

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) console.log(`  PASS  ${label}`);
  else {
    failures++;
    console.log(`  FAIL  ${label}`);
    if (extra !== undefined) console.log(`        ${JSON.stringify(extra)}`);
  }
}

let n = 0;
async function makeCoupon(data: Partial<Parameters<typeof prisma.coupon.create>[0]["data"]> = {}) {
  const code = `${PREFIX}${(++n).toString().padStart(2, "0")}`;
  const c = await prisma.coupon.create({
    data: {
      code,
      description: "temp test coupon",
      discountType: "PERCENT",
      discountValue: 10,
      isActive: true,
      ...data,
    },
  });
  created.push(c.id);
  return c;
}

async function main() {
  console.log("\nCoupon rule engine\n");

  // ------------------------------------------------------------ happy paths
  console.log("Happy paths");
  const pct = await makeCoupon({ discountType: "PERCENT", discountValue: 25 });
  const r1 = await validateCoupon({ code: pct.code, subtotalPaise: 10000 });
  check("25% of Rs.100 = Rs.25", r1.ok && r1.discountPaise === 2500, r1);

  const capped = await makeCoupon({
    discountType: "PERCENT",
    discountValue: 25,
    maxDiscountPaise: 1000,
  });
  const r2 = await validateCoupon({ code: capped.code, subtotalPaise: 100000 });
  check("explicit cap is honoured", r2.ok && r2.discountPaise === 1000, r2);

  const uncapped = await makeCoupon({ discountType: "PERCENT", discountValue: 90 });
  const r3 = await validateCoupon({ code: uncapped.code, subtotalPaise: 10000 });
  check("uncapped 90% defaults to a 70% cap", r3.ok && r3.discountPaise === 7000, r3);

  const flat = await makeCoupon({ discountType: "FLAT", discountValue: 12345 });
  const r4 = await validateCoupon({ code: flat.code, subtotalPaise: 50000 });
  check("flat discount is absolute paise", r4.ok && r4.discountPaise === 12345, r4);

  const flatOver = await makeCoupon({ discountType: "FLAT", discountValue: 99999 });
  const r5 = await validateCoupon({ code: flatOver.code, subtotalPaise: 10000 });
  check("flat discount never exceeds the subtotal", r5.ok && r5.discountPaise === 10000, r5);

  const lower = await validateCoupon({ code: pct.code.toLowerCase(), subtotalPaise: 10000 });
  check("codes are case-insensitive", lower.ok, lower);

  // ------------------------------------------------------------ rejections
  console.log("\nRejections");

  const rMissing = await validateCoupon({ code: "DOESNOTEXIST", subtotalPaise: 10000 });
  check("unknown code rejected", !rMissing.ok, rMissing);

  const inactive = await makeCoupon({ isActive: false });
  const rInactive = await validateCoupon({ code: inactive.code, subtotalPaise: 10000 });
  check("inactive coupon rejected", !rInactive.ok, rInactive);

  const expired = await makeCoupon({ expiresAt: new Date(Date.now() - 86_400_000) });
  const rExpired = await validateCoupon({ code: expired.code, subtotalPaise: 10000 });
  check("expired coupon rejected", !rExpired.ok, rExpired);

  const future = await makeCoupon({ startsAt: new Date(Date.now() + 86_400_000) });
  const rFuture = await validateCoupon({ code: future.code, subtotalPaise: 10000 });
  check("not-yet-started coupon rejected", !rFuture.ok, rFuture);

  const minOrder = await makeCoupon({ minOrderPaise: 50000 });
  const rMin = await validateCoupon({ code: minOrder.code, subtotalPaise: 10000 });
  check("below minimum rejected", !rMin.ok, rMin);
  const rMinOk = await validateCoupon({ code: minOrder.code, subtotalPaise: 50000 });
  check("exactly at minimum accepted", rMinOk.ok, rMinOk);

  const exhausted = await makeCoupon({ usageLimit: 2, usedCount: 2 });
  const rUsed = await validateCoupon({ code: exhausted.code, subtotalPaise: 10000 });
  check("usage limit reached rejected", !rUsed.ok, rUsed);

  const oneLeft = await makeCoupon({ usageLimit: 2, usedCount: 1 });
  const rOneLeft = await validateCoupon({ code: oneLeft.code, subtotalPaise: 10000 });
  check("one use remaining accepted", rOneLeft.ok, rOneLeft);

  const rEmpty = await validateCoupon({ code: pct.code, subtotalPaise: 0 });
  check("empty cart rejected", !rEmpty.ok, rEmpty);

  const zeroOff = await makeCoupon({ discountType: "PERCENT", discountValue: 0 });
  const rZero = await validateCoupon({ code: zeroOff.code, subtotalPaise: 10000 });
  check("zero-value coupon rejected", !rZero.ok, rZero);

  // ------------------------------------------------------------ per-user
  console.log("\nPer-customer limit");
  const perUser = await makeCoupon({ perUserLimit: 1 });

  // CouponRedemption has a foreign key to a real Order, so stand one up first.
  const probeOrder = await prisma.order.create({
    data: {
      orderNumber: `ZZTEST-${Date.now().toString(36).toUpperCase()}`,
      customerName: "Coupon Test",
      email: "repeat@example.com",
      phone: "+919000000000",
      subtotalPaise: 10000,
      discountPaise: 0,
      shippingPaise: 0,
      totalPaise: 10000,
      status: "PENDING",
    },
  });

  const first = await validateCoupon({
    code: perUser.code,
    subtotalPaise: 10000,
    email: "repeat@example.com",
  });
  check("first use accepted", first.ok, first);

  if (first.ok) {
    // Simulate the redemption the fulfilment step would have written.
    await prisma.couponRedemption.create({
      data: {
        couponId: first.couponId,
        orderId: probeOrder.id,
        email: "repeat@example.com",
      },
    });
    await prisma.coupon.update({
      where: { id: first.couponId },
      data: { usedCount: { increment: 1 } },
    });

    const second = await validateCoupon({
      code: perUser.code,
      subtotalPaise: 10000,
      email: "repeat@example.com",
    });
    check("second use by the same email rejected", !second.ok, second);

    const other = await validateCoupon({
      code: perUser.code,
      subtotalPaise: 10000,
      email: "someone-else@example.com",
    });
    check("a different email is unaffected", other.ok, other);
  }

  console.log(`\n  info  created and removed ${created.length} temporary coupons`);
}

main()
  .catch((error) => {
    console.error(error);
    failures++;
  })
  .finally(async () => {
    await prisma.coupon.deleteMany({ where: { id: { in: created } } });
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "ZZTEST-" } } });
    await prisma.$disconnect();
    console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
    process.exit(failures === 0 ? 0 : 1);
  });