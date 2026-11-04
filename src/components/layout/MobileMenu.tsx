"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";

import { BrandLink } from "@/components/brand/Logo";
import { BookStayLink } from "@/components/links/BookStayLink";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { primaryNav } from "@/lib/routes";
import { pauseSmoothScroll } from "@/lib/smooth-scroll";

function CloseIcon() {
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
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const LAMPS = 7;

/**
 * The menu below xl: a full-screen plum night (the deep variant). The links
 * are set large in Cormorant with roman numerals; a row of lamps lights as
 * it opens; Book a Stay, Call and WhatsApp wait at the foot. A native modal
 * <dialog>: focus is trapped, Escape closes it, focus returns to the Menu
 * button, and the page behind stops scrolling.
 */
export function MobileMenu({ bookingUrl }: { bookingUrl: string | null }) {
  const { site } = useSiteData();
  const pathname = usePathname();
  const { open, setOpen, triggerRef } = useMobileMenu();
  const onClose = () => setOpen(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lampsRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  // Open/close the native dialog in sync with the `open` prop; the lamps
  // light one frame after it opens, so their transitions run.
  useEffect(() => {
    openRef.current = open;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    const lamps = lampsRef.current;
    if (!lamps) return;
    if (!open) {
      delete lamps.dataset.lit;
      return;
    }
    const frame = requestAnimationFrame(() => {
      lamps.dataset.lit = "";
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Native close (Escape, or our own close()) returns focus to the trigger.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      setOpen(false);
      triggerRef.current?.focus();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [setOpen, triggerRef]);

  // Close on route change (e.g. tapping a nav link), skipping the initial mount.
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (openRef.current) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock page scroll while open (smooth scrolling pauses too; the menu itself
  // still scrolls natively — it is marked data-lenis-prevent).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pauseSmoothScroll(true);
    return () => {
      document.body.style.overflow = previous;
      pauseSmoothScroll(false);
    };
  }, [open]);

  const links = primaryNav(site.navigation.main);

  // The deep scope needs its own text-ink (CLAUDE.md §E) so colour re-resolves.
  return (
    <dialog
      ref={dialogRef}
      id="mobile-menu"
      aria-label="Site menu"
      data-theme="deep"
      data-lenis-prevent=""
      className="menu-dialog m-0 h-dvh max-h-none w-screen max-w-none p-0 text-ink"
    >
      <div className="container-site flex h-full flex-col overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="menu-top">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="header-menu-button"
          >
            <CloseIcon />
            <span aria-hidden="true" className="header-menu-label">
              Close
            </span>
          </button>
          <BrandLink sizes="2.875rem" />
        </div>

        <div ref={lampsRef} aria-hidden="true" className="menu-lamps">
          {Array.from({ length: LAMPS }, (_, i) => (
            <span key={i} className="lamp" style={{ "--i": i } as CSSProperties} />
          ))}
        </div>

        <nav aria-label="Mobile" className="menu-nav mt-4 flex-1">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              aria-current={pathname === link.href ? "page" : undefined}
              className="menu-link"
              style={{ "--i": index } as CSSProperties}
            >
              <span aria-hidden="true" className="menu-num">
                {NUMERALS[index] ?? index + 1}
              </span>
              <span className="menu-label">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="menu-foot pt-8">
          <BookStayLink bookingUrl={bookingUrl} className="btn-primary w-full" />
          <div className="menu-lines">
            <CallLink className="link-royal" />
            <WhatsAppLink context="general" className="link-royal">
              WhatsApp us
            </WhatsAppLink>
          </div>
          <p className="menu-address">{site.locationLine.value}</p>
        </div>
      </div>
    </dialog>
  );
}
