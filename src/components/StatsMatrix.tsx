/**
 * 12500 -> "12.5K", 840000 -> "8.4L".
 *
 * Indian storefronts read "1.2L" far more naturally than "120K", so lakh wins
 * over the usual K/M ladder once a number crosses 100_000.
 *
 * Kept here (rather than utils.ts) because scripts/social-test.ts imports it
 * from this path.
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
