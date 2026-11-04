import Link from "next/link";

import { Picture } from "@/components/media/Picture";
import { BookStayLink } from "@/components/links/BookStayLink";
import { ArchWindow } from "@/components/motion/ArchWindow";
import { DepthPhoto } from "@/components/motion/DepthPhoto";
import type { Image } from "@/content";

type HomeHeroProps = {
  /** The hotel itself, seen through the arch window. */
  image: Image;
  /** Its grey depth map (pnpm make:depth), for the pointer's depth. */
  depthSrc: string;
  /** "Hotel Dipali": the first word on one line, the rest (in plum) below. */
  name: string;
  city: string;
  /** One line of positioning (site.tagline). */
  line: string;
  /** From getBookingUrl() (src/lib/booking.ts). */
  bookingUrl: string | null;
};

/**
 * The home page's opening statement, on ivory. Left: the name, very large —
 * DIPALI in plum, taking one pass of gold foil as it arrives — the line from
 * content, Book a Stay and Plan a Wedding. Right: the lit entrance inside an
 * arch window, a soft lavender halo behind it and a thin gold double frame.
 *
 * Under rich motion (desktop) the photograph gains depth from the pointer
 * (DepthPhoto, WebGL, lazy), and as The Dipali Experience rises over the
 * hero (--cover, LayeredSection) the arch opens toward a full frame while the
 * copy rises away. Phones get the same content in one column, with no WebGL
 * and no video. Server-rendered; complete with every animation disabled.
 */
export function HomeHero({ image, depthSrc, name, city, line, bookingUrl }: HomeHeroProps) {
  const [first = name, ...rest] = name.split(" ");

  return (
    <section aria-labelledby="home-hero" className="home-hero">
      <p aria-hidden="true" className="home-hero-vertical">
        A stay to remember
      </p>

      <div className="home-hero-inner container-site">
        <div className="home-hero-copy">
          <p className="eyebrow">Welcome to</p>
          <h1 id="home-hero" className="home-hero-name">
            {/* The display lines are visual; the heading's name is one phrase. */}
            <span className="visually-hidden">
              {name}, {city}
            </span>
            <span aria-hidden="true">{first}</span>
            <span aria-hidden="true" className="home-hero-dipali foil">
              {rest.join(" ")}
            </span>
          </h1>
          <p className="home-hero-line">{line}</p>
          <div className="home-hero-actions">
            <BookStayLink bookingUrl={bookingUrl} className="btn-primary" />
            <Link href="/weddings/" prefetch={false} className="btn-secondary">
              Plan a Wedding
            </Link>
          </div>
        </div>

        <div className="home-hero-art">
          <span aria-hidden="true" className="home-hero-halo" />
          <ArchWindow>
            {/* The window is min(78vw, 22rem) wide on phones; from 1024px up to
                27rem (and no taller than the viewport allows). On phones `sizes`
                deliberately under-declares (~2/3 of the width): at 3× it picks the
                720 w file (79 KB) instead of the 960 w (124 KB) — still ~2.4×
                density — because this photograph is the phone's LCP and shares
                a slow link with everything else. */}
            <Picture
              image={image}
              fill
              priority
              sizes="(min-width: 1024px) min(27rem, 36vw), min(52vw, 15rem)"
            />
            <DepthPhoto depthSrc={depthSrc} focus={image.focus} />
          </ArchWindow>
          <span aria-hidden="true" className="home-hero-frame" />
          <span aria-hidden="true" className="home-hero-frame home-hero-frame-outer" />
        </div>
      </div>

      {/* Deepens as the next section covers the hero (rich motion only). */}
      <div aria-hidden="true" className="layer-veil" />
    </section>
  );
}
