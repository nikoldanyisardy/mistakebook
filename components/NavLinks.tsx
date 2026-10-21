"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app/review", label: "Review" },
  { href: "/app", label: "My mistakes" },
  { href: "/app/new", label: "Log a mistake" },
];

function isActive(pathname: string, href: string) {
  // "/app" is only active on itself; the others also cover their sub-pages.
  return href === "/app"
    ? pathname === "/app"
    : pathname === href || pathname.startsWith(`${href}/`);
}

// <Link> prefetches these routes as soon as the nav is on screen (production
// builds). With loading.tsx in each route, the prefetch includes the loading
// skeleton, so a tap switches pages instantly while the data loads. Full-data
// prefetching is left off on purpose: it would query the database for every
// page on every visit and could show a stale list right after a change.
export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="main-nav" aria-label="Main">
      {LINKS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? "nav-link active" : "nav-link"}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ProfileLink() {
  const pathname = usePathname();
  const active = isActive(pathname, "/app/profile");

  return (
    <Link
      href="/app/profile"
      className={active ? "header-link active" : "header-link"}
      aria-current={active ? "page" : undefined}
    >
      Profile
    </Link>
  );
}
