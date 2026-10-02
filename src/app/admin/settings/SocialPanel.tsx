"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Save, Trash2, Users } from "lucide-react";
import {
  saveSocialAction,
  disconnectSocialAction,
  refreshSocialAction,
} from "@/app/admin/actions/social";
import type { ActionState } from "@/app/admin/actions/auth";

const initialState: ActionState = { ok: false };

export type SocialFormState = {
  hasYoutubeApiKey: boolean;
  instagramUserId: string;
  hasInstagramToken: boolean;
  youtubeSource: "live" | "cache" | "manual" | "none";
  instagramSource: "live" | "cache" | "manual" | "none";
  youtubeFetchedAt: string;
  instagramFetchedAt: string;
  lastError: string;
};

const SOURCE_LABEL: Record<SocialFormState["youtubeSource"], { text: string; cls: string }> = {
  live: { text: "Live from API", cls: "bg-brand-100 text-brand-800" },
  cache: { text: "Cached", cls: "bg-amber-100 text-amber-800" },
  manual: { text: "Typed in by hand", cls: "bg-ink-100 text-ink-700" },
  none: { text: "No number", cls: "bg-red-100 text-red-700" },
};

function Pill({ source }: { source: SocialFormState["youtubeSource"] }) {
  const s = SOURCE_LABEL[source];
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.text}</span>
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
  return "mt-1 text-xs leading-relaxed text-ink-500";
}

function when(iso: string) {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "never";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function SocialPanel({ state }: { state: SocialFormState }) {
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    saveSocialAction,
    initialState,
  );
  const [refreshState, refreshAction, refreshing] = useActionState<ActionState, FormData>(
    refreshSocialAction,
    initialState,
  );
  const [disconnectState, disconnectAction, disconnecting] = useActionState<ActionState, FormData>(
    disconnectSocialAction,
    initialState,
  );

  const configured = state.hasYoutubeApiKey || state.hasInstagramToken;

  return (
    <section className="rounded-card border border-ink-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Users size={17} className="text-brand-700" />
            Social proof numbers
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Pulls your real YouTube subscriber and Instagram follower counts so the homepage never
            shows a stale or invented figure. Optional — the manual fields above work without it.
          </p>
        </div>
        <Pill source={state.youtubeSource === "none" ? "none" : "live"} />
      </div>

      <form action={saveAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="yt-api-key" className={labelClass()}>
              YouTube Data API key
              {!state.hasYoutubeApiKey && <span className="ml-0.5 text-ink-400">(optional)</span>}
            </label>
            <input
              id="yt-api-key"
              name="youtubeApiKey"
              type="password"
              placeholder={state.hasYoutubeApiKey ? "•••••••• — leave blank to keep" : "AIza…"}
              autoComplete="new-password"
              className={inputClass()}
            />
            <p className={hintClass()}>
              From Google Cloud Console → enable <em>YouTube Data API v3</em> → Credentials → API key.
              Uses the YouTube channel URL saved in Social links. Free, 10,000 calls/day — we use one
              every 6 hours.
            </p>
          </div>

          <div>
            <label htmlFor="ig-user-id" className={labelClass()}>
              Instagram User ID
              {!state.hasInstagramToken && <span className="ml-0.5 text-ink-400">(optional)</span>}
            </label>
            <input
              id="ig-user-id"
              name="instagramUserId"
              inputMode="numeric"
              defaultValue={state.instagramUserId}
              placeholder="17841400000000000"
              className={inputClass()}
            />
            <p className={hintClass()}>
              Meta → Instagram → API setup with the <code>instagram_basic</code> permission. Your
              Professional account must be linked to a Facebook Page.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ig-token" className={labelClass()}>
              Instagram access token
              {!state.hasInstagramToken && <span className="ml-0.5 text-ink-400">(optional)</span>}
            </label>
            <input
              id="ig-token"
              name="instagramAccessToken"
              type="password"
              placeholder={
                state.hasInstagramToken ? "•••••••• — leave blank to keep" : "EAAG… long-lived token"
              }
              autoComplete="new-password"
              className={inputClass()}
            />
            <p className={hintClass()}>
              Long-lived, so it expires about every 60 days. When it does, the page keeps showing the
              last good number and you re-paste a fresh one here — it never blanks out.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save API credentials"}
          </button>
          <Result state={saveState} />
        </div>
      </form>

      {/* ------------------------------------------------------------- refresh */}
      <div className="mt-5 border-t border-ink-200 pt-5">
        <h3 className="mb-0.5 text-sm font-semibold text-ink-900">Fetch the live numbers</h3>
        <p className="mb-3 text-sm text-ink-500">
          The only way to be sure the credentials work — saving them proves nothing.
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-800">YouTube</p>
              <p className="truncate text-xs text-ink-500">Last checked {when(state.youtubeFetchedAt)}</p>
            </div>
            <Pill source={state.youtubeSource} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-800">Instagram</p>
              <p className="truncate text-xs text-ink-500">Last checked {when(state.instagramFetchedAt)}</p>
            </div>
            <Pill source={state.instagramSource} />
          </div>
        </div>

        <form action={refreshAction} className="mt-3.5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={refreshing || !configured}
            className="btn btn-outline btn-md"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {refreshing ? "Fetching…" : "Refresh now"}
          </button>
          <Result state={refreshState} />
        </form>

        {state.lastError && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{state.lastError}</span>
          </p>
        )}
      </div>

      {/* -------------------------------------------------------------- remove */}
      {configured && (
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
              {disconnecting ? "Removing…" : "Remove API credentials"}
            </button>
            <Result state={disconnectState} />
          </form>
        </div>
      )}
    </section>
  );
}
