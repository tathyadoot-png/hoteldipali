"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, type FocusEvent, type PointerEvent } from "react";

type NavLink = { label: string; href: string };

/**
 * One wing of the primary nav. A hairline slides beneath — and takes the width
 * of — whichever link is pointed at or focused, and rests under the current page's link (or
 * fades away if that page lives in the other wing). Positions are measured
 * only on pointer/focus events and on resize — never while scrolling.
 */
function NavWing({ links, pathname, side }: { links: NavLink[]; pathname: string; side: "l" | "r" }) {
  const listRef = useRef<HTMLUListElement>(null);

  const place = useCallback((target: Element | null) => {
    const list = listRef.current;
    if (!list) return;
    if (!(target instanceof HTMLElement)) {
      list.dataset.glide = "off";
      return;
    }
    list.style.setProperty("--x", `${target.offsetLeft}px`);
    list.style.setProperty("--w", String(target.offsetWidth));
    list.dataset.glide = "on";
  }, []);

  const rest = useCallback(
    () => place(listRef.current?.querySelector('[aria-current="page"]') ?? null),
    [place],
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    rest();
    // Web fonts and resizes change link widths.
    const observer = new ResizeObserver(rest);
    observer.observe(list);
    return () => observer.disconnect();
  }, [rest, pathname]);

  const toLink = (event: PointerEvent | FocusEvent) =>
    place((event.target as Element).closest("a"));

  return (
    <ul
      ref={listRef}
      data-glide="off"
      className={`header-wing header-wing-${side}`}
      onPointerOver={toLink}
      onPointerLeave={rest}
      onFocus={toLink}
      onBlur={rest}
    >
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <li key={link.href}>
            {/* prefetch=false: keep the static export from prefetching every
                route on every page load. */}
            <Link
              href={link.href}
              prefetch={false}
              aria-current={isActive ? "page" : undefined}
              className="header-link"
            >
              {link.label}
            </Link>
          </li>
        );
      })}
      <li aria-hidden="true" className="header-glide" />
    </ul>
  );
}

/**
 * The primary nav, split into two wings that flank the logo keystone. The
 * keystone itself sits over the empty centre column (see Header).
 */
export function NavDesktop({ links, pathname }: { links: NavLink[]; pathname: string }) {
  const split = Math.ceil(links.length / 2);
  return (
    <nav aria-label="Primary" className="header-nav">
      <NavWing links={links.slice(0, split)} pathname={pathname} side="l" />
      <NavWing links={links.slice(split)} pathname={pathname} side="r" />
    </nav>
  );
}
