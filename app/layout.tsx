import type { Metadata, Viewport } from "next";
import Link from "next/link";
import HeaderAuthLinks from "@/components/HeaderAuthLinks";
import LogoutButton from "@/components/LogoutButton";
import NavLinks, { ProfileLink } from "@/components/NavLinks";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "MistakeBook",
  description:
    "Log the mistakes you make on problem sets, quizzes and practice exams, and review them until you stop making them.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17120f",
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
          <div className="header-inner">
            <Link href={user ? "/app" : "/"} className="brand">
              <span className="brand-mark" aria-hidden="true">
                M
              </span>
              MistakeBook
            </Link>
            {user ? (
              <>
                <NavLinks />
                <div className="header-actions">
                  <ProfileLink />
                  <LogoutButton />
                </div>
              </>
            ) : (
              <div className="header-actions">
                <HeaderAuthLinks />
              </div>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
