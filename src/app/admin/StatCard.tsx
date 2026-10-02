import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENTS: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "brand",
  small = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: keyof typeof ACCENTS;
  small?: boolean;
}) {
  return (
    <div className="rounded-card border border-ink-200 bg-white p-4">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            small ? "h-8 w-8" : "h-10 w-10",
            ACCENTS[accent] ?? ACCENTS.brand,
          )}
        >
          <Icon size={small ? 15 : 18} />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-500">
          {label}
        </span>
      </div>
      <p className={cn("font-bold text-ink-900", small ? "text-xl" : "text-2xl")}>{value}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-ink-500">{sub}</p>}
    </div>
  );
}