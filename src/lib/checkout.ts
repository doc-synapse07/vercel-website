import { getProducts } from "./store";

export type CheckoutItem = {
  id: string;
  qty: number;
  variantId?: string;
};

export type AmountResult = { amount: number; shipping: number } | { error: string; status: number };

const FLAT_SHIPPING_PAISES = 7900; // ₹79
const FREE_SHIPPING_THRESHOLD_PAISES = 99900; // ₹999

export async function computeCartAmount(
  items: CheckoutItem[],
  opts?: { country?: string; courier?: unknown }
): Promise<AmountResult> {
  const products = await getProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  let amount = 0;
  let shipping = 0;
  let hasPhysical = false;

  for (const item of items) {
    const quantity = Math.floor(Number(item.qty));
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: "Invalid cart", status: 400 };
    }
    const product = productMap.get(String(item.id));
    if (!product) {
      return { error: "Invalid cart", status: 400 };
    }
    if (product.kind === "DIGITAL" && !product.isFree) {
      // Digital products - no stock check needed
    }
    const variantId = typeof item.variantId === "string" ? item.variantId : undefined;
    if (variantId && !(product.variants || []).some((v) => v.id === variantId)) {
      return { error: "Invalid cart", status: 400 };
    }
    if (product.kind !== "DIGITAL") {
      hasPhysical = true;
    }
    const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined;
    const pricePaise = variant ? variant.pricePaise : product.pricePaise;
    amount += pricePaise * quantity;
  }

  if (hasPhysical && amount > 0 && amount < FREE_SHIPPING_THRESHOLD_PAISES) {
    shipping = FLAT_SHIPPING_PAISES;
  }

  return { amount: amount + shipping, shipping };
}