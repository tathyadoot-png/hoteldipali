import Link from "next/link";

type NavLink = { label: string; href: string };

/**
 * The primary nav from xl: one row of links. Hover or focus draws a gold
 * underline out from each link's centre; the current page carries a small
 * gold flame under its label (aria-current="page"). CSS only.
 */
export function NavDesktop({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <nav aria-label="Primary" className="header-nav">
      <ul className="header-links">
        {links.map((link) => (
          <li key={link.href}>
            {/* prefetch=false: keep the static export from prefetching every
                route on every page load. */}
            <Link
              href={link.href}
              prefetch={false}
              aria-current={pathname === link.href ? "page" : undefined}
              className="header-link"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
