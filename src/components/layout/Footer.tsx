"use client";

import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { track } from "@/lib/analytics";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

export function Footer() {
  const { site, outlets } = useSiteData();
  const legalLinks =
    site.navigation.footer.find((group) => group.title === "Policies")?.links ?? [];

  return (
    <footer className="band-brand">
      <div className="container-site section grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-4">
        {/* Col 1: brand */}
        <div className="flex flex-col gap-4">
          <Logo variant="reverse" />
          <p className="body">{site.shortDescription.value}</p>
          <p className="body">{site.locationLine.value}</p>
          <a
            href={site.mapsUrl.value}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
            onClick={() => track("directions_click", { page: "footer" })}
          >
            Get directions
          </a>
        </div>

        {/* Col 2: contacts */}
        <div>
          {/* text-brand-ink overrides .eyebrow's default ink-muted (meant for
              light surfaces) so these headings read correctly on the brand band. */}
          <p className="eyebrow text-brand-ink">Contact</p>
          <ul className="mt-4 flex flex-col gap-3">
            {site.contacts.map((contact) => (
              <li key={contact.department} className="flex flex-col gap-1">
                <span className="body font-semibold">{contact.label}</span>
                <CallLink department={contact.department} className="body" />
                {contact.department === site.primaryWhatsapp ? (
                  <WhatsAppLink context="general" className="body">
                    WhatsApp
                  </WhatsAppLink>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: explore + dining */}
        <div>
          <p className="eyebrow text-brand-ink">Explore</p>
          <ul className="mt-4 flex flex-col gap-2">
            {site.navigation.main.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className="link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-6 text-brand-ink">Dining &amp; bakery</p>
          <ul className="mt-4 flex flex-col gap-2">
            {outlets.map((outlet) => (
              <li key={outlet.slug}>
                <Link href={`/dining/#${outlet.slug}`} prefetch={false} className="link">
                  {outlet.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: follow + legal */}
        <div>
          <p className="eyebrow text-brand-ink">Follow</p>
          <ul className="mt-4 flex flex-col gap-2">
            {site.socials.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.url.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {SOCIAL_LABELS[social.platform] ?? social.platform}
                </a>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-6 text-brand-ink">Legal</p>
          <ul className="mt-4 flex flex-col gap-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className="link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-1 py-6">
          {/* text-brand-ink overrides .caption's default ink-muted (meant for
              light surfaces) so this reads correctly against the brand band. */}
          <p className="caption not-italic text-brand-ink">
            © {new Date().getFullYear()} {site.legal.legalName.value}
          </p>
          <p className="caption not-italic text-brand-ink">Also searched as Hotel Deepali</p>
          <p className="caption not-italic text-brand-ink">GSTIN: {site.legal.gstin.value}</p>
        </div>
      </div>
    </footer>
  );
}
