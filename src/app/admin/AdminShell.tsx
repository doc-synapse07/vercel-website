"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string } | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The login screen renders without the admin chrome.
  if (!admin) return <>{children}</>;

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(item)
              ? "bg-brand-700 text-white"
              : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
          }`}
        >
          <item.icon size={17} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ------------------------------------------------------------ header */}
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-ink-300 p-2 text-ink-700 lg:hidden"
            aria-label="Toggle admin menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
              S7
            </span>
            <span className="font-bold text-ink-900">Store admin</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 sm:inline-flex"
            >
              View store <ExternalLink size={14} />
            </Link>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink-900">{admin.name}</p>
              <p className="text-xs text-ink-500">{admin.email}</p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>

        {open && <div className="border-t border-ink-200 p-3 lg:hidden">{nav}</div>}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 rounded-card border border-ink-200 bg-white p-3">
            {nav}
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}