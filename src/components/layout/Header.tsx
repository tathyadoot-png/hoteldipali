"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLink } from "@/components/brand/Logo";
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

/**
 * The header: an ivory bar with a fine gold hairline, transparent over the
 * home hero until the next section arrives. Below xl: the menu, the logo
 * medallion exactly centred, and Book. From xl: the medallion and the name,
 * the links (a gold underline drawn from the centre on hover; a small gold
 * flame under the current page) and Book a Stay. The logo is always the gold
 * emblem on its plum medallion — never on the ivory itself.
 */
export function Header({ bookingUrl }: { bookingUrl: string | null }) {
  const { site } = useSiteData();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { open: menuOpen, setOpen: setMenuOpen, triggerRef } = useMobileMenu();

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

  const isOverlay = overlayHeaderRoutes.includes(pathname) && !scrolled;

  return (
    <header
      data-state={isOverlay ? "overlay" : "solid"}
      // Background and hairline live in .header-shell[data-state] (theme.css).
      className="header-shell sticky top-0 z-40 h-18 text-ink md:h-22"
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

        <BrandLink className="header-brand" sizes="3.25rem">
          <span aria-hidden="true" className="header-wordmark">
            <span className="header-wordmark-name">{site.name}</span>
            <span className="header-wordmark-place">{site.address.value.city}</span>
          </span>
        </BrandLink>

        <NavDesktop links={primaryNav(site.navigation.main)} pathname={pathname} />

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
