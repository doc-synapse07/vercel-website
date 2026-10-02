"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, XCircle, FlaskConical } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { OrderRow } from "@/lib/types";

export function MockPayClient({
  orderNumber,
  totalPaise,
  customerEmail,
  items,
}: {
  orderNumber: string;
  totalPaise: number;
  customerEmail: string;
  items: { title: string; quantity: number; subtotalPaise: number; coverImage?: string | null }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "";

  const [status, setStatus] = useState<"idle" | "paying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function simulateSuccess() {
    if (!orderId) {
      setError("Missing order reference.");
      return;
    }
    setStatus("paying");
    setError(null);

    try {
      const res = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Payment failed");

      router.push(`/order/success?orderId=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 rounded-card border border-amber-300 bg-amber-50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
          <FlaskConical size={17} /> Sandbox mode
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-amber-800">
          No payment gateway keys are configured, so this page simulates the gateway. No real
          money moves and no card details are needed. Add Razorpay, Stripe or Cashfree keys in{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-[12px]">.env</code> to switch to
          real payments.
        </p>
      </div>

      <div className="mb-6 rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800">
        <h2 className="mb-4 text-lg font-semibold text-ink-900 dark:text-white">Order summary</h2>

        <dl className="mb-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600 dark:text-ink-300">Order number</dt>
            <dd className="font-semibold text-ink-900 dark:text-white">{orderNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600 dark:text-ink-300">Email</dt>
            <dd className="font-semibold text-ink-900 dark:text-white">{customerEmail}</dd>
          </div>
        </dl>

        <ul className="flex flex-col gap-3 border-t border-ink-200 pt-4 dark:border-ink-700">
          {items.map((i, idx) => (
            <li key={idx} className="flex gap-3">
              {i.coverImage && (
                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-ink-100">
                  <Image src={i.coverImage} alt="" fill sizes="44px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-ink-900 dark:text-white">{i.title}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Qty {i.quantity}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {formatINR(i.subtotalPaise)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-ink-200 pt-4 text-base dark:border-ink-700">
          <span className="font-semibold text-ink-900 dark:text-white">Amount due</span>
          <span className="text-lg font-bold text-ink-900 dark:text-white">{formatINR(totalPaise)}</span>
        </div>
      </div>

      {error && (
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={simulateSuccess}
        disabled={status === "paying"}
        className="btn btn-primary btn-lg mb-3 w-full"
      >
        {status === "paying" ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Processing payment…
          </>
        ) : (
          <>
            <CheckCircle2 size={18} /> Simulate successful payment of{" "}
            {formatINR(totalPaise)}
          </>
        )}
      </button>

      <p className="flex items-start gap-2 text-xs text-ink-500 dark:text-ink-400">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        Clicking the button marks the order paid, generates the download links and sends the
        confirmation email — exactly what a real gateway webhook would trigger.
      </p>
    </div>
  );
}

/** Kept for parity with the success page which reuses the same order shape. */
export type MockOrder = OrderRow;