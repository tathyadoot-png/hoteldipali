import { CallLink } from "@/components/links/CallLink";
import { Picture } from "@/components/media/Picture";
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
 * The home page's hero — temporary and static: one full-bleed image under the
 * name and the calls to action, in the Peacock variant so the transparent
 * header reads over it. A server component; the redesign replaces it.
 */
export function EntranceHero({ image, eyebrow, title, tagline }: EntranceHeroProps) {
  return (
    <section
      data-theme="peacock"
      aria-labelledby="home-hero"
      className="entrance -mt-18 bg-surface text-ink md:-mt-22"
    >
      <Picture image={image} fill priority decorative sizes="100vw" />
      <div aria-hidden="true" className="entrance-scrim absolute inset-0" />

      <div className="entrance-content container-site">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="home-hero" className="heading-hero mt-5">
          {title.lead}
          <br />
          <em>{title.emphasis}</em>
        </h1>
        <p className="entrance-tagline">{tagline}</p>
        <div className="entrance-actions mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <a href="#enquire" className="btn-primary btn-arch">
            Enquire now
          </a>
          <CallLink className="btn-ghost" />
        </div>
      </div>
    </section>
  );
}
