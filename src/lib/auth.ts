import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { prisma } from "./db";
import type { AdminRole } from "./constants";

const COOKIE_NAME = "sj7_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Set it in .env before using admin.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

export async function createAdminSession(payload: SessionPayload) {
  const token = await new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as AdminRole) ?? "ADMIN",
    };
  } catch {
    return null;
  }
}

/**
 * Reads and validates the session cookie.
 * Also re-checks the DB so a deactivated admin loses access immediately
 * instead of when their 8-hour cookie happens to expire.
 */
export const getCurrentAdmin = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) return null;

  return { sub: admin.id, email: admin.email, name: admin.name, role: admin.role as AdminRole };
});

