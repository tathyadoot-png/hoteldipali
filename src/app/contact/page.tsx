import type { Metadata } from "next";

import { ContactLines } from "@/components/contact/ContactLines";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { getSite } from "@/content";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: `Contact | ${site.name}, ${site.address.value.city}`,
    description: `Call, WhatsApp or write to ${site.name} in ${site.address.value.city} — reservations, weddings and events, and directions to the hotel on Jabalpur Road.`,
  };
}

/**
 * Contact: the front desk. On emerald stone, the hotel's lines are set large
 * on gold rules — the numbers are the page's typography — beside the title;
 * then, on ivory, the enquiry form on its stone tablet. The footer finale
 * closes the page. Every line comes from content (sample placeholder numbers
 * never show — reachableContacts).
 */
export default async function ContactPage() {
  const site = await getSite();
  const city = site.address.value.city;

  return (
    <>
      <section
        data-theme="emerald"
        aria-labelledby="contact-title"
        className="contact-hero bg-surface text-ink"
      >
        <div className="contact-hero-inner container-site">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

          <div className="contact-hero-grid">
            <div className="contact-intro">
              <ScrollReveal variant="mask">
                <h1 id="contact-title" className="contact-title">
                  Contact {site.name}
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={140}>
                <span aria-hidden="true" className="contact-rule" />
                <p className="contact-lead">
                  Reservations, weddings and events, and the front desk in {city} — call, message us
                  on WhatsApp, or write to us below.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={220} className="contact-desk">
              <ContactLines variant="register" />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section
        id="enquire"
        aria-labelledby="contact-enquire"
        className="contact-enquire paper-grain bg-surface scroll-mt-24"
      >
        <div className="contact-enquire-grid container-site relative">
          <div className="contact-enquire-copy">
            <ScrollReveal variant="mask">
              <h2 id="contact-enquire" className="contact-enquire-title">
                Tell us what you are <em>planning</em>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <p className="contact-enquire-lead">
                A stay, a wedding, an event, a meal or a membership — tell us in a line or two,
                with your dates if you know them, and we will reply with the details.
              </p>
              <p className="contact-enquire-note">
                For anything urgent, call or message us on WhatsApp.
              </p>
            </ScrollReveal>
          </div>

          <EnquiryForm idPrefix="contact" className="contact-form" />
        </div>
      </section>
    </>
  );
}
