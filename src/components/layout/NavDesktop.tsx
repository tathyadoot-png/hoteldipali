"use client";

import Link from "next/link";

type NavLink = { label: string; href: string };

export function NavDesktop({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <nav aria-label="Primary" className="flex items-center gap-7">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          // prefetch=false: most of these routes aren't built until later steps
          // and would otherwise 404-prefetch on every page load.
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            className={
              "body border-b-2 pb-1 font-medium " +
              (isActive ? "border-accent text-accent" : "border-transparent")
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
