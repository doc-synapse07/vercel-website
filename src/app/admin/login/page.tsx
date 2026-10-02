import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white">
            S7
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Store admin</h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter your password to manage products and orders.
          </p>
        </div>

        <div className="rounded-card border border-ink-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center">
          <a href="/" className="text-sm font-medium text-brand-700 hover:underline">
            ← Back to the store
          </a>
        </p>
      </div>
    </div>
  );
}