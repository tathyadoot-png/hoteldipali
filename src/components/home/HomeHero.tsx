import Link from "next/link";
import { preload } from "react-dom";

import { Wordmark } from "@/components/brand/Wordmark";
import { HeroMorph } from "@/components/home/HeroMorph";
import { BookStayLink } from "@/components/links/BookStayLink";
import { Picture, srcSetFor } from "@/components/media/Picture";
import type { Image } from "@/content";

type HomeHeroProps = {
  /** The lit entrance cut out of the night (pnpm make:mask): it stands in front of the name. */
  cutout: Image;
  /** "Hotel Dipali": HOTEL small above, DIPALI across the screen. */
  name: string;
  city: string;
  /** One line of positioning (site.tagline). */
  line: string;
  /** From getBookingUrl() (src/lib/booking.ts). */
  bookingUrl: string | null;
};

// The building is ~46% of the screen's width from 1024px; on phones it is
// wider than the screen (its garden fades out at the sides), but `sizes`
// deliberately under-declares there: at 3× it picks the 720 w file (54 KB)
// instead of the 1080 w — still ~1.6× density — because this cut-out is the
// phone's largest paint and shares a slow link with everything else.
const SIZES = "(min-width: 1024px) min(46vw, 48rem), 60vw";

/**
 * The home page's opening statement, on the night (the deep scope): DIPALI
 * across the whole width in engraved gold, HOTEL above it, and the hotel's
 * own lit entrance — a cut-out of the real night photograph — standing in
 * front of the letters. Below: the line from content, Book a Stay and Plan a
 * Wedding, and on wide screens a gold hairline as the scroll cue.
 *
 * Under rich motion (desktop) HeroMorph turns the first viewport of scroll
 * into one movement: the letters spread a little and sink behind the
 * building, which rises faster; then the name shrinks and travels into the
 * header's centre, where the header's logotype takes over. Phones get the
 * same layering, still, with the header's logotype from the start.
 * Server-rendered; complete with every animation disabled.
 */
export function HomeHero({ cutout, name, city, line, bookingUrl }: HomeHeroProps) {
  // The cut-out is the phone's largest paint: fetch it with the document.
  preload(cutout.src, {
    as: "image",
    fetchPriority: "high",
    imageSrcSet: srcSetFor(cutout.src, cutout.widths),
    imageSizes: SIZES,
  });

  return (
    <section aria-labelledby="home-hero" data-theme="deep" className="home-hero text-ink">
      {/* The name is shown by the wordmark; the heading says it once. */}
      <h1 id="home-hero" className="visually-hidden">
        {name}, {city}
      </h1>

      <div className="home-hero-name">
        <Wordmark name={name} />
      </div>

      <div className="home-hero-building">
        <Picture image={cutout} priority sizes={SIZES} transparent />
      </div>

      <div className="home-hero-foot">
        <p className="home-hero-line">{line}</p>
        <div className="home-hero-actions">
          <BookStayLink bookingUrl={bookingUrl} className="btn-primary" />
          <Link href="/weddings/" prefetch={false} className="btn-secondary">
            Plan a Wedding
          </Link>
        </div>
        <span aria-hidden="true" className="home-hero-cue" />
      </div>

      <HeroMorph />
    </section>
  );
}
