import Link from "next/link";
import type { CSSProperties } from "react";

import { BrandLink } from "@/components/brand/Logo";
import { FooterStage } from "@/components/layout/FooterStage";
import { BookStayLink } from "@/components/links/BookStayLink";
import { CallLink } from "@/components/links/CallLink";
import { DirectionsLink } from "@/components/links/DirectionsLink";
import { EnquireLink } from "@/components/links/EnquireLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import type { Outlet, Site } from "@/content";
import { reachableContacts } from "@/lib/contacts";
import { isBuiltRoute, outletHref, primaryNav } from "@/lib/routes";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

// The row of lamps along the footer's top edge. On phones every other one
// (the "wide" ones) is left out so the row stays airy.
const LAMPS = 13;

type FooterProps = {
  site: Site;
  outlets: Outlet[];
  /** From getBookingUrl() (src/lib/booking.ts), resolved by the root layout. */
  bookingUrl: string | null;
};

/**
 * The footer: plum velvet (the deep variant). A row of small gold lamps runs
 * along its top edge and lights, one after another, as it arrives
 * (FooterStage); then the invitation with Book a Stay and an enquiry; then
 * Find us, Call or message, Explore and Eat & drink; and the legal line on
 * the darker foot.
 *
 * Content rules: only lines a visitor can use (no sample placeholder
 * numbers), only links to pages that exist (isBuiltRoute), and social links
 * only once the hotel has verified them.
 */
export function Footer({ site, outlets, bookingUrl }: FooterProps) {
  const contacts = reachableContacts(site);
  const builtLinks = (title: string) =>
    (site.navigation.footer.find((group) => group.title === title)?.links ?? []).filter((link) =>
      isBuiltRoute(link.href),
    );
  const explore = [
    ...primaryNav(site.navigation.main),
    ...builtLinks("Hotel").filter((link) => link.href !== "/contact/"),
  ];
  const legal = builtLinks("Policies");
  const socials = site.socials.filter((social) => social.url.status === "verified");
  const whatsapp = site.contacts.find(
    (contact) => contact.department === site.primaryWhatsapp,
  )?.whatsapp;

  return (
    // text-ink re-declares `color` so it resolves against the deep tokens.
    <FooterStage data-theme="deep" className="site-footer text-ink">
      <div aria-hidden="true" className="footer-lamps container-site">
        {Array.from({ length: LAMPS }, (_, i) => (
          <span
            key={i}
            className={i % 2 === 1 ? "lamp footer-lamp-wide" : "lamp"}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>

      <div className="container-site">
        <div className="footer-invite">
          <BrandLink sizes="4rem" lazy />
          <h2 className="footer-title">We look forward to welcoming you</h2>
          <p className="footer-lead">Book a stay, or tell us what you are planning.</p>
          <div className="footer-actions">
            <span className="lamplight">
              <BookStayLink bookingUrl={bookingUrl} className="btn-primary">
                Book a Stay
              </BookStayLink>
            </span>
            <EnquireLink className="btn-secondary">Send an enquiry</EnquireLink>
          </div>
        </div>

        <div className="footer-cols">
          <div>
            <h3 className="eyebrow footer-label">Find us</h3>
            <p className="footer-text">{site.locationLine.value}</p>
            <DirectionsLink className="link-royal mt-2" />
          </div>

          <div>
            <h3 className="eyebrow footer-label">Call or message</h3>
            <ul className="footer-list">
              {contacts.map((contact) => (
                <li key={contact.department}>
                  <CallLink
                    department={contact.department}
                    className="footer-line"
                    labelClassName="footer-line-text"
                  >
                    <span className="footer-line-label">{contact.label}</span>
                    <span className="footer-line-value">{contact.phone.value}</span>
                  </CallLink>
                </li>
              ))}
              {whatsapp && whatsapp.status !== "sample" ? (
                <li>
                  <WhatsAppLink context="general" className="footer-line" labelClassName="footer-line-text">
                    <span className="footer-line-label">WhatsApp</span>
                    <span className="footer-line-value">{whatsapp.value}</span>
                  </WhatsAppLink>
                </li>
              ) : null}
            </ul>
          </div>

          <nav aria-label="Footer">
            <h3 className="eyebrow footer-label">Explore</h3>
            <ul className="footer-list">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} prefetch={false} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow footer-label">Eat &amp; drink</h3>
            <ul className="footer-list">
              {outlets.map((outlet) => (
                <li key={outlet.slug}>
                  <Link href={outletHref(outlet.slug)} prefetch={false} className="footer-link">
                    {outlet.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-base">
        <div className="footer-base-inner container-site">
          <p>
            © {new Date().getFullYear()} {site.legal.legalName.value}
          </p>
          <p>GSTIN {site.legal.gstin.value}</p>
          <p>Also searched as Hotel Deepali</p>
          {legal.length > 0 ? (
            <ul className="footer-base-links">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} prefetch={false} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {socials.length > 0 ? (
            <ul className="footer-base-links">
              {socials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    {SOCIAL_LABELS[social.platform] ?? social.platform}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </FooterStage>
  );
}
