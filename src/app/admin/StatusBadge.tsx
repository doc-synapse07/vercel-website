const STYLES: Record<string, string> = {
  PAID: "bg-brand-100 text-brand-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-ink-200 text-ink-700",
};

const LABELS: Record<string, string> = {
  PAID: "Paid",
  PENDING: "Payment pending",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
        STYLES[status] ?? "bg-ink-100 text-ink-700"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}