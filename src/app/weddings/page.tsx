import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { getVenues, type Venue } from "@/content";

export const metadata: Metadata = {
  title: "Weddings & Celebrations | Hotel Dipali, Sagar",
  description:
    "Lawns and banquet halls at Hotel Dipali, Sagar for weddings, receptions, ring ceremonies, birthdays and corporate events. Enquire to plan your celebration.",
};

const KIND_LABEL: Record<Venue["kind"], string> = {
  lawn: "Lawn",
  hall: "Banquet hall",
  poolside: "Poolside lawn",
  terrace: "Terrace",
};

// Human labels for the occasion slugs used in venue `suitableFor`. Only slugs
// that actually appear in the content are ever rendered; the order is a display
// preference, not an invented list.
const OCCASION_LABELS: Record<string, string> = {
  weddings: "Weddings",
  receptions: "Receptions",
  sangeet: "Sangeet",
  cocktails: "Cocktail evenings",
  "ring-ceremonies": "Ring ceremonies",
  anniversaries: "Anniversaries",
  birthdays: "Birthdays",
  corporate: "Corporate events",
  conferences: "Conferences",
};
const OCCASION_ORDER = Object.keys(OCCASION_LABELS);

function formatArea(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sq ft`;
}

export default async function WeddingsPage() {
  const venues = await getVenues();
  const [featured, ...supporting] = venues;
  const heroImage = featured?.images[0];

  // Occasions supported across all venues, in display order, each with the
  // spaces that list it — entirely derived from venue `suitableFor` data.
  const occasions = OCCASION_ORDER.flatMap((slug) => {
    const spaces = venues.filter((v) => v.suitableFor.includes(slug));
    return spaces.length ? [{ slug, label: OCCASION_LABELS[slug]!, spaces }] : [];
  });

  const lawnCount = venues.filter((v) => !v.indoor).length;
  const hallCount = venues.filter((v) => v.indoor).length;

  return (
    <>
      {/* ───────────────────────── HERO (Peacock) ─────────────────────────
          Cinematic venue cover. The header is solid on this route, so the
          hero sits below it rather than pulling under a transparent header. */}
      <section
        data-theme="peacock"
        className="relative flex min-h-[82vh] flex-col overflow-hidden bg-surface text-ink"
        aria-labelledby="weddings-title"
      >
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export; decorative hero background */}
            <img
              src={heroImage.src}
              alt=""
              aria-hidden="true"
              width={heroImage.width}
              height={heroImage.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden="true" className="hero-tint absolute inset-0" />
            <div aria-hidden="true" className="hero-gradient absolute inset-0" />
          </>
        ) : null}

        <div className="container-site relative z-10 flex flex-1 flex-col pt-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Weddings" }]} />

          <div className="mt-auto max-w-2xl pb-16 md:pb-20">
            <p className="eyebrow">Celebrations at Hotel Dipali</p>
            <hr className="rule-ornament mt-5" aria-hidden="true" />

            <h1 id="weddings-title" className="heading-hero mt-6">
              Weddings &amp;
              <br />
              <em>celebrations</em>
            </h1>

            <p className="body-lg mt-6 max-w-lg text-ink-muted">
              Open-air lawns and banquet halls for weddings, receptions and every
              gathering in between — in the heart of Sagar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href="#enquire" className="btn-primary">
                Plan your wedding
              </a>
              <WhatsAppLink context="wedding" className="btn-ghost" />
            </div>

            <p className="caption mt-8 text-ink-muted">
              {venues.length} spaces · {lawnCount} open-air {lawnCount === 1 ? "lawn" : "lawns"} ·{" "}
              {hallCount} banquet {hallCount === 1 ? "hall" : "halls"}
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── INTRO (Ivory) ───────────────────────── */}
      <section className="paper-grain bg-surface py-16 md:py-20" aria-labelledby="weddings-intro">
        <div className="container-site relative">
          <ScrollReveal>
            <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h2 id="weddings-intro" className="heading-2">
                  A setting that carries the day
                </h2>
              </div>
              <div className="lg:col-span-5 lg:pt-2">
                <p className="body-lg text-ink-muted">
                  Lawns for open-air mandaps and banquet halls for all-weather receptions
                  — with room to welcome a few guests or a few hundred. Tell us about your
                  celebration and we will help you choose the right space.
                </p>
                <Botanical variant="vine" className="mt-7 w-36 text-highlight" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───────────────────── FEATURED VENUE (Peacock) ─────────────────────
          Signature device: a dominant venue image with a smaller framed inset
          crossing its edge, carried through the whole showcase below. */}
      {featured ? (
        <section
          data-theme="peacock"
          className="bg-surface py-16 text-ink md:py-20"
          aria-labelledby="venue-featured"
        >
          <div className="container-site">
            <ScrollReveal>
              <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <VenueFrame venue={featured} priority />
                </div>

                <div className="lg:col-span-5">
                  <p className="eyebrow">
                    {KIND_LABEL[featured.kind]} · The flagship space
                  </p>
                  <h2 id="venue-featured" className="heading-1 mt-4">
                    {featured.name}
                  </h2>

                  <VenueScale venue={featured} className="mt-7" />

                  <ul className="mt-7 flex flex-col gap-2">
                    {featured.highlights.map((h) => (
                      <li key={h} className="body text-ink-muted">
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <a href="#enquire" className="btn-primary">
                      Enquire about the {featured.name}
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {/* ─────────────────── SUPPORTING VENUES (Ivory) ───────────────────
          Alternating image side, so the showcase has rhythm rather than a grid. */}
      {supporting.length > 0 ? (
        <section className="bg-surface-alt py-16 md:py-20" aria-labelledby="venues-more">
          <div className="container-site">
            <h2 id="venues-more" className="heading-2">
              More spaces to celebrate
            </h2>

            <div className="mt-12 flex flex-col gap-16 md:gap-20">
              {supporting.map((venue, i) => {
                const imageRight = i % 2 === 1;
                return (
                  <ScrollReveal key={venue.slug}>
                    <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12">
                      <div
                        className={`lg:col-span-7 ${imageRight ? "lg:order-2 lg:col-start-6" : ""}`}
                      >
                        <VenueFrame venue={venue} />
                      </div>

                      <div className={`lg:col-span-5 ${imageRight ? "lg:order-1" : ""}`}>
                        <p className="eyebrow">
                          {KIND_LABEL[venue.kind]} · {venue.indoor ? "Indoor" : "Open-air"}
                        </p>
                        <h3 className="heading-2 mt-3">{venue.name}</h3>

                        <VenueScale venue={venue} className="mt-6" />

                        <ul className="mt-6 flex flex-col gap-2">
                          {venue.highlights.map((h) => (
                            <li key={h} className="body text-ink-muted">
                              {h}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-7">
                          <a href="#enquire" className="link">
                            Enquire about the {venue.name}
                          </a>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────────────────── COMPARISON (Ivory) ─────────────────────
          Shared fields only. Desktop: aligned columns. Mobile: labelled rows. */}
      <section className="bg-surface py-16 md:py-20" aria-labelledby="venues-compare">
        <div className="container-site">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="venues-compare" className="heading-2">
              Compare the spaces
            </h2>
            <p className="caption">Seated and floating numbers are indicative</p>
          </div>

          <div
            aria-hidden="true"
            className="mt-10 hidden border-b border-line pb-3 lg:grid lg:grid-cols-12 lg:gap-6"
          >
            <p className="eyebrow lg:col-span-4">Space</p>
            <p className="eyebrow lg:col-span-2">Type</p>
            <p className="eyebrow lg:col-span-2">Seated</p>
            <p className="eyebrow lg:col-span-2">Floating</p>
            <p className="eyebrow lg:col-span-2">Size</p>
          </div>

          <ul className="divide-y divide-line border-b border-line">
            {venues.map((venue) => (
              <li
                key={venue.slug}
                className="grid grid-cols-1 gap-x-6 gap-y-3 py-6 lg:grid-cols-12 lg:items-baseline"
              >
                <h3 className="heading-3 lg:col-span-4">{venue.name}</h3>
                <CompareCell label="Type" value={KIND_LABEL[venue.kind]} span="lg:col-span-2" />
                <CompareCell label="Seated" value={`${venue.capacitySeated}`} span="lg:col-span-2" />
                <CompareCell label="Floating" value={`${venue.capacityFloating}`} span="lg:col-span-2" />
                <CompareCell
                  label="Size"
                  value={venue.areaSqft ? formatArea(venue.areaSqft) : null}
                  span="lg:col-span-2"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────────────── OCCASIONS (Ivory alt) ─────────────────────
          Derived from venue `suitableFor`: each occasion names the spaces
          that suit it, so it doubles as a finder. */}
      {occasions.length > 0 ? (
        <section
          className="paper-grain bg-surface-alt py-16 md:py-20"
          aria-labelledby="occasions"
        >
          <div className="container-site relative">
            <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 id="occasions" className="heading-2">
                  Every kind of gathering
                </h2>
                <Botanical variant="flower" className="mt-6 h-14 w-14 text-highlight" />
              </div>

              <ul className="divide-y divide-line border-y border-line lg:col-span-8">
                {occasions.map((occasion) => (
                  <li
                    key={occasion.slug}
                    className="flex flex-col gap-1 py-5 md:flex-row md:items-baseline md:justify-between md:gap-8"
                  >
                    <h3 className="heading-3">{occasion.label}</h3>
                    <p className="caption not-italic text-right text-ink-muted">
                      {occasion.spaces.map((s) => s.name).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────────────────── ENQUIRY (Peacock) ───────────────────── */}
      <section
        id="enquire"
        data-theme="peacock"
        className="paper-grain bg-surface py-16 text-ink md:py-20"
        aria-labelledby="weddings-enquire"
      >
        <div className="container-site relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 id="weddings-enquire" className="heading-1">
                Plan your <em>celebration</em>
              </h2>
              <p className="body-lg mt-6 text-ink-muted">
                Tell us the occasion, your dates and roughly how many guests. We will
                suggest the right space and reply with the details.
              </p>
              <Botanical variant="vine" className="mt-8 w-40 text-highlight" />
              <div className="mt-8 flex flex-col items-start gap-3">
                <CallLink className="link" />
                <WhatsAppLink context="wedding" className="link" />
              </div>
            </div>

            <div className="lg:col-span-7">
              <EnquiryForm
                enquiryTypes={["wedding", "event"]}
                defaultEnquiryType="wedding"
                idPrefix="weddings"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** A dominant venue image with a smaller framed inset crossing its lower edge —
 *  the page's recurring editorial device. Falls back gracefully to one image. */
function VenueFrame({ venue, priority = false }: { venue: Venue; priority?: boolean }) {
  const [main, inset] = venue.images;
  if (!main) return null;

  return (
    <div className="relative">
      <div className="img-hover">
        <Picture
          image={main}
          ratio="4:3"
          sizes="(min-width: 1024px) 58vw, 100vw"
          priority={priority}
        />
      </div>
      {inset ? (
        <div className="frame-hairline absolute -right-4 -bottom-8 hidden w-40 bg-surface p-2 lg:block xl:w-48">
          <Picture image={inset} ratio="1:1" decorative sizes="12rem" />
        </div>
      ) : null}
    </div>
  );
}

/** Capacity + size readout. Each item renders only when its data exists. */
function VenueScale({ venue, className }: { venue: Venue; className?: string }) {
  return (
    <dl
      className={`grid grid-cols-3 gap-x-6 gap-y-2 border-y border-line py-5 ${className ?? ""}`}
    >
      <ScaleItem label="Seated" value={`${venue.capacitySeated}`} />
      <ScaleItem label="Floating" value={`${venue.capacityFloating}`} />
      {venue.areaSqft ? <ScaleItem label="Size" value={formatArea(venue.areaSqft)} /> : null}
    </dl>
  );
}

function ScaleItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

/** One comparison value: labelled inline on mobile, aligned to the column
 *  headings from lg up. Renders nothing when the fact is absent. */
function CompareCell({
  label,
  value,
  span,
}: {
  label: string;
  value: string | null;
  span: string;
}) {
  if (!value) return null;
  return (
    <p className={`body flex gap-2 text-ink-muted lg:block ${span}`}>
      <span className="eyebrow shrink-0 self-center lg:hidden">{label}</span>
      <span>{value}</span>
    </p>
  );
}
