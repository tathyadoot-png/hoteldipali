import Link from "next/link";
import type { Metadata } from "next";

import { Emblem } from "@/components/brand/Logo";
import { MedallionRing } from "@/components/brand/Ornaments";
import { ContactLines } from "@/components/contact/ContactLines";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { EntranceHero } from "@/components/home/EntranceHero";
import { IntroLoader } from "@/components/home/IntroLoader";
import { DipaliExperience } from "@/components/home/DipaliExperience";
import { GrandReveal } from "@/components/home/GrandReveal";
import { LivingExperiences } from "@/components/home/LivingExperiences";
import { ChapterHead } from "@/components/home/ChapterHead";
import { RoomDiscovery, type RoomPreview } from "@/components/home/RoomDiscovery";
import { CelebrateScene } from "@/components/home/CelebrateScene";
import { DineHandoff } from "@/components/home/DineHandoff";
import { UnwindRipple } from "@/components/home/UnwindRipple";
import { PicturesAssemble } from "@/components/home/PicturesAssemble";
import { LayeredSection } from "@/components/motion/LayeredSection";
import { getGallery, getLeisure, getOutlet, getRooms, getSite, getVenues } from "@/content";
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
  const city = site.address.value.city;

  // The home page tells each experience once, in The Living Experiences, and
  // never shows the same photograph twice (A World Within Dipali and the
  // older Stay / Celebrate / Unwind / Dine sections were folded into it).

  // I · Stay: every room, each linking to its page.
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

  // II · Celebrate: the first real photograph of a venue (never a labelled
  // placeholder in the full-bleed scene), and every venue on the card.
  const celebrateVenue = venues.find((venue) => venue.images.some(isPhoto));
  const celebrateImage = celebrateVenue?.images.find(isPhoto);

  // III · Dine: the places in the order of a day, from the daytime table to
  // the evening bar; the frame holds the restaurant by day and the bar after dark.
  const dineOutlets = [
    { outlet: restaurant, mood: "Through the day" },
    { outlet: bakery, mood: "Something to take home" },
    { outlet: sweets, mood: "Something to take home" },
    { outlet: poolside, mood: "By the water" },
    { outlet: bar, mood: "Evening" },
  ].flatMap(({ outlet, mood }) =>
    outlet
      ? [{ name: outlet.name, href: outletHref(outlet.slug), mood, summary: outlet.summary }]
      : [],
  );
  const dayImage = restaurant?.images.find(isPhoto);
  const eveningImage = bar?.images.find(isPhoto);

  // IV · Unwind: the pool from above.
  const { pool, gym } = leisure;
  const poolImage = pool.images.find(isPhoto);

  // "In pictures": the hospitality photographs with no section of their own —
  // reception, sitting areas, the portico and the lounges. Rooms have their
  // own chapter, so room photographs are left out here, as is the photograph
  // "The Dipali Experience" already shows.
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

  return (
    <>
      {/* ═══ ARRIVE — the lit entrance, framed by a gold arch ═══ */}
      <IntroLoader caption={`${city} · ${site.address.value.state}`} />
      {/* The hero holds still while The Dipali Experience rises over it
          (rich motion); the wrapper ends the hold once it is covered. */}
      <div className="layers">
        <EntranceHero
          image={site.homeHero}
          video={site.homeHeroVideo}
          eyebrow="A Timeless Destination"
          titlePrefix={`${site.name}, ${city}:`}
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
              // leads to The Living Experiences, below the Grand Reveal.
              // Repoint it once one exists (docs/PLAN.md, open questions).
              cta={{ label: "Discover Our Story", href: "#explore" }}
              image={site.homeExperience}
              caption={`The reception atrium · ${city}`}
            />
          </div>
          {/* Deepens as The Grand Reveal covers this section (rich motion). */}
          <div aria-hidden="true" className="layer-veil" />
        </LayeredSection>
      </div>

      {/* ═══ THE GRAND REVEAL — through a portal to the whole house at night ═══
          An emerald panel rises over The Dipali Experience (rich motion). */}
      <LayeredSection
        id="reveal"
        covers="#welcome"
        data-theme="emerald"
        aria-labelledby="home-reveal"
        className="grand-reveal-section layer-rise scroll-mt-24 bg-surface text-ink"
      >
        <GrandReveal
          headingId="home-reveal"
          eyebrow="Hotel Dipali by night"
          title={{ lines: ["As evening falls,", "the whole house"], accent: "comes alight" }}
          lead="The façade, the gardens and the porch, lit for every guest who arrives after dark."
          image={site.homeReveal}
          caption={`The façade at night · ${city}`}
          inscription={`${site.name} · ${city}`}
          cta={{ label: "Plan your visit", href: "#enquire" }}
        />
      </LayeredSection>

      {/* ═══ THE LIVING EXPERIENCES — an ivory arch rises over the night ═══
          Four chapters, each composed and moving in its own way. */}
      <section
        id="explore"
        aria-labelledby="home-living"
        className="threshold paper-grain scroll-mt-28 overflow-x-clip bg-surface pt-[var(--arch)]"
      >
        <LivingExperiences
          headingId="home-living"
          eyebrow="Four experiences · One destination"
          title={{ lead: "The", accent: "Living", tail: "Experiences" }}
          intro={`To stay, to celebrate, to dine and to unwind — one address in ${city}, many ways to spend the day.`}
          chapters={[
            { href: "#stay", numeral: "I", label: "Stay" },
            { href: "#celebrate", numeral: "II", label: "Weddings & Events" },
            { href: "#dine", numeral: "III", label: "Dining" },
            { href: "#unwind", numeral: "IV", label: "Pool & Gym" },
          ]}
        >
          {/* ─── I · STAY — the rooms as an index, the stage following ─── */}
          <section id="stay" aria-labelledby="home-rooms" className="chapter chapter-stay scroll-mt-24">
            <div className="stay container-site">
              <div className="stay-intro">
                <ChapterHead
                  numeral="I"
                  label="Stay"
                  headingId="home-rooms"
                  title={{ lead: "A room for every", accent: "guest" }}
                />
                <ScrollReveal delay={140}>
                  <p className="chapter-lead">
                    Rooms in warm wood and soft light — choose by size and by how many of you
                    are travelling.
                  </p>
                </ScrollReveal>
              </div>
              <RoomDiscovery rooms={roomPreviews} />
              <ScrollReveal className="stay-more">
                <Link href="/rooms/" prefetch={false} className="link-royal">
                  Explore all rooms
                </Link>
              </ScrollReveal>
            </div>
          </section>

          {/* ─── II · CELEBRATE — the hall, seen through the word ─── */}
          <section
            id="celebrate"
            data-theme="peacock"
            aria-labelledby="home-weddings"
            className="chapter chapter-celebrate paper-grain scroll-mt-24 overflow-x-clip bg-surface text-ink"
          >
            <CelebrateScene
              word="Celebrate"
              image={celebrateImage}
              caption={celebrateVenue ? `${celebrateVenue.name} · ${city}` : city}
              venues={venues.map((venue) => ({ name: venue.name, kind: VENUE_KIND[venue.kind] ?? venue.kind }))}
            >
              <ChapterHead
                numeral="II"
                label="Weddings & Events"
                headingId="home-weddings"
                title={{ lead: "Lawns, halls and room for", accent: "everyone" }}
              />
              <ScrollReveal delay={140}>
                <p className="chapter-lead">
                  Open-air lawns and banquet halls for weddings, receptions, ring ceremonies,
                  birthdays and corporate events.
                </p>
                <div className="chapter-actions">
                  <Link href="/weddings/" prefetch={false} className="btn-primary">
                    Plan your wedding
                  </Link>
                  <Link href="/events/" prefetch={false} className="link-royal">
                    Events &amp; gatherings
                  </Link>
                </div>
              </ScrollReveal>
            </CelebrateScene>
          </section>

          {/* ─── III · DINE — from the table into the evening ─── */}
          <section id="dine" aria-labelledby="home-dining" className="chapter chapter-dine scroll-mt-24 bg-surface-alt">
            <DineHandoff
              outlets={dineOutlets}
              more={{ label: "Explore dining", href: "/dining/" }}
              day={dayImage && restaurant ? { image: dayImage, label: `By day · ${restaurant.name}` } : undefined}
              evening={eveningImage && bar ? { image: eveningImage, label: `After dark · ${bar.name}` } : undefined}
            >
              <ChapterHead
                numeral="III"
                label="Dining"
                headingId="home-dining"
                title={{ lead: "From the table into the", accent: "evening" }}
              />
              <ScrollReveal delay={140}>
                <p className="chapter-lead">
                  A restaurant, the Dipali counters, poolside plates and the Infinity Bar — one
                  family of places to eat, drink and gather.
                </p>
              </ScrollReveal>
            </DineHandoff>
          </section>

          {/* ─── IV · UNWIND — the water, in widening circles ─── */}
          <section id="unwind" aria-labelledby="home-leisure" className="chapter chapter-unwind scroll-mt-24 bg-surface">
            <UnwindRipple image={poolImage}>
              <ChapterHead
                numeral="IV"
                label="Pool & Gym"
                headingId="home-leisure"
                title={{ lead: "Room to", accent: "unwind" }}
              />
              <p className="chapter-lead">{pool.summary}</p>
              <p className="chapter-body">{gym.summary}</p>
              <div className="chapter-actions">
                <a href="#enquire" className="btn-secondary">
                  Ask about memberships
                </a>
              </div>
            </UnwindRipple>
          </section>
        </LivingExperiences>
      </section>

      {/* ═══ IN PICTURES — a look around, assembling as it arrives ═══ */}
      {pictures.length >= 3 ? (
        <section
          id="gallery"
          aria-labelledby="home-pictures"
          className="pictures-section scroll-mt-24 overflow-x-clip bg-surface"
        >
          <div className="container-site">
            <div className="pictures-head">
              <ScrollReveal>
                <p className="pictures-eyebrow">In pictures</p>
              </ScrollReveal>
              <ScrollReveal variant="mask" delay={60}>
                <h2 id="home-pictures" className="pictures-title">
                  A look <em>around</em>
                </h2>
              </ScrollReveal>
            </div>
            <PicturesAssemble images={pictures} />
          </div>
        </section>
      ) : null}

      {/* ═══ CLOSE — a peacock arch, and the conversation that starts a visit ═══ */}
      <section
        id="enquire"
        data-theme="peacock"
        aria-labelledby="home-enquire"
        className="close-section threshold paper-grain scroll-mt-24 bg-surface pt-[calc(var(--arch)+3rem)] pb-20 text-ink md:pb-28"
      >
        <div className="close container-site">
          <ScrollReveal className="close-copy">
            <span aria-hidden="true" className="close-medallion">
              <MedallionRing className="close-ring" />
              <Emblem className="close-emblem" sizes="2.75rem" />
            </span>
            <h2 id="home-enquire" className="close-title">
              Every visit begins with a <em>conversation</em>
            </h2>
            <span aria-hidden="true" className="close-rule" />
            <p className="close-lead">
              Tell us what you are planning — a stay, a wedding, a meal or a membership — with
              your dates, and we will reply with the details.
            </p>
            {/* The same lines as the contact page's front desk. */}
            <ContactLines variant="list" className="close-contacts" />
          </ScrollReveal>

          <div className="close-form">
            <EnquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
