import { prisma } from "./db";
import { decryptSecret, encryptSecret, isEncrypted } from "./secrets";

/**
 * SMTP configuration with the admin panel as the primary source and the
 * environment variables as a fallback.
 *
 * The owner sets this up from Admin > Settings instead of editing .env, which
 * means it has to be read from the database on every send rather than captured
 * once at module load. Values are cached briefly and invalidated on save, so an
 * edit takes effect immediately without hammering the database.
 */

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  /** Where the live values came from — surfaced in the admin UI. */
  source: "admin" | "env";
};

const KEYS = {
  host: "smtp.host",
  port: "smtp.port",
  secure: "smtp.secure",
  user: "smtp.user",
  pass: "smtp.pass",
  fromName: "smtp.fromName",
  fromEmail: "smtp.fromEmail",
} as const;

const TTL_MS = 30_000;
let cache: { value: SmtpConfig | null; expires: number } | null = null;

export function clearSmtpCache() {
  cache = null;
}

function fromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD ?? "";

  if (!host || !user || !password) return null;

  const port = Number(process.env.SMTP_PORT || 587);

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user,
    password,
    fromName: process.env.SMTP_FROM_NAME || "SYNAPSE.07",
    fromEmail: process.env.SMTP_FROM_EMAIL || user,
    source: "env",
  };
}

async function fromDb(): Promise<SmtpConfig | null> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  });
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const host = stored[KEYS.host]?.trim() ?? "";
  const user = stored[KEYS.user]?.trim() ?? "";
  const rawPass = stored[KEYS.pass] ?? "";

  if (!host || !user || !rawPass) return null;

  // Only decrypt when we actually have something to open — a missing or
  // corrupt row must degrade to "not configured", not crash the page.
  let password: string;
  try {
    password = decryptSecret(rawPass);
  } catch (error) {
    console.error("[smtp]", error);
    return null;
  }

  const port = Number(stored[KEYS.port] || 587);

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure: stored[KEYS.secure] === "true" || port === 465,
    user,
    password,
    fromName: stored[KEYS.fromName]?.trim() || "SYNAPSE.07",
    fromEmail: stored[KEYS.fromEmail]?.trim() || user,
    source: "admin",
  };
}

/** The live SMTP settings, or null when nothing usable is configured. */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  if (cache && cache.expires > Date.now()) return cache.value;

  const config = (await fromDb()) ?? fromEnv();
  cache = { value: config, expires: Date.now() + TTL_MS };
  return config;
}

export async function isSmtpConfigured(): Promise<boolean> {
  return (await getSmtpConfig()) !== null;
}

export type SmtpFormInput = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  /** Omit to keep the already-saved password. */
  password?: string;
  fromName: string;
  fromEmail: string;
};

/**
 * Stores the admin-supplied SMTP settings, sealing the password.
 * Returns false when a password is needed but neither supplied nor saved.
 */
export async function saveSmtpConfig(input: SmtpFormInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const existingRow = await prisma.setting.findUnique({ where: { key: KEYS.pass } });
  const existingPass = existingRow?.value ?? "";
  const newPass = input.password?.trim() ?? "";

  let passwordValue: string;
  if (newPass) {
    passwordValue = encryptSecret(newPass);
  } else if (existingPass) {
    // Blank field means "keep what is already saved" so the owner does not have
    // to retype the password on every unrelated tweak.
    passwordValue = existingPass;
  } else {
    return { ok: false, error: "Enter the SMTP password." };
  }

  const entries: [string, string][] = [
    [KEYS.host, input.host.trim()],
    [KEYS.port, String(input.port)],
    [KEYS.secure, String(input.secure)],
    [KEYS.user, input.user.trim()],
    [KEYS.pass, passwordValue],
    [KEYS.fromName, input.fromName.trim() || "SYNAPSE.07"],
    [KEYS.fromEmail, (input.fromEmail.trim() || input.user).trim()],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );

  clearSmtpCache();
  return { ok: true };
}

/** Removes the admin-stored config, falling back to the environment if present. */
export async function clearSmtpConfig(): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: { in: Object.values(KEYS) } } });
  clearSmtpCache();
}

/**
 * What the settings form should render: the admin-stored values, or the
 * environment's as a starting point so they are visible and editable.
 * Never includes a usable password — only whether one is present.
 */
export async function getSmtpFormState(): Promise<{
  host: string;
  port: string;
  secure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  hasPassword: boolean;
  storedInAdmin: boolean;
  activeSource: "admin" | "env" | "none";
}> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  });
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const passRow = stored[KEYS.pass] ?? "";

  const env = fromEnv();
  const active = (await getSmtpConfig())?.source ?? "none";

  return {
    host: stored[KEYS.host] ?? env?.host ?? "",
    port: stored[KEYS.port] ?? String(env?.port ?? 587),
    secure: stored[KEYS.secure] ? stored[KEYS.secure] === "true" : (env?.secure ?? false),
    user: stored[KEYS.user] ?? env?.user ?? "",
    fromName: stored[KEYS.fromName] ?? env?.fromName ?? "SYNAPSE.07",
    fromEmail: stored[KEYS.fromEmail] ?? env?.fromEmail ?? "",
    hasPassword: passRow.length > 0 || Boolean(env?.password),
    storedInAdmin: passRow.length > 0,
    activeSource: active,
  };
}

/** Re-exported so callers can tell a sealed value from a plaintext legacy row. */
export { isEncrypted };