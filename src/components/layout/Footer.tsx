import Link from "next/link";
import type { CSSProperties } from "react";

import { Logo } from "@/components/brand/Logo";
import { MedallionRing } from "@/components/brand/Ornaments";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { FooterStage } from "@/components/layout/FooterStage";
import { BookStayLink } from "@/components/links/BookStayLink";
import { CallLink } from "@/components/links/CallLink";
import { DirectionsLink } from "@/components/links/DirectionsLink";
import { EnquireLink } from "@/components/links/EnquireLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import type { Outlet, Site } from "@/content";
import { reachableContacts } from "@/lib/contacts";
import { isBuiltRoute, outletHref } from "@/lib/routes";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

// The archivolts: contours of the gateway's arch, each one order further out.
const ORDERS = [1, 2, 3];

type FooterProps = {
  site: Site;
  outlets: Outlet[];
  /** From getBookingUrl() (src/lib/booking.ts), resolved by the root layout. */
  bookingUrl: string | null;
};

/**
 * The finale: an emerald stone band whose centre is a gateway — its crown
 * rises above the footer's top edge, the emblem in its arched head, the
 * invitation and the booking action inside. As the footer arrives one gold
 * line draws it (FooterStage, theme.css): in from the left along the string
 * course, over the arch and the keystone, out to the right; the jambs drop to
 * the plinth and three archivolts — the arch's contours, one order further out
 * each — spread across the stone. Contacts and wayfinding sit quietly beside it.
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
  const explore = [...site.navigation.main, ...builtLinks("Hotel")];
  const legal = builtLinks("Policies");
  const socials = site.socials.filter((social) => social.url.status === "verified");
  const whatsapp = site.contacts.find(
    (contact) => contact.department === site.primaryWhatsapp,
  )?.whatsapp;

  return (
    // text-ink re-declares `color` so it resolves against the emerald tokens.
    <FooterStage data-theme="emerald" className="finale text-ink">
      <div aria-hidden="true" className="finale-surface">
        <div className="finale-stone" />
        {/* Clipped by the band's top edge: they show in the frieze only. */}
        <div className="finale-orders">
          {ORDERS.map((n) => (
            <span key={n} className="finale-order" style={{ "--n": n } as CSSProperties} />
          ))}
        </div>
      </div>

      <div className="finale-inner container-site">
        {/* The gateway: a stone ring around a lit opening. Its outer line is
            the arch (one stroke, drawn left to right) and the jambs below it;
            the inner line follows the opening. */}
        <div className="finale-gate">
          <svg aria-hidden="true" className="finale-arch" viewBox="0 0 200 100" fill="none">
            <path pathLength={1} d="M0.3 100A99.7 99.7 0 0 1 199.7 100" />
          </svg>
          <div className="finale-door">
            <div className="finale-medallion">
              <MedallionRing className="finale-ring" />
              <Logo variant="reverse" imgClassName="finale-emblem" sizes="4rem" lazy />
            </div>
            <h2 className="finale-title">
              <span className="finale-line" style={{ "--l": 0 } as CSSProperties}>
                We look forward
              </span>{" "}
              <span className="finale-line" style={{ "--l": 1 } as CSSProperties}>
                to <em>welcoming you</em>
              </span>
            </h2>
            <p className="finale-lead">Book a stay, or tell us what you are planning.</p>
            <div className="finale-actions">
              <BookStayLink bookingUrl={bookingUrl} className="btn-primary finale-book">
                Book a Stay
              </BookStayLink>
              <EnquireLink className="btn-secondary finale-enquire">Send an enquiry</EnquireLink>
            </div>
          </div>
          <span aria-hidden="true" className="finale-key" />
        </div>

        <span aria-hidden="true" className="finale-plinth" />

        <span aria-hidden="true" className="finale-course finale-course-l" />
        <span aria-hidden="true" className="finale-course finale-course-r" />

        <div className="finale-side finale-side-l">
          <ScrollReveal className="finale-group" delay={260}>
            <h3 className="finale-label">Find us</h3>
            <p className="finale-text">{site.locationLine.value}</p>
            <DirectionsLink className="finale-link" />
          </ScrollReveal>
          <ScrollReveal className="finale-group" delay={340}>
            <h3 className="finale-label">Call or message</h3>
            <ul className="finale-lines">
              {contacts.map((contact) => (
                <li key={contact.department}>
                  <CallLink
                    department={contact.department}
                    className="finale-line-link"
                    labelClassName="finale-line-text"
                  >
                    <span className="finale-line-label">{contact.label}</span>
                    <span className="finale-line-value">{contact.phone.value}</span>
                  </CallLink>
                </li>
              ))}
              {whatsapp && whatsapp.status !== "sample" ? (
                <li>
                  <WhatsAppLink
                    context="general"
                    className="finale-line-link"
                    labelClassName="finale-line-text"
                  >
                    <span className="finale-line-label">WhatsApp</span>
                    <span className="finale-line-value">{whatsapp.value}</span>
                  </WhatsAppLink>
                </li>
              ) : null}
            </ul>
          </ScrollReveal>
        </div>

        <nav aria-label="Footer" className="finale-side finale-side-r">
          <ScrollReveal className="finale-group" delay={300}>
            <h3 className="finale-label">Explore</h3>
            <ul className="finale-links">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} prefetch={false} className="finale-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>
          <ScrollReveal className="finale-group" delay={380}>
            <h3 className="finale-label">Eat &amp; drink</h3>
            <ul className="finale-links">
              {outlets.map((outlet) => (
                <li key={outlet.slug}>
                  <Link href={outletHref(outlet.slug)} prefetch={false} className="finale-link">
                    {outlet.name}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </nav>
      </div>

      <div className="finale-base container-site">
        <p>
          © {new Date().getFullYear()} {site.legal.legalName.value}
        </p>
        <p>GSTIN {site.legal.gstin.value}</p>
        <p>Also searched as Hotel Deepali</p>
        {legal.length > 0 ? (
          <ul className="finale-base-links">
            {legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className="finale-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {socials.length > 0 ? (
          <ul className="finale-base-links">
            {socials.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.url.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="finale-link"
                >
                  {SOCIAL_LABELS[social.platform] ?? social.platform}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FooterStage>
  );
}
