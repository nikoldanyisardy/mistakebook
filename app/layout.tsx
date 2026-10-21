import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Link from "next/link";
import HeaderAuthLinks from "@/components/HeaderAuthLinks";
import LogoutButton from "@/components/LogoutButton";
import NavLinks, { ProfileLink } from "@/components/NavLinks";
import { getUser } from "@/lib/supabase/server";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "MistakeBook",
  description:
    "Log the mistakes you make on problem sets, quizzes and practice exams, and review them until you stop making them.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href={user ? "/app" : "/"} className="brand">
              <span className="brand-mark" aria-hidden="true">
                <BookCheckIcon />
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

// Logo: an open book with a checkmark, drawn as white lines.
function BookCheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 6.5C10.3 5 7.8 4.5 4 4.5v13c3.8 0 6.3.5 8 2 1.7-1.5 4.2-2 8-2v-13c-3.8 0-6.3.5-8 2z" />
      <path d="M12 6.5v13" />
      <path d="m14.6 11.4 1.7 1.7 3-3.4" />
    </svg>
  );
}
