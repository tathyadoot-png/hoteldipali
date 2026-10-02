"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/brand/Logo";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { useSiteData } from "@/components/providers/SiteDataProvider";

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

export function MobileMenu() {
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

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      id="mobile-menu"
      aria-label="Site menu"
      className="menu-dialog m-0 h-dvh max-h-none w-screen max-w-none bg-surface p-0 text-ink"
    >
      <div className="container-site flex h-full flex-col py-6">
        <div className="flex items-center justify-between">
          <Logo variant="default" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex min-h-11 min-w-11 items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Mobile" className="mt-10 flex flex-1 flex-col gap-1 overflow-y-auto">
          {site.navigation.main.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={
                  "heading-2 flex min-h-11 items-center py-3 " +
                  (isActive ? "text-accent" : "text-ink")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
          <CallLink className="btn-ghost justify-center" />
          <WhatsAppLink context="general" className="btn-primary justify-center">
            WhatsApp us
          </WhatsAppLink>
          <p className="caption not-italic">{site.locationLine.value}</p>
        </div>
      </div>
    </dialog>
  );
}
