import { CallLink } from "@/components/links/CallLink";
import { Picture } from "@/components/media/Picture";
import { ScrollSection } from "@/components/motion/ScrollSection";
import type { Image } from "@/content";

type EntranceHeroProps = {
  image: Image;
  /** e.g. "Sagar, Madhya Pradesh" */
  eyebrow: string;
  /** The hotel name: the lead word, then the emphasised rest. */
  title: { lead: string; emphasis: string };
  tagline: string;
};

/**
 * The home page's hero: the hotel's own aerial photograph, full bleed, with
 * the name and the calls to action on a forest-green gradient. The copy rises
 * in on load (CSS only, so it runs before hydration and without JS); with rich
 * motion the photograph drifts a little slower than the page as you scroll
 * away. Complete and legible with every animation disabled.
 */
export function EntranceHero({ image, eyebrow, title, tagline }: EntranceHeroProps) {
  return (
    <ScrollSection
      mode="through"
      data-theme="peacock"
      aria-labelledby="home-hero"
      className="entrance -mt-18 bg-surface text-ink md:-mt-22"
    >
      <div aria-hidden="true" className="entrance-media">
        <Picture image={image} fill priority decorative sizes="100vw" />
      </div>
      <div aria-hidden="true" className="entrance-scrim absolute inset-0" />

      <div className="entrance-content container-site">
        <p className="entrance-rise eyebrow entrance-eyebrow">{eyebrow}</p>
        <h1 id="home-hero" className="entrance-rise heading-hero mt-5">
          {title.lead}
          <br />
          <em>{title.emphasis}</em>
        </h1>
        <p className="entrance-rise entrance-tagline">{tagline}</p>
        <div className="entrance-rise entrance-actions mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <a href="#enquire" className="btn-primary btn-cta">
            Enquire now
          </a>
          <CallLink className="btn-ghost" />
        </div>
      </div>
    </ScrollSection>
  );
}
