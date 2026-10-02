/**
 * Google OAuth for customer sign-in, implemented with plain fetch so no extra
 * dependency is needed. Setup is a Google Cloud Console OAuth client
 * (APIs & Services → Credentials → Create Credentials → OAuth client ID, type
 * "Web application") with the redirect URI below added as an authorised
 * redirect URI.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function getGoogleRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/auth/google/callback`;
}

/** Only relative in-site paths may be used as a post-login destination. */
export function sanitizeReturnTo(input: string | null): string {
  if (!input) return "/account";
  try {
    const decoded = decodeURIComponent(input);
    if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes("\\")) {
      return decoded;
    }
  } catch {
    // Malformed encoding — fall through to the default.
  }
  return "/account";
}

export function buildGoogleAuthUrl(state: string): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!.trim());
  url.searchParams.set("redirect_uri", getGoogleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export type GoogleTokens = { accessToken: string };

export async function exchangeGoogleCode(code: string): Promise<GoogleTokens | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        redirect_uri: getGoogleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      console.error("[google-oauth] token exchange failed:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) return null;
    return { accessToken: json.access_token };
  } catch (error) {
    console.error("[google-oauth] token exchange error:", error);
    return null;
  }
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile | null> {
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error("[google-oauth] userinfo failed:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    // Google marks @gmail addresses verified; Workspace/domain addresses may
    // not be. Refusing unverified addresses outright would lock out legitimate
    // users, and the store delivers to checkout-typed emails anyway.
    if (!json.sub || !json.email) return null;

    return {
      sub: json.sub,
      email: json.email.toLowerCase(),
      name: json.name?.trim() || json.email.split("@")[0],
      picture: json.picture,
    };
  } catch (error) {
    console.error("[google-oauth] userinfo error:", error);
    return null;
  }
}
