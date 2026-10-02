import Link from "next/link";
import { Compass, Package } from "lucide-react";

/**
 * Global 404 for URLs that match no route at all. It renders inside the bare
 * root layout, so it carries its own logo and links rather than relying on the
 * storefront header.
 */
export default function RootNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-base font-bold text-white">
        S7
      </span>
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">404</p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mb-8 max-w-md text-ink-600 dark:text-ink-300">
        The link may be broken, or the product might have been renamed. Try searching the store or
        browse all categories.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="btn btn-primary btn-md"
        >
          <Compass size={16} /> Browse all notes
        </Link>
        <Link
          href="/account"
          className="btn btn-outline btn-md"
        >
          <Package size={16} /> Your orders
        </Link>
      </div>
    </div>
  );
}