"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { BookStayLink } from "@/components/links/BookStayLink";
import { NavDesktop } from "@/components/layout/NavDesktop";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { overlayHeaderRoutes, primaryNav } from "@/lib/routes";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 8.5h18M9 15.5h12" />
    </svg>
  );
}

// Scrolling past this many px of the 1px sentinel's shrunk viewport flips the
// header from overlay to solid. Detected via IntersectionObserver rootMargin,
// never a scroll listener.
const SCROLL_THRESHOLD_PX = 80;
// The header may hide once the page is this far down (in viewports): well past
// the first screen — never over a hero, nor while the home hero's name lands.
const HIDE_AFTER = 1.5;
// Scroll movement (px) that counts as a change of direction.
const DIRECTION_SLOP = 6;

/**
 * The header: a thin bar with the hotel's name at its centre. Transparent —
 * the deep scope, the name in gold — over the home hero, where the hero's own
 * giant name travels into the centre slot as the page scrolls (rich motion,
 * HomeHero → HeroMorph sets data-landed); solid ivory with a gold hairline
 * everywhere else, the name in plum. Below xl: Menu · logotype · Book. From
 * xl: three links · logotype · the other links and Book a Stay; the current
 * page carries the logo's small diamond.
 *
 * It hides while the page scrolls down past the first screen and comes back
 * on any scroll up (transform only) — never while it holds keyboard focus or
 * the menu is open.
 */
export function Header({ bookingUrl }: { bookingUrl: string | null }) {
  const { site } = useSiteData();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { open: menuOpen, setOpen: setMenuOpen, triggerRef } = useMobileMenu();
  const headerRef = useRef<HTMLElement>(null);
  const menuOpenRef = useRef(menuOpen);

  useEffect(() => {
    // A page can name the element whose arrival should end the overlay — the
    // home page uses the section that rises over its hero.
    const solidFrom = document.querySelector<HTMLElement>("[data-header-solid-from]");
    if (solidFrom) {
      const observer = new IntersectionObserver(
        ([entry]) => setScrolled(Boolean(entry?.isIntersecting)),
        // Root = everything above a line 10% down the viewport (just below the
        // header). The trigger intersects it from the moment its top crosses
        // that line and stays intersecting however far past a jump scroll
        // lands — a thin strip could be leapt over in one frame and missed.
        { rootMargin: "1000000px 0px -90% 0px", threshold: 0 },
      );
      observer.observe(solidFrom);
      return () => observer.disconnect();
    }

    const sentinel = document.getElementById("scroll-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!(entry?.isIntersecting ?? true)),
      // Grows the root 80px upward so the sentinel (pinned at document y=0)
      // keeps intersecting until the page has scrolled past that threshold.
      { rootMargin: `${SCROLL_THRESHOLD_PX}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Re-run on navigation: the trigger element only exists on some pages.
  }, [pathname]);

  // Hide on the way down, return on the way up. One rAF per scroll burst; the
  // attribute only changes when the decision does.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let last = window.scrollY;
    let frame = 0;
    const show = () => {
      if (header.dataset.hidden !== undefined) delete header.dataset.hidden;
    };
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - last;
      if (Math.abs(dy) < DIRECTION_SLOP) return;
      last = y;
      const hide =
        dy > 0 &&
        y > window.innerHeight * HIDE_AFTER &&
        !menuOpenRef.current &&
        !header.matches(":focus-within");
      if (hide) header.dataset.hidden = "";
      else show();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", show);
    return () => {
      window.removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", show);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen) delete headerRef.current?.dataset.hidden;
  }, [menuOpen]);

  const isHome = overlayHeaderRoutes.includes(pathname);
  const isOverlay = isHome && !scrolled;

  return (
    <header
      ref={headerRef}
      data-state={isOverlay ? "overlay" : "solid"}
      data-home={isHome ? "" : undefined}
      // Over the home hero the bar takes the night's colours; the deep scope
      // needs its own text-ink so colour re-resolves (CLAUDE.md §E).
      data-theme={isOverlay ? "deep" : undefined}
      // Height, position and background live in .header-shell (theme.css).
      className="header-shell text-ink"
    >
      <div className="container-site header-bar">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Menu"
          className="header-menu-button xl:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
          <span aria-hidden="true" className="header-menu-label">
            Menu
          </span>
        </button>

        <NavDesktop links={primaryNav(site.navigation.main)} pathname={pathname} />

        <Link href="/" prefetch={false} aria-label={`${site.name} — home`} className="header-logotype">
          <Wordmark name={site.name} />
        </Link>

        <div className="header-actions">
          <BookStayLink bookingUrl={bookingUrl} className="header-book btn-primary">
            {/* One flex item, so the space before "a Stay" survives. */}
            <span>
              Book<span className="header-book-more"> a Stay</span>
            </span>
          </BookStayLink>
        </div>
      </div>
    </header>
  );
}
