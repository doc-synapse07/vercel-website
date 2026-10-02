/**
 * Social stats checks.
 *
 * Focus is on the logic we own and can verify without network access or real API
 * credentials: URL parsing, compact formatting, secret round-tripping, and the
 * degradation path when the APIs are unreachable.
 *
 * Run with: npx tsx scripts/social-test.ts
 */

import { prisma } from "../src/lib/db";
import { clearSettingsCache } from "../src/lib/settings";
import { decryptSecret, encryptSecret } from "../src/lib/secrets";
import {
  clearSocialConfig,
  getSocialFormState,
  getSocialStats,
  parseYouTubeTarget,
  saveSocialConfig,
} from "../src/lib/social-stats";
import { formatCompact } from "../src/components/StatsMatrix";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("\n--- YouTube URL parsing ---");
  check(
    "parses a handle URL",
    parseYouTubeTarget("https://www.youtube.com/@DocSynapse.07").handle === "DocSynapse.07",
  );
  check(
    "parses a channel-id URL",
    parseYouTubeTarget("https://youtube.com/channel/UCabcdefghijklmnopqrstuv").channelId ===
      "UCabcdefghijklmnopqrstuv",
  );
  check(
    "parses a legacy /user/ URL",
    parseYouTubeTarget("https://www.youtube.com/user/someperson").username === "someperson",
  );
  check("parses a bare @handle", parseYouTubeTarget("@DocSynapse.07").handle === "DocSynapse.07");
  check("returns empty for blank", JSON.stringify(parseYouTubeTarget("   ")) === "{}");
  check("returns empty for junk", JSON.stringify(parseYouTubeTarget("nonsense")) === "{}");

  console.log("\n--- compact formatting ---");
  check("999 stays literal", formatCompact(999) === "999");
  check("8000 becomes 8K", formatCompact(8000) === "8K");
  check("12500 becomes 12.5K", formatCompact(12500) === "12.5K");
  check("120000 becomes 1.2L", formatCompact(120000) === "1.2L");
  check("150000 becomes 1.5L", formatCompact(150000) === "1.5L");
  check("10000000 becomes 1Cr", formatCompact(10000000) === "1Cr");
  check("2500000 becomes 25L", formatCompact(2500000) === "25L");
  check("accepts a numeric string", formatCompact("8400") === "8.4K");
  check("strips formatting characters", formatCompact("12,500") === "12.5K");
  check("blank yields empty", formatCompact("") === "");
  check("zero yields empty", formatCompact("0") === "");
  check("garbage yields empty", formatCompact("abc") === "");

  console.log("\n--- secret sealing ---");
  const sealed = encryptSecret("AIzaSyTestKey123");
  check("ciphertext differs from plaintext", sealed !== "AIzaSyTestKey123");
  check("ciphertext is prefixed", sealed.startsWith("enc.v1."));
  check("ciphertext hides the key", !sealed.includes("AIzaSyTestKey123"));
  check("round-trips correctly", decryptSecret(sealed) === "AIzaSyTestKey123");
  check("encrypting twice is a no-op", encryptSecret(sealed) === sealed);

  console.log("\n--- configured state ---");
  await clearSocialConfig();
  let form = await getSocialFormState();
  check("no API key after clearing", !form.hasYoutubeApiKey);
  check("no Instagram token after clearing", !form.hasInstagramToken);
  check("no error recorded", form.lastError === "");

  console.log("\n--- with nothing configured, it must not throw ---");
  const bare = await getSocialStats({ force: true });
  check("returns without throwing", typeof bare.youtubeSubscribers === "string");
  check("YouTube source is none", bare.youtubeSource === "none");
  check("Instagram source is none", bare.instagramSource === "none");

  console.log("\n--- saving credentials ---");
  const saved = await saveSocialConfig({
    youtubeApiKey: "AIzaFakeKeyForTesting",
    instagramUserId: "17841400000000000",
    instagramAccessToken: "EAAGfakeTokenForTesting",
  });
  check("save succeeded", saved.ok);

  form = await getSocialFormState();
  check("YouTube key is now set", form.hasYoutubeApiKey);
  check("Instagram token is now set", form.hasInstagramToken);
  check("Instagram user id stored", form.instagramUserId === "17841400000000000");

  console.log("\n--- secrets are encrypted at rest ---");
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["social.youtubeApiKey", "social.instagramAccessToken"] } },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  check("YouTube key is ciphertext", (byKey["social.youtubeApiKey"] ?? "").startsWith("enc.v1."));
  check("Instagram token is ciphertext", (byKey["social.instagramAccessToken"] ?? "").startsWith("enc.v1."));
  check(
    "no plaintext key leaked to the database",
    !JSON.stringify(byKey).includes("AIzaFakeKeyForTesting"),
  );
  check(
    "no plaintext token leaked to the database",
    !JSON.stringify(byKey).includes("EAAGfakeTokenForTesting"),
  );

  console.log("\n--- a bad key must not break the storefront ---");
  // Network is optional here; either a clean rejection or a graceful fallback is
  // acceptable. What must never happen is an exception escaping.
  let threw = false;
  try {
    await getSocialStats({ force: true });
  } catch {
    threw = true;
  }
  check("an invalid key does not throw", !threw);

  console.log("\n--- manual values remain the fallback ---");
  await clearSocialConfig();
  await prisma.setting.upsert({
    where: { key: "youtubeSubscribers" },
    create: { key: "youtubeSubscribers", value: "8400" },
    update: { value: "8400" },
  });
  // This script writes straight to the database, bypassing saveSettings, so the
  // 30s settings cache has to be dropped explicitly or the old blank value wins.
  clearSettingsCache();

  const manual = await getSocialStats({ force: true });
  check("manual count is used when no API exists", manual.youtubeSubscribers === "8400");
  check("and is reported as manual", manual.youtubeSource === "manual");

  // Leave the store as we found it.
  await prisma.setting.deleteMany({ where: { key: "youtubeSubscribers" } });

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
