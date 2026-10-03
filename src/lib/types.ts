/** Shared view-model types used by both server components and client components. */

export type CartProduct = {
  id: string;
  slug: string;
  title: string;
  pricePaise: number;
  mrpPaise: number | null;
  coverImage: string | null;
  productType: string;
  isFree: boolean;
  kind?: ProductKind;
  variants?: ProductVariant[];
  categorySlug?: string;
  originalPrice?: number;
};

export type CategoryNav = {
  name: string;
  slug: string;
  productCount: number;
};

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  coverImage: string | null;
  productType: string;
  isFree: boolean;
  isFeatured: boolean;
  category: { name: string; slug: string };
  fileCount: number;
};

export type AdminStats = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenuePaise: number;
  revenueLast30DaysPaise: number;
  ordersLast30Days: number;
  totalCustomers: number;
  activeCoupons: number;
  totalDownloads: number;
  lowFileProducts: number;
};

export type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  totalPaise: number;
  status: string;
  paymentProvider: string | null;
  couponCode: string | null;
  itemCount: number;
  createdAt: Date;
};

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderPaise: number | null;
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
};

// Fusion patterns: Additional types for new features (don't break existing)
export type ProductKind = "DIGITAL" | "PHYSICAL";

export type ProductVariant = {
  id: string;
  label: string;
  pricePaise: number;
  inStock: boolean;
};

export type ProductFile = {
  id: string;
  fileName: string;
  sizeBytes: number;
  sortOrder: number;
};

export type CartItem = {
  key: string;
  id: string;
  name: string;
  pricePaise: number;
  mrpPaise: number | null;
  image: string | null;
  qty: number;
  kind?: ProductKind;
  variantId?: string;
  variantLabel?: string;
  customization?: string;
  
  // Backward compat
  productId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  productType: string;
  isFree: boolean;
  quantity: number;
  price: number;
  originalPrice?: number;
};

export type Settings = {
  siteName: string;
  siteTagline: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  upiId: string;
};

// Re-export Prisma-compatible types for server-side use
export type Product = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  coverImage: string | null;
  productType: string;
  kind: ProductKind;
  variants: ProductVariant[];
  files: ProductFile[];
  categorySlug: string;
  isActive: boolean;
  isFeatured: boolean;
  inStock: boolean;
  isFree: boolean;
};

export type Category = {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
};

export type OrderItem = {
  id: string;
  name: string;
  pricePaise: number;
  mrpPaise: number | null;
  productType: string;
  quantity: number;
  kind?: ProductKind;
  variant?: string;
  customization?: string;
  fileName?: string;
  downloadUrl?: string;
  expiresAt?: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: "pending" | "paid" | "failed" | "refunded";
  items: OrderItem[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  total: number;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    line: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  courier?: string;
  trackingNumber?: string;
  paymentProvider?: string;
  paymentOrderId?: string;
  paymentRefId?: string;
  paymentSignature?: string;
  paidAt?: string;
  createdAt: string;
  shipping?: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  googleId?: string;
  passwordHash?: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
};