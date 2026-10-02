"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

/**
 * Storefront header.
 *
 * Flat link row, deliberately: HOME | SHOP | SERVICES, then an icon-only cart,
 * an account link and a filled "Get in touch" call to action.
 *
 * There is no SHOP dropdown on purpose. With ten exam categories a dropdown
 * becomes a wall of lookalike labels; the category grid on the homepage and the
 * /products page are the browsing surfaces instead.
 *
 * There is deliberately no link to the admin panel here. It is reachable by
 * typing /admin, which keeps it out of the way of customers while remaining
 * one URL away for the owner.
 */

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/services", label: "Services" },
] as const;

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap border-b-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
        active
          ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-300"
          : "border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function SiteHeader({ siteName }: { siteName: string }) {
  const { count, openDrawer, ready } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile sheet whenever the route changes, otherwise it survives
  // navigation and covers the page the customer just asked for.
  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-[13px] font-extrabold tracking-tight text-white shadow-md shadow-brand-700/30">
            S7
          </span>
          <span className="text-[19px] font-extrabold leading-none tracking-tight text-ink-900 dark:text-white">
            SYNAPSE<span className="text-brand-600 dark:text-brand-400">.07</span>
          </span>
        </Link>

        {/* ------------------------------------------------------ desktop nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex">
          {NAV.map((l) => (
            <NavLink key={l.href} href={l.href} active={isActive(l.href)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* ------------------------------------------------------ right side */}
        <div className="relative z-10 flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative grid h-9 w-9 place-items-center text-ink-600 transition-colors hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300"
          >
            <ShoppingCart size={20} />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-ink-900">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          <Link
            href="/account"
            className="hidden items-center gap-1.5 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-600 transition-colors hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300 sm:flex"
          >
            <User size={16} />
            Account
          </Link>

          <Link href="/contact" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Get in touch
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center text-ink-700 transition-colors hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------ mobile sheet */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900 lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 p-4">
            {NAV.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                active={isActive(l.href)}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}

            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-1 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              Account
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-1 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              FAQ
            </Link>

            <Link href="/contact" className="btn btn-primary btn-md mt-4 w-full">
              Get in touch
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
