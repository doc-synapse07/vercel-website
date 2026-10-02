import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { CouponManager } from "./CouponManager";
import { deleteCouponAction, toggleCouponActiveAction } from "@/app/admin/actions/coupons";

export const metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <CouponManager
      coupons={coupons}
      onToggleActive={toggleCouponActiveAction}
      onDelete={deleteCouponAction}
    />
  );
}