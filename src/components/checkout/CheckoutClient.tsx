"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR, normalizePhone } from "@/lib/utils";
import type { CartProduct } from "@/lib/types";

export type ProviderOption = {
  id: string;
  label: string;
  description: string;
};

/** Loads a third-party script once and resolves when it is ready. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function CheckoutClient({
  providers,
  account,
}: {
  providers: ProviderOption[];
  /** Signed-in customer, if any — name and email are prefilled from it. */
  account?: { name: string; email: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const cart = useCart();

  // ------------------------------------------------------------------ items
  // "Buy now" bypasses the cart: ?product=<id>&qty=<n>
  const buyNowId = params.get("product");
  const buyNowQty = Math.max(1, Number(params.get("qty") ?? 1) || 1);
  const [buyNowProduct, setBuyNowProduct] = useState<CartProduct | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(Boolean(buyNowId));

  useEffect(() => {
    if (!buyNowId) return;
    let cancelled = false;

    (async () => {
      setBuyNowLoading(true);
      try {
        const res = await fetch(`/api/products/${buyNowId}`);
        if (!res.ok) throw new Error("not found");
        const data = (await res.json()) as CartProduct;
        if (!cancelled) setBuyNowProduct(data);
      } catch {
        if (!cancelled) router.replace("/products");
      } finally {
        if (!cancelled) setBuyNowLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buyNowId, router]);

  const usingCart = !buyNowId;

  const items = useMemo(() => {
    if (usingCart) {
      return cart.lines.map((l) => ({
        productId: l.productId,
        title: l.title,
        slug: l.slug,
        coverImage: l.coverImage,
        pricePaise: l.pricePaise,
        mrpPaise: l.mrpPaise,
        quantity: l.quantity,
        isFree: l.isFree,
      }));
    }
    if (!buyNowProduct) return [];
    return [
      {
        productId: buyNowProduct.id,
        title: buyNowProduct.title,
        slug: buyNowProduct.slug,
        coverImage: buyNowProduct.coverImage,
        pricePaise: buyNowProduct.isFree ? 0 : buyNowProduct.pricePaise,
        mrpPaise: buyNowProduct.mrpPaise,
        quantity: buyNowQty,
        isFree: buyNowProduct.isFree,
      },
    ];
  }, [usingCart, cart.lines, buyNowProduct, buyNowQty]);

  const subtotalPaise = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const mrpTotalPaise = items.reduce(
    (s, i) => s + (i.mrpPaise ?? i.pricePaise) * i.quantity,
    0,
  );

  // ----------------------------------------------------------------- form
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState(providers[0]?.id ?? "mock");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(
    null,
  );
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discountPaise = appliedCoupon?.discountPaise ?? 0;
  const totalPaise = Math.max(0, subtotalPaise - discountPaise);
  const savings = Math.max(0, mrpTotalPaise - subtotalPaise) + discountPaise;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotalPaise, email: email || undefined }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reason?: string;
        discountPaise?: number;
        code?: string;
      };
      if (data.ok) {
        setAppliedCoupon({ code: data.code!, discountPaise: data.discountPaise ?? 0 });
        setCouponMessage({
          ok: true,
          text: `${data.code} applied — you saved ${formatINR(data.discountPaise ?? 0)}.`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponMessage({ ok: false, text: data.reason ?? "Invalid coupon" });
      }
    } catch {
      setCouponMessage({ ok: false, text: "Could not check that coupon." });
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  }

  // --------------------------------------------------------------- payment
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: normalizePhone(phone),
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: appliedCoupon?.code ?? null,
          provider,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        orderId?: string;
        orderNumber?: string;
        payment?: {
          provider: string;
          gatewayOrderId: string;
          keyId?: string;
          clientSecret?: string;
          publishableKey?: string;
          paymentSessionId?: string;
          appId?: string;
          mockUrl?: string;
        };
      };

      if (!data.ok || !data.orderId || !data.payment) {
        throw new Error(data.error ?? "Could not start the payment.");
      }

      const orderId = data.orderId;
      const payment = data.payment;

      if (payment.provider === "mock") {
        router.push(`/checkout/mock?orderId=${orderId}`);
        return;
      }

      if (payment.provider === "razorpay") {
        await runRazorpay(orderId, payment);
        return;
      }

      if (payment.provider === "stripe") {
        await runStripe(orderId, payment);
        return;
      }

      if (payment.provider === "cashfree") {
        await runCashfree(orderId, payment);
        return;
      }

      throw new Error("Unsupported payment method.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function runRazorpay(
    orderId: string,
    payment: { keyId?: string; gatewayOrderId: string },
  ) {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    const RazorpayCtor = (window as unknown as { Razorpay: new (o: unknown) => { open: () => void; on: (e: string, f: (r: never) => void) => void } }).Razorpay;

    const instance = new RazorpayCtor({
      key: payment.keyId,
      amount: totalPaise,
      currency: "INR",
      name: "SYNAPSE.07",
      description: "Exam preparation PDFs",
      order_id: payment.gatewayOrderId,
      prefill: { name, email, contact: normalizePhone(phone).replace("+", "") },
      notes: { internalOrderId: orderId },
      theme: { color: "#0f766e" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setSubmitting(true);
        try {
          const res = await fetch("/api/payments/verify/razorpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, internalOrderId: orderId }),
          });
          const data = (await res.json()) as { ok: boolean; error?: string };
          if (!data.ok) throw new Error(data.error ?? "Payment verification failed");
          router.push(`/order/success?orderId=${orderId}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Verification failed");
          setSubmitting(false);
        }
      },
      modal: {
        ondismiss: () => setSubmitting(false),
      },
    });

    instance.on("payment.failed", (r: never) => {
      const response = r as { error?: { description?: string } };
      setError(response?.error?.description ?? "Payment failed. Please try again.");
      setSubmitting(false);
    });

    instance.open();
  }

  async function runStripe(
    orderId: string,
    payment: { publishableKey?: string; clientSecret?: string },
  ) {
    if (!payment.publishableKey || !payment.clientSecret) {
      throw new Error("Stripe payment session is incomplete.");
    }
    await loadScript("https://js.stripe.com/v3/");
    const StripeCtor = (window as unknown as { Stripe: new (k: string) => { confirmPayment: (a: unknown) => Promise<{ error?: { message?: string } }> } }).Stripe;

    const stripe = new StripeCtor(payment.publishableKey);
    const result = await stripe.confirmPayment({
      clientSecret: payment.clientSecret,
      confirmParams: { return_url: `${window.location.origin}/order/success?orderId=${orderId}` },
    });

    if (result.error) throw new Error(result.error.message ?? "Stripe payment failed");
    // On success Stripe redirects to the return_url above.
  }

  async function runCashfree(
    orderId: string,
    payment: { paymentSessionId?: string; appId?: string },
  ) {
    if (!payment.paymentSessionId || !payment.appId) {
      throw new Error("Cashfree session is incomplete.");
    }
    await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");

    const cashfree = (window as unknown as { Cashfree: (o: unknown) => { open: (a: unknown) => void; on: (e: string, f: (r: never) => void) => void } }).Cashfree;

    const cf = cashfree({ appId: payment.appId, mode: "TEST" });
    const returnUrl = `${window.location.origin}/order/success?orderId=${orderId}`;

    cf.open({
      paymentSessionId: payment.paymentSessionId,
      redirectMethod: "POST",
      redirectUrl: returnUrl,
    });

    cf.on("payment.success", async (r: never) => {
      const response = r as { paymentData?: { orderId?: string; paymentId?: string } };
      setSubmitting(true);
      try {
        const res = await fetch("/api/payments/verify/cashfree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: response?.paymentData?.orderId,
            paymentId: response?.paymentData?.paymentId,
            internalOrderId: orderId,
          }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!data.ok) throw new Error(data.error ?? "Payment verification failed");
        router.push(`/order/success?orderId=${orderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
        setSubmitting(false);
      }
    });

    cf.on("payment.error", (r: never) => {
      const response = r as { errorData?: { message?: string } };
      setError(response?.errorData?.message ?? "Cashfree payment failed.");
      setSubmitting(false);
    });

    cf.on("checkout.dismissed", () => setSubmitting(false));
  }

  // ------------------------------------------------------------------ render
  if (buyNowLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="animate-spin text-brand-700 dark:text-brand-300" size={28} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 py-24 text-center dark:border-ink-600">
        <h2 className="mb-1.5 text-xl font-semibold text-ink-900 dark:text-white">Nothing to check out</h2>
        <p className="mb-6 max-w-sm text-sm text-ink-500 dark:text-ink-400">
          Your cart is empty. Add a product to continue.
        </p>
        <Link
          href="/products"
          className="btn btn-primary btn-md"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-ink-600 dark:text-white";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200";

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* ---------------------------------------------------------- details */}
      <div>
        <div className="mb-6 rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-white">
            <User size={18} className="text-brand-700 dark:text-brand-300" /> Your details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className={labelCls}>
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jasmine M S"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelCls}>
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                Your download links are sent here.
              </p>
            </div>

            <div>
              <label htmlFor="phone" className={labelCls}>
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">Used for order updates only.</p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-white">
            <CreditCard size={18} className="text-brand-700 dark:text-brand-300" /> Payment method
          </h2>

          {providers.length === 1 && providers[0].id === "mock" ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
              <p className="text-sm font-medium text-amber-900">
                Sandbox mode — no payment gateway configured
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                No real money will be charged. Add Razorpay, Stripe or Cashfree keys in{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 text-[12px]">.env</code> to
                enable live payments.
              </p>
            </div>
          ) : null}

          <div className="grid gap-2.5">
            {providers.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  provider === p.id
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-950"
                    : "border-ink-300 hover:border-brand-300 dark:border-ink-600"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={provider === p.id}
                  onChange={() => setProvider(p.id)}
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink-900 dark:text-white">{p.label}</span>
                  <span className="block text-[13px] text-ink-500 dark:text-ink-400">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- summary */}
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-card border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-800">
          <h2 className="mb-4 text-lg font-semibold text-ink-900 dark:text-white">Order summary</h2>

          <ul className="mb-4 flex flex-col gap-3">
            {items.map((i) => (
              <li key={i.productId} className="flex gap-3">
                <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  {i.coverImage && (
                    <Image
                      src={i.coverImage}
                      alt=""
                      fill
                      sizes="52px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-ink-900 dark:text-white">{i.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                    Qty {i.quantity} × {i.isFree ? "Free" : formatINR(i.pricePaise)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink-900 dark:text-white">
                  {formatINR(i.pricePaise * i.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {/* coupon */}
          <div className="mb-4 border-t border-ink-200 pt-4 dark:border-ink-700">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5 dark:bg-brand-950">
                <span className="flex items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200">
                  <BadgeCheck size={15} /> {appliedCoupon.code} applied
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-800 dark:text-brand-200">
                    −{formatINR(appliedCoupon.discountPaise)}
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="rounded p-0.5 text-brand-700 hover:bg-brand-100 dark:text-brand-300"
                    aria-label="Remove coupon"
                  >
                    <X size={14} />
                  </button>
                </span>
              </div>
            ) : (
              <>
                <label htmlFor="coupon" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                  Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm uppercase outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-ink-600"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponBusy || !couponInput.trim()}
                    className="shrink-0 rounded-lg border border-ink-300 px-3.5 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-800 disabled:opacity-50 dark:border-ink-600 dark:text-ink-200 dark:hover:text-brand-300"
                  >
                    {couponBusy ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
              </>
            )}

            {couponMessage && (
              <p
                className={`mt-2 text-[13px] ${
                  couponMessage.ok ? "text-brand-700 dark:text-brand-300" : "text-red-600"
                }`}
              >
                {couponMessage.text}
              </p>
            )}
          </div>

          <dl className="flex flex-col gap-2.5 border-t border-ink-200 pt-4 text-sm dark:border-ink-700">
            <div className="flex justify-between">
              <dt className="text-ink-600 dark:text-ink-300">Subtotal</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">{formatINR(subtotalPaise)}</dd>
            </div>
            {discountPaise > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-600 dark:text-ink-300">Coupon discount</dt>
                <dd className="font-semibold text-brand-700 dark:text-brand-300">−{formatINR(discountPaise)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-600 dark:text-ink-300">Delivery</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">Instant &amp; free</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between rounded-md bg-brand-50 px-2 py-1.5 dark:bg-brand-950">
                <dt className="text-brand-800 dark:text-brand-200">Total savings</dt>
                <dd className="font-bold text-brand-800 dark:text-brand-200">{formatINR(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-200 pt-2.5 text-base dark:border-ink-700">
              <dt className="font-semibold text-ink-900 dark:text-white">Total</dt>
              <dd className="text-lg font-bold text-ink-900 dark:text-white">{formatINR(totalPaise)}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || totalPaise <= 0}
            className="btn btn-primary btn-lg mt-4 w-full"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Lock size={16} /> Pay {formatINR(totalPaise)}
              </>
            )}
          </button>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <ShieldCheck size={13} className="mt-0.5 shrink-0" />
            Payments are processed securely. Download links are emailed within seconds.
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <Mail size={13} className="mt-0.5 shrink-0" />
            Check your spam folder if the email does not arrive within a few minutes.
          </p>
        </div>
      </div>
    </form>
  );
}