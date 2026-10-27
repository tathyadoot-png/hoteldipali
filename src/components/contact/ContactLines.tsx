"use client";

import { CallLink } from "@/components/links/CallLink";
import { DirectionsLink } from "@/components/links/DirectionsLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { reachableContacts } from "@/lib/contacts";
import type { WhatsAppContext } from "@/lib/whatsapp";

type ContactLinesProps = {
  /** "register": the contact page's front desk — each number set large on a
   * gold rule. "list": a compact list beside an enquiry form. */
  variant: "register" | "list";
  whatsappContext?: WhatsAppContext;
  className?: string;
};

/**
 * The ways to reach the hotel, from content: every line a visitor can use
 * (sample placeholder numbers are left out — reachableContacts), WhatsApp on
 * the line that takes it, and the way to the hotel with directions. Shared by
 * the contact page and the home page's enquiry close.
 */
export function ContactLines({
  variant,
  whatsappContext = "general",
  className,
}: ContactLinesProps) {
  const { site } = useSiteData();
  const contacts = reachableContacts(site);

  return (
    <ul className={`lines lines-${variant} ${className ?? ""}`}>
      {contacts.map((contact) => {
        const whatsapp =
          contact.department === site.primaryWhatsapp && contact.whatsapp?.status !== "sample"
            ? contact.whatsapp
            : undefined;
        return (
          <li key={contact.department} className="lines-entry">
            <p className="lines-label">{contact.label}</p>
            <CallLink department={contact.department} className="lines-number">
              <span className="visually-hidden">Call {contact.label}, </span>
              {contact.phone.value}
            </CallLink>
            {whatsapp ? (
              <WhatsAppLink context={whatsappContext} className="lines-action">
                WhatsApp us
              </WhatsAppLink>
            ) : null}
          </li>
        );
      })}
      <li className="lines-entry">
        <p className="lines-label">Visit</p>
        <p className="lines-address">{site.locationLine.value}</p>
        <DirectionsLink className="lines-action" />
      </li>
    </ul>
  );
}
