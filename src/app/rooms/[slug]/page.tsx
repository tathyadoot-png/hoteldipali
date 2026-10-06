import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Picture } from "@/components/media/Picture";
import { RoomCard } from "@/components/cards/RoomCard";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { getRoom, getRoomSlugs, getRooms } from "@/content";
import { formatMoney } from "@/lib/format";

type RoomPageProps = { params: Promise<{ slug: string }> };

// STATIC-ONLY: every room route is emitted at build time from the content
// loader. When the source becomes a CMS this stays the same shape — only the
// loader changes.
export async function generateStaticParams() {
  const slugs = await getRoomSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room) return {};

  return {
    title: `${room.name} | Hotel Dipali, Sagar`,
    description: room.summary,
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room) notFound();

  const allRooms = await getRooms();
  const related = allRooms.filter((r) => r.slug !== room.slug);

  const [hero, secondary, tertiary] = room.images;
  const paragraphs = room.description.split(/\n{2,}/).filter(Boolean);
  // Mirrors RoomCard: a price appears only when the fact is cleared for the site.
  const price = room.priceFrom?.showOnSite === true ? room.priceFrom : null;

  return (
    <>
      {/* ── Hero: metadata offset into the left margin against a framed image ── */}
      <section className="bg-surface pt-10 pb-16 md:pt-12 md:pb-20" aria-labelledby="room-title">
        <div className="container-site">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Rooms", href: "/rooms/" },
              { label: room.name },
            ]}
          />

          {/* DOM order is the mobile order: title, image, then facts and CTA —
              so the room is seen before it is specified. From lg the first and
              last blocks stack in the left column beside the image. */}
          <div className="mt-10 grid gap-x-12 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-5 lg:row-start-1">
              <p className="eyebrow">Stay</p>
              <h1 id="room-title" className="heading-1 mt-4">
                {room.name}
              </h1>
              <p className="body-lg mt-5 text-ink-muted">{room.summary}</p>
            </div>

            {hero ? (
              <div className="img-hover lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-start">
                <Picture
                  image={hero}
                  ratio="4:3"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority
                />
              </div>
            ) : null}

            <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2">
              <dl className="divide-y divide-line border-y border-line">
                <RoomFact label="Size" value={room.sizeSqft ? `${room.sizeSqft} sq ft` : null} />
                <RoomFact label="Sleeps" value={`${room.maxGuests} guests`} />
                <RoomFact label="Bed" value={room.bed} />
                <RoomFact label="View" value={room.view ?? null} />
                {price ? <RoomFact label="From" value={formatMoney(price)} /> : null}
              </dl>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a href="#enquire" className="btn-primary">
                  Enquire about this room
                </a>
                <WhatsAppLink context="room" roomName={room.name} className="link" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Description + secondary image ─────────────────────── */}
      <section className="paper-grain bg-surface-alt py-16 md:py-20" aria-labelledby="room-about">
        <div className="container-site relative">
          <ScrollReveal>
            {/* Two rows — heading/copy, then image/highlights — so neither
                column is left holding a long run of empty space. */}
            <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 id="room-about" className="heading-2">
                  About the room
                </h2>
                <Botanical variant="sprig" className="mt-6 h-14 text-highlight" />
              </div>

              <div className="lg:col-span-6 lg:col-start-6">
                <div className="flex flex-col gap-4">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="body-lg text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {secondary ? (
                <div className="img-hover lg:col-span-7 lg:col-start-1">
                  <Picture
                    image={secondary}
                    ratio="3:2"
                    sizes="(min-width: 1024px) 58vw, 100vw"
                  />
                </div>
              ) : null}

              {room.highlights.length > 0 ? (
                <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
                  <h3 className="eyebrow">What defines it</h3>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {room.highlights.map((highlight) => (
                      <li key={highlight} className="body py-3">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Amenities: plain semantic lists, no icon wall ─────── */}
      <section className="bg-surface py-16 md:py-20" aria-labelledby="room-amenities">
        <div className="container-site">
          <ScrollReveal>
            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <h2 id="room-amenities" className="heading-2">
                  In the room
                </h2>
                {tertiary ? (
                  <div className="img-hover mt-8">
                    <Picture image={tertiary} ratio="1:1" sizes="(min-width: 1024px) 25vw, 100vw" />
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-4 lg:col-start-5">
                <h3 className="eyebrow">Room</h3>
                <ul className="mt-4 flex flex-col gap-2">
                  {room.roomAmenities.map((item) => (
                    <li key={item} className="body text-ink-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-4 lg:col-start-9">
                <h3 className="eyebrow">Bathroom</h3>
                <ul className="mt-4 flex flex-col gap-2">
                  {room.bathroomAmenities.map((item) => (
                    <li key={item} className="body text-ink-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Enquiry ───────────────────────────────────────────── */}
      <section
        id="enquire"
        data-theme="dusk"
        className="paper-grain bg-surface py-16 text-ink md:py-20"
        aria-labelledby="room-enquire"
      >
        <div className="container-site relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 id="room-enquire" className="heading-2">
                Enquire about the {room.name}
              </h2>
              <p className="body-lg mt-5 text-ink-muted">
                Send us your dates and who is travelling. We will confirm what is
                available and reply with the details.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3">
                <CallLink className="link" />
                <WhatsAppLink context="room" roomName={room.name} className="link" />
              </div>
            </div>

            <div className="lg:col-span-7">
              <EnquiryForm
                enquiryTypes={["rooms"]}
                defaultEnquiryType="rooms"
                idPrefix={`room-${room.slug}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Related rooms ─────────────────────────────────────── */}
      {related.length > 0 ? (
        <section className="bg-surface-alt py-16 md:py-20" aria-labelledby="room-related">
          <div className="container-site">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="room-related" className="heading-2">
                Continue your stay
              </h2>
              <Link href="/rooms/" prefetch={false} className="link">
                All rooms
              </Link>
            </div>

            <div className="mt-10 grid gap-6 xs:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <RoomCard key={other.slug} room={other} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** One row of the hero fact list. Renders nothing when the fact is absent. */
function RoomFact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="body text-right">{value}</dd>
    </div>
  );
}
