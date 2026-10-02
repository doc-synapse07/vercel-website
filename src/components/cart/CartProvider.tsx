"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartProduct } from "@/lib/types";

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  pricePaise: number;
  mrpPaise: number | null;
  coverImage: string | null;
  productType: string;
  isFree: boolean;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  mrpTotalPaise: number;
  ready: boolean;
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  drawerOpen: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sj7_cart_v1";

function readStoredCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate shape — a tampered or stale entry must not crash the storefront.
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).productId === "string" &&
        typeof (l as CartLine).pricePaise === "number" &&
        typeof (l as CartLine).title === "string",
    );
  } catch {
    return [];
  }
}

// Initialize cart state synchronously to avoid hydration flash
function getInitialCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  return readStoredCart();
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage immediately (synchronous) to avoid hydration flash
  const [lines, setLines] = useState<CartLine[]>(getInitialCart);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Mark ready after first render (client-side)
  useEffect(() => {
    setReady(true);
  }, []);

  // Sync to localStorage on changes
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private browsing / quota — cart simply won't persist across reloads.
    }
  }, [lines, ready]);

  const addItem = useCallback((product: CartProduct, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          pricePaise: product.isFree ? 0 : product.pricePaise,
          mrpPaise: product.mrpPaise,
          coverImage: product.coverImage,
          productType: product.productType,
          isFree: Boolean(product.isFree),
          quantity,
        },
      ];
    });
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.productId !== productId) return [l];
        const next = Math.max(1, Math.min(99, Math.floor(quantity || 1)));
        return [{ ...l, quantity: next }];
      }),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const has = useCallback(
    (productId: string) => lines.some((l) => l.productId === productId),
    [lines],
  );

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotalPaise = lines.reduce((sum, l) => sum + l.pricePaise * l.quantity, 0);
    const mrpTotalPaise = lines.reduce(
      (sum, l) => sum + (l.mrpPaise ?? l.pricePaise) * l.quantity,
      0,
    );
    return {
      lines,
      count,
      subtotalPaise,
      mrpTotalPaise,
      ready: true,
      addItem,
      removeItem,
      setQuantity,
      clear,
      has,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      drawerOpen,
    };
  }, [lines, addItem, removeItem, setQuantity, clear, has, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}