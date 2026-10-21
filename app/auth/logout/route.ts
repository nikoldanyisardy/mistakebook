import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthCookie } from "@/lib/supabase/auth-shared";

// Logout in one round trip: sign out on the server, clear every Supabase
// session cookie on this response and send the browser to the landing page.
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Ignored: the cookies are cleared explicitly below.
        },
      },
    }
  );
  await supabase.auth.signOut();

  // Always clear every auth cookie (including chunks), whether or not the
  // Auth server was reachable. Same path ("/") and SameSite as when they were
  // set, so every browser, Safari included, replaces and drops them.
  for (const { name } of request.cookies.getAll()) {
    if (isAuthCookie(name)) {
      response.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0), sameSite: "lax" });
    }
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
