"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/brand/Logo";
import { MedallionRing } from "@/components/brand/Ornaments";
import { BookStayLink } from "@/components/links/BookStayLink";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { pauseSmoothScroll } from "@/lib/smooth-scroll";

function CloseIcon() {
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
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function MobileMenu({ bookingUrl }: { bookingUrl: string | null }) {
  const { site } = useSiteData();
  const pathname = usePathname();
  const { open, setOpen, triggerRef } = useMobileMenu();
  const onClose = () => setOpen(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);

  // Open/close the native dialog in sync with the `open` prop.
  useEffect(() => {
    openRef.current = open;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
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

  // The hall behind the gates is Emerald (the royal identity); data-theme needs
  // its own text-ink (see CLAUDE.md §E) so colour re-resolves inside it.
  return (
    <dialog
      ref={dialogRef}
      id="mobile-menu"
      aria-label="Site menu"
      data-theme="emerald"
      data-lenis-prevent=""
      className="menu-dialog m-0 h-dvh max-h-none w-screen max-w-none bg-surface p-0 text-ink"
    >
      {/* Two gate leaves that part as the menu opens and close behind you. */}
      <div aria-hidden="true" className="menu-gate menu-gate-l" />
      <div aria-hidden="true" className="menu-gate menu-gate-r" />

      <div className="menu-hall container-site flex h-full flex-col py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
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
          <div className="menu-medallion">
            <MedallionRing className="header-ring" />
            <Logo variant="reverse" imgClassName="header-emblem" sizes="3rem" />
          </div>
        </div>

        <nav aria-label="Mobile" className="menu-arch mt-6 flex flex-1 flex-col overflow-y-auto">
          {site.navigation.main.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              aria-current={pathname === link.href ? "page" : undefined}
              className="menu-link"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="menu-foot flex flex-col gap-4 pt-6 pb-[env(safe-area-inset-bottom)]">
          <BookStayLink bookingUrl={bookingUrl} className="btn-royal btn-royal-arrow w-full" />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
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
