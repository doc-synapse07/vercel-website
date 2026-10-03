"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { uniqueSlug } from "./auth";
import { buildStorageKey, deleteFile, putFile } from "@/lib/storage";
import type { StorageDriver } from "@/lib/storage";
import { PRODUCT_TYPES } from "@/lib/constants";
import { CACHE_TAGS } from "@/lib/queries";

export type ProductFormState = {
  ok: boolean;
  error?: string;
  success?: string;
  slug?: string;
};

const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB per PDF
const ALLOWED_PDF_TYPES = ["application/pdf", "application/x-pdf"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ProductSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  shortDescription: z.string().trim().max(400),
  description: z.string().trim().max(20000),
  categoryId: z.string().min(1, "Choose a category"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  mrp: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(),
  productType: z.enum(PRODUCT_TYPES),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isFree: z.boolean(),
  stockQty: z.union([z.coerce.number().int().min(0), z.literal(""), z.null()]).optional(),
  weightGrams: z.union([z.coerce.number().int().min(0), z.literal(""), z.null()]).optional(),
});

function toPaise(rupees: unknown): number | null {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function optionalInt(value: unknown): number | null {
  const s = typeof value === "string" ? value.trim() : value;
  if (s === "" || s === null || s === undefined) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

/**
 * Strips anything executable from admin-entered rich text before it is stored
 * and rendered with dangerouslySetInnerHTML: script-capable tags, event
 * handler attributes and javascript:/data: URLs. Formatting tags, links and
 * pasted Word styling pass through untouched.
 */
function cleanDescription(html: string): string {
  let out = html
    .replace(
      /<(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|video|audio|source|canvas)[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<\/?(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|video|audio|source|canvas)[^>]*\/?>/gi,
      "",
    );
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(
    /\s(href|src)\s*=\s*"((?:javascript|data|vbscript)[^"]*)"/gi,
    ' $1="#"',
  );
  out = out.replace(
    /\s(href|src)\s*=\s*'((?:javascript|data|vbscript)[^']*)'/gi,
    " $1='#'",
  );
  return out.trim();
}

/** Uploads every attached PDF and creates ProductFile rows. */
async function attachFiles(params: {
  productId: string;
  productSlug: string;
  files: File[];
  replaceExisting: boolean;
}): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;

  if (params.replaceExisting) {
    const existing = await prisma.productFile.findMany({ where: { productId: params.productId } });
    for (const file of existing) {
      // Never let a stale DB row break the whole save.
      await deleteFile(file.storageKey, file.storageDriver as StorageDriver).catch(() => {});
    }
    await prisma.productFile.deleteMany({ where: { productId: params.productId } });
  }

  const startOrder = await prisma.productFile.count({ where: { productId: params.productId } });

  for (let i = 0; i < params.files.length; i++) {
    const file = params.files[i];

    if (!file || file.size === 0) continue;

    const isPdf = ALLOWED_PDF_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      errors.push(`"${file.name}" is not a PDF and was skipped.`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`"${file.name}" is larger than 200 MB and was skipped.`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = buildStorageKey({
        productSlug: params.productSlug,
        originalFileName: file.name,
      });
      const driver = await putFile({ key, body: buffer, contentType: "application/pdf" });

      await prisma.productFile.create({
        data: {
          productId: params.productId,
          fileName: file.name,
          storageKey: key,
          storageDriver: driver,
          sizeBytes: buffer.length,
          contentType: "application/pdf",
          sortOrder: startOrder + i,
        },
      });
      added++;
    } catch (error) {
      console.error("[admin:product] file upload failed:", error);
      errors.push(`"${file.name}" could not be uploaded.`);
    }
  }

  return { added, errors };
}

/** Uploads a cover image and returns the public media path to store on the product. */
async function attachCover(file: File, productSlug: string): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Cover image must be smaller than 8 MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const key = `covers/${productSlug}.${ext}`;

  await putFile({ key, body: buffer, contentType: file.type });

  // Route-served so works identically on Vercel where the filesystem is read-only.
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const parsed = ProductSchema.safeParse({
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    mrp: formData.get("mrp"),
    productType: formData.get("productType"),
    isActive: bool(formData, "isActive"),
    isFeatured: bool(formData, "isFeatured"),
    isFree: bool(formData, "isFree"),
    stockQty: formData.get("stockQty"),
    weightGrams: formData.get("weightGrams"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.title);
  const isFree = data.isFree;

  // A free product must not carry a price or it would be bypassable.
  const pricePaise = isFree ? 0 : toPaise(data.price) ?? 0;

  let coverImage: string | null = null;
  const coverFile = formData.get("coverFile");
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      coverImage = await attachCover(coverFile, slug);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Cover image upload failed.",
      };
    }
  }

  const product = await prisma.product.create({
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription || null,
      description: cleanDescription(data.description) || null,
      categoryId: data.categoryId,
      pricePaise,
      mrpPaise: isFree ? null : toPaise(data.mrp),
      productType: data.productType,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      isFree,
      stockQty: data.productType === "PHYSICAL" ? optionalInt(data.stockQty) : null,
      weightGrams: data.productType === "PHYSICAL" ? optionalInt(data.weightGrams) : null,
      coverImage,
    },
  });

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const { added, errors } = await attachFiles({
    productId: product.id,
    productSlug: slug,
    files,
    replaceExisting: false,
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.products);
  revalidateTag(CACHE_TAGS.categories);

  const detail = errors.length
    ? `Saved, but ${errors.length} file(s) were skipped: ${errors[0]}`
    : `Product created${added ? ` with ${added} PDF${added === 1 ? "" : "s"}` : ""}.`;

  redirect(`/admin/products/${product.id}?created=1&detail=${encodeURIComponent(detail)}`);
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing product id." };

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Product not found." };

  const parsed = ProductSchema.safeParse({
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    mrp: formData.get("mrp"),
    productType: formData.get("productType"),
    isActive: bool(formData, "isActive"),
    isFeatured: bool(formData, "isFeatured"),
    isFree: bool(formData, "isFree"),
    stockQty: formData.get("stockQty"),
    weightGrams: formData.get("weightGrams"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.title, id);
  const isFree = data.isFree;
  const pricePaise = isFree ? 0 : toPaise(data.price) ?? 0;

  let coverImage: string | null = existing.coverImage;
  const coverFile = formData.get("coverFile");
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      coverImage = await attachCover(coverFile, slug);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Cover image upload failed.",
      };
    }
  } else if (formData.get("removeCover") === "on") {
    coverImage = null;
  }

  await prisma.product.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription || null,
      description: cleanDescription(data.description) || null,
      categoryId: data.categoryId,
      pricePaise,
      mrpPaise: isFree ? null : toPaise(data.mrp),
      productType: data.productType,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      isFree,
      stockQty: data.productType === "PHYSICAL" ? optionalInt(data.stockQty) : null,
      weightGrams: data.productType === "PHYSICAL" ? optionalInt(data.weightGrams) : null,
      coverImage,
    },
  });

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const replaceExisting = formData.get("replaceFiles") === "on";

  const { added, errors } = await attachFiles({
    productId: id,
    productSlug: slug,
    files,
    replaceExisting,
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/products/${slug}`);
  revalidatePath("/products");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.products);
  revalidateTag(CACHE_TAGS.categories);
  revalidateTag(CACHE_TAGS.product(slug));

  return {
    ok: true,
    slug,
    success: errors.length
      ? `Saved, but ${errors.length} file(s) were skipped: ${errors[0]}`
      : `Saved${added ? ` — ${added} new PDF${added === 1 ? "" : "s"} attached` : ""}.`,
  };
}

export async function deleteProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Remove the files from storage first; the DB rows cascade.
  const files = await prisma.productFile.findMany({ where: { productId: id } });
  for (const file of files) {
    await deleteFile(file.storageKey, file.storageDriver as StorageDriver).catch(() => {});
  }

  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.products);
  revalidateTag(CACHE_TAGS.categories);
}

export async function toggleProductActiveAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true } });
  if (!product) return;

  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidateTag(CACHE_TAGS.products);
  revalidateTag(CACHE_TAGS.categories);
}

export async function deleteProductFileAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const fileId = String(formData.get("fileId") ?? "");
  if (!fileId) return;

  const file = await prisma.productFile.findUnique({ where: { id: fileId } });
  if (!file) return;

  await deleteFile(file.storageKey, file.storageDriver as StorageDriver).catch(() => {});
  await prisma.productFile.delete({ where: { id: fileId } });

  revalidatePath("/admin/products");
  revalidateTag(CACHE_TAGS.products);
}

export async function renameProductFileAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const fileId = String(formData.get("fileId") ?? "");
  const fileName = String(formData.get("fileName") ?? "").trim();
  if (!fileId || !fileName) return;

  await prisma.productFile.update({
    where: { id: fileId },
    data: { fileName: fileName.slice(0, 200) },
  });

  revalidatePath("/admin/products");
  revalidateTag(CACHE_TAGS.products);
}

export async function reorderProductFilesAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const order = String(formData.get("order") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.$transaction(
    order.map((fileId, index) =>
      prisma.productFile.update({ where: { id: fileId }, data: { sortOrder: index } }),
    ),
  );

  revalidatePath(`/admin/products/${productId}`);
  revalidateTag(CACHE_TAGS.products);
}