import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Reversible encryption for secrets that the store owner enters in the admin
 * panel (SMTP password today, gateway keys later).
 *
 * These are stored in the same `Setting` table as the public store details, so
 * without this a database dump would hand over live credentials. Values are
 * sealed with AES-256-GCM, which also authenticates them — a tampered row fails
 * to decrypt instead of silently yielding garbage.
 *
 * The key is derived from SETTINGS_ENCRYPTION_KEY, falling back to AUTH_SECRET
 * so an existing deployment does not have to invent a new variable. AUTH_SECRET
 * is already required and already has to be rotated carefully, so this keeps the
 * key count down without weakening anything.
 */

const PREFIX = "enc.v1.";

function deriveKey(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.AUTH_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY or AUTH_SECRET must be set (at least 16 characters) before storing secrets in the admin panel.",
    );
  }

  return createHash("sha256").update(secret).digest();
}

/** True when a stored value is already sealed rather than plaintext. */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Seals a plaintext secret. Already-encrypted input is returned untouched. */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isEncrypted(plaintext)) return plaintext;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const sealed = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  // PREFIX already carries the trailing separator; only the payload is joined.
  return (
    PREFIX +
    [
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      sealed.toString("base64url"),
    ].join(".")
  );
}

/**
 * Opens a sealed secret. Plaintext is returned as-is so that a value written by
 * an older build still works, but that fallback is only ever hit for values
 * this app did not itself seal.
 */
export function decryptSecret(value: string): string {
  if (!value || !isEncrypted(value)) return value;

  const parts = value.slice(PREFIX.length).split(".");
  if (parts.length !== 3) {
    throw new Error("Stored secret is malformed and cannot be decrypted.");
  }

  const [ivB64, tagB64, dataB64] = parts;

  try {
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error(
      "Stored secret could not be decrypted. It was saved with a different SETTINGS_ENCRYPTION_KEY / AUTH_SECRET.",
    );
  }
}

