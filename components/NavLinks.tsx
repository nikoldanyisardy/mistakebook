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
      className={active ? "btn btn-ghost btn-small active" : "btn btn-ghost btn-small"}
      aria-current={active ? "page" : undefined}
    >
      Profile
    </Link>
  );
}
