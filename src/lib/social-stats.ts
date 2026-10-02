import { prisma } from "./db";
import { decryptSecret, encryptSecret } from "./secrets";
import { getSettings } from "./settings";

/**
 * Live YouTube subscriber and Instagram follower counts.
 *
 * Two very different APIs sit behind one interface:
 *
 *  - YouTube Data API v3. Public channel statistics need nothing but an API key,
 *    no OAuth. `channels.list` costs a single quota unit against a 10,000/day
 *    default, so refreshing a few times a day is free.
 *  - Instagram Graph API. Requires a Professional account linked to a Facebook
 *    Page, plus a long-lived access token (~60 day lifetime). The Instagram Basic
 *    Display API was shut down in Dec 2024, so the Graph API is the only official
 *    route left.
 *
 * Design rules this module follows:
 *
 *  1. The storefront must never block on a third-party API. Results are cached in
 *     the database with a timestamp; a fetch happens only when the cached value
 *     has aged past TTL, and any failure falls back to the last good value.
 *  2. Manual entry stays supported as the final fallback, so the owner is never
 *     forced to wire up API credentials just to keep the page rendering.
 *  3. Secrets are sealed with AES-256-GCM exactly like the SMTP password.
 */

const SECRET_KEYS = {
  youtubeApiKey: "social.youtubeApiKey",
  instagramAccessToken: "social.instagramAccessToken",
} as const;

const PLAIN_KEYS = {
  instagramUserId: "social.instagramUserId",
  cachedYoutubeSubscribers: "social.cache.youtubeSubscribers",
  cachedYoutubeAt: "social.cache.youtubeAt",
  cachedInstagramFollowers: "social.cache.instagramFollowers",
  cachedInstagramAt: "social.cache.instagramAt",
  lastError: "social.cache.lastError",
} as const;

const ALL_KEYS = [...Object.values(SECRET_KEYS), ...Object.values(PLAIN_KEYS)];

/** Six hours. A follower count does not need to be live, and this keeps us well
 *  inside both the YouTube daily quota and any Meta rate limits. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const GRAPH_VERSION = "v21.0";
const UA = "synapse07-store/1.0";

/** Short in-process cache so a burst of page renders hits the DB once. */
const TTL_MS = 30_000;
let memCache: { value: SocialStats; expires: number } | null = null;

export function clearSocialStatsCache() {
  memCache = null;
}

export type PlatformSource = "live" | "cache" | "manual" | "none";

export type SocialStats = {
  /** Raw digits, or "" when unknown. Formatting is the caller's business. */
  youtubeSubscribers: string;
  instagramFollowers: string;
  youtubeSource: PlatformSource;
  instagramSource: PlatformSource;
  /** ISO timestamp of the last successful fetch, for the admin panel. */
  youtubeFetchedAt: string;
  instagramFetchedAt: string;
  /** Most recent fetch failure, cleared on the next success. */
  lastError: string;
};

async function readRows(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ALL_KEYS } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

async function readSecret(stored: Record<string, string>, key: string): Promise<string> {
  const raw = stored[key] ?? "";
  if (!raw) return "";
  try {
    return decryptSecret(raw);
  } catch (error) {
    console.error("[social-stats]", error);
    return "";
  }
}

async function writePairs(pairs: [string, string][]): Promise<void> {
  await prisma.$transaction(
    pairs.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  clearSocialStatsCache();
}

/* ------------------------------------------------------------------ youtube */

type YouTubeTarget = { channelId?: string; handle?: string; username?: string };

/**
 * Pulls a channel id / handle / legacy username out of whatever the owner pasted
 * into the social-links field. All four common URL shapes are handled, because
 * people copy these by hand from the address bar.
 */
export function parseYouTubeTarget(url: string): YouTubeTarget {
  const raw = url.trim();
  if (!raw) return {};

  const channelId = raw.match(/\/channel\/(UC[\w-]{20,})/);
  if (channelId) return { channelId: channelId[1] };

  const handle = raw.match(/@([\w.-]{3,})/);
  if (handle) return { handle: handle[1] };

  const legacy = raw.match(/youtube\.com\/(?:user|c)\/([\w.-]{3,})/);
  if (legacy) return { username: legacy[1] };

  // A bare handle such as "@DocSynapse.07" typed straight into the field.
  if (raw.startsWith("@")) return { handle: raw.slice(1) };

  return {};
}

type YouTubeResult = { subscribers: string; ok: boolean; error?: string };

async function fetchYouTube(apiKey: string, target: YouTubeTarget): Promise<YouTubeResult> {
  if (!target.channelId && !target.handle && !target.username) {
    return { subscribers: "", ok: false, error: "No YouTube channel URL set." };
  }

  const attempt = async (
    param: "id" | "forHandle" | "forUsername",
    value: string,
  ): Promise<YouTubeResult> => {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "statistics");
    url.searchParams.set(param, value);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) {
      const body = await res.text();
      return { subscribers: "", ok: false, error: `YouTube API ${res.status}: ${body.slice(0, 200)}` };
    }

    const json = (await res.json()) as {
      items?: { statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[];
    };

    const count = json.items?.[0]?.statistics?.subscriberCount;
    // An empty string means the channel hides its subscriber count. That is the
    // channel's own choice and there is nothing we can or should do about it, so
    // it is reported as "no result" rather than an error worth showing.
    return count
      ? { subscribers: count, ok: true }
      : { subscribers: "", ok: false, error: "" };
  };

  // `forHandle` is the modern parameter but is not available on every API
  // version, so fall back to the older lookups rather than showing nothing.
  const tries: Array<() => Promise<YouTubeResult>> = [];
  if (target.channelId) tries.push(() => attempt("id", target.channelId!));
  if (target.handle) {
    tries.push(() => attempt("forHandle", `@${target.handle}`));
    tries.push(() => attempt("forUsername", target.handle!));
  }
  if (target.username) tries.push(() => attempt("forUsername", target.username!));

  let lastError = "";
  for (const run of tries) {
    try {
      const result = await run();
      if (result.ok) return result;
      if (result.error) lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return { subscribers: "", ok: false, error: lastError };
}

/* --------------------------------------------------------------- instagram */

type InstagramResult = { followers: string; ok: boolean; error?: string };

async function fetchInstagram(
  accessToken: string,
  igUserId: string,
): Promise<InstagramResult> {
  if (!igUserId) {
    return { followers: "", ok: false, error: "Instagram User ID is not set." };
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(igUserId)}`);
  url.searchParams.set("fields", "username,followers_count,media_count,name");
  url.searchParams.set("access_token", accessToken);

  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    const json = (await res.json()) as {
      followers_count?: number;
      error?: { message?: string; code?: number };
    };

    if (!res.ok || json.error) {
      const message = json.error?.message ?? `HTTP ${res.status}`;
      return { followers: "", ok: false, error: `Instagram API: ${message}` };
    }


    const count = json.followers_count;
    return typeof count === "number"
      ? { ok: true, followers: String(count) }
      : { followers: "", ok: false, error: "Instagram returned no follower count." };
  } catch (error) {
    return {
      followers: "",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ------------------------------------------------------------------ public */

function isStale(fetchedAt: string): boolean {
  if (!fetchedAt) return true;
  const ts = Date.parse(fetchedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > CACHE_TTL_MS;
}

/**
 * Current counts. Refetches from the APIs when the cached value is stale, and
 * degrades to cache, then to the owner's manual entry, then to nothing.
 */
export async function getSocialStats(options: { force?: boolean } = {}): Promise<SocialStats> {
  if (!options.force && memCache && memCache.expires > Date.now()) return memCache.value;

  const [stored, settings] = await Promise.all([readRows(), getSettings()]);
  const now = new Date().toISOString();

  const cachedYt = stored[PLAIN_KEYS.cachedYoutubeSubscribers] ?? "";
  const cachedYtAt = stored[PLAIN_KEYS.cachedYoutubeAt] ?? "";
  const cachedIg = stored[PLAIN_KEYS.cachedInstagramFollowers] ?? "";
  const cachedIgAt = stored[PLAIN_KEYS.cachedInstagramAt] ?? "";

  const result: SocialStats = {
    youtubeSubscribers: cachedYt,
    instagramFollowers: cachedIg,
    youtubeSource: cachedYt ? "cache" : "none",
    instagramSource: cachedIg ? "cache" : "none",
    youtubeFetchedAt: cachedYtAt,
    instagramFetchedAt: cachedIgAt,
    lastError: stored[PLAIN_KEYS.lastError] ?? "",
  };

  const writes: [string, string][] = [];
  const errors: string[] = [];

  // ---- YouTube
  const ytApiKey = process.env.YOUTUBE_API_KEY?.trim() || (await readSecret(stored, SECRET_KEYS.youtubeApiKey));
  if (ytApiKey && (options.force || isStale(cachedYtAt))) {
    const target = parseYouTubeTarget(settings.youtubeUrl);
    const yt = await fetchYouTube(ytApiKey, target);

    if (yt.ok) {
      result.youtubeSubscribers = yt.subscribers;
      result.youtubeSource = "live";
      result.youtubeFetchedAt = now;
      writes.push([PLAIN_KEYS.cachedYoutubeSubscribers, yt.subscribers], [PLAIN_KEYS.cachedYoutubeAt, now]);
    } else if (yt.error) {
      errors.push(yt.error);
      // Keep the stale value rather than blanking the storefront.
      result.youtubeSource = cachedYt ? "cache" : "manual";
    }
  }

  // ---- Instagram
  const igToken =
    process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || (await readSecret(stored, SECRET_KEYS.instagramAccessToken));
  const igUserId = (stored[PLAIN_KEYS.instagramUserId] ?? "").trim();

  if (igToken && igUserId && (options.force || isStale(cachedIgAt))) {
    const ig = await fetchInstagram(igToken, igUserId);

    if (ig.ok) {
      result.instagramFollowers = ig.followers;
      result.instagramSource = "live";
      result.instagramFetchedAt = now;
      writes.push([PLAIN_KEYS.cachedInstagramFollowers, ig.followers], [PLAIN_KEYS.cachedInstagramAt, now]);
    } else {
      errors.push(ig.error ?? "Instagram fetch failed.");
      result.instagramSource = cachedIg ? "cache" : "manual";
    }
  }

  // ---- manual fallbacks, used only when nothing better exists
  if (!result.youtubeSubscribers && settings.youtubeSubscribers) {
    result.youtubeSubscribers = settings.youtubeSubscribers;
    result.youtubeSource = "manual";
  }
  if (!result.instagramFollowers && settings.instagramFollowers) {
    result.instagramFollowers = settings.instagramFollowers;
    result.instagramSource = "manual";
  }

  const errorText = errors.join(" | ");
  if (errorText !== result.lastError) {
    writes.push([PLAIN_KEYS.lastError, errorText]);
    result.lastError = errorText;
  }

  if (writes.length) await writePairs(writes);

  memCache = { value: result, expires: Date.now() + TTL_MS };
  return result;
}

/* ------------------------------------------------------------- admin panel */

export async function getSocialFormState(): Promise<{
  hasYoutubeApiKey: boolean;
  instagramUserId: string;
  hasInstagramToken: boolean;
  youtubeSource: PlatformSource;
  instagramSource: PlatformSource;
  youtubeFetchedAt: string;
  instagramFetchedAt: string;
  lastError: string;
}> {
  const [stored, stats] = await Promise.all([readRows(), getSocialStats()]);

  return {
    hasYoutubeApiKey: Boolean(
      process.env.YOUTUBE_API_KEY?.trim() || stored[SECRET_KEYS.youtubeApiKey],
    ),
    instagramUserId: stored[PLAIN_KEYS.instagramUserId] ?? "",
    hasInstagramToken: Boolean(
      process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || stored[SECRET_KEYS.instagramAccessToken],
    ),
    youtubeSource: stats.youtubeSource,
    instagramSource: stats.instagramSource,
    youtubeFetchedAt: stats.youtubeFetchedAt,
    instagramFetchedAt: stats.instagramFetchedAt,
    lastError: stats.lastError,
  };
}

export async function saveSocialConfig(input: {
  youtubeApiKey?: string;
  instagramUserId: string;
  instagramAccessToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const stored = await readRows();

  const existingYt = stored[SECRET_KEYS.youtubeApiKey] ?? "";
  const newYt = input.youtubeApiKey?.trim() ?? "";
  const existingIg = stored[SECRET_KEYS.instagramAccessToken] ?? "";
  const newIg = input.instagramAccessToken?.trim() ?? "";

  const writes: [string, string][] = [
    [PLAIN_KEYS.instagramUserId, input.instagramUserId.trim()],
  ];

  // Blank secret field means "leave the saved one alone" so an unrelated edit does
  // not wipe a working key.
  if (newYt) writes.push([SECRET_KEYS.youtubeApiKey, encryptSecret(newYt)]);
  else if (existingYt) writes.push([SECRET_KEYS.youtubeApiKey, existingYt]);

  if (newIg) writes.push([SECRET_KEYS.instagramAccessToken, encryptSecret(newIg)]);
  else if (existingIg) writes.push([SECRET_KEYS.instagramAccessToken, existingIg]);

  await writePairs(writes);
  return { ok: true };
}

export async function clearSocialConfig(): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: { in: ALL_KEYS } } });
  clearSocialStatsCache();
}
