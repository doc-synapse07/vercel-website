/** Enum-like string unions. String columns validated in code. */

export const PRODUCT_TYPES = ["DIGITAL", "PHYSICAL"] as const;

export const ORDER_STATUSES = ["PENDING", "PAID", "FAILED"] as const;

export const PAYMENT_PROVIDERS = ["razorpay", "stripe", "cashfree", "mock"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const DISCOUNT_TYPES = ["PERCENT", "FLAT"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type AdminRole = "ADMIN" | "STAFF";