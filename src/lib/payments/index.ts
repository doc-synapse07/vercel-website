import Razorpay from "razorpay";
import Stripe from "stripe";
import { paiseToRupees } from "../utils";
import type { PaymentProvider } from "../constants";

/**
 * Unified payment layer.
 *
 * The storefront detects which gateways are configured and shows only those.
 * If none are configured it falls back to the "mock" gateway, which simulates a
 * successful payment locally so the whole order -> email -> download flow can be
 * exercised without any real gateway account.
 */

export type CreatePaymentInput = {
  provider: PaymentProvider;
  orderNumber: string;
  orderId: string;
  amountPaise: number;
  customerName: string;
  email: string;
  phone: string;
};

export type CreatePaymentResult = {
  provider: PaymentProvider;
  gatewayOrderId: string;
  amountPaise: number;

  // Razorpay: key + order id are handed to the browser checkout
  keyId?: string;

  // Stripe: browser confirms with the publishable key + client secret
  clientSecret?: string;
  publishableKey?: string;

  // Cashfree: browser opens the SDK with this session id
  paymentSessionId?: string;
  appId?: string;

  // Mock: internal redirect target
  mockUrl?: string;
};

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
export function cashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

/** Providers the customer may choose on the checkout page. */
export function getAvailableProviders(): PaymentProvider[] {
  const list: PaymentProvider[] = [];
  if (razorpayConfigured()) list.push("razorpay");
  if (stripeConfigured()) list.push("stripe");
  if (cashfreeConfigured()) list.push("cashfree");
  if (list.length === 0) list.push("mock");
  return list;
}

export function isLiveMode(): boolean {
  // Razorpay/Stripe live keys have recognisable prefixes.
  if ((process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_live_")) return true;
  if ((process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_")) return true;
  if ((process.env.CASHFREE_APP_ID || "").startsWith("PRODUCTION")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Gateway clients (lazily constructed)
// ---------------------------------------------------------------------------

let razorpayClient: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayClient;
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });
  }
  return stripeClient;
}

export function cashfreeBaseUrl(): string {
  return isLiveMode() ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createPayment(
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  switch (input.provider) {
    case "razorpay":
      return createRazorpayPayment(input);
    case "stripe":
      return createStripePayment(input);
    case "cashfree":
      return createCashfreePayment(input);
    case "mock":
      return createMockPayment(input);
    default: {
      const exhaustive: never = input.provider;
      throw new Error(`Unsupported payment provider: ${String(exhaustive)}`);
    }
  }
}

async function createRazorpayPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const order = await getRazorpay().orders.create({
    amount: input.amountPaise, // Razorpay expects paise for INR
    currency: "INR",
    receipt: input.orderNumber,
    notes: { internalOrderId: input.orderId, email: input.email, phone: input.phone },
  });

  return {
    provider: "razorpay",
    gatewayOrderId: order.id,
    amountPaise: input.amountPaise,
    keyId: process.env.RAZORPAY_KEY_ID!,
  };
}

async function createStripePayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  // Stripe expects the smallest currency unit; INR uses paise.
  const intent = await getStripe().paymentIntents.create({
    amount: input.amountPaise,
    currency: "inr",
    // `receipt` was replaced by receipt_email on modern Stripe API versions.
    receipt_email: input.email,
    metadata: { internalOrderId: input.orderId, orderNumber: input.orderNumber },
    automatic_payment_methods: { enabled: true },
    description: `Order ${input.orderNumber}`,
  });

  return {
    provider: "stripe",
    gatewayOrderId: intent.id,
    amountPaise: input.amountPaise,
    clientSecret: intent.client_secret ?? undefined,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  };
}

async function createCashfreePayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const res = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.CASHFREE_APP_ID!,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      "x-api-version": process.env.CASHFREE_API_VERSION || "2023-08-01",
    },
    body: JSON.stringify({
      order_id: input.orderNumber,
      order_amount: paiseToRupees(input.amountPaise),
      order_currency: "INR",
      customer_details: {
        customer_id: input.email,
        customer_name: input.customerName,
        customer_email: input.email,
        customer_phone: input.phone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/success?cf_order_id={order_id}`,
        payment_methods: "upi,cc,nb,emi,wallet",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cashfree order creation failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { order_id: string; payment_session_id: string };

  return {
    provider: "cashfree",
    gatewayOrderId: data.order_id,
    amountPaise: input.amountPaise,
    paymentSessionId: data.payment_session_id,
    appId: process.env.CASHFREE_APP_ID!,
  };
}

async function createMockPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  return {
    provider: "mock",
    gatewayOrderId: `mock_${input.orderNumber}`,
    amountPaise: input.amountPaise,
    mockUrl: `/checkout/mock?orderId=${input.orderId}`,
  };
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(params.razorpaySignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getStripeClient(): Stripe {
  return getStripe();
}