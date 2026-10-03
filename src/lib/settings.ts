import { getSettings as getStoreSettings, setSetting } from "./store";

/**
 * Store settings with sensible fallbacks so the site renders even on a
 * fresh database where nothing has been configured yet.
 */
export const DEFAULT_SETTINGS = {
  siteName: process.env.NEXT_PUBLIC_STORE_NAME || "SYNAPSE.07",
  tagline: "Learn Smart. Revise Fast. Crack Exams.",
  supportEmail: process.env.STORE_SUPPORT_EMAIL || "support@synapse07.store",
  supportPhone: process.env.STORE_SUPPORT_PHONE || "+91 7041169494",
  instagramUrl: "",
  instagramFollowers: "",
  youtubeUrl: "",
  youtubeSubscribers: "",
  telegramUrl: "",
  whatsappUrl: "",
  heroTitle: "Learn Smart. Revise Fast.",
  heroSubtitle: "Crack Exams.",
  upiId: "",
} as const;

export type Settings = Record<keyof typeof DEFAULT_SETTINGS, string>;

const CACHE_KEY = "settings:all";

/** In-process cache; settings change rarely so a short TTL is fine. */
let cache: { value: Settings; expires: number } | null = null;
const TTL_MS = 30_000;

export async function getSettings(): Promise<Settings> {
  if (cache && cache.expires > Date.now()) return cache.value;

  const raw = await getStoreSettings();
  const merged = { ...DEFAULT_SETTINGS } as Settings;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const v = raw[key];
    if (typeof v === "string" && v.length > 0) merged[key] = v;
  }

  cache = { value: merged, expires: Date.now() + TTL_MS };
  return merged;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => typeof v === "string" && v.length > 0);
  if (!entries.length) return;

  await Promise.all(entries.map(([key, value]) => setSetting(key, value)));

  cache = null;
}

export function clearSettingsCache() {
  cache = null;
}