import Link from "next/link";
import type { Metadata } from "next";

import { Emblem } from "@/components/brand/Logo";
import { Botanical } from "@/components/decor/Botanical";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { EntranceHero } from "@/components/home/EntranceHero";
import { IntroLoader } from "@/components/home/IntroLoader";
import { RoomDiscovery, type RoomPreview } from "@/components/home/RoomDiscovery";
import { DayJourney } from "@/components/home/DayJourney";
import { DipaliExperience } from "@/components/home/DipaliExperience";
import { WorldWithin, type WorldExperience } from "@/components/home/WorldWithin";
import { LayeredSection } from "@/components/motion/LayeredSection";
import { ScrollSection } from "@/components/motion/ScrollSection";
import {
  getGallery,
  getLeisure,
  getOutlet,
  getRooms,
  getSite,
  getVenues,
  type Outlet,
} from "@/content";
import { isPhoto } from "@/lib/images";
import { outletHref } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: `${site.name}, ${site.address.value.city}`,
    description: site.shortDescription.value,
  };
}

const VENUE_KIND: Record<string, string> = {
  lawn: "Lawn",
  hall: "Banquet hall",
  poolside: "Poolside lawn",
  terrace: "Terrace",
};

export default async function HomePage() {
  const [site, rooms, venues, leisure, gallery] = await Promise.all([
    getSite(),
    getRooms(),
    getVenues(),
    getLeisure(),
    getGallery(),
  ]);
  const [restaurant, bakery, sweets, poolside, bar] = await Promise.all([
    getOutlet("restaurant"),
    getOutlet("bakery"),
    getOutlet("sweets"),
    getOutlet("poolside-restaurant"),
    getOutlet("infinity-bar"),
  ]);

  const roomPreviews: RoomPreview[] = rooms.flatMap((room) =>
    room.images[0]
      ? [
          {
            slug: room.slug,
            name: room.name,
            summary: room.summary,
            sizeSqft: room.sizeSqft,
            maxGuests: room.maxGuests,
            image: room.images[0],
          },
        ]
      : [],
  );
  // Scenes take the first real photograph available, so a venue still on a
  // placeholder never fills the full-bleed window.
  const venuePhotos = venues.flatMap((venue) => venue.images.filter(isPhoto));
  const celebrateImage = venuePhotos[0] ?? venues[0]?.images[0];
  const { pool, gym } = leisure;
  // "In pictures": the hospitality photographs with no section of their own —
  // reception, sitting areas, the portico and the lounges.
  // Rooms have their own section, so room photographs are left out here, as
  // is the photograph "The Dipali Experience" already shows.
  const PICTURE_ORDER = ["property", "stay", "events"];
  const pictures = gallery
    .filter(
      (item) =>
        isPhoto(item.image) &&
        PICTURE_ORDER.includes(item.category) &&
        !item.image.src.includes("/room-") &&
        item.image.source !== site.homeExperience.source,
    )
    .sort((a, b) => PICTURE_ORDER.indexOf(a.category) - PICTURE_ORDER.indexOf(b.category) || a.order - b.order)
    .slice(0, 5)
    .map((item) => item.image);

  // "A World Within Dipali": the four experiences the hotel is (CLAUDE.md §A),
  // each on a real photograph the sections further down do not already lead
  // with, linking to its page (or, for the pool and gym, its section here).
  // Celebrate is featured — weddings and events come first for the hotel —
  // and the order matches the layout's reading order (a zig-zag on desktop).
  const roomPhotos = rooms.flatMap((room) => room.images.filter(isPhoto));
  const dinePhotos = restaurant?.images.filter(isPhoto) ?? [];
  const poolPhotos = [
    ...gallery.filter((item) => item.category === "pool-gym").map((item) => item.image),
    ...pool.images,
  ].filter(isPhoto);
  const worldCandidates: (Omit<WorldExperience, "image"> & { image: WorldExperience["image"] | undefined })[] = [
    {
      slot: "feature",
      numeral: "I",
      label: "Celebrate",
      title: "Weddings on the lawns and in the banquet halls",
      href: "/weddings/",
      more: "Plan a wedding",
      aside: { label: "Events & gatherings", href: "/events/" },
      image: venuePhotos[1] ?? venuePhotos[0],
    },
    {
      slot: "tall",
      numeral: "II",
      label: "Stay",
      title: "Rooms made for unhurried rest",
      href: "/rooms/",
      more: "See the rooms",
      image: roomPhotos[1] ?? roomPhotos[0],
    },
    {
      slot: "panorama",
      numeral: "III",
      label: "Unwind",
      title: "A swimming pool and a gym",
      href: "#unwind",
      more: "The pool & gym",
      image: poolPhotos.find((image) => image.source !== pool.images[0]?.source) ?? poolPhotos[0],
    },
    {
      slot: "wide",
      numeral: "IV",
      label: "Dine",
      title: "The restaurant, Infinity Bar, Dipali Bakery and Dipali Sweets",
      href: "/dining/",
      more: "Explore dining",
      image: dinePhotos[1] ?? dinePhotos[0],
    },
  ];
  const worldItems = worldCandidates.flatMap((item) => (item.image ? [{ ...item, image: item.image }] : []));

  return (
    <>
      {/* ═══ ARRIVE — the lit entrance, framed by a gold arch ═══ */}
      <IntroLoader caption={`${site.address.value.city} · ${site.address.value.state}`} />
      {/* The hero holds still while The Dipali Experience rises over it
          (rich motion); the wrapper ends the hold once it is covered. */}
      <div className="layers">
        <EntranceHero
          image={site.homeHero}
          video={site.homeHeroVideo}
          eyebrow="A Timeless Destination"
          titlePrefix={`${site.name}, ${site.address.value.city}:`}
          title={{ lead: "A Stay", accent: "Beyond", tail: "Ordinary" }}
          subline="Comfort, Crafted with Care"
          primary={{ label: "Explore the Experience", href: "#explore" }}
          secondary={{ label: "Discover Hotel Dipali", href: "#welcome" }}
        />

        {/* ═══ THE DIPALI EXPERIENCE — an ivory arch rises over the hero ═══
            It is also the element that turns the overlay header solid. */}
        <LayeredSection
          id="welcome"
          data-header-solid-from=""
          aria-labelledby="home-intro"
          className="threshold layer-rise paper-grain scroll-mt-16 bg-surface pt-[var(--arch)] pb-24 md:pb-36"
        >
          <div className="layer-content container-site relative">
            <DipaliExperience
              headingId="home-intro"
              eyebrow="The Art of Hospitality"
              title={{
                first: "More Than a Stay.",
                secondLead: "A Feeling to",
                accent: "Remember",
                secondTail: ".",
              }}
              lead="Discover thoughtful hospitality, inviting spaces and memorable moments at Hotel Dipali."
              body={site.shortDescription.value}
              // Provisional target: there is no About / story page yet, so this
              // leads to A World Within Dipali, just below. Repoint it once one
              // exists (docs/PLAN.md, open questions).
              cta={{ label: "Discover Our Story", href: "#explore" }}
              image={site.homeExperience}
              caption={`The reception atrium · ${site.address.value.city}`}
            />
          </div>
          {/* Deepens as A World Within Dipali covers this section (rich motion). */}
          <div aria-hidden="true" className="layer-veil" />
        </LayeredSection>
      </div>

      {/* ═══ A WORLD WITHIN DIPALI — an emerald panel rises over the ivory ═══ */}
      <LayeredSection
        id="explore"
        covers="#welcome"
        scene
        data-theme="emerald"
        aria-labelledby="home-world"
        className="world-section layer-rise scroll-mt-28 bg-surface text-ink"
      >
        <WorldWithin
          headingId="home-world"
          eyebrow="Four experiences · One destination"
          title={{ lead: "A World Within", accent: "Dipali" }}
          intro={`To stay, to celebrate, to dine and to unwind — one address in ${site.address.value.city}, many ways to spend the day.`}
          items={worldItems}
        />
      </LayeredSection>

      {/* ═══ STAY — rooms as an index with a following stage ═══ */}
      <section
        id="stay"
        aria-labelledby="home-rooms"
        className="scroll-mt-24 bg-surface-alt py-20 md:py-28"
      >
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <ScrollReveal>
                <p className="eyebrow">Stay</p>
              </ScrollReveal>
              <ScrollReveal variant="mask" delay={60}>
                <h2 id="home-rooms" className="heading-1 mt-4 max-w-xl">
                  A room for every <em>guest</em>
                </h2>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={140}>
              <Link href="/rooms/" prefetch={false} className="link-cta">
                Explore all rooms
              </Link>
            </ScrollReveal>
          </div>

          <div className="mt-12 md:mt-16">
            <RoomDiscovery rooms={roomPreviews} />
          </div>
        </div>
      </section>

      {/* ═══ CELEBRATE — a window that opens as the scene rises ═══ */}
      <ScrollSection
        id="celebrate"
        data-theme="peacock"
        mode="through"
        aria-labelledby="home-weddings"
        className="paper-grain scroll-mt-24 overflow-x-clip bg-surface pt-20 pb-20 text-ink md:pt-28 md:pb-28"
      >
        {/* The word sits above the window and its foot overlaps the opening. */}
        <div className="container-site relative z-10">
          <p aria-hidden="true" className="celebrate-word mb-[-0.22em]">
            Celebrate
          </p>
        </div>

        {celebrateImage ? (
          <div className="celebrate-window relative h-[56vh] min-h-72 md:h-[72vh]">
            <Picture image={celebrateImage} fill sizes="100vw" />
          </div>
        ) : null}

        <div className="container-site relative mt-14 md:mt-20">
          <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
            <ScrollReveal className="lg:col-span-6">
              <p className="eyebrow">Weddings &amp; celebrations</p>
              <h2 id="home-weddings" className="heading-1 mt-4">
                Lawns, halls and room for <em>everyone</em>
              </h2>
              <p className="body-lg mt-6 text-ink-muted">
                Open-air lawns and banquet halls for weddings, receptions, ring
                ceremonies, birthdays and corporate events.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/weddings/" prefetch={false} className="btn-primary">
                  Plan your wedding
                </Link>
                <Link href="/events/" prefetch={false} className="link-cta">
                  Events &amp; gatherings
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal className="lg:col-span-5 lg:col-start-8" delay={80}>
              <ul className="divide-y divide-line border-y border-line">
                {venues.map((venue) => (
                  <li key={venue.slug} className="flex items-baseline justify-between gap-6 py-4">
                    <span className="heading-3">{venue.name}</span>
                    <span className="caption not-italic">
                      {VENUE_KIND[venue.kind] ?? venue.kind}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </ScrollSection>

      {/* ═══ UNWIND — the pool, seen from above ═══ */}
      <section
        id="unwind"
        aria-labelledby="home-leisure"
        data-theme="peacock"
        className="scroll-mt-24 bg-surface py-20 text-ink md:py-28"
      >
        <div className="container-site">
          <div className="grid items-center gap-x-12 gap-y-12 lg:grid-cols-12">
            <ScrollReveal className="lg:col-span-5">
              <p className="eyebrow">Pool &amp; gym</p>
              <h2 id="home-leisure" className="heading-1 mt-4">
                Room to <em>unwind</em>
              </h2>
              <p className="body-lg mt-6">{pool.summary}</p>
              <p className="body mt-4">{gym.summary}</p>
              <div className="mt-8">
                <a href="#enquire" className="btn-ghost">
                  Ask about memberships
                </a>
              </div>
            </ScrollReveal>

            <div className="relative lg:col-span-6 lg:col-start-7">
              {pool.images[0] ? (
                <ScrollReveal variant="image" className="frame-arch">
                  <Picture image={pool.images[0]} ratio="4:5" sizes="(min-width: 1024px) 50vw, 100vw" />
                </ScrollReveal>
              ) : null}
              {/* The gym inset waits for a real photograph. */}
              {isPhoto(gym.images[0]) ? (
                <div className="absolute -bottom-8 -left-6 hidden w-44 bg-accent p-2 lg:block">
                  <Picture image={gym.images[0]} ratio="1:1" sizes="11rem" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DINE — from the daytime table into the evening ═══ */}
      <DayJourney id="dine" labelledBy="home-dining" className="scroll-mt-24 bg-surface-alt">
        <div data-panel className="journey-panel journey-intro flex flex-col justify-center pb-4">
          <p className="eyebrow">Dine</p>
          <h2 id="home-dining" className="heading-1 mt-4">
            From the table into the <em>evening</em>
          </h2>
          <p className="body-lg mt-6 max-w-xl text-ink-muted">
            A restaurant, the Dipali counters, poolside plates and the Infinity Bar —
            one family of places to eat, drink and gather.
          </p>
          <Link href="/dining/" prefetch={false} className="link-cta mt-6 self-start">
            Explore dining
          </Link>
        </div>

        {restaurant ? (
          <JourneyPanel outlet={restaurant} mood="Through the day" tone="surface" />
        ) : null}

        {bakery && sweets ? (
          <article data-panel className="journey-panel grid overflow-hidden bg-surface lg:grid-cols-[1.15fr_1fr]">
            <div className="grid min-h-64 grid-cols-2 gap-1 lg:min-h-0">
              {[bakery, sweets].map((outlet) =>
                outlet.images[0] ? (
                  <div key={outlet.slug} className="relative min-h-64 lg:min-h-0">
                    <Picture image={outlet.images[0]} fill sizes="(min-width: 1024px) 18vw, 50vw" />
                  </div>
                ) : null,
              )}
            </div>
            <div className="flex flex-col justify-end p-6 md:p-10">
              <p className="eyebrow">Something to take home</p>
              <h3 className="heading-2 mt-3">The Dipali counters</h3>
              <ul className="mt-5 flex flex-col gap-4">
                {[bakery, sweets].map((outlet) => (
                  <li key={outlet.slug}>
                    <a href={outletHref(outlet.slug)} className="link body font-medium">
                      {outlet.name}
                    </a>
                    <p className="body mt-1 text-ink-muted">{outlet.summary}</p>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ) : null}

        {poolside ? <JourneyPanel outlet={poolside} mood="By the water" tone="surface" /> : null}

        {bar ? <JourneyPanel outlet={bar} mood="Evening" tone="peacock" /> : null}
      </DayJourney>

      {/* ═══ IN PICTURES — a look around the hotel ═══ */}
      {pictures.length >= 3 ? (
        <section
          id="gallery"
          aria-labelledby="home-pictures"
          className="scroll-mt-24 bg-surface py-20 md:py-28"
        >
          <div className="container-site">
            <ScrollReveal>
              <p className="eyebrow">In pictures</p>
            </ScrollReveal>
            <ScrollReveal variant="mask" delay={60}>
              <h2 id="home-pictures" className="heading-1 mt-4 max-w-2xl">
                A look <em>around</em>
              </h2>
            </ScrollReveal>
            <ul className="pictures-grid mt-12 md:mt-16">
              {pictures.map((image, i) => (
                <li key={image.id} className="pictures-item">
                  <ScrollReveal variant="image" delay={(i % 3) * 70} className="h-full">
                    <figure className="img-hover relative h-full">
                      {/* The caption describes the photo; the image itself is decorative. */}
                      <Picture
                        image={image}
                        fill
                        decorative
                        sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      />
                      <figcaption className="pictures-caption">{image.alt}</figcaption>
                    </figure>
                  </ScrollReveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ═══ CLOSE — a peacock arch, and the conversation that starts a visit ═══ */}
      <section
        id="enquire"
        data-theme="peacock"
        aria-labelledby="home-enquire"
        className="threshold paper-grain scroll-mt-24 bg-surface pt-[calc(var(--arch)+3rem)] pb-20 text-ink md:pb-28"
      >
        <div className="container-site relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-5">
              <Emblem className="mb-3 h-15 w-auto" sizes="3.125rem" />
              <h2 id="home-enquire" className="heading-1 mt-8">
                Every visit begins with a <em>conversation</em>
              </h2>
              <p className="body-lg mt-6 text-ink-muted">
                Tell us what you are planning — a stay, a wedding, a meal or a
                membership — with your dates, and we will reply with the details.
              </p>
              <Botanical variant="vine" className="mt-8 w-40 text-highlight" />
              <div className="mt-8 flex flex-col items-start gap-3">
                <CallLink className="link" />
                <WhatsAppLink context="general" className="link" />
                <p className="caption not-italic">{site.locationLine.value}</p>
              </div>
            </ScrollReveal>

            <div className="lg:col-span-7">
              <EnquiryForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** One outlet in the dining walk: a photograph beside its story. */
function JourneyPanel({
  outlet,
  mood,
  tone,
}: {
  outlet: Outlet;
  mood: string;
  tone: "surface" | "peacock";
}) {
  const cover = outlet.images[0];
  return (
    <article
      data-panel
      data-theme={tone === "peacock" ? "peacock" : undefined}
      className="journey-panel grid overflow-hidden bg-surface text-ink lg:grid-cols-[1.15fr_1fr]"
    >
      {cover ? (
        <div className="relative min-h-64 lg:min-h-0">
          <Picture image={cover} fill sizes="(min-width: 1024px) 36vw, 100vw" />
        </div>
      ) : null}
      <div className="flex flex-col justify-end p-6 md:p-10">
        <p className="eyebrow">
          {mood} · {outlet.cuisine.join(" · ")}
        </p>
        <h3 className="heading-2 mt-3">{outlet.name}</h3>
        <p className="body mt-4 text-ink-muted">{outlet.summary}</p>
        <a href={outletHref(outlet.slug)} className="link mt-6 self-start">
          Explore {outlet.name}
        </a>
      </div>
    </article>
  );
}
