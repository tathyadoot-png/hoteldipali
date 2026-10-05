import Link from "next/link";
import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { SectionHeading } from "@/components/content/SectionHeading";
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
import { outletHref, roomHref } from "@/lib/routes";

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

  const heroImage = gallery.find(
    (g) => g.image.id === "gallery-property-1",
  )?.image;

  const [featuredRoom, ...otherRooms] = rooms;
  const weddingImage = venues[0]?.images[0];

  const restaurant = outlets.find((o) => o.slug === "restaurant");
  const otherDiningOutlets = outlets.filter((o) => o.slug !== "restaurant");

  const pool = leisure.pool;
  const gym = leisure.gym;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          HERO — full-viewport editorial cover
          ═══════════════════════════════════════════════════════════ */}
      <section
        data-theme="dusk"
        className="relative -mt-18 flex min-h-dvh flex-col justify-end overflow-hidden bg-surface text-ink md:-mt-22"
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
            <div aria-hidden="true" className="hero-gradient absolute inset-0" />
          </>
        ) : null}

        <div className="container-site relative z-10 pb-16 md:pb-24 lg:pb-28">
          <div className="max-w-2xl">
            <p className="eyebrow">
              {site.address.value.city}, {site.address.value.state}
            </p>
            <hr className="rule-ornament mt-4" aria-hidden="true" />

            <h1 id="home-hero" className="heading-hero mt-6">
              Hotel
              <br />
              <em>Dipali</em>
            </h1>

            <p className="body-lg mt-6 max-w-md text-ink-muted">
              {site.locationLine.value}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#enquire" className="btn-primary">
                Enquire now
              </a>
              <CallLink className="btn-ghost" />
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-4 flex justify-center md:bottom-8"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="scroll-cue text-ink-muted"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          INTRO — quiet editorial introduction
          ═══════════════════════════════════════════════════════════ */}
      <section className="section bg-surface" aria-labelledby="home-intro">
        <div className="container-site">
          <ScrollReveal>
            <Botanical variant="sprig" className="h-16 text-highlight" />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="mt-10 grid gap-8 md:grid-cols-5 md:gap-12 lg:gap-20">
              <div className="md:col-span-2">
                <h2 id="home-intro" className="heading-2">
                  {site.tagline.value}
                </h2>
              </div>
              <div className="md:col-span-3">
                <p className="body-lg text-ink-muted">
                  {site.shortDescription.value}
                </p>
                <hr className="rule-ornament mt-8" aria-hidden="true" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ROOMS — featured room + card rail
          ═══════════════════════════════════════════════════════════ */}
      <section className="section bg-surface-alt" aria-labelledby="home-rooms">
        <div className="container-site">
          {featuredRoom ? (
            <ScrollReveal>
              <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                {featuredRoom.images[0] ? (
                  <div>
                    <Picture
                      image={featuredRoom.images[0]}
                      ratio="4:3"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                    <p className="caption mt-3">{featuredRoom.name}</p>
                  </div>
                ) : null}
                <div className="flex flex-col justify-center">
                  <p className="eyebrow">Stay</p>
                  <h2 id="home-rooms" className="heading-2 mt-3">
                    A room for every <em>guest</em>
                  </h2>
                  <p className="body-lg mt-4 text-ink-muted">
                    {featuredRoom.summary}
                  </p>
                  <Link
                    href={roomHref(featuredRoom.slug)}
                    prefetch={false}
                    className="link mt-4"
                  >
                    View {featuredRoom.name}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ) : null}

          {otherRooms.length > 0 ? (
            <ScrollReveal className="mt-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {otherRooms.map((room) => (
                  <RoomCard key={room.slug} room={room} />
                ))}
              </div>
            </ScrollReveal>
          ) : null}

          <ScrollReveal className="mt-8">
            <Link href="/rooms/" prefetch={false} className="link">
              Explore all rooms
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          WEDDINGS & CELEBRATIONS — dusk, large imagery, strong type
          ═══════════════════════════════════════════════════════════ */}
      <section
        data-theme="dusk"
        className="bg-surface text-ink"
        aria-labelledby="home-weddings"
      >
        {weddingImage ? (
          <ScrollReveal>
            <Picture
              image={weddingImage}
              ratio="16:9"
              decorative
              sizes="100vw"
            />
          </ScrollReveal>
        ) : null}

        <div className="section">
          <div className="container-site">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <Botanical
                  variant="vine"
                  className="mx-auto w-40 text-highlight"
                />
                <p className="eyebrow mt-8">Weddings &amp; Celebrations</p>
                <h2 id="home-weddings" className="heading-1 mt-4">
                  Where celebrations <em>come alive</em>
                </h2>
                <p className="body-lg mt-6 text-ink-muted">
                  Lawns, banquet halls and dedicated event spaces for weddings,
                  receptions, ring ceremonies, birthdays and corporate events.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/weddings/"
                    prefetch={false}
                    className="btn-primary"
                  >
                    Plan your wedding
                  </Link>
                  <Link href="/events/" prefetch={false} className="link">
                    View all venues
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          DINING — brand family, editorial list
          ═══════════════════════════════════════════════════════════ */}
      <section className="section bg-surface" aria-labelledby="home-dining">
        <div className="container-site">
          <ScrollReveal>
            <SectionHeading
              eyebrow="A family of tastes"
              title={
                <>
                  Dining at <em>Dipali</em>
                </>
              }
              as="h2"
              id="home-dining"
            />
          </ScrollReveal>

          {restaurant ? (
            <ScrollReveal className="mt-10">
              <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                {restaurant.images[0] ? (
                  <Picture
                    image={restaurant.images[0]}
                    ratio="3:2"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                ) : null}
                <div className="flex flex-col justify-center">
                  <h3 className="heading-3">{restaurant.name}</h3>
                  <p className="body mt-3 text-ink-muted">
                    {restaurant.summary}
                  </p>
                  <Link
                    href={outletHref(restaurant.slug)}
                    prefetch={false}
                    className="link mt-4"
                  >
                    Explore {restaurant.name}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ) : null}

          {otherDiningOutlets.length > 0 ? (
            <ScrollReveal className="mt-10">
              <hr className="rule" aria-hidden="true" />
              <div className="divide-y divide-line">
                {otherDiningOutlets.map((outlet) => {
                  const thumb = outlet.images[0];
                  return (
                    <div
                      key={outlet.slug}
                      className="flex items-center gap-5 py-5"
                    >
                      {thumb ? (
                        <Picture
                          image={thumb}
                          ratio="1:1"
                          className="w-16 shrink-0 md:w-20"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <h3 className="heading-3">
                          <Link
                            href={outletHref(outlet.slug)}
                            prefetch={false}
                            className="link"
                          >
                            {outlet.name}
                          </Link>
                        </h3>
                        <p className="body mt-1 text-ink-muted">
                          {outlet.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          ) : null}

          <ScrollReveal className="mt-8">
            <Link href="/dining/" prefetch={false} className="link">
              Explore dining
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          POOL & GYM — compact lifestyle split
          ═══════════════════════════════════════════════════════════ */}
      <section className="section bg-surface-alt" aria-labelledby="home-leisure">
        <div className="container-site">
          <ScrollReveal>
            <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
              {pool.images[0] ? (
                <Picture
                  image={pool.images[0]}
                  ratio="16:9"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              ) : null}
              <div className="flex flex-col justify-center">
                <p className="eyebrow">Wellness</p>
                <h2 id="home-leisure" className="heading-2 mt-3">
                  Pool &amp; <em>Gym</em>
                </h2>
                <p className="body-lg mt-4 text-ink-muted">{pool.summary}</p>
                <p className="body mt-3 text-ink-muted">{gym.summary}</p>
                <div className="mt-6">
                  <Link
                    href="/pool-and-gym/"
                    prefetch={false}
                    className="btn-ghost"
                  >
                    Explore pool &amp; gym
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ENQUIRY — dusk, conversion section
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="enquire"
        data-theme="dusk"
        className="section bg-surface text-ink"
        aria-labelledby="home-enquire"
      >
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>
              <div className="flex flex-col gap-4">
                <Botanical
                  variant="flower"
                  className="h-12 w-12 text-highlight"
                />
                <p className="eyebrow mt-2">Get in touch</p>
                <h2 id="home-enquire" className="heading-2 mt-1">
                  Make an <em>enquiry</em>
                </h2>
                <p className="body-lg text-ink-muted">
                  Reach out with your dates and requirements.
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <CallLink className="link" />
                  <WhatsAppLink context="general" className="link">
                    WhatsApp us
                  </WhatsAppLink>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <EnquiryForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
