import { preload } from "react-dom";

import { ArchFrame, Sprig } from "@/components/brand/Ornaments";
import { HeroDepth } from "@/components/home/HeroDepth";
import { HeroVideo } from "@/components/home/HeroVideo";
import { Picture } from "@/components/media/Picture";
import type { Image, Site } from "@/content";

type Cta = { label: string; href: string };

type EntranceHeroProps = {
  /** The hotel itself, seen through the arched window — and the video's poster. */
  image: Image;
  /** The same view in motion (tablet and up; see HeroVideo). */
  video?: Pick<Site["homeHeroVideo"], "src" | "width" | "height">;
  eyebrow: string;
  /** Headline in three parts; `accent` is set in the script face. */
  title: { lead: string; accent: string; tail: string };
  /** Read before the visible headline by assistive tech and search engines. */
  titlePrefix: string;
  subline: string;
  primary: Cta;
  secondary: Cta;
};

// The emerald canvas's stone texture (--texture-stone in theme.css) is this
// page's largest paint, but only CSS refers to it; hinted from the document
// head it loads alongside the photograph instead of after the stylesheet.
const STONE_TEXTURE = "/images/textures/emerald-stone-1024.webp";

// The gold ribbon: two strands of one band crossing the emerald canvas. Wide
// screens: it rises from the left edge above the headline, flows into the
// arched doorway at its shoulder (passing behind the photograph) and leaves
// through the far side above the sprig. Narrow screens: a shorter curve that
// threads behind the arch.
const RIBBON_WIDE = {
  a: "M-80 300C160 170 420 130 640 175C820 212 930 262 1060 236C1170 214 1300 214 1400 320C1440 362 1480 400 1540 420C1600 440 1650 440 1700 432",
  b: "M-80 330C162 200 424 160 644 205C822 242 934 292 1064 266C1176 244 1304 244 1404 350C1444 392 1484 430 1544 450C1604 470 1654 470 1700 462",
};
const RIBBON_NARROW = {
  a: "M460 140C360 110 320 190 280 260C240 330 150 350 80 370C30 384 0 400 -40 430",
  b: "M460 168C366 138 334 214 296 282C256 352 162 374 90 394C40 408 8 424 -40 456",
};

function Ribbon({ variant }: { variant: "wide" | "narrow" }) {
  const paths = variant === "wide" ? RIBBON_WIDE : RIBBON_NARROW;
  const id = `ribbon-gold-${variant}`;
  return (
    <svg
      aria-hidden="true"
      className={`entrance-ribbon entrance-ribbon-${variant}`}
      viewBox={variant === "wide" ? "0 0 1600 1000" : "0 0 400 900"}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={variant === "wide" ? 1600 : 400}
          y2={variant === "wide" ? 1000 : 900}
        >
          <stop offset="0" className="stop-shade" />
          <stop offset="0.38" className="stop-gold" />
          <stop offset="0.52" className="stop-glint" />
          <stop offset="0.66" className="stop-gold" />
          <stop offset="1" className="stop-shade" />
        </linearGradient>
      </defs>
      <path className="ribbon-strand ribbon-b" pathLength={1} d={paths.b} stroke={`url(#${id})`} />
      <path className="ribbon-strand ribbon-a" pathLength={1} d={paths.a} stroke={`url(#${id})`} />
      {/* A single light that runs along the band once it has drawn. */}
      <path className="ribbon-glint" pathLength={1} d={paths.a} />
    </svg>
  );
}

/**
 * The home page's opening statement (Emerald). A textured emerald canvas; the
 * hotel's lit entrance seen through an arched window in a double gold frame,
 * flanked by botanical sprigs; one gold ribbon crossing the composition; and
 * the editorial headline. On first load the loader's arch flies onto this
 * arch (IntroLoader); everything here is also complete and legible with every
 * animation disabled. Server-rendered; HeroDepth adds the pointer response
 * and HeroVideo the moving image. Under rich motion the hero holds still
 * (sticky) and recedes while The Dipali Experience rises over it — driven by
 * --cover, which that section writes here (LayeredSection).
 */
export function EntranceHero({
  image,
  video,
  eyebrow,
  title,
  titlePrefix,
  subline,
  primary,
  secondary,
}: EntranceHeroProps) {
  preload(STONE_TEXTURE, { as: "image", fetchPriority: "high" });

  return (
    <section
      data-theme="emerald"
      aria-labelledby="home-hero"
      className="entrance -mt-18 bg-surface text-ink md:-mt-22"
    >
      <div aria-hidden="true" className="entrance-canvas" />
      <Ribbon variant="wide" />
      <Ribbon variant="narrow" />

      <div className="entrance-inner container-site">
        <div className="entrance-copy">
          <p className="entrance-eyebrow">{eyebrow}</p>
          <h1 id="home-hero" className="entrance-title">
            <span className="visually-hidden">{titlePrefix} </span>
            <span className="entrance-line">
              {title.lead} <span className="entrance-script">{title.accent}</span>
            </span>{" "}
            <span className="entrance-line">{title.tail}</span>
          </h1>
          <p className="entrance-subline">{subline}</p>
          <div className="entrance-actions">
            <a href={primary.href} className="btn-secondary btn-cta">
              {primary.label}
            </a>
            <a href={secondary.href} className="link-royal">
              {secondary.label}
            </a>
          </div>
        </div>

        <figure className="entrance-arch">
          <div className="entrance-arch-window">
            {/* The arch's CSS width: min(58vw, 20rem); from 1024px, 0.72 × its
                height of min(68svh, 44rem). */}
            <Picture
              image={image}
              fill
              priority
              sizes="(min-width: 1024px) min(49vh, 32rem), min(58vw, 20rem)"
            />
            {video ? <HeroVideo src={video.src} width={video.width} height={video.height} /> : null}
          </div>
          <ArchFrame className="entrance-arch-frame" />
          <Sprig className="entrance-sprig entrance-sprig-l" />
          <Sprig className="entrance-sprig entrance-sprig-r" flip />
        </figure>
      </div>

      {/* Deepens as the next section covers the hero (rich motion only). */}
      <div aria-hidden="true" className="layer-veil" />
      <HeroDepth />
    </section>
  );
}
