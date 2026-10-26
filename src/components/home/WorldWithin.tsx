import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Picture } from "@/components/media/Picture";
import type { Image } from "@/content";

export type WorldExperience = {
  /** Layout slot; the first item is the featured one. */
  slot: "feature" | "tall" | "wide" | "panorama";
  numeral: string;
  label: string;
  /** The item's heading; also the text of its link. */
  title: string;
  href: string;
  /** Visible call to action under the title (decorative; the title links). */
  more: string;
  /** A second, related destination (e.g. Events beside Weddings). */
  aside?: { label: string; href: string };
  image: Image;
};

type WorldWithinProps = {
  headingId: string;
  eyebrow: string;
  title: { lead: string; accent: string };
  intro: string;
  items: WorldExperience[];
};

// How each photograph opens as it enters, and the width it is shown at
// (the `sizes` hint): every slot reveals from its own direction.
const SLOT: Record<WorldExperience["slot"], { reveal: "wipe-up" | "wipe-down" | "wipe-left" | "wipe-centre"; sizes: string }> = {
  feature: { reveal: "wipe-up", sizes: "(min-width: 1024px) min(54vw, 41rem), 100vw" },
  tall: { reveal: "wipe-down", sizes: "(min-width: 1024px) min(30vw, 23rem), 80vw" },
  wide: { reveal: "wipe-left", sizes: "(min-width: 1024px) min(30vw, 23rem), 80vw" },
  panorama: { reveal: "wipe-centre", sizes: "(min-width: 1024px) min(54vw, 41rem), 100vw" },
};

/**
 * "A World Within Dipali": the hotel as a collection of experiences in one
 * place — an editorial gallery on emerald stone, not a grid of equal cards.
 * A featured experience (large, with an ivory plaque) and supporting ones of
 * different proportions, each photograph opening from its own direction as
 * it arrives; labels and titles follow with a short stagger and fine gold
 * rules draw in after. Under rich motion the panels also drift at slightly
 * different rates (transform only, from the section's --p). Every item is one
 * link (its title) stretched over the whole panel. Server-rendered; complete
 * and readable with no JS or motion.
 */
export function WorldWithin({ headingId, eyebrow, title, intro, items }: WorldWithinProps) {
  return (
    <div className="world container-site">
      <div className="world-head">
        <ScrollReveal className="world-eyebrow-wrap">
          <p className="world-eyebrow">{eyebrow}</p>
        </ScrollReveal>
        {/* One mask for the heading; its second line follows a beat later (CSS). */}
        <ScrollReveal variant="mask" delay={60} className="world-title-wrap">
          <h2 id={headingId} className="world-title">
            <span className="world-title-line">{title.lead}</span>{" "}
            <span className="world-title-line world-title-accent">
              <em>{title.accent}</em>
            </span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={220} className="world-intro">
          <span aria-hidden="true" className="world-rule" />
          <p>{intro}</p>
        </ScrollReveal>
      </div>

      <ul className="world-grid">
        {items.map((item, index) => {
          const slot = SLOT[item.slot];
          return (
            <li key={item.href} className={`world-item world-item-${item.slot}`}>
              <div className="world-media">
                <ScrollReveal variant={slot.reveal} delay={index === 0 ? 80 : 0} className="world-frame">
                  <Picture image={item.image} fill decorative sizes={slot.sizes} />
                </ScrollReveal>
              </div>
              <ScrollReveal delay={160} className="world-caption">
                <span aria-hidden="true" className="world-numeral">
                  {item.numeral}
                </span>
                <div className="world-caption-body">
                  <p className="world-label">{item.label}</p>
                  <h3 className="world-item-title">
                    <a href={item.href} className="world-link">
                      {item.title}
                    </a>
                  </h3>
                  <div className="world-actions">
                    <span aria-hidden="true" className="world-more">
                      {item.more}
                    </span>
                    {item.aside ? (
                      <a href={item.aside.href} className="world-aside">
                        {item.aside.label}
                      </a>
                    ) : null}
                  </div>
                </div>
              </ScrollReveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
