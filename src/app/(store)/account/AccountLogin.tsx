"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signInAction, signUpAction, type AccountActionState } from "./actions";

const initialState: AccountActionState = { ok: false };

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const inputClass =
  "mt-2 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-ink-600 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-500";
const labelClass = "block text-[13px] font-semibold text-ink-900 dark:text-white";

export function AccountLogin({
  googleEnabled,
  oauthError,
}: {
  googleEnabled: boolean;
  oauthError?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signingIn] = useActionState<AccountActionState, FormData>(
    signInAction,
    initialState,
  );
  const [signUpState, signUpFormAction, signingUp] = useActionState<AccountActionState, FormData>(
    signUpAction,
    initialState,
  );

  const busy = signingIn || signingUp;
  const formError = mode === "signin" ? signInState.error : signUpState.error;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-sm items-center justify-center px-4 py-16">
      <div className="w-full rounded-card border border-ink-200 bg-white p-8 dark:border-ink-700 dark:bg-ink-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
          Your account
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-ink-900 dark:text-white">
          Sign in or create an account
        </h1>
        <p className="mt-2 text-xs leading-5 text-ink-500 dark:text-ink-400">
          Track orders and check out faster with your Google or email account.
        </p>

        {oauthError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {oauthError}
          </p>
        )}

        {googleEnabled ? (
          <a
            href="/api/auth/google?returnTo=/account"
            className="btn btn-outline btn-md mt-6 w-full !normal-case !tracking-normal"
          >
            <GoogleMark /> Continue with Google
          </a>
        ) : (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Google sign-in is not switched on for this store yet — use your email below.
          </p>
        )}

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-ink-400 dark:text-ink-500">
          <span className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
          or use email
          <span className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Sign in or create account">
          {(
            [
              { key: "signin", label: "Sign in" },
              { key: "signup", label: "Create account" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={mode === t.key}
              onClick={() => setMode(t.key)}
              className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                mode === t.key
                  ? "bg-brand-700 text-white"
                  : "border border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-700 dark:border-ink-600 dark:text-ink-400 dark:hover:border-brand-500 dark:hover:text-brand-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mode === "signin" ? (
          <form key="signin" action={signInFormAction} className="mt-5 space-y-4">
            <div>
              <label htmlFor="al-email" className={labelClass}>
                Email
              </label>
              <input
                id="al-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="al-password" className={labelClass}>
                Password
              </label>
              <input
                id="al-password"
                name="password"
                type="password"
                required
                placeholder="Your password"
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary btn-md w-full">
              {signingIn ? <Loader2 size={16} className="animate-spin" /> : null}
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form key="signup" action={signUpFormAction} className="mt-5 space-y-4">
            <div>
              <label htmlFor="ac-name" className={labelClass}>
                Name
              </label>
              <input
                id="ac-name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Priya Sharma"
                autoComplete="name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ac-email" className={labelClass}>
                Email
              </label>
              <input
                id="ac-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ac-password" className={labelClass}>
                Password
              </label>
              <input
                id="ac-password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary btn-md w-full">
              {signingUp ? <Loader2 size={16} className="animate-spin" /> : null}
              {signingUp ? "Creating…" : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
