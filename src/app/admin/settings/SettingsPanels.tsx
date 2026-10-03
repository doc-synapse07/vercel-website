"use client";

import { useActionState, useState } from "react";
import { Loader2, Save, KeyRound } from "lucide-react";
import {
  saveSettingsAction,
  changePasswordAction,
  type ActionState,
} from "@/app/admin/actions/auth";
import type { Settings } from "@/lib/settings";
import { formatCompact } from "@/components/StatsMatrix";

const initialState: ActionState = { ok: false };

function Field({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
  required,
  placeholder,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/**
 * Manual follower/subscriber count with a live storefront preview:
 * type 57800 and it shows "→ 57.8K" — exactly what the homepage will render.
 */
function CompactCountField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [preview, setPreview] = useState(() => formatCompact(defaultValue));
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          inputMode="numeric"
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={(e) => setPreview(formatCompact(e.target.value))}
          className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 pr-24 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {preview && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-800">
            → {preview}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-500">
        Manual fallback — only used when the API below cannot be reached. Number only.
      </p>
    </div>
  );
}

function SectionCard({  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-ink-200 bg-white p-5">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      {description && <p className="mt-0.5 mb-4 text-sm text-ink-500">{description}</p>}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------- store info */

function StoreSettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveSettingsAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SectionCard
        title="Store details"
        description="Shown in the header, footer and browser tab title."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Store name"
            name="siteName"
            defaultValue={settings.siteName}
            required
          />
          <Field
            label="Tagline"
            name="tagline"
            defaultValue={settings.tagline}
            hint="One line, appears under the logo."
          />
          <Field
            label="Support email"
            name="supportEmail"
            type="email"
            defaultValue={settings.supportEmail}
          />
          <Field
            label="Support phone"
            name="supportPhone"
            defaultValue={settings.supportPhone}
          />
          <Field
            label="UPI ID"
            name="upiId"
            defaultValue={settings.upiId}
            placeholder="store@upi"
            hint="Optional — shown if you enable manual UPI payments later."
          />
        </div>
      </SectionCard>

      <SectionCard title="Social links" description="Leave blank to hide an icon.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Instagram URL"
            name="instagramUrl"
            defaultValue={settings.instagramUrl}
            placeholder="https://instagram.com/…"
          />
          <CompactCountField
            label="Instagram followers"
            name="instagramFollowers"
            defaultValue={settings.instagramFollowers}
            placeholder="12500"
          />
          <Field
            label="YouTube URL"
            name="youtubeUrl"
            defaultValue={settings.youtubeUrl}
            placeholder="https://youtube.com/@…"
          />
          <CompactCountField
            label="YouTube subscribers"
            name="youtubeSubscribers"
            defaultValue={settings.youtubeSubscribers}
            placeholder="8400"
          />
          <Field
            label="Telegram group URL"
            name="telegramUrl"
            defaultValue={settings.telegramUrl}
            placeholder="https://t.me/…"
          />
          <Field
            label="WhatsApp URL"
            name="whatsappUrl"
            defaultValue={settings.whatsappUrl}
            placeholder="https://wa.me/…"
          />
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-md"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state.success && (
          <span className="text-sm font-medium text-brand-700">{state.success}</span>
        )}
        {state.error && <span className="text-sm font-medium text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

/* ----------------------------------------------------------- change password */

function PasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password" name="currentPassword" type="password" required />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          required
          hint="At least 8 characters."
        />
        <Field label="Confirm new password" name="confirmPassword" type="password" required />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-outline btn-md"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          {pending ? "Updating…" : "Change password"}
        </button>
        {state.success && (
          <span className="text-sm font-medium text-brand-700">{state.success}</span>
        )}
        {state.error && <span className="text-sm font-medium text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

export function SettingsPanels({ settings }: { settings: Settings }) {
  return (
    <div className="flex flex-col gap-6">
      <StoreSettingsForm settings={settings} />

      <SectionCard
        title="Your admin password"
        description="Used to sign in to this panel."
      >
        <PasswordForm />
      </SectionCard>
    </div>
  );
}