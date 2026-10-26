"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useSiteData } from "@/components/providers/SiteDataProvider";
import { track } from "@/lib/analytics";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

type BookStayLinkProps = {
  /** From getBookingUrl() (src/lib/booking.ts), resolved by a server component. */
  bookingUrl: string | null;
  className?: string;
  children?: ReactNode;
};

/**
 * "Book a Stay". Opens the hotel's booking engine when one is configured;
 * otherwise (the current state) a prefilled WhatsApp "check availability"
 * message — CLAUDE.md §D. Both open in a new tab, which the accessible name
 * says.
 */
export function BookStayLink({ bookingUrl, className, children }: BookStayLinkProps) {
  const { site } = useSiteData();
  const pathname = usePathname();

  let href = bookingUrl;
  let via = "engine";
  if (!href) {
    const contact = site.contacts.find((c) => c.department === site.primaryWhatsapp);
    const number = contact?.whatsapp ?? contact?.phone;
    if (!number) return null;
    href = buildWhatsAppUrl(number.value, whatsappMessages.availability());
    via = "whatsapp";
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track("booking_click", { via, page: pathname })}
    >
      {children ?? "Book a Stay"}
      <span className="visually-hidden">
        {via === "whatsapp" ? " — check availability on WhatsApp" : " (opens in a new tab)"}
      </span>
    </a>
  );
}
