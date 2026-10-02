"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";

/**
 * The current query is passed in by the server-rendered parent rather than read
 * with useSearchParams() — that hook forces a client-side bailout and breaks
 * static prerendering of every page this component appears on.
 */
export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  // Keep in step when the parent re-renders with a different query, e.g. the
  // user pressed Back and landed on an earlier search.
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for INI-CET PYQs, UPSC CMS, radiology…"
        aria-label="Search products"
        className="w-full rounded-xl border border-ink-300 bg-white py-3.5 pl-12 pr-28 text-sm text-ink-900 shadow-sm outline-none transition-all placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-ink-600 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-500 dark:focus:ring-brand-900"
      />
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Search
      </button>
    </form>
  );
}