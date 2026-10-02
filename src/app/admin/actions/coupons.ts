"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { DISCOUNT_TYPES } from "@/lib/constants";

export type CouponFormState = {
  ok: boolean;
  error?: string;
  success?: string;
};

const CouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens and underscores"),
    description: z.string().trim().max(200),
    discountType: z.enum(DISCOUNT_TYPES),
    // PERCENT -> 1..100. FLAT -> rupees.
    discountValue: z.coerce.number().positive("Enter a value greater than zero"),
    minOrder: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(),
    maxDiscount: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(),
    usageLimit: z.union([z.coerce.number().int().min(1), z.literal(""), z.null()]).optional(),
    perUserLimit: z.union([z.coerce.number().int().min(1), z.literal(""), z.null()]).optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (d) => d.discountType !== "PERCENT" || d.discountValue <= 100,
    { message: "A percentage discount cannot be more than 100", path: ["discountValue"] },
  )
  .refine(
    (d) =>
      !d.startsAt ||
      !d.expiresAt ||
      new Date(d.expiresAt).getTime() > new Date(d.startsAt).getTime(),
    { message: "Expiry must be after the start date", path: ["expiresAt"] },
  );

function optionalNumber(value: unknown): number | null {
  const s = typeof value === "string" ? value.trim() : value;
  if (s === "" || s === null || s === undefined) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toDate(value: unknown): Date | null {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toPaise(value: unknown): number | null {
  const n = optionalNumber(value);
  return n === null ? null : Math.round(n * 100);
}

export async function createCouponAction(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const parsed = CouponSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minOrder: formData.get("minOrder"),
    maxDiscount: formData.get("maxDiscount"),
    usageLimit: formData.get("usageLimit"),
    perUserLimit: formData.get("perUserLimit"),
    startsAt: formData.get("startsAt"),
    expiresAt: formData.get("expiresAt"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const d = parsed.data;
  const code = d.code.toUpperCase();

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return { ok: false, error: `Coupon "${code}" already exists.` };
  }

  const discountValue =
    d.discountType === "PERCENT" ? Math.round(d.discountValue) : Math.round(d.discountValue * 100);

  await prisma.coupon.create({
    data: {
      code,
      description: d.description || null,
      discountType: d.discountType,
      discountValue,
      minOrderPaise: toPaise(d.minOrder),
      maxDiscountPaise: d.discountType === "PERCENT" ? toPaise(d.maxDiscount) : null,
      usageLimit: optionalNumber(d.usageLimit),
      perUserLimit: optionalNumber(d.perUserLimit),
      startsAt: toDate(d.startsAt),
      expiresAt: toDate(d.expiresAt),
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/coupons");
  return { ok: true, success: `Coupon ${code} created.` };
}

export async function updateCouponAction(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing coupon id." };

  const parsed = CouponSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minOrder: formData.get("minOrder"),
    maxDiscount: formData.get("maxDiscount"),
    usageLimit: formData.get("usageLimit"),
    perUserLimit: formData.get("perUserLimit"),
    startsAt: formData.get("startsAt"),
    expiresAt: formData.get("expiresAt"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const d = parsed.data;
  const code = d.code.toUpperCase();

  const clash = await prisma.coupon.findUnique({ where: { code } });
  if (clash && clash.id !== id) {
    return { ok: false, error: `Coupon "${code}" already exists.` };
  }

  const discountValue =
    d.discountType === "PERCENT" ? Math.round(d.discountValue) : Math.round(d.discountValue * 100);

  await prisma.coupon.update({
    where: { id },
    data: {
      code,
      description: d.description || null,
      discountType: d.discountType,
      discountValue,
      minOrderPaise: toPaise(d.minOrder),
      maxDiscountPaise: d.discountType === "PERCENT" ? toPaise(d.maxDiscount) : null,
      usageLimit: optionalNumber(d.usageLimit),
      perUserLimit: optionalNumber(d.perUserLimit),
      startsAt: toDate(d.startsAt),
      expiresAt: toDate(d.expiresAt),
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/coupons");
  return { ok: true, success: `Coupon ${code} updated.` };
}

export async function deleteCouponAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Past orders keep their snapshot via Order.couponCode; SetNull protects history.
  await prisma.coupon.delete({ where: { id } });

  revalidatePath("/admin/coupons");
}

export async function toggleCouponActiveAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const coupon = await prisma.coupon.findUnique({ where: { id }, select: { isActive: true } });
  if (!coupon) return;

  await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  revalidatePath("/admin/coupons");
}