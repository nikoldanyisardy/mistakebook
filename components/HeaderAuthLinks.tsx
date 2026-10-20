"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Header links for logged-out visitors. The landing page has its own
// sign-up button, so the header only offers "Log in" there.
export default function HeaderAuthLinks() {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <Link href="/login" className="header-text-link">
        Log in
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="btn btn-ghost btn-small">
        Log in
      </Link>
      <Link href="/signup" className="btn btn-primary btn-small">
        Sign up
      </Link>
    </>
  );
}
