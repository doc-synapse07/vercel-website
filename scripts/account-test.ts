/**
 * Customer account checks.
 *
 * Covers the security-relevant logic that can run without a request scope:
 * input validation (the exact schemas the server actions use), password
 * hashing, the Google find-or-create/link flow at the DB level, and the
 * open-redirect guard on returnTo.
 *
 * The session cookie itself is verified in the browser, not here, because
 * next/headers cookies() only exist inside a request.
 *
 * Run with: npx tsx scripts/account-test.ts
 */

import { prisma } from "../src/lib/db";
import { bcrypt } from "../src/lib/auth-password";
import { SignInSchema, SignUpSchema } from "../src/lib/account-validation";
import {
  buildGoogleAuthUrl,
  isGoogleConfigured,
  sanitizeReturnTo,
} from "../src/lib/google-oauth";

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

const TEST_EMAIL = "account-test@example.com";
const TEST_GOOGLE_SUB = "google-test-sub-123";

async function cleanup() {
  await prisma.customer.deleteMany({
    where: { email: { in: [TEST_EMAIL, "google-link@example.com"] } },
  });
}

async function main() {
  await cleanup();

  console.log("\n--- signup validation (real schema) ---");
  check("bad email rejected", !SignUpSchema.safeParse({ name: "Ab", email: "nope", password: "password123" }).success);
  check("short name rejected", !SignUpSchema.safeParse({ name: "A", email: "a@b.co", password: "password123" }).success);
  check("short password rejected", !SignUpSchema.safeParse({ name: "Asha", email: "a@b.co", password: "short" }).success);
  check(
    "valid input accepted",
    SignUpSchema.safeParse({ name: "Asha", email: "Asha@Example.COM", password: "password123" }).success,
  );
  const normalized = SignUpSchema.safeParse({ name: "Asha", email: "Asha@Example.COM", password: "password123" });
  check(
    "email lowercased by schema",
    normalized.success && normalized.data.email === "asha@example.com",
    JSON.stringify(normalized.success ? normalized.data.email : "parse failed"),
  );

  console.log("\n--- signin validation (real schema) ---");
  check("bad email rejected", !SignInSchema.safeParse({ email: "nope", password: "x" }).success);
  check("empty password rejected", !SignInSchema.safeParse({ email: "a@b.co", password: "" }).success);
  check("valid input accepted", SignInSchema.safeParse({ email: "a@b.co", password: "x" }).success);

  console.log("\n--- password storage ---");
  const created = await prisma.customer.create({
    data: { name: "Test User", email: TEST_EMAIL, passwordHash: await bcrypt.hash("password123", 12) },
  });
  check("customer row created", Boolean(created.id));
  check("hash is not the password", created.passwordHash !== "password123");
  check("hash verifies", await bcrypt.compare("password123", created.passwordHash!));
  check("wrong password fails", !(await bcrypt.compare("wrong-password", created.passwordHash!)));

  const duplicate = await prisma.customer.findUnique({ where: { email: TEST_EMAIL } });
  check("duplicate email is detectable", duplicate?.id === created.id);

  console.log("\n--- Google link flow ---");
  // Same shape as the callback route: email match on a password account links it.
  const linked = await prisma.customer.update({
    where: { id: created.id },
    data: { googleId: TEST_GOOGLE_SUB },
  });
  check("googleId linked to password account", linked.googleId === TEST_GOOGLE_SUB);
  const byGoogle = await prisma.customer.findUnique({ where: { googleId: TEST_GOOGLE_SUB } });
  check("lookup by googleId works", byGoogle?.email === TEST_EMAIL);

  const googleOnly = await prisma.customer.create({
    data: { name: "Google User", email: "google-link@example.com", googleId: "google-sub-456" },
  });
  check("Google-only account has no password", googleOnly.passwordHash === null);
  const withPassword = await prisma.customer.update({
    where: { id: googleOnly.id },
    data: { passwordHash: await bcrypt.hash("password123", 12) },
  });
  check("password attachable later", await bcrypt.compare("password123", withPassword.passwordHash!));

  console.log("\n--- returnTo guard ---");
  check("plain path allowed", sanitizeReturnTo("/account") === "/account");
  check("nested path allowed", sanitizeReturnTo("/products/abc") === "/products/abc");
  check("empty defaults", sanitizeReturnTo(null) === "/account");
  check("absolute URL rejected", sanitizeReturnTo("https://evil.com/x") === "/account");
  check("protocol-relative rejected", sanitizeReturnTo("//evil.com") === "/account");
  check("backslash rejected", sanitizeReturnTo("/\\evil") === "/account");
  check("javascript scheme rejected", sanitizeReturnTo("javascript:alert(1)") === "/account");

  console.log("\n--- Google config ---");
  const savedId = process.env.GOOGLE_CLIENT_ID;
  const savedSecret = process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  check("unconfigured without env", !isGoogleConfigured());
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  check("configured with env", isGoogleConfigured());
  const authUrl = new URL(buildGoogleAuthUrl("state-123"));
  check("auth url points at Google", authUrl.hostname === "accounts.google.com");
  check("auth url carries state", authUrl.searchParams.get("state") === "state-123");
  check("auth url requests email scope", (authUrl.searchParams.get("scope") ?? "").includes("email"));
  check("auth url carries client id", authUrl.searchParams.get("client_id") === "test-client-id");
  check(
    "callback is the registered redirect",
    (authUrl.searchParams.get("redirect_uri") ?? "").endsWith("/api/auth/google/callback"),
  );
  if (savedId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = savedId;
  if (savedSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
  else process.env.GOOGLE_CLIENT_SECRET = savedSecret;

  await cleanup();
  const gone = await prisma.customer.findUnique({ where: { email: TEST_EMAIL } });
  check("test rows cleaned up", gone === null);

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
