"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { bcrypt } from "@/lib/auth-password";
import { SignInSchema, SignUpSchema } from "@/lib/account-validation";
import { createCustomerSession, destroyCustomerSession } from "@/lib/customer-auth";

export type AccountActionState = {
  ok: boolean;
  error?: string;
};

/**
 * Email signup. No email-verification gate: download links are delivered to
 * whatever address the customer types at checkout anyway, so holding the
 * account hostage behind a verification email would add friction without
 * adding security. Rate limiting lives at the hosting layer.
 */
export async function signUpAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    // A Google-created account has no password yet — same email, so attach the
    // password to it instead of erroring out.
    if (!existing.passwordHash) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: { passwordHash: await bcrypt.hash(password, 12), name },
      });
      await createCustomerSession({ sub: existing.id, email, name });
      revalidatePath("/account");
      redirect("/account");
    }
    return {
      ok: false,
      error: "An account with this email already exists. Sign in instead.",
    };
  }

  const customer = await prisma.customer.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });

  await createCustomerSession({ sub: customer.id, email, name });
  revalidatePath("/account");
  redirect("/account");
}

export async function signInAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { email } });

  // Same message either way so the form cannot be used to enumerate accounts.
  if (!customer || !customer.passwordHash) {
    return { ok: false, error: "No account matches that email and password." };
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) {
    return { ok: false, error: "No account matches that email and password." };
  }

  await createCustomerSession({ sub: customer.id, email: customer.email, name: customer.name });
  revalidatePath("/account");
  redirect("/account");
}

export async function signOutAction(): Promise<void> {
  await destroyCustomerSession();
  revalidatePath("/account");
  redirect("/account");
}
