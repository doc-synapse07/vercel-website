import { prisma } from "./db";

/**
 * Store settings with sensible fallbacks so the site renders even on a
 * fresh database where nothing has been configured yet.
 */
export const DEFAULT_SETTINGS = {
  siteName: process.env.NEXT_PUBLIC_STORE_NAME || "SYNAPSE.07",
  tagline: "Learn Smart. Revise Fast. Crack Exams.",
  supportEmail: process.env.STORE_SUPPORT_EMAIL || "support@synapse07.store",
  supportPhone: process.env.STORE_SUPPORT_PHONE || "+91 90000 00000",
  upiId: "",
  instagramUrl: "",
  instagramFollowers: "",
  youtubeUrl: "",
  youtubeSubscribers: "",
  telegramUrl: "",
  whatsappUrl: "",
  aboutText:
    "Curated exam-preparation notes for UPSC CMS, NEET PG, INICET, FMGE, NORCET and state medical officer exams.",
} as const;

export type Settings = Record<keyof typeof DEFAULT_SETTINGS, string>;

const CACHE_KEY = "settings:all";

/** In-process cache; settings change rarely so a short TTL is fine. */
let cache: { value: Settings; expires: number } | null = null;
const TTL_MS = 30_000;

export async function getSettings(): Promise<Settings> {
  if (cache && cache.expires > Date.now()) return cache.value;

  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const merged = { ...DEFAULT_SETTINGS } as Settings;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const v = stored[key];
    if (typeof v === "string") merged[key] = v;
  }

  cache = { value: merged, expires: Date.now() + TTL_MS };
  return merged;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => typeof v === "string");
  if (!entries.length) return;

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value as string },
        update: { value: value as string },
      }),
    ),
  );

  cache = null;
}

export function clearSettingsCache() {
  cache = null;
}