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