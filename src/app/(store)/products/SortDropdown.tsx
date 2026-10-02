"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { ProductListOptions } from "@/lib/queries";

const SORTS: { key: NonNullable<ProductListOptions["sort"]>; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "popular", label: "Popular" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

export function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "newest";

  function buildUrl(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-outline btn-sm flex items-center gap-1.5 px-3 py-2.5"
        onClick={(e) => {
          e.preventDefault();
          const menu = e.currentTarget.nextElementSibling as HTMLElement;
          menu.classList.toggle("hidden");
        }}
      >
        <SlidersHorizontal size={16} />
        {SORTS.find((s) => s.key === currentSort)?.label || "Sort"}
        <ChevronDown size={14} />
      </button>
      <div
        className="hidden absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-md border border-ink-300 bg-white py-1 shadow-lg dark:border-ink-600 dark:bg-ink-800"
        role="menu"
      >
        {SORTS.map((s) => {
          const active = currentSort === s.key;
          return (
            <Link
              key={s.key}
              href={buildUrl(s.key)}
              className={`block px-3 py-2 text-sm transition-colors ${
                active ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
              }`}
              onClick={() => {
                const menu = document.querySelector('[role="menu"]') as HTMLElement;
                menu?.classList.add("hidden");
              }}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}