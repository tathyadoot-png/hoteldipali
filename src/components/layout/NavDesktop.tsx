import Link from "next/link";

type NavLink = { label: string; href: string };

/** How many links stand to the left of the logotype; the rest go right. */
const START_COUNT = 3;

/**
 * The primary nav from xl, in two lists either side of the header's
 * logotype (one landmark: the nav is `display: contents` there). Hover or
 * focus draws a gold underline out from each link's centre; the current page
 * carries the logo's small diamond under its label (aria-current="page").
 * CSS only.
 */
export function NavDesktop({ links, pathname }: { links: NavLink[]; pathname: string }) {
  const lists = [links.slice(0, START_COUNT), links.slice(START_COUNT)];
  return (
    <nav aria-label="Primary" className="header-nav">
      {lists.map((list, side) => (
        <ul key={side} className={side === 0 ? "header-links header-links-start" : "header-links header-links-end"}>
          {list.map((link) => (
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
      ))}
    </nav>
  );
}
