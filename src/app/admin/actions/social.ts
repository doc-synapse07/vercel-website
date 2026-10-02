"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import {
  clearSocialConfig,
  getSocialStats,
  saveSocialConfig,
} from "@/lib/social-stats";
import type { ActionState } from "./auth";

const SocialSchema = z.object({
  // Blank keeps the saved key, so both are optional.
  youtubeApiKey: z.string().trim().max(300).optional(),
  instagramUserId: z
    .string()
    .trim()
    .max(40)
    .regex(/^\d*$/, "The Instagram User ID is numeric"),
  instagramAccessToken: z.string().trim().max(600).optional(),
});

export async function saveSocialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const parsed = SocialSchema.safeParse({
    youtubeApiKey: formData.get("youtubeApiKey") || undefined,
    instagramUserId: formData.get("instagramUserId") ?? "",
    instagramAccessToken: formData.get("instagramAccessToken") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await saveSocialConfig(parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath("/");

  return { ok: true, success: "Saved. Use Refresh now to pull the live numbers." };
}

/** Forgets the API keys and every cached count. */
export async function disconnectSocialAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  await clearSocialConfig();

  revalidatePath("/admin/settings");
  revalidatePath("/");

  return {
    ok: true,
    success: "Removed. Counts will now come from the manual fields, if you filled those in.",
  };
}

/**
 * Forces an immediate fetch from both APIs. This is how the owner finds out
 * whether their credentials actually work — saving them proves nothing, exactly
 * as with the SMTP test send.
 */
export async function refreshSocialAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Session expired. Please sign in again." };

  const stats = await getSocialStats({ force: true });

  revalidatePath("/admin/settings");
  revalidatePath("/");

  const describe = (source: string, value: string, at: string) =>
    value ? `${source} ${value}${at ? ` (updated ${at})` : ""}` : `${source} not available`;

  const parts = [
    describe("YouTube", stats.youtubeSubscribers, stats.youtubeFetchedAt),
    describe("Instagram", stats.instagramFollowers, stats.instagramFetchedAt),
  ];

  if (stats.lastError) {
    return {
      ok: false,
      error: `${parts.join(" · ")} — ${stats.lastError}`,
    };
  }

  const gotSomething = Boolean(stats.youtubeSubscribers || stats.instagramFollowers);
  if (!gotSomething) {
    return {
      ok: false,
      error: `${parts.join(" · ")}. Check that the channel URL and Instagram User ID are filled in.`,
    };
  }

  return { ok: true, success: `Refreshed — ${parts.join(" · ")}` };
}
