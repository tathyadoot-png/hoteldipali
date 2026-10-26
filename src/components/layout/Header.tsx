"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { MedallionRing } from "@/components/brand/Ornaments";
import { BookStayLink } from "@/components/links/BookStayLink";
import { CallLink } from "@/components/links/CallLink";
import { NavDesktop } from "@/components/layout/NavDesktop";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { overlayHeaderRoutes } from "@/lib/routes";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

export function Header({ bookingUrl }: { bookingUrl: string | null }) {
  const { site } = useSiteData();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { open: menuOpen, setOpen: setMenuOpen, triggerRef } = useMobileMenu();

  useEffect(() => {
    // A page can name the element whose arrival should end the overlay — the
    // home page uses the ivory arch that rises over its entrance film, so the
    // header stays transparent for the whole pinned scene.
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
      data-theme="emerald"
      data-state={isOverlay ? "overlay" : "solid"}
      // text-ink re-declares `color` on this element so it re-resolves against
      // the emerald-scoped --color-ink (inherited `color` would not).
      // Background lives in .header-shell[data-state] (theme.css).
      className="header-shell sticky top-0 z-40 flex h-18 items-center text-ink md:h-22"
    >
      {/* The engraved band: two gold rules run from either end to a medallion
          holding the emblem; the links sit inside the band and a small gold
          bead slides along its lower rule. Ends: the call link (left, xl) and
          Book a Stay (right); below xl the menu takes the left end. */}
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

        <span aria-hidden="true" className="header-band header-band-l" />
        <span aria-hidden="true" className="header-band header-band-r" />

        <NavDesktop links={site.navigation.main} pathname={pathname} />

        <div className="header-keystone">
          <MedallionRing className="header-ring" />
          <Logo variant="reverse" imgClassName="header-emblem" sizes="3rem" />
        </div>

        {/* The wrapper owns the display rule (the link carries inline-flex
            utilities, which would outrank a component-layer display:none). */}
        <span className="header-call">
          <CallLink labelClassName="header-call-label" />
        </span>

        <BookStayLink bookingUrl={bookingUrl} className="header-book btn-royal">
          {/* One flex item, so the space before "a Stay" survives. */}
          <span>
            Book<span className="header-book-more"> a Stay</span>
          </span>
        </BookStayLink>
      </div>
    </header>
  );
}
