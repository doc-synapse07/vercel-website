"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Save, X, Ticket } from "lucide-react";
import {
  createCouponAction,
  updateCouponAction,
  type CouponFormState,
} from "@/app/admin/actions/coupons";

const initialState: CouponFormState = { ok: false };

export type CouponFormValues = {
  id?: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderPaise: number | null;
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
};

/** datetime-local needs "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function rupees(paise: number | null): string {
  return paise === null ? "" : (paise / 100).toString();
}

export function CouponForm({
  coupon,
  onDone,
  onCancel,
}: {
  coupon?: CouponFormValues | null;
  /** Called after a successful save. */
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(coupon?.id);
  const action = isEdit ? updateCouponAction : createCouponAction;
  const [state, formAction, pending] = useActionState<CouponFormState, FormData>(
    action,
    initialState,
  );

  const [discountType, setDiscountType] = useState(coupon?.discountType ?? "PERCENT");

  // Only fire onDone on the transition into success, otherwise re-renders would
  // close the modal the user just reopened.
  const wasSuccess = useRef(false);
  useEffect(() => {
    if (state.ok && state.success && !wasSuccess.current) {
      wasSuccess.current = true;
      onDone?.();
    }
  }, [state, onDone]);

  const inputCls =
    "w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-100";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-700";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {coupon?.id && <input type="hidden" name="id" value={coupon.id} />}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          {state.success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className={labelCls}>
            Coupon code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            name="code"
            required
            minLength={3}
            maxLength={30}
            defaultValue={coupon?.code ?? ""}
            placeholder="WELCOME10"
            className={`${inputCls} font-mono uppercase`}
          />
          <p className="mt-1.5 text-xs text-ink-500">Case-insensitive for customers.</p>
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>
            Description
          </label>
          <input
            id="description"
            name="description"
            maxLength={200}
            defaultValue={coupon?.description ?? ""}
            placeholder="10% off for new customers"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="discountType" className={labelCls}>
            Discount type
          </label>
          <select
            id="discountType"
            name="discountType"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className={inputCls}
          >
            <option value="PERCENT">Percentage (%)</option>
            <option value="FLAT">Flat amount (₹)</option>
          </select>
        </div>

        <div>
          <label htmlFor="discountValue" className={labelCls}>
            {discountType === "PERCENT" ? "Discount percentage" : "Discount amount (₹)"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            required
            min={discountType === "PERCENT" ? 1 : 0.01}
            step="any"
            max={discountType === "PERCENT" ? 100 : undefined}
            defaultValue={
              coupon
                ? discountType === "PERCENT"
                  ? coupon.discountValue
                  : coupon.discountValue / 100
                : ""
            }
            placeholder={discountType === "PERCENT" ? "10" : "100"}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="minOrder" className={labelCls}>
            Minimum cart value (₹)
          </label>
          <input
            id="minOrder"
            name="minOrder"
            type="number"
            min={0}
            step="any"
            defaultValue={rupees(coupon?.minOrderPaise ?? null)}
            placeholder="No minimum"
            className={inputCls}
          />
        </div>

        {discountType === "PERCENT" && (
          <div>
            <label htmlFor="maxDiscount" className={labelCls}>
              Maximum discount (₹)
            </label>
            <input
              id="maxDiscount"
              name="maxDiscount"
              type="number"
              min={0}
              step="any"
              defaultValue={rupees(coupon?.maxDiscountPaise ?? null)}
              placeholder="Uncapped"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Caps a percentage discount so large carts are not wiped out.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="usageLimit" className={labelCls}>
            Total usage limit
          </label>
          <input
            id="usageLimit"
            name="usageLimit"
            type="number"
            min={1}
            defaultValue={coupon?.usageLimit?.toString() ?? ""}
            placeholder="Unlimited"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="perUserLimit" className={labelCls}>
            Uses per customer (by email)
          </label>
          <input
            id="perUserLimit"
            name="perUserLimit"
            type="number"
            min={1}
            defaultValue={coupon?.perUserLimit?.toString() ?? ""}
            placeholder="Unlimited"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="startsAt" className={labelCls}>
            Valid from
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalInput(coupon?.startsAt ?? null)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="expiresAt" className={labelCls}>
            Expires on
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toLocalInput(coupon?.expiresAt ?? null)}
            className={inputCls}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={coupon?.isActive ?? true}
          className="h-4 w-4 rounded accent-brand-700"
        />
        Active
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-md"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isEdit ? (
            <Save size={16} />
          ) : (
            <Ticket size={16} />
          )}
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline btn-md"
        >
          <X size={16} /> Cancel
        </button>
      </div>
    </form>
  );
}