import Link from "next/link";
import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Picture } from "@/components/media/Picture";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { getRooms } from "@/content";
import { formatMoney } from "@/lib/format";
import { roomHref } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Rooms | Hotel Dipali, Sagar",
  description:
    "Rooms and suites at Hotel Dipali, Sagar — from a garden-facing deluxe room to suites with space for the whole family.",
};

export default async function RoomsPage() {
  const rooms = await getRooms();
  const [featured, ...rest] = rooms;

  return (
    <>
      {/* ── Opening ───────────────────────────────────────────── */}
      <section className="paper-grain bg-surface pt-10 pb-16 md:pt-12 md:pb-20" aria-labelledby="rooms-title">
        <div className="container-site relative">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rooms" }]} />

          <div className="mt-10 grid gap-x-12 gap-y-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="eyebrow">Stay</p>
              <h1 id="rooms-title" className="heading-1 mt-4">
                Rooms &amp; suites
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pt-4">
              <p className="body-lg text-ink-muted">
                Rooms and suites that range from garden-facing calm to space enough for
                the whole family — each kept simple, warm and quiet.
              </p>
              <Botanical variant="vine" className="mt-7 w-32 text-highlight" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured room ─────────────────────────────────────── */}
      {featured ? (
        <section className="bg-surface-alt py-16 md:py-20" aria-labelledby="rooms-featured">
          <div className="container-site">
            <ScrollReveal>
              <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12">
                {featured.images[0] ? (
                  <div className="img-hover lg:col-span-7">
                    <Picture
                      image={featured.images[0]}
                      ratio="4:3"
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      priority
                    />
                  </div>
                ) : null}

                <div className="lg:col-span-5 lg:pb-2">
                  <p className="eyebrow">Most asked for</p>
                  <h2 id="rooms-featured" className="heading-2 mt-3">
                    {featured.name}
                  </h2>
                  <p className="body-lg mt-4 text-ink-muted">{featured.summary}</p>

                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
                    <RoomFact label="Size" value={featured.sizeSqft ? `${featured.sizeSqft} sq ft` : null} />
                    <RoomFact label="Sleeps" value={`${featured.maxGuests} guests`} />
                    <RoomFact label="Bed" value={featured.bed} />
                    <RoomFact label="View" value={featured.view ?? null} />
                  </dl>

                  <div className="mt-8">
                    <Link href={roomHref(featured.slug)} prefetch={false} className="btn-primary">
                      View {featured.name}
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {/* ── Comparison rail ───────────────────────────────────────
          Rooms differ along shared, comparable axes (size, occupancy,
          bedding), so aligned columns carry real information here — this is
          the page's working view, not a decorative grid. */}
      {rest.length > 0 ? (
        <section className="bg-surface py-16 md:py-20" aria-labelledby="rooms-all">
          <div className="container-site">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="rooms-all" className="heading-2">
                The other rooms
              </h2>
              <p className="caption">Compare size, occupancy and bedding</p>
            </div>

            {/* Column headings: desktop only — on mobile each value is labelled inline. */}
            <div
              aria-hidden="true"
              className="mt-10 hidden border-b border-line pb-3 lg:grid lg:grid-cols-12 lg:gap-6"
            >
              <p className="eyebrow lg:col-span-5">Room</p>
              <p className="eyebrow lg:col-span-2">Size</p>
              <p className="eyebrow lg:col-span-2">Sleeps</p>
              <p className="eyebrow lg:col-span-3">Bed</p>
            </div>

            <ul className="divide-y divide-line border-b border-line lg:border-t-0">
              {rest.map((room) => {
                const thumb = room.images[0];
                const price = room.priceFrom?.showOnSite === true ? room.priceFrom : null;

                return (
                  <li key={room.slug}>
                    <Link
                      href={roomHref(room.slug)}
                      prefetch={false}
                      aria-label={`${room.name} — view room`}
                      className="img-hover group grid grid-cols-1 gap-x-6 gap-y-4 py-7 lg:grid-cols-12 lg:items-center"
                    >
                      <div className="flex items-center gap-5 lg:col-span-5">
                        {thumb ? (
                          <div className="w-20 shrink-0 md:w-24">
                            <Picture image={thumb} ratio="1:1" decorative sizes="6rem" />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <h3 className="heading-3 group-hover:text-accent">{room.name}</h3>
                          <p className="body mt-1 text-ink-muted">{room.summary}</p>
                          {price ? (
                            <p className="body mt-2 font-semibold">From {formatMoney(price)}</p>
                          ) : null}
                        </div>
                      </div>

                      <RailFact label="Size" value={room.sizeSqft ? `${room.sizeSqft} sq ft` : null} span="lg:col-span-2" />
                      <RailFact label="Sleeps" value={`${room.maxGuests} guests`} span="lg:col-span-2" />
                      <RailFact label="Bed" value={room.bed} span="lg:col-span-3" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Closing CTA ───────────────────────────────────────── */}
      <section
        data-theme="dusk"
        className="paper-grain bg-surface py-16 text-ink md:py-20"
        aria-labelledby="rooms-help"
      >
        <div className="container-site relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 id="rooms-help" className="heading-2">
                Not sure which room suits you?
              </h2>
              <p className="body-lg mt-4 text-ink-muted">
                Tell us your dates and who is travelling, and we will suggest the room
                that fits.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:col-span-5 lg:justify-end">
              <Link href="/contact/#enquire" prefetch={false} className="btn-primary">
                Make an enquiry
              </Link>
              <CallLink className="link" />
              <WhatsAppLink context="stay" className="link" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Stacked label/value pair for the featured room's fact list. */
function RoomFact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

/** One comparable value in a rail row: labelled inline on mobile, aligned to
 *  the column headings from lg up. */
function RailFact({
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
