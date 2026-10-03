"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, ClipboardList, Home, Menu, ShoppingBag, ShoppingCart, Sparkles, User, X } from "lucide-react";
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
  { href: "/mock-tests", label: "Mock Tests" },
  { href: "/services", label: "Services" },
] as const;

const MOBILE_NAV = [
  { href: "/", label: "Home", desc: "Start here", icon: Home },
  { href: "/products", label: "Shop", desc: "PDF notes & bundles", icon: ShoppingBag },
  { href: "/mock-tests", label: "Mock Tests", desc: "Free practice tests", icon: ClipboardList },
  { href: "/services", label: "Services", desc: "Videos & collabs", icon: Sparkles },
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
  const { count, ready } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile sheet whenever the route changes, otherwise it survives
  // navigation and covers the page the customer just asked for.
  useEffect(() => setMobileOpen(false), [pathname]);

  // Lock background scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

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
          <Link
            href="/cart"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative grid h-9 w-9 place-items-center text-ink-600 transition-colors hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300"
          >
            <ShoppingCart size={20} />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-ink-900">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

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
            className={`grid h-10 w-10 place-items-center rounded-lg transition-colors lg:hidden ${
              mobileOpen
                ? "bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-white"
                : "text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            }`}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------ mobile sheet */}
      {mobileOpen && (
        <>
          {/* Backdrop — tap anywhere outside to close */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 cursor-default bg-ink-950/40 backdrop-blur-[2px] lg:hidden"
          />
          <div className="animate-fade-up absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-b-2xl border-t border-ink-200 bg-white shadow-xl shadow-ink-950/10 dark:border-ink-700 dark:bg-ink-900 lg:hidden">
            <nav
              aria-label="Mobile"
              className="mx-auto max-w-6xl space-y-1 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              {MOBILE_NAV.map((l) => {
                const active = isActive(l.href);
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[56px] items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                        : "text-ink-800 hover:bg-ink-100 active:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-800 dark:active:bg-ink-800"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                        active
                          ? "bg-brand-600 text-white"
                          : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                      }`}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold leading-tight">
                        {l.label}
                      </span>
                      <span className="block truncate text-xs font-medium text-ink-500 dark:text-ink-400">
                        {l.desc}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      className={active ? "text-brand-600 dark:text-brand-300" : "text-ink-400"}
                    />
                  </Link>
                );
              })}

              <div
                aria-hidden
                className="mx-3 my-2 border-t border-ink-200 dark:border-ink-700"
              />

              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                aria-current={pathname.startsWith("/account") ? "page" : undefined}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors ${
                  pathname.startsWith("/account")
                    ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                    : "text-ink-800 hover:bg-ink-100 active:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-800 dark:active:bg-ink-800"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                  <User size={19} />
                </span>
                My account
                <ChevronRight size={18} className="ml-auto text-ink-400" />
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary btn-md mt-2 min-h-[52px] w-full text-base"
              >
                Get in touch
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
