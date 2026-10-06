import Link from "next/link";
import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { EventFinder, type EventType } from "@/components/events/EventFinder";
import { getVenues } from "@/content";

export const metadata: Metadata = {
  title: "Events & Celebrations | Hotel Dipali, Sagar",
  description:
    "Host birthdays, ring ceremonies, corporate days and receptions at Hotel Dipali, Sagar. Find the lawn or banquet hall that fits your gathering and enquire.",
};

// Display labels for the occasion slugs in venue `suitableFor`. Only slugs that
// actually appear in the content are rendered. The order is event-first — the
// Weddings page leads with wedding occasions; this page does not.
const OCCASION_LABELS: Record<string, string> = {
  birthdays: "Birthdays",
  "ring-ceremonies": "Ring ceremonies",
  anniversaries: "Anniversaries",
  corporate: "Corporate events",
  conferences: "Conferences",
  receptions: "Receptions",
  cocktails: "Cocktail evenings",
  sangeet: "Sangeet",
  weddings: "Weddings",
};
const EVENT_TYPE_ORDER = Object.keys(OCCASION_LABELS);

export default async function EventsPage() {
  const venues = await getVenues();
  const heroImage =
    venues.find((v) => v.slug === "grand-banquet-hall")?.images[0] ?? venues[0]?.images[0];

  // Event types present across all venues, in the event-first display order.
  const present = new Set(venues.flatMap((v) => v.suitableFor));
  const eventTypes: EventType[] = EVENT_TYPE_ORDER.filter((slug) => present.has(slug)).map(
    (slug) => ({ slug, label: OCCASION_LABELS[slug]! }),
  );

  return (
    <>
      {/* ───────────────────────── HERO (Light split) ─────────────────────────
          A split, image-beside-text opening — deliberately lighter and calmer
          than the Weddings page's full-bleed Dusk cover. */}
      <section
        className="paper-grain bg-surface pt-10 pb-16 md:pb-20"
        aria-labelledby="events-title"
      >
        <div className="container-site relative">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />

          <div className="mt-10 grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow">Events &amp; gatherings</p>
              <h1 id="events-title" className="heading-hero mt-5">
                Room for every <em>occasion</em>
              </h1>
              <p className="body-lg mt-6 text-ink-muted">
                Birthdays, ring ceremonies, corporate days and receptions — in open-air
                lawns and banquet halls sized from intimate to grand.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a href="#enquire" className="btn-primary">
                  Enquire now
                </a>
                <WhatsAppLink context="celebration" className="btn-ghost" />
              </div>
            </div>

            {heroImage ? (
              <div className="img-hover lg:col-span-7">
                <Picture
                  image={heroImage}
                  ratio="16:9"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ───────────────────── EVENT FINDER (surface-alt) ─────────────────────
          DISCOVER + MATCH: the page's core device. */}
      <section className="bg-surface-alt py-16 md:py-20" aria-labelledby="events-finder">
        <div className="container-site">
          <ScrollReveal>
            <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 id="events-finder" className="heading-2">
                  Find your space
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <p className="body-lg text-ink-muted">
                  Choose the kind of gathering you are planning to see the lawns and halls
                  that suit it. Capacities are indicative — tell us your numbers and we
                  will confirm.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-12">
            <EventFinder venues={venues} eventTypes={eventTypes} />
          </div>
        </div>
      </section>

      {/* ───────────────── WEDDINGS CROSS-LINK (Light) ─────────────────
          Keeps wedding-specific storytelling on its own page. */}
      <section className="bg-surface py-14 md:py-16" aria-labelledby="events-weddings">
        <div className="container-site">
          <div className="flex flex-col gap-6 border-y border-line py-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 id="events-weddings" className="heading-3">
                Planning a wedding?
              </h2>
              <p className="body mt-2 text-ink-muted">
                The lawns, the mandap and the full wedding story have a page of their own.
              </p>
            </div>
            <Link href="/weddings/" prefetch={false} className="btn-secondary shrink-0">
              Explore Weddings
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────── ENQUIRY (Dusk) ───────────────────── */}
      <section
        id="enquire"
        data-theme="dusk"
        className="paper-grain bg-surface py-16 text-ink md:py-20"
        aria-labelledby="events-enquire"
      >
        <div className="container-site relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 id="events-enquire" className="heading-1">
                Let&rsquo;s plan the <em>occasion</em>
              </h2>
              <p className="body-lg mt-6 text-ink-muted">
                Tell us the kind of event, your dates and roughly how many guests. We will
                suggest the right space and reply with the details.
              </p>
              <Botanical variant="flower" className="mt-8 h-14 w-14 text-highlight" />
              <div className="mt-8 flex flex-col items-start gap-3">
                <CallLink className="link" />
                <WhatsAppLink context="celebration" className="link" />
              </div>
            </div>

            <div className="lg:col-span-7">
              <EnquiryForm
                enquiryTypes={["event", "wedding"]}
                defaultEnquiryType="event"
                idPrefix="events"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
