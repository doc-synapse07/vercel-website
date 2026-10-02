import Link from "next/link";
import { FileText, Instagram, Youtube } from "lucide-react";

/**
 * 12500 -> "12.5K", 840000 -> "8.4L".
 *
 * Indian storefronts read "1.2L" far more naturally than "120K", so lakh wins
 * over the usual K/M ladder once a number crosses 100_000.
 */
export function formatCompact(input: string | number | null | undefined): string {
  const n = typeof input === "number" ? input : Number(String(input ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";

  if (n >= 1_00_00_000) return `${trim(n / 1_00_00_000)}Cr`;
  if (n >= 1_00_000) return `${trim(n / 1_00_000)}L`;
  if (n >= 1_000) return `${trim(n / 1_000)}K`;
  return String(n);
}

/** One decimal place, but drop ".0" so 8000 reads as "8K" not "8.0K". */
function trim(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

type Tile = {
  key: string;
  value: string;
  label: string;
  sub: string;
  href?: string;
  icon: typeof FileText;
  /** Social tiles tint with the platform colour instead of the brand teal. */
  tint?: string;
  iconBg?: string;
};

export function StatsMatrix({
  products,
  categories,
  youtubeSubscribers,
  instagramFollowers,
  youtubeUrl,
  instagramUrl,
}: {
  products: number;
  categories: number;
  youtubeSubscribers?: string;
  instagramFollowers?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
}) {
  const tiles: Tile[] = [
    {
      key: "products",
      value: String(products),
      label: products === 1 ? "PDF product" : "PDF products",
      sub: `${categories} exam ${categories === 1 ? "category" : "categories"}`,
      href: "/products",
      icon: FileText,
    },
  ];

  const subs = formatCompact(youtubeSubscribers);
  if (subs) {
    tiles.push({
      key: "youtube",
      value: subs,
      label: "YouTube subscribers",
      sub: "Free revision videos",
      href: youtubeUrl || undefined,
      icon: Youtube,
      tint: "group-hover:text-red-600",
      iconBg: "bg-red-50 text-red-600",
    });
  }

  const followers = formatCompact(instagramFollowers);
  if (followers) {
    tiles.push({
      key: "instagram",
      value: followers,
      label: "Instagram followers",
      sub: "Daily posts & updates",
      href: instagramUrl || undefined,
      icon: Instagram,
      tint: "group-hover:text-pink-600",
      iconBg: "bg-pink-50 text-pink-600",
    });
  }

  // Tile count varies with which social counts the owner has entered, so the grid
  // has to collapse to however many are actually available.
  const cols =
    tiles.length >= 3
      ? "sm:grid-cols-3"
      : tiles.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-1";

  return (
    <section className="border-b border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
      <div className="mx-auto max-w-6xl px-4">
        <div className={`grid grid-cols-1 divide-y divide-ink-200 dark:divide-ink-700 sm:divide-x sm:divide-y-0 ${cols}`}>
          {tiles.map((t) => {
            const body = (
              <>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconBg ?? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"}`}
                >
                  <t.icon size={21} />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl font-extrabold leading-none tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                    {t.value}
                    <span className="text-brand-700 dark:text-brand-300">{t.value.endsWith("K") || t.value.endsWith("L") || t.value.endsWith("Cr") ? "+" : ""}</span>
                  </span>
                  <span className="mt-1.5 block text-sm font-semibold text-ink-800 dark:text-ink-100">{t.label}</span>
                  <span className="block text-xs text-ink-500 dark:text-ink-400">{t.sub}</span>
                </span>
              </>
            );

            const className = `group flex items-center gap-4 px-2 py-7 sm:px-6 sm:text-center sm:flex-col sm:gap-3 sm:py-8`;

            return t.href ? (
              <Link key={t.key} href={t.href} className={`${className} transition-colors hover:bg-ink-50 dark:hover:bg-ink-800`}>
                {body}
              </Link>
            ) : (
              <div key={t.key} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
