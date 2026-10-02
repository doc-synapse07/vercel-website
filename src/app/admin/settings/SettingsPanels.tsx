"use client";

import { useActionState } from "react";
import { Loader2, Save, KeyRound } from "lucide-react";
import {
  saveSettingsAction,
  changePasswordAction,
  type ActionState,
} from "@/app/admin/actions/auth";
import type { Settings } from "@/lib/settings";

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

function SectionCard({
  title,
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
          <Field
            label="Instagram followers"
            name="instagramFollowers"
            defaultValue={settings.instagramFollowers}
            inputMode="numeric"
            placeholder="12500"
            hint="Manual fallback — only used when the API below cannot be reached. Number only."
          />
          <Field
            label="YouTube URL"
            name="youtubeUrl"
            defaultValue={settings.youtubeUrl}
            placeholder="https://youtube.com/@…"
          />
          <Field
            label="YouTube subscribers"
            name="youtubeSubscribers"
            defaultValue={settings.youtubeSubscribers}
            inputMode="numeric"
            placeholder="8400"
            hint="Manual fallback — only used when the API below cannot be reached. Number only."
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

      <SectionCard title="About text" description="Used on the storefront footer.">
        <textarea
          id="aboutText"
          name="aboutText"
          rows={4}
          defaultValue={settings.aboutText}
          maxLength={1000}
          className="w-full resize-y rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
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