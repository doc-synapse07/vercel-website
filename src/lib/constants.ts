/** Enum-like string unions. SQLite has no native enums so these are validated in code. */

export const PRODUCT_TYPES = ["DIGITAL", "PHYSICAL"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const ORDER_STATUSES = ["PENDING", "PAID", "FAILED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["razorpay", "stripe", "cashfree", "mock"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const DISCOUNT_TYPES = ["PERCENT", "FLAT"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type AdminRole = "ADMIN" | "STAFF";