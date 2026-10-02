import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createCustomerSession } from "@/lib/customer-auth";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  sanitizeReturnTo,
} from "@/lib/google-oauth";

function fail(message: string, returnTo: string): NextResponse {
  const url = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  url.searchParams.set("error", message);
  void returnTo;
  return NextResponse.redirect(url);
}

/**
 * Google redirects back here. Verifies the state token, exchanges the code,
 * then finds or creates the customer:
 *
 *  - googleId match → sign in.
 *  - email match on a password account → link the googleId to it (same person,
 *    proven by Google handing us that exact address).
 *  - neither → create a fresh Google-only account (no password set).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = await cookies();
  const savedState = store.get("sj7_oauth_state")?.value;
  const returnTo = sanitizeReturnTo(store.get("sj7_oauth_return")?.value ?? null);

  const clear = (res: NextResponse) => {
    res.cookies.delete("sj7_oauth_state");
    res.cookies.delete("sj7_oauth_return");
    return res;
  };

  if (searchParams.get("error")) {
    return clear(fail("Google sign-in was cancelled.", returnTo));
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state || !savedState || state !== savedState) {
    return clear(fail("Google sign-in failed verification. Please try again.", returnTo));
  }

  const tokens = await exchangeGoogleCode(code);
  if (!tokens) {
    return clear(fail("Google did not accept the sign-in. Please try again.", returnTo));
  }

  const profile = await fetchGoogleProfile(tokens.accessToken);
  if (!profile) {
    return clear(fail("Could not read your Google profile. Please try again.", returnTo));
  }

  let customer = await prisma.customer.findUnique({ where: { googleId: profile.sub } });

  if (!customer) {
    const byEmail = await prisma.customer.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      customer = await prisma.customer.update({
        where: { id: byEmail.id },
        data: { googleId: profile.sub, avatarUrl: profile.picture ?? byEmail.avatarUrl },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: profile.name,
          email: profile.email,
          googleId: profile.sub,
          avatarUrl: profile.picture,
        },
      });
    }
  }

  await createCustomerSession({ sub: customer.id, email: customer.email, name: customer.name });

  const dest = new URL(returnTo, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  return clear(NextResponse.redirect(dest));
}
