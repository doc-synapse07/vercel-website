"use client";

import Image from "next/image";
import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  Save,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  X,
} from "lucide-react";
import {
  createProductAction,
  updateProductAction,
  deleteProductFileAction,
  type ProductFormState,
} from "@/app/admin/actions/products";
import { formatBytes } from "@/lib/utils";
import { VariantManager } from "@/components/VariantManager";
import { DescriptionEditor } from "./DescriptionEditor";

export type CategoryOption = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  pricePaise: number;
  mrpPaise: number | null;
  productType: string;
  isActive: boolean;
  isFeatured: boolean;
  isFree: boolean;
  stockQty: number | null;
  weightGrams: number | null;
  coverImage: string | null;
  files: { id: string; fileName: string; sizeBytes: number }[];
  variants?: { id: string; label: string; pricePaise: number; inStock: boolean }[];
};

const initialState: ProductFormState = { ok: false };

export function ProductForm({
  categories,
  product,
  storageDriver,
}: {
  categories: CategoryOption[];
  product?: ProductFormValues | null;
  storageDriver: string;
}) {
  const isEdit = Boolean(product?.id);

  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    initialState,
  );

  const [productType, setProductType] = useState(product?.productType ?? "DIGITAL");
  const [isFree, setIsFree] = useState(product?.isFree ?? false);
  const [replaceFiles, setReplaceFiles] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  // New-upload staging: drag-and-drop + per-file remove, backed by the real
  // <input type="file"> so the server action flow is unchanged.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<{ name: string; size: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);

  function syncPending(input: HTMLInputElement | null) {
    if (!input?.files) {
      setPendingFiles([]);
      return;
    }
    setPendingFiles(Array.from(input.files).map((f) => ({ name: f.name, size: f.size })));
  }

  function removePending(index: number) {
    const input = fileInputRef.current;
    if (!input?.files) return;
    const dt = new DataTransfer();
    Array.from(input.files).forEach((f, i) => {
      if (i !== index) dt.items.add(f);
    });
    input.files = dt.files;
    syncPending(input);
  }

  function isPdf(f: File) {
    return f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
  }

  function onDropFiles(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const input = fileInputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    if (input.files) Array.from(input.files).forEach((f) => dt.items.add(f));
    Array.from(e.dataTransfer.files)
      .filter(isPdf)
      .forEach((f) => dt.items.add(f));
    input.files = dt.files;
    syncPending(input);
  }

  const pendingBytes = pendingFiles.reduce((sum, f) => sum + f.size, 0);

  const inputCls =
    "w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-100";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-700";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {state.success}
        </p>
      )}

      {/* ------------------------------------------------------------ basics */}
      <section className="rounded-card border border-ink-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-ink-900">Product details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={labelCls}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              minLength={3}
              defaultValue={product?.title ?? ""}
              placeholder="e.g. INI-CET Most Repeated PYQs"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="shortDescription" className={labelCls}>
              Short description
            </label>
            <input
              id="shortDescription"
              name="shortDescription"
              maxLength={400}
              defaultValue={product?.shortDescription ?? ""}
              placeholder="One line shown on the product card"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <span id="description-label" className={labelCls}>
              Full description
            </span>
            <DescriptionEditor defaultValue={product?.description ?? ""} />
            <p className="mt-1.5 text-xs text-ink-500">
              Shown on the product page. Select any text and use the toolbar above for
              bold, italic, headings, bullet points and links — no HTML needed.
            </p>
          </div>

          <div>
            <label htmlFor="categoryId" className={labelCls}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              className={inputCls}
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="productType" className={labelCls}>
              Product type
            </label>
            <select
              id="productType"
              name="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className={inputCls}
            >
              <option value="DIGITAL">Digital (PDF download)</option>
              <option value="PHYSICAL">Physical (needs shipping)</option>
            </select>
            <p className="mt-1.5 text-xs text-ink-500">
              {productType === "DIGITAL"
                ? "Download links are emailed after payment."
                : "A shipping address will be collected at checkout."}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ pricing */}
      <section className="rounded-card border border-ink-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-ink-900">Pricing</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className={labelCls}>
              Selling price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              disabled={isFree}
              defaultValue={product ? (product.pricePaise / 100).toString() : ""}
              placeholder="499"
              className={`${inputCls} disabled:bg-ink-100 disabled:text-ink-400`}
            />
          </div>

          <div>
            <label htmlFor="mrp" className={labelCls}>
              MRP (₹)
            </label>
            <input
              id="mrp"
              name="mrp"
              type="number"
              min={0}
              step="0.01"
              disabled={isFree}
              defaultValue={product?.mrpPaise ? (product.mrpPaise / 100).toString() : ""}
              placeholder="999"
              className={`${inputCls} disabled:bg-ink-100 disabled:text-ink-400`}
            />
            <p className="mt-1.5 text-xs text-ink-500">Shown struck through to display a discount.</p>
          </div>

          <div>
            <label htmlFor="stockQty" className={labelCls}>
              Stock quantity
            </label>
            <input
              id="stockQty"
              name="stockQty"
              type="number"
              min={0}
              disabled={productType !== "PHYSICAL"}
              defaultValue={product?.stockQty?.toString() ?? ""}
              placeholder="Unlimited"
              className={`${inputCls} disabled:bg-ink-100 disabled:text-ink-400`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="h-4 w-4 rounded accent-brand-700"
            />
            Visible in store
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              className="h-4 w-4 rounded accent-brand-700"
            />
            Feature on home page
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              name="isFree"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-700"
            />
            Free product (no payment)
          </label>
        </div>
      </section>

      {/* ------------------------------------------------------------ variants */}
      {productType === "PHYSICAL" && (
        <VariantManager
          initialVariants={product?.variants ?? []}
          productType={productType}
        />
      )}

      {/* -------------------------------------------------------------- cover */}
      <section className="rounded-card border border-ink-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-ink-900">Cover image</h2>
        <p className="mb-4 text-xs text-ink-500">
          Stored in {storageDriver === "r2" ? "Cloudflare R2" : "./storage (local)"}. PNG or JPG
          up to 8 MB.
        </p>

        {product?.coverImage && (
          <div className="mb-4">
            <input type="hidden" name="removeCover" value={removeCover ? "on" : ""} />
            <div
              className={`relative h-28 w-[84px] overflow-hidden rounded-lg border bg-white transition-opacity ${
                removeCover ? "border-red-300 opacity-40 grayscale" : "border-ink-200"
              }`}
            >
              <Image
                src={product.coverImage}
                alt="Current cover"
                fill
                sizes="84px"
                className="object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setRemoveCover((v) => !v)}
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                removeCover
                  ? "text-ink-500 hover:text-ink-800"
                  : "text-red-600 hover:text-red-700"
              }`}
            >
              <Trash2 size={13} />
              {removeCover ? "Keep cover (undo)" : "Delete cover"}
            </button>
            {removeCover && (
              <p className="mt-1 text-xs text-red-600">Will be removed when you save.</p>
            )}
          </div>
        )}

        <label
          htmlFor="coverFile"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink-300 p-4 text-sm text-ink-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        >
          <span className="btn btn-primary btn-sm pointer-events-none">Choose file</span>
          <span id="coverFileName" className="truncate">No cover chosen</span>
        </label>
        <input
          id="coverFile"
          type="file"
          name="coverFile"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const el = document.getElementById("coverFileName");
            if (el) el.textContent = e.target.files?.[0]?.name ?? "No cover chosen";
          }}
          className="sr-only"
        />
      </section>

      {/* -------------------------------------------------------------- files */}
      {productType === "DIGITAL" && (
        <section className="rounded-card border border-ink-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-ink-900">PDF files</h2>
            {product && product.files.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-800">
                {product.files.length} attached
              </span>
            )}
            {pendingFiles.length > 0 && (
              <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-bold text-white">
                +{pendingFiles.length} new
              </span>
            )}
          </div>
          <p className="mb-4 text-xs text-ink-500">
            Select one PDF for a single product, or several for a bundle. Every file is emailed
            as its own download link. Stored in{" "}
            {storageDriver === "r2" ? "Cloudflare R2" : "./storage (local)"}.
          </p>

          {product && product.files.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-700">
                  {product.files.length} file{product.files.length === 1 ? "" : "s"} attached
                </p>
                {isEdit && (
                  <label className="flex items-center gap-2 text-sm text-ink-600">
                    <input
                      type="checkbox"
                      name="replaceFiles"
                      checked={replaceFiles}
                      onChange={(e) => setReplaceFiles(e.target.checked)}
                      className="h-4 w-4 rounded accent-red-600"
                    />
                    Delete existing and replace
                  </label>
                )}
              </div>

              <ul className="flex flex-col gap-2">
                {product.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                      <FileText size={15} />
                    </span>

                    <form action={deleteProductFileAction} className="flex min-w-0 flex-1 items-center gap-2">
                      <input type="hidden" name="fileId" value={f.id} />
                      <input
                        name="fileName"
                        defaultValue={f.fileName}
                        key={f.id}
                        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink-900 hover:border-ink-200 focus:border-brand-400 focus:outline-none"
                        aria-label="File name"
                      />
                      <span className="shrink-0 text-xs text-ink-400">{formatBytes(f.sizeBytes)}</span>
                      <button type="submit" title="Delete this file" className="shrink-0 rounded-md p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isEdit && product && product.files.length > 0 && !replaceFiles && (
            <p className="mb-3 flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2.5 text-xs text-ink-600">
              <Info size={14} className="mt-0.5 shrink-0" />
              New files will be added to the existing bundle. Tick &ldquo;delete existing and replace&rdquo; to start over.
            </p>
          )}

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDropFiles}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? "border-brand-500 bg-brand-50"
                : "border-ink-300 hover:border-brand-400 hover:bg-brand-50/40"
            }`}
          >
            <Upload
              size={22}
              className={`mx-auto mb-2 ${dragOver ? "text-brand-600" : "text-ink-400"}`}
            />
            <p className="mb-1 text-sm font-medium text-ink-700">
              {dragOver
                ? "Drop PDFs here"
                : "Drag PDFs here or click to browse"}
            </p>
            <p className="text-xs text-ink-500">
              {isEdit && product && product.files.length > 0 && !replaceFiles
                ? "New files will be added to the existing bundle"
                : "One PDF for a single product, several for a bundle"}{" "}
              · PDF only · up to 200 MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              name="files"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => syncPending(e.target)}
              className="sr-only"
            />
          </div>

          {pendingFiles.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-700">
                  {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} ready to
                  upload · {formatBytes(pendingBytes)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setPendingFiles([]);
                  }}
                  className="text-xs font-medium text-ink-500 hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
              <ul className="flex flex-col gap-2">
                {pendingFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-700 text-white">
                      <FileText size={15} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">
                      {f.name}
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      title={`Remove ${f.name}`}
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removePending(i)}
                      className="shrink-0 rounded-md p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------ actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-md">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>

        <Link href="/admin/products" className="btn btn-outline btn-md">
          Cancel
        </Link>

        {isEdit && product?.slug && (
          <Link href={`/products/${product.slug}`} className="ml-auto text-sm font-medium text-brand-700 hover:underline">
            View on store →
          </Link>
        )}
      </div>
    </form>
  );
}