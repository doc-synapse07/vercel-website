"use client";

import { useActionState } from "react";
import { Loader2, Save, Send, Trash2, Mail } from "lucide-react";
import {
  saveSmtpAction,
  disconnectSmtpAction,
  sendTestEmailAction,
} from "@/app/admin/actions/mail";
import type { ActionState } from "@/app/admin/actions/auth";

const initialState: ActionState = { ok: false };

export type SmtpFormState = {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  hasPassword: boolean;
  storedInAdmin: boolean;
  activeSource: "admin" | "env" | "none";
};

const PRESETS: { label: string; host: string; port: string; secure: boolean; hint: string }[] = [
  { label: "Gmail", host: "smtp.gmail.com", port: "587", secure: false, hint: "Needs a Google App Password, not your account password." },
  { label: "Outlook / Hotmail", host: "smtp.office365.com", port: "587", secure: false, hint: "May require an app password if 2FA is on." },
  { label: "Brevo (Sendinblue)", host: "smtp-relay.brevo.com", port: "587", secure: false, hint: "Free tier available." },
  { label: "Mailgun", host: "smtp.mailgun.org", port: "587", secure: false, hint: "" },
  { label: "Amazon SES", host: "email-smtp.ap-south-1.amazonaws.com", port: "587", secure: false, hint: "Host varies by region." },
];

function StatusPill({ state }: { state: SmtpFormState }) {
  const map = {
    admin: { text: "Configured here", cls: "bg-brand-100 text-brand-800" },
    env: { text: "Using .env", cls: "bg-amber-100 text-amber-800" },
    none: { text: "Not configured", cls: "bg-red-100 text-red-700" },
  } as const;

  const s = map[state.activeSource];

  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${s.cls}`}>
      {s.text}
    </span>
  );
}

function Result({ state }: { state: ActionState }) {
  if (state.success) {
    return <span className="text-sm font-medium text-brand-700">{state.success}</span>;
  }
  if (state.error) {
    return <span className="text-sm font-medium text-red-600">{state.error}</span>;
  }
  return null;
}

function inputClass() {
  return "w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
}

function labelClass() {
  return "mb-1.5 block text-sm font-medium text-ink-800";
}

function hintClass() {
  return "mt-1 text-xs text-ink-500";
}

export function SmtpPanel({ state }: { state: SmtpFormState }) {
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    saveSmtpAction,
    initialState,
  );
  const [disconnectState, disconnectAction, disconnecting] = useActionState<ActionState, FormData>(
    disconnectSmtpAction,
    initialState,
  );
  const [testState, testAction, testing] = useActionState<ActionState, FormData>(
    sendTestEmailAction,
    initialState,
  );

  // Presets are a plain <datalist>-style convenience, so the inputs stay
  // uncontrolled and the owner can still type anything.
  const hostList = PRESETS.map((p) => p.host).join(",");

  return (
    <section className="rounded-card border border-ink-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Mail size={17} className="text-brand-700" />
            Email delivery (SMTP)
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Used to email customers their download links after payment. Saved here instead of in
            .env — the password is encrypted before it is stored.
          </p>
        </div>
        <StatusPill state={state} />
      </div>

      <form action={saveAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="smtp-host" className={labelClass()}>
              SMTP host <span className="text-red-600">*</span>
            </label>
            <input
              id="smtp-host"
              name="host"
              required
              defaultValue={state.host}
              list="smtp-presets"
              placeholder="smtp.gmail.com"
              autoComplete="off"
              className={inputClass()}
            />
            <datalist id="smtp-presets">
              {PRESETS.map((p) => (
                <option key={p.host} value={p.host}>
                  {p.label}
                </option>
              ))}
            </datalist>
            <p className={hintClass()}>
              Common hosts: {hostList.split(",").slice(0, 3).join(", ")}
            </p>
          </div>

          <div>
            <label htmlFor="smtp-port" className={labelClass()}>
              Port <span className="text-red-600">*</span>
            </label>
            <input
              id="smtp-port"
              name="port"
              required
              inputMode="numeric"
              defaultValue={state.port}
              placeholder="587"
              className={inputClass()}
            />
            <p className={hintClass()}>587 for STARTTLS, 465 for implicit SSL.</p>
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-300 px-3 py-2.5 text-sm text-ink-800">
              <input
                type="checkbox"
                name="secure"
                defaultChecked={state.secure}
                className="h-4 w-4 rounded border-ink-300 accent-brand-700"
              />
              Use implicit SSL (no STARTTLS)
            </label>
          </div>

          <div>
            <label htmlFor="smtp-user" className={labelClass()}>
              Username <span className="text-red-600">*</span>
            </label>
            <input
              id="smtp-user"
              name="user"
              required
              defaultValue={state.user}
              placeholder="you@gmail.com"
              autoComplete="off"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="smtp-password" className={labelClass()}>
              Password / app password
              {!state.hasPassword && <span className="ml-0.5 text-red-600">*</span>}
            </label>
            <input
              id="smtp-password"
              name="password"
              type="password"
              required={!state.hasPassword}
              placeholder={state.hasPassword ? "•••••••• — leave blank to keep" : ""}
              autoComplete="new-password"
              className={inputClass()}
            />
            <p className={hintClass()}>
              {state.hasPassword
                ? "A password is already saved. Leave this blank to keep it."
                : "For Gmail, use an App Password rather than your account password."}
            </p>
          </div>

          <div>
            <label htmlFor="smtp-from-name" className={labelClass()}>
              Sender name
            </label>
            <input
              id="smtp-from-name"
              name="fromName"
              defaultValue={state.fromName}
              placeholder="SYNAPSE.07"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="smtp-from-email" className={labelClass()}>
              Sender address
            </label>
            <input
              id="smtp-from-email"
              name="fromEmail"
              type="email"
              defaultValue={state.fromEmail}
              placeholder="Defaults to your username"
              className={inputClass()}
            />
            <p className={hintClass()}>Must be an address your provider is allowed to send from.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save SMTP settings"}
          </button>
          <Result state={saveState} />
        </div>
      </form>

      {/* ---------------------------------------------------------- test send */}
      <div className="mt-5 border-t border-ink-200 pt-5">
        <h3 className="mb-0.5 text-sm font-semibold text-ink-900">Send a test email</h3>
        <p className="mb-3 text-sm text-ink-500">
          Confirms the provider actually accepts these credentials.
        </p>
        <form action={testAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="test-to" className={labelClass()}>
                Send to
              </label>
              <input
                id="test-to"
                name="to"
                type="email"
                placeholder="Defaults to your admin email"
                autoComplete="off"
                className={inputClass()}
              />
            </div>
            <button
              type="submit"
              disabled={testing}
              className="btn btn-outline btn-md"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {testing ? "Sending…" : "Send test email"}
            </button>
          </div>
          <Result state={testState} />
        </form>
      </div>

      {/* ------------------------------------------------------------- remove */}
      {state.storedInAdmin && (
        <div className="mt-5 border-t border-ink-200 pt-5">
          <form action={disconnectAction} className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={disconnecting}
              className="btn btn-danger btn-sm"
            >
              {disconnecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {disconnecting ? "Removing…" : "Remove saved settings"}
            </button>
            <Result state={disconnectState} />
          </form>
        </div>
      )}
    </section>
  );
}