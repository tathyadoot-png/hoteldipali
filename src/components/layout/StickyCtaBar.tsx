"use client";

import { usePathname } from "next/navigation";

import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useMobileMenu } from "@/components/providers/MobileMenuProvider";
import { enquireHref, stickyCtaConfig, stickyCtaHiddenRoutes } from "@/lib/routes";

export function StickyCtaBar() {
  const pathname = usePathname();
  const { open: menuOpen } = useMobileMenu();

  if (stickyCtaHiddenRoutes.includes(pathname) || menuOpen) return null;

  const { label } = stickyCtaConfig(pathname);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] xl:hidden">
      <div className="grid grid-cols-3 gap-2 p-2">
        <CallLink className="btn-ghost min-h-11 justify-center px-2 text-sm">
          Call
        </CallLink>
        <WhatsAppLink context="availability" className="btn-ghost min-h-11 justify-center px-2 text-sm">
          WhatsApp
        </WhatsAppLink>
        <a href={enquireHref(pathname)} className="btn-primary min-h-11 justify-center px-2 text-sm">
          {label}
        </a>
      </div>
    </div>
  );
}
