// Shared by the proxy, server code and the logout route.

// Request header the proxy uses to hand the verified user to the layout and
// pages. The proxy always deletes any copy sent by the browser before setting
// it, so it can only come from the proxy's own getUser() check.
export const USER_HEADER = "x-mistakebook-user";

export type SessionUser = { id: string; email: string | null };

// Supabase session cookies: "sb-<project>-auth-token", its chunks
// ("…-auth-token.0", ".1", …) and the PKCE "…-auth-token-code-verifier".
export function isAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

export function encodeUser(user: SessionUser) {
  return encodeURIComponent(JSON.stringify(user));
}

export function decodeUser(value: string | null): SessionUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return typeof parsed?.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}
