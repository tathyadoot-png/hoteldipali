"use client";

import { usePathname } from "next/navigation";

import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { enquireHref, stickyCtaConfig, stickyCtaHiddenRoutes } from "@/lib/routes";

/**
 * The phone bar below xl: Call · WhatsApp · the page's own action (Enquire,
 * Plan wedding, Check availability), in gold on plum (the deep variant), clear
 * of the phone's safe area. Hidden while the menu is open, which offers the
 * same three.
 */
export function StickyCtaBar() {
  const pathname = usePathname();
  const { open: menuOpen } = useMobileMenu();

  if (stickyCtaHiddenRoutes.includes(pathname) || menuOpen) return null;

  const { label } = stickyCtaConfig(pathname);

  // The deep scope needs its own text-ink (CLAUDE.md §E).
  return (
    <div data-theme="deep" className="sticky-bar text-ink">
      <div className="sticky-bar-row">
        <CallLink className="sticky-link">Call</CallLink>
        <WhatsAppLink context="availability" className="sticky-link">
          WhatsApp
        </WhatsAppLink>
        <a href={enquireHref(pathname)} className="btn-primary btn-compact">
          {label}
        </a>
      </div>
    </div>
  );
}
