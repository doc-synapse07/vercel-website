import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { prisma } from "./db";

const COOKIE_NAME = "sj7_customer";
// 30 days — customers should stay signed in across visits, unlike admins.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Set it in .env.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type CustomerSession = {
  sub: string;
  email: string;
  name: string;
};

export async function createCustomerSession(customer: CustomerSession) {
  const token = await new SignJWT({ email: customer.email, name: customer.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.sub)
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

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Reads and validates the customer session cookie, then re-checks the DB so a
 * deleted account loses access immediately instead of when the cookie expires.
 */
export const getCurrentCustomer = cache(async (): Promise<CustomerSession | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let sub = "";
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    sub = payload.sub;
  } catch {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: sub },
    select: { id: true, email: true, name: true },
  });

  if (!customer) return null;
  return { sub: customer.id, email: customer.email, name: customer.name };
});

export { COOKIE_NAME as CUSTOMER_COOKIE_NAME };
