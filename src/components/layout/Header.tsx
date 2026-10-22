"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { CallLink } from "@/components/links/CallLink";
import { NavDesktop } from "@/components/layout/NavDesktop";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { enquireHref, overlayHeaderRoutes } from "@/lib/routes";

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
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

// Scrolling past this many px of the 1px sentinel's shrunk viewport flips the
// header from overlay to solid. Detected via IntersectionObserver rootMargin,
// never a scroll listener.
const SCROLL_THRESHOLD_PX = 80;

export function Header() {
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
      data-theme={isOverlay ? "peacock" : undefined}
      data-state={isOverlay ? "overlay" : "solid"}
      className={
        // text-ink re-declares `color` on this element so it re-resolves
        // against the (possibly peacock-scoped) --color-ink custom property —
        // inherited `color` only carries the already-resolved parent value.
        "header-shell sticky top-0 z-40 flex h-18 items-center text-ink md:h-22 " +
        (isOverlay ? "bg-transparent" : "bg-surface")
      }
    >
      {/* Three columns around a centred keystone: the nav's two wings flank
          the logo; the outer edges hold the call link and the enquiry arch
          (below xl: the menu and the call link). */}
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

        <NavDesktop links={site.navigation.main} pathname={pathname} />

        <div className="header-keystone">
          <Logo
            variant={isOverlay ? "reverse" : "default"}
            imgClassName="h-16 md:h-21"
          />
        </div>

        <CallLink className="header-call" labelClassName="header-call-label" />

        <a href={enquireHref(pathname)} className="header-enquire btn-primary btn-arch">
          Enquire
        </a>
      </div>
    </header>
  );
}
