"use client";

import { useEffect, useState } from "react";
import { Plus, X, Ticket } from "lucide-react";
import { CouponForm, type CouponFormValues } from "./CouponForm";

export type CouponRowView = CouponFormValues & { usedCount: number };

export function CouponManager({
  coupons,
  onToggleActive,
  onDelete,
}: {
  coupons: CouponRowView[];
  onToggleActive: (formData: FormData) => void;
  onDelete: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState<CouponRowView | null>(null);
  const [creating, setCreating] = useState(false);

  // Escape closes the modal.
  useEffect(() => {
    if (!creating && !editing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    // Prevent the page behind the modal from scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [creating, editing]);

  function close() {
    setEditing(null);
    setCreating(false);
  }

  function openNew() {
    setEditing(null);
    setCreating(true);
  }

  function openEdit(c: CouponRowView) {
    setCreating(false);
    setEditing(c);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Coupons</h1>
          <p className="mt-1 text-sm text-ink-500">
            Percentage or flat discounts with expiry dates and usage limits.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> New coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink-300 py-16 text-center">
          <Ticket size={26} className="mx-auto mb-3 text-ink-400" />
          <p className="mb-4 text-sm text-ink-500">No coupons yet.</p>
          <button
            type="button"
            onClick={openNew}
            className="btn btn-primary btn-sm"
          >
            Create your first coupon
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Conditions</th>
                  <th className="px-4 py-3 font-medium">Used</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                  const notStarted = c.startsAt ? new Date(c.startsAt) > new Date() : false;
                  const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit;

                  const status = !c.isActive
                    ? { label: "OFF", cls: "bg-ink-200 text-ink-600" }
                    : expired
                      ? { label: "EXPIRED", cls: "bg-red-100 text-red-700" }
                      : exhausted
                        ? { label: "LIMIT REACHED", cls: "bg-amber-100 text-amber-800" }
                        : { label: "LIVE", cls: "bg-brand-100 text-brand-800" };

                  return (
                    <tr key={c.id} className="border-b border-ink-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-ink-900">{c.code}</p>
                        {c.description && (
                          <p className="mt-0.5 text-xs text-ink-500">{c.description}</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-brand-700">
                          {c.discountType === "PERCENT"
                            ? `${c.discountValue}% off`
                            : `₹${(c.discountValue / 100).toFixed(0)} off`}
                        </span>
                        {c.maxDiscountPaise ? (
                          <p className="text-xs text-ink-500">
                            cap ₹{(c.maxDiscountPaise / 100).toFixed(0)}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-xs text-ink-600">
                        {c.minOrderPaise ? <p>Min ₹{(c.minOrderPaise / 100).toFixed(0)}</p> : null}
                        {c.perUserLimit ? <p>{c.perUserLimit}/customer</p> : null}
                        {!c.minOrderPaise && !c.perUserLimit ? (
                          <span className="text-ink-400">—</span>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-ink-900">
                          {c.usedCount}
                          {c.usageLimit !== null && (
                            <span className="text-ink-500"> / {c.usageLimit}</span>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {c.expiresAt ? (
                          <span className={expired ? "text-red-600" : "text-ink-600"}>
                            {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                            {expired ? " (expired)" : ""}
                          </span>
                        ) : (
                          <span className="text-ink-400">No expiry</span>
                        )}
                        {notStarted && (
                          <p className="text-amber-600">
                            Starts {new Date(c.startsAt!).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                          >
                            Edit
                          </button>
                          <form action={onToggleActive}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
                            >
                              {c.isActive ? "Disable" : "Enable"}
                            </button>
                          </form>
                          <form action={onDelete}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing ? `Edit ${editing.code}` : "New coupon"}
            className="my-8 w-full max-w-2xl rounded-card bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-ink-900">
                {editing ? `Edit ${editing.code}` : "New coupon"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <CouponForm
                coupon={editing}
                onDone={close}
                onCancel={close}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}