"use client";

import { useActionState } from "react";
import { Loader2, Lock, LogIn } from "lucide-react";
import { loginAction, type ActionState } from "@/app/admin/actions/auth";

const initialState: ActionState = { ok: false };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const inputCls =
    "w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* The account is resolved server-side — this store has a single owner, so
          there is nothing useful to ask for and one less thing to get wrong. */}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">
          Password
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-md w-full"
      >
        {pending ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}