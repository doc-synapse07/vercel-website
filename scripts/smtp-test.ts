/**
 * Tests for admin-configurable SMTP: encryption at rest, resolution order,
 * password retention and env fallback.
 *
 * Leaves the database exactly as it found it.
 *
 *   npx tsx scripts/smtp-test.ts
 */
import { prisma } from "../src/lib/db";
import {
  clearSmtpConfig,
  getSmtpConfig,
  getSmtpFormState,
  saveSmtpConfig,
} from "../src/lib/mail-config";
import { decryptSecret, encryptSecret, isEncrypted } from "../src/lib/secrets";

const PASS_KEY = "smtp.pass";
const SECRET = "super-secret-app-password";

let failures = 0;
const saved = new Map<string, string | null>();

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) console.log(`  PASS  ${label}`);
  else {
    failures++;
    console.log(`  FAIL  ${label}`);
    if (extra !== undefined) console.log(`        ${JSON.stringify(extra)}`);
  }
}

/** Snapshots the smtp.* rows so the test can restore them. */
async function snapshot() {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: "smtp." } } });
  saved.clear();
  for (const r of rows) saved.set(r.key, r.value);
}

async function main() {
  console.log("\nSMTP configuration\n");

  // The env fallback must not leak in from a real deployment. Prisma loads .env
// into the process, so every SMTP_* value has to be cleared explicitly.
const originalEnv: Record<string, string | undefined> = {};
for (const key of [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_FROM_NAME",
  "SMTP_FROM_EMAIL",
]) {
  originalEnv[key] = process.env[key];
  delete process.env[key];
}

  try {
    // ------------------------------------------------------------ encryption
    console.log("Encryption at rest");
    const sealed = encryptSecret(SECRET);
    check("ciphertext does not contain the plaintext", !sealed.includes(SECRET), sealed);
    check("ciphertext is tagged as encrypted", isEncrypted(sealed));
    check("sealed value round-trips", decryptSecret(sealed) === SECRET);
    check("encrypting twice is a no-op", encryptSecret(sealed) === sealed);

    const tampered = sealed.slice(0, -6) + "AAAAAA";
    let tamperRejected = false;
    try {
      decryptSecret(tampered);
    } catch {
      tamperRejected = true;
    }
    check("a tampered ciphertext is rejected", tamperRejected);

    check(
      "plaintext passes through unchanged (legacy rows)",
      decryptSecret("plain-value") === "plain-value",
    );

    // ------------------------------------------------------------- resolution
    console.log("\nResolution order");
    await snapshot();
    await clearSmtpConfig();

    check("nothing configured resolves to null", (await getSmtpConfig()) === null);
    check("isSmtpConfigured is false", (await getSmtpFormState()).activeSource === "none");

    const result = await saveSmtpConfig({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: "shop@gmail.com",
      password: SECRET,
      fromName: "Synapse 07",
      fromEmail: "no-reply@gmail.com",
    });
    check("save succeeds", result.ok, result);

    const raw = await prisma.setting.findUnique({ where: { key: PASS_KEY } });
    check("the password row is encrypted", Boolean(raw && isEncrypted(raw.value)), raw?.value);
    check("the plaintext password is absent from the DB", !(raw?.value ?? "").includes(SECRET));

    const config = await getSmtpConfig();
    check("host resolves", config?.host === "smtp.gmail.com");
    check("port resolves", config?.port === 587);
    check("username resolves", config?.user === "shop@gmail.com");
    check("password is decrypted on read", config?.password === SECRET);
    check("source is the admin panel", config?.source === "admin");

    // ----------------------------------------------------------- env fallback
    console.log("\nEnvironment fallback");
    await clearSmtpConfig();
    process.env.SMTP_HOST = "smtp.env.example.com";
    process.env.SMTP_USER = "env-user";
    process.env.SMTP_PASSWORD = "env-pass";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_FROM_NAME = "Env Store";

    const envConfig = await getSmtpConfig();
    check("falls back to the environment", envConfig?.source === "env", envConfig?.source);
    check("env host is used", envConfig?.host === "smtp.env.example.com");
    check("port 465 implies implicit SSL", envConfig?.secure === true);
    check("from name is read from the environment", envConfig?.fromName === "Env Store");
    check("sender address defaults to the username", envConfig?.fromEmail === "env-user");

    const envState = await getSmtpFormState();
    check("form shows the env host so it can be copied over", envState.host === "smtp.env.example.com");
    check("form reports env as the active source", envState.activeSource === "env");
    check("form flags that no password is stored in admin", envState.storedInAdmin === false);

    // Admin settings take precedence over the environment.
    await saveSmtpConfig({
      host: "smtp.admin.example.com",
      port: 2525,
      secure: true,
      user: "admin-user",
      password: SECRET,
      fromName: "Admin Store",
      fromEmail: "",
    });
    const preferred = await getSmtpConfig();
    check("admin config wins over the environment", preferred?.source === "admin", preferred?.source);
    check("admin host is used", preferred?.host === "smtp.admin.example.com");
    check("from address falls back to the admin username", preferred?.fromEmail === "admin-user");

    // ------------------------------------------------------ password retention
    console.log("\nPassword handling");
    const retained = await saveSmtpConfig({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: "shop@gmail.com",
      // Blank means "keep the saved one".
      password: undefined,
      fromName: "Renamed Store",
      fromEmail: "no-reply@gmail.com",
    });
    check("a blank password keeps the saved one", retained.ok);
    check("the kept password still decrypts", (await getSmtpConfig())?.password === SECRET);
    check("the other fields did update", (await getSmtpConfig())?.fromName === "Renamed Store");

    const afterRetain = await prisma.setting.findUnique({ where: { key: PASS_KEY } });
    check(
      "the password ciphertext was not rewritten",
      Boolean(afterRetain && isEncrypted(afterRetain.value)),
    );

    await prisma.setting.deleteMany({ where: { key: PASS_KEY } });
    const missing = await saveSmtpConfig({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: "shop@gmail.com",
      password: "",
      fromName: "Store",
      fromEmail: "",
    });
    check("a blank password with none saved is rejected", !missing.ok, missing);

    // ------------------------------------------------------------- teardown
    console.log("\nRemoval");
    await clearSmtpConfig();
    check("rows are deleted", (await prisma.setting.count({ where: { key: { startsWith: "smtp." } } })) === 0);
    check("removal falls back to the environment", (await getSmtpConfig())?.source === "env");

    for (const key of [
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "SMTP_FROM_NAME",
      "SMTP_FROM_EMAIL",
    ]) {
      delete process.env[key];
    }
    await clearSmtpConfig();
    check("with no admin config and no env, delivery is off", (await getSmtpConfig()) === null);
  } finally {
    // ---------------------------------------------------------- restore state
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    await prisma.setting.deleteMany({ where: { key: { startsWith: "smtp." } } });
    for (const [key, value] of saved) {
      if (value !== null) await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    failures++;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
    process.exit(failures === 0 ? 0 : 1);
  });