"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { bcrypt } from "@/lib/auth-password";
import { createAdminSession, destroyAdminSession, getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type ActionState = {
  ok: boolean;
  error?: string;
  success?: string;
};

const LoginSchema = z.object({
  password: z.string().min(1),
});

/**
 * There is a single store owner, so the login form asks for a password only and the
 * account is resolved here. ADMIN_EMAIL pins the account when several exist (for
 * example after a staff member was invited); otherwise the oldest active admin wins.
 */
async function resolveLoginAdmin() {
  const configured = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (configured) {
    const byEmail = await prisma.adminUser.findUnique({ where: { email: configured } });
    if (byEmail) return byEmail;
  }

  return prisma.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter your password." };
  }

  const admin = await resolveLoginAdmin();

  // Compare against a dummy hash when there is no account so that response
  // timing does not reveal whether one exists.
  const hash = admin?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(parsed.data.password, hash);

  if (!admin || !ok || !admin.isActive) {
    return { ok: false, error: "Incorrect password." };
  }

  await createAdminSession({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as "ADMIN" | "STAFF",
  });

  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "The two passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const record = await prisma.adminUser.findUnique({ where: { id: admin.sub } });
  if (!record) return { ok: false, error: "Account not found." };

  const ok = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!ok) return { ok: false, error: "Your current password is incorrect." };

  await prisma.adminUser.update({
    where: { id: admin.sub },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  return { ok: true, success: "Password updated successfully." };
}

const SettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(200),
  supportEmail: z.string().trim().email().or(z.literal("")),
  supportPhone: z.string().trim().max(40),
  aboutText: z.string().trim().max(1000),
  upiId: z.string().trim().max(100),
  instagramUrl: z.string().trim().max(300),
  instagramFollowers: z.string().trim().regex(/^\d{0,9}$/, "Enter a number, e.g. 12500"),
  youtubeUrl: z.string().trim().max(300),
  youtubeSubscribers: z.string().trim().regex(/^\d{0,9}$/, "Enter a number, e.g. 8400"),
  telegramUrl: z.string().trim().max(300),
  whatsappUrl: z.string().trim().max(300),
});

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const parsed = SettingsSchema.safeParse({
    siteName: formData.get("siteName"),
    tagline: formData.get("tagline"),
    supportEmail: formData.get("supportEmail"),
    supportPhone: formData.get("supportPhone"),
    aboutText: formData.get("aboutText"),
    upiId: formData.get("upiId"),
    instagramUrl: formData.get("instagramUrl"),
    instagramFollowers: formData.get("instagramFollowers"),
    youtubeUrl: formData.get("youtubeUrl"),
    youtubeSubscribers: formData.get("youtubeSubscribers"),
    telegramUrl: formData.get("telegramUrl"),
    whatsappUrl: formData.get("whatsappUrl"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { saveSettings } = await import("@/lib/settings");
  await saveSettings(parsed.data);

  revalidatePath("/", "layout");
  return { ok: true, success: "Settings saved." };
}

/** Ensures a slug is unique by appending -2, -3, … when needed. */
export async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "product";
  let candidate = base;
  let n = 2;

  // Bounded loop — a collision on every suffix is not realistic, but we must not spin forever.
  for (let i = 0; i < 100; i++) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n}`;
    n++;
  }
  return `${base}-${Date.now()}`;
}