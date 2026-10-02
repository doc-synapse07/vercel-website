import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

// Admin data changes constantly — never serve a cached shell.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  // Unauthenticated visitors are sent to login; the layout itself must not
  // redirect or the login page (which shares this layout) would loop.
  if (!admin) {
    return <AdminShell admin={null}>{children}</AdminShell>;
  }

  return <AdminShell admin={admin}>{children}</AdminShell>;
}