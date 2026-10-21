import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { encodeUser, isAuthCookie, USER_HEADER, type SessionUser } from "@/lib/supabase/auth-shared";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];
type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Runs on every page request and makes the one logged-in / logged-out
// decision for it:
// - With a Supabase session cookie, it checks the user with the Auth server
//   (getUser), refreshing the session if needed. If the session is no longer
//   valid, it clears the session cookies so a stale cookie can't cause loops.
// - It passes the verified user to the layout and pages in USER_HEADER, so the
//   header, the page and these redirects always agree.
// - /app needs a user (otherwise /login); /login and /signup send a verified
//   user to /app.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // /auth/* route handlers (logout) manage the session cookies themselves.
  if (path.startsWith("/auth/")) {
    const headers = new Headers(request.headers);
    headers.delete(USER_HEADER);
    return NextResponse.next({ request: { headers } });
  }

  const cookiesToSet: CookieToSet[] = [];
  let user: SessionUser | null = null;
  let clearSession = false;

  if (request.cookies.getAll().some((c) => isAuthCookie(c.name))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(list) {
            // Refreshed tokens: forward them to the page and to the browser.
            list.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              cookiesToSet.push({ name, value, options: options as CookieOptions });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.getUser();
    if (data.user) {
      user = { id: data.user.id, email: data.user.email ?? null };
    } else {
      // An auth error (revoked, expired or invalid session, deleted user)
      // means the cookie is dead: clear it. A network or server error only
      // counts as logged out for this request, without logging the user out.
      const status = (error as { status?: number } | null)?.status ?? 0;
      clearSession = !error || (status >= 400 && status < 500);
    }
  }

  const isProtected = path === "/app" || path.startsWith("/app/");
  const isAuthPage = path === "/login" || path === "/signup";

  let response: NextResponse;
  if (!user && isProtected) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (user && isAuthPage) {
    response = NextResponse.redirect(new URL("/app", request.url));
  } else {
    // Built after any refresh, so the page gets the new tokens. Any copy of
    // the user header sent by the browser is dropped.
    const headers = new Headers(request.headers);
    headers.delete(USER_HEADER);
    if (user) headers.set(USER_HEADER, encodeUser(user));
    if (clearSession) {
      // The page should not see the dead session either.
      const kept = request.cookies.getAll().filter((c) => !isAuthCookie(c.name));
      headers.set("cookie", kept.map((c) => `${c.name}=${c.value}`).join("; "));
    }
    response = NextResponse.next({ request: { headers } });
  }

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }
  if (clearSession) {
    for (const { name } of request.cookies.getAll()) {
      if (isAuthCookie(name)) response.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  }
  // Responses depend on the session cookie: never cache them in between.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
