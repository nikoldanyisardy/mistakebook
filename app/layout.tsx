import type { Metadata, Viewport } from "next";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdTech App",
  description: "EdTech Challenge app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href={user ? "/app" : "/"} className="brand">
            EdTech App
          </Link>
          <nav className="nav">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
