import Link from "next/link";
import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { RoomCard } from "@/components/cards/RoomCard";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import {
  getSite,
  getRooms,
  getVenues,
  getOutlets,
  getLeisure,
  getGallery,
} from "@/content";
import { outletHref, roomHref, venueHref } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: `${site.name}, ${site.address.value.city}`,
    description: site.shortDescription.value,
  };
}

export default async function HomePage() {
  const [site, rooms, venues, outlets, leisure, gallery] = await Promise.all([
    getSite(),
    getRooms(),
    getVenues(),
    getOutlets(),
    getLeisure(),
    getGallery(),
  ]);

  // STATIC-ONLY: the hero still points at a labelled sample placeholder. The
  // slot is sized and cropped for the real "hotel exterior, wide" photograph
  // (docs/data-needed.md) so swapping the file needs no layout change.
  const heroImage = gallery.find((g) => g.image.id === "gallery-property-1")?.image;

  const [featuredRoom, ...otherRooms] = rooms;
  const lawn = venues[0];
  const lawnImage = lawn?.images[0];
  const lawnInset = lawn?.images[1];

  const restaurant = outlets.find((o) => o.slug === "restaurant");
  const familyOutlets = outlets.filter((o) => o.slug !== "restaurant");

  const { pool, gym } = leisure;
  const poolImage = pool.images[0];
  const gymImage = gym.images[0];

  return (
    <>
      {/* ───────────────────────── HERO ─────────────────────────
          Full-viewport editorial cover. Text is deliberately offset to the
          lower-left; a quiet marker holds the upper-right. */}
      <section
        data-theme="dusk"
        className="relative -mt-18 flex min-h-dvh flex-col overflow-hidden bg-surface text-ink md:-mt-22"
        aria-labelledby="home-hero"
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

        {/* Upper-right editorial marker — desktop only, clear of the header. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-32 right-0 z-10 hidden lg:block"
        >
          <div className="flex items-start gap-5 pr-[var(--gutter)]">
            <div className="pt-1 text-right">
              <p className="eyebrow">Rooms · Lawns</p>
              <p className="eyebrow mt-1">Banquets · Dining</p>
            </div>
            <Botanical variant="sprig" className="h-24 text-highlight" />
          </div>
        </div>

        <div className="container-site relative z-10 mt-auto pb-20 md:pb-24 lg:pb-28">
          <div className="max-w-xl lg:max-w-2xl">
            <p className="eyebrow">
              {site.address.value.city}, {site.address.value.state}
            </p>
            <hr className="rule-ornament mt-5" aria-hidden="true" />

            <h1 id="home-hero" className="heading-hero mt-6">
              Hotel
              <br />
              <em>Dipali</em>
            </h1>

            <p className="body-lg mt-6 max-w-md text-ink-muted">
              {site.locationLine.value}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href="#enquire" className="btn-primary">
                Enquire now
              </a>
              <CallLink className="btn-ghost" />
            </div>
          </div>
        </div>

        {/* Scroll cue, bottom-right. */}
        <div
          aria-hidden="true"
          className="absolute right-0 bottom-6 z-10 hidden items-center gap-3 pr-[var(--gutter)] md:flex"
        >
          <span className="eyebrow">Scroll</span>
          <svg
            viewBox="0 0 24 48"
            width="12"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="scroll-cue text-highlight"
          >
            <path d="M12 2v36M6 32l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* ───────────────────────── 01 · INTRO ─────────────────────────
          Tight, asymmetric, typographic. No images — a breath after the hero. */}
      <section
        className="paper-grain bg-surface py-20 md:py-24 lg:py-28"
        aria-labelledby="home-intro"
      >
        <div className="container-site relative">
          <ScrollReveal>
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
              <div className="flex items-start gap-5 lg:col-span-2 lg:flex-col lg:gap-3">
                <span className="section-index">01</span>
                <p className="eyebrow pt-3 lg:pt-0">The hotel</p>
              </div>

              <div className="lg:col-span-6">
                <h2 id="home-intro" className="heading-2">
                  {site.tagline.value}
                </h2>
                <Botanical variant="vine" className="mt-7 w-36 text-highlight" />
              </div>

              <div className="lg:col-span-4">
                <p className="body-lg text-ink-muted">{site.shortDescription.value}</p>
                <hr className="rule-ornament mt-7" aria-hidden="true" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───────────────────────── 02 · STAY ─────────────────────────
          One dominant room, then the rest as a quieter supporting rhythm. */}
      <section className="bg-surface-alt pb-20 md:pb-24 lg:pb-28" aria-labelledby="home-rooms">
        <hr className="rule" aria-hidden="true" />
        <div className="container-site pt-16 md:pt-20">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-5">
                  <span className="section-index">02</span>
                  <p className="eyebrow">Stay</p>
                </div>
                <h2 id="home-rooms" className="heading-2 mt-4 max-w-lg">
                  A room for every <em>guest</em>
                </h2>
              </div>
              <Link href="/rooms/" prefetch={false} className="link pb-2">
                Explore all rooms
              </Link>
            </div>
          </ScrollReveal>

          {/* Featured room: wide image with the copy panel crossing its edge. */}
          {featuredRoom?.images[0] ? (
            <ScrollReveal className="mt-12">
              <div className="lg:grid lg:grid-cols-12">
                {/* Both items need an explicit row: auto-placement would avoid
                    the cells the copy panel occupies and drop to row 2. */}
                <div className="img-hover lg:col-span-10 lg:col-start-3 lg:row-start-1">
                  <Picture
                    image={featuredRoom.images[0]}
                    ratio="16:9"
                    sizes="(min-width: 1024px) 83vw, 100vw"
                  />
                </div>
                <div className="relative z-10 -mt-10 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:self-end">
                  <div className="bg-surface p-7 md:p-9 lg:mb-10 lg:max-w-md">
                    <p className="eyebrow">Featured</p>
                    <h3 className="heading-2 mt-3">{featuredRoom.name}</h3>
                    <p className="body mt-4 text-ink-muted">{featuredRoom.summary}</p>
                    <p className="caption mt-4 not-italic text-ink-muted">
                      {featuredRoom.bed} · Up to {featuredRoom.maxGuests} guests
                    </p>
                    <Link
                      href={roomHref(featuredRoom.slug)}
                      prefetch={false}
                      className="link mt-5 inline-block"
                    >
                      View {featuredRoom.name}
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ) : null}

          {otherRooms.length > 0 ? (
            <ScrollReveal className="mt-16">
              <div className="flex items-center gap-5">
                <p className="eyebrow shrink-0">More rooms</p>
                <hr className="rule w-full" aria-hidden="true" />
              </div>
              <div className="mt-8 grid gap-6 xs:grid-cols-2 lg:grid-cols-3">
                {otherRooms.map((room) => (
                  <RoomCard key={room.slug} room={room} />
                ))}
              </div>
            </ScrollReveal>
          ) : null}
        </div>
      </section>

      {/* ───────────────────────── 03 · WEDDINGS ─────────────────────────
          The second wow moment: dusk, layered imagery, campaign typography. */}
      <section
        data-theme="dusk"
        className="paper-grain overflow-hidden bg-surface py-20 text-ink md:py-24 lg:py-28"
        aria-labelledby="home-weddings"
      >
        <div className="container-site relative">
          <ScrollReveal>
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Layered image pair. */}
              {lawnImage ? (
                <div className="relative lg:col-span-7">
                  <div className="img-hover">
                    <Picture
                      image={lawnImage}
                      ratio="3:2"
                      decorative
                      sizes="(min-width: 1024px) 58vw, 100vw"
                    />
                  </div>
                  {lawnInset ? (
                    <div className="absolute -right-4 -bottom-10 hidden w-40 frame-hairline bg-surface p-2 lg:block xl:w-48">
                      <Picture image={lawnInset} ratio="1:1" decorative sizes="12rem" />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="lg:col-span-5">
                <div className="flex items-center gap-5">
                  <span className="section-index">03</span>
                  <p className="eyebrow">Weddings &amp; Celebrations</p>
                </div>

                <h2 id="home-weddings" className="heading-1 mt-5">
                  Where celebrations <em>come alive</em>
                </h2>

                <Botanical variant="vine" className="mt-7 w-40 text-highlight" />

                <p className="body-lg mt-6 text-ink-muted">
                  Lawns, banquet halls and dedicated event spaces for weddings,
                  receptions, ring ceremonies, birthdays and corporate events.
                </p>

                {/* Venue names only — capacities stay on the venue pages. */}
                <ul className="mt-7 divide-y divide-line border-y border-line">
                  {venues.slice(0, 4).map((venue) => (
                    <li key={venue.slug} className="py-3">
                      <Link
                        href={venueHref(venue.slug)}
                        prefetch={false}
                        className="link body"
                      >
                        {venue.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Link href="/weddings/" prefetch={false} className="btn-primary">
                    Plan your wedding
                  </Link>
                  <Link href="/events/" prefetch={false} className="link">
                    View all venues
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───────────────────────── 04 · DINING ─────────────────────────
          One dominant outlet, then the brand family at varying proportions. */}
      <section className="bg-surface py-20 md:py-24 lg:py-28" aria-labelledby="home-dining">
        <div className="container-site">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-5">
                  <span className="section-index">04</span>
                  <p className="eyebrow">A family of tastes</p>
                </div>
                <h2 id="home-dining" className="heading-2 mt-4">
                  Dining at <em>Dipali</em>
                </h2>
              </div>
              <Link href="/dining/" prefetch={false} className="link pb-2">
                Explore dining
              </Link>
            </div>
          </ScrollReveal>

          {restaurant ? (
            <ScrollReveal className="mt-12">
              <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12">
                {restaurant.images[0] ? (
                  <div className="img-hover lg:col-span-8">
                    <Picture
                      image={restaurant.images[0]}
                      ratio="16:9"
                      sizes="(min-width: 1024px) 66vw, 100vw"
                    />
                  </div>
                ) : null}
                <div className="lg:col-span-4 lg:pb-4">
                  <h3 className="heading-2">{restaurant.name}</h3>
                  <p className="body mt-4 text-ink-muted">{restaurant.summary}</p>
                  <Link
                    href={outletHref(restaurant.slug)}
                    prefetch={false}
                    className="link mt-5 inline-block"
                  >
                    Explore {restaurant.name}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ) : null}

          {/* The family: alternating portrait/square so the row has rhythm. */}
          {familyOutlets.length > 0 ? (
            <ScrollReveal className="mt-16">
              <div className="flex items-center gap-5">
                <p className="eyebrow shrink-0">The Dipali family</p>
                <hr className="rule w-full" aria-hidden="true" />
              </div>
              <ul className="mt-8 grid gap-x-6 gap-y-10 xs:grid-cols-2 lg:grid-cols-4">
                {familyOutlets.map((outlet, i) => (
                  <li key={outlet.slug} className={i % 2 === 1 ? "lg:pt-10" : undefined}>
                    {outlet.images[0] ? (
                      <div className="img-hover">
                        <Picture
                          image={outlet.images[0]}
                          ratio={i % 2 === 1 ? "1:1" : "4:5"}
                          sizes="(min-width: 1024px) 22vw, 50vw"
                        />
                      </div>
                    ) : null}
                    <h3 className="heading-3 mt-5">
                      <Link href={outletHref(outlet.slug)} prefetch={false} className="link">
                        {outlet.name}
                      </Link>
                    </h3>
                    <p className="body mt-2 text-ink-muted">{outlet.summary}</p>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          ) : null}
        </div>
      </section>

      {/* ───────────────────────── 05 · POOL & GYM ─────────────────────────
          Copy-left / image-right, portrait crop, layered inset. */}
      <section
        className="paper-grain bg-surface-alt py-20 md:py-24 lg:py-28"
        aria-labelledby="home-leisure"
      >
        <div className="container-site relative">
          <ScrollReveal>
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <div className="flex items-center gap-5">
                  <span className="section-index">05</span>
                  <p className="eyebrow">Pool &amp; Gym</p>
                </div>
                <h2 id="home-leisure" className="heading-1 mt-5">
                  Space to <em>unwind</em>
                </h2>
                <p className="body-lg mt-6 text-ink-muted">{pool.summary}</p>
                <hr className="rule-ornament mt-7" aria-hidden="true" />
                <p className="body mt-6 text-ink-muted">{gym.summary}</p>
                <div className="mt-8">
                  <Link href="/pool-and-gym/" prefetch={false} className="btn-ghost">
                    Explore pool &amp; gym
                  </Link>
                </div>
              </div>

              {poolImage ? (
                <div className="relative lg:col-span-6 lg:col-start-7">
                  <div className="img-hover">
                    <Picture
                      image={poolImage}
                      ratio="4:5"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  </div>
                  {gymImage ? (
                    <div className="absolute -bottom-8 -left-6 hidden w-40 frame-hairline bg-surface-alt p-2 lg:block xl:w-44">
                      <Picture image={gymImage} ratio="1:1" decorative sizes="11rem" />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───────────────────────── 06 · ENQUIRE ───────────────────────── */}
      <section
        id="enquire"
        data-theme="dusk"
        className="paper-grain bg-surface py-20 text-ink md:py-24 lg:py-28"
        aria-labelledby="home-enquire"
      >
        <div className="container-site relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-5">
              <div className="flex items-center gap-5">
                <span className="section-index">06</span>
                <p className="eyebrow">Get in touch</p>
              </div>

              <h2 id="home-enquire" className="heading-1 mt-5">
                Make an <em>enquiry</em>
              </h2>

              <p className="body-lg mt-6 text-ink-muted">
                Send us your dates and requirements, or reach us directly — whichever
                is quicker for you.
              </p>

              <Botanical variant="flower" className="mt-8 h-14 w-14 text-highlight" />

              <div className="mt-8 flex flex-col items-start gap-3">
                <CallLink className="link" />
                <WhatsAppLink context="general" className="link">
                  WhatsApp us
                </WhatsAppLink>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80} className="lg:col-span-7">
              <EnquiryForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
