import Link from "next/link";
import { Compass, Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
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