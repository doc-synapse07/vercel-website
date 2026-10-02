import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildGoogleAuthUrl, isGoogleConfigured, sanitizeReturnTo } from "@/lib/google-oauth";

/**
 * Starts Google sign-in: parks a one-time state token in an httpOnly cookie
 * (CSRF protection for the callback) and redirects to Google.
 */
export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const state = randomBytes(32).toString("hex");

  const res = NextResponse.redirect(buildGoogleAuthUrl(state));
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set("sj7_oauth_state", state, opts);
  res.cookies.set("sj7_oauth_return", returnTo, opts);
  return res;
}
