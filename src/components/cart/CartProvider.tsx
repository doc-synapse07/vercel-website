"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, CartProduct, ProductKind } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const CART_KEY = "sj7-cart-v1";

function cartKey(customerId: string | null) {
  return customerId ? `${CART_KEY}:${customerId}` : CART_KEY;
}

function cartLineKey(id: string, variantId?: string | null, customization?: string | null): string {
  let key = variantId ? `${id}::${variantId}` : id;
  const custom = (customization || "").trim().toLowerCase();
  if (custom) key += `::${custom}`;
  return key;
}

function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of a) map.set(item.key ?? item.id, { ...item, key: item.key ?? item.id });
  for (const item of b) {
    const key = item.key ?? item.id;
    const existing = map.get(key);
    if (existing) {
      const merged = { ...existing, ...item, key, qty: existing.qty + item.qty };
      if (merged.kind === "DIGITAL") merged.qty = 1;
      map.set(key, merged);
    } else {
      map.set(key, { ...item, key });
    }
  }
  return [...map.values()];
}

type CartContextValue = {
  items: CartItem[];
  // Backward compatibility
  lines: CartItem[];
  count: number;
  subtotal: number;
  subtotalPaise: number;
  mrpTotalPaise: number;
  ready: boolean;
  add: (product: CartProduct, qty?: number, variantId?: string, customization?: string) => void;
  addItem: (product: CartProduct, qty?: number, variantId?: string, customization?: string) => void;
  setQty: (key: string, qty: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  remove: (key: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  has: (productId: string, variantId?: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  customerId = null,
  children,
}: {
  customerId?: string | null;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(customerId);

  // Handle customerId changes (login/logout/switch)
  if (prevId !== customerId && typeof window !== "undefined") {
    let next: CartItem[] = [];
    try {
      if (prevId === null && customerId) {
        // Guest -> Account: merge guest cart into account cart
        const guestRaw = localStorage.getItem(CART_KEY);
        const accountRaw = localStorage.getItem(cartKey(customerId));
        next = mergeCarts(
          guestRaw ? JSON.parse(guestRaw) : [],
          accountRaw ? JSON.parse(accountRaw) : []
        );
        localStorage.removeItem(CART_KEY);
      } else if (prevId && customerId === null) {
        // Account -> Guest: clear cart
        next = [];
      } else if (prevId && customerId && prevId !== customerId) {
        // Account switch: load new account cart
        const accountRaw = localStorage.getItem(cartKey(customerId));
        next = accountRaw ? JSON.parse(accountRaw) : [];
      }
    } catch {}
    setPrevId(customerId);
    setItems(next);
  }

  // Initial load (deferred to avoid hydration mismatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(cartKey(customerId));
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on changes
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(cartKey(customerId), JSON.stringify(items));
    } catch {}
  }, [items, ready, customerId]);

  const value = useMemo<CartContextValue>(() => {
    const add = (product: CartProduct, qty = 1, variantId?: string, customization?: string) => {
      const isDigital = product.kind === "DIGITAL";
      if (isDigital && !product.isFree) return; // Free digital handled separately
      const variant = variantId
        ? (product.variants || []).find((v) => v.id === variantId)
        : undefined;
      const cleanCustomization = customization?.trim().slice(0, 500) || undefined;
      const key = cartLineKey(product.id, variant?.id, cleanCustomization);
      const variantPrice = variant ? variant.pricePaise : product.pricePaise;
      const productPrice = product.pricePaise;
      setItems((prev) => {
        const found = prev.find((i) => (i.key ?? i.id) === key);
        if (found) {
          if (isDigital) return prev; // Digital: qty stays 1
          return prev.map((i) =>
            (i.key ?? i.id) === key
              ? { ...i, qty: i.qty + qty, pricePaise: variant ? variant.pricePaise : i.pricePaise }
              : i
          );
        }
        return [
          ...prev,
          {
            key,
            id: product.id,
            productId: product.id,
            name: product.title,
            title: product.title,
            pricePaise: variant ? variant.pricePaise : productPrice,
            mrpPaise: variant ? variant.pricePaise : product.mrpPaise,
            price: variant ? variant.pricePaise : productPrice,
            image: product.coverImage,
            coverImage: product.coverImage,
            slug: product.slug,
            kind: product.kind,
            productType: product.productType,
            variantId: variant?.id,
            variantLabel: variant?.label,
            customization: cleanCustomization,
            qty: isDigital ? 1 : qty,
            quantity: isDigital ? 1 : qty,
            isFree: product.isFree,
            originalPrice: product.originalPrice,
          },
        ];
      });
    };

    const setQty = (key: string, qty: number) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if ((i.key ?? i.id) !== key) return i;
            const capped = i.kind === "DIGITAL" ? 1 : qty;
            return { ...i, qty: capped };
          })
          .filter((i) => i.qty > 0)
      );
    };

    const remove = (key: string) => setItems((prev) => prev.filter((i) => (i.key ?? i.id) !== key));
    const clear = () => setItems([]);
    const has = (productId: string, variantId?: string) =>
      items.some((i) => i.id === productId && (variantId ? i.variantId === variantId : !i.variantId));
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.pricePaise * i.qty, 0);
    const mrpTotal = items.reduce((n, i) => n + (i.mrpPaise ?? i.pricePaise) * i.qty, 0);

    return {
      items,
      lines: items,
      count,
      subtotal,
      subtotalPaise: subtotal,
      mrpTotalPaise: mrpTotal,
      ready: true,
      add,
      addItem: add,
      setQty,
      setQuantity: (productId: string, qty: number) => {
        const item = items.find((i) => i.id === productId);
        if (item) setQty(item.key ?? item.id, qty);
      },
      remove,
      removeItem: (productId: string) => {
        const item = items.find((i) => i.id === productId);
        if (item) remove(item.key ?? item.id);
      },
      clear,
      has,
    };
  }, [items, ready, customerId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}