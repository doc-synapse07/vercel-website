"use client";

import { useState } from "react";

type Variant = { id: string; label: string; pricePaise: number; inStock: boolean };

export function VariantManager({
  initialVariants,
  productType,
}: {
  initialVariants: { id: string; label: string; pricePaise: number; inStock: boolean }[];
  productType: string;
}) {
  const [variants, setVariants] = useState<
    { id: string; label: string; pricePaise: number; inStock: boolean }[]
  >(initialVariants);

  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newInStock, setNewInStock] = useState(true);

  const handleAdd = () => {
    if (!newLabel.trim() || !newPrice) return alert("Label and price required");
    setVariants((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newLabel.trim(), pricePaise: Math.round(parseFloat(newPrice) * 100), inStock: newInStock },
    ]);
    setNewLabel("");
    setNewPrice("");
    setNewInStock(true);
  };

  if (productType !== "PHYSICAL") return null;

  return (
    <section className="rounded-card border border-ink-200 bg-white p-5">
      <h2 className="mb-1 text-base font-semibold text-ink-900">Variants (materials, qualities)</h2>
      <p className="mb-4 text-xs text-ink-500">
        Add material/quality options with individual pricing. Each variant becomes a selectable option.
      </p>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-ink-700">Add variant</label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g., PLA, PETG, Premium)"
            className="flex-1 min-w-[180px] rounded-lg border border-ink-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Price (₹)"
            min="0"
            step="0.01"
            className="w-32 rounded-lg border border-ink-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={newInStock}
              onChange={(e) => setNewInStock(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-700"
            />
            In stock
          </label>
          <button type="button" onClick={() => {
            if (!newLabel.trim() || !newPrice) return alert("Label and price required");
            setVariants((prev) => [
              ...prev,
              { id: crypto.randomUUID(), label: newLabel.trim(), pricePaise: Math.round(parseFloat(newPrice) * 100), inStock: newInStock },
            ]);
            setNewLabel("");
            setNewPrice("");
            setNewInStock(true);
          }} className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {variants.map((v) => (
          <div key={v.id} className="flex items-center gap-2 rounded-lg border border-ink-200 p-3">
            <input type="hidden" name="variants" value={JSON.stringify(v)} />
            <input
              type="text"
              value={v.label}
              onChange={(e) => setVariants(variants.map((item) => (item.id === v.id ? { ...item, label: e.target.value } : item)))}
              className="flex-1 min-w-[160px] rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <input
              type="number"
              value={(v.pricePaise / 100).toFixed(2)}
              onChange={(e) => setVariants(variants.map((item) => (item.id === v.id ? { ...item, pricePaise: Math.round(parseFloat(e.target.value) * 100) } : item)))}
              step="0.01"
              min="0"
              className="w-28 rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={v.inStock}
                onChange={(e) => setVariants(variants.map((item) => (item.id === v.id ? { ...item, inStock: e.target.checked } : item)))}
                className="h-4 w-4 rounded accent-brand-700"
              />
              In stock
            </label>
            <button
              type="button"
              onClick={() => setVariants(variants.filter((item) => item.id !== v.id))}
              className="text-ink-500 hover:text-red-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}