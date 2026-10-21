import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { decodeUser, USER_HEADER } from "@/lib/supabase/auth-shared";

// Server client for Server Components, Server Actions and Route Handlers.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component: cookies can't be set here.
            // The proxy refreshes the session instead.
          }
        },
      },
    }
  );
}

// The logged-in user for this request, as verified by the proxy with the
// Supabase Auth server (see proxy.ts). The layout and every page read the same
// value, so the header and the page can't disagree. No header means logged out.
export const getUser = cache(async () => {
  return decodeUser((await headers()).get(USER_HEADER));
});
