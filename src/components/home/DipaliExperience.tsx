import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Picture } from "@/components/media/Picture";
import type { Image } from "@/content";

type DipaliExperienceProps = {
  /** id of the h2, for the enclosing section's aria-labelledby. */
  headingId: string;
  eyebrow: string;
  /** Two lines; `accent` (in the second line) is set in the script face. */
  title: { first: string; secondLead: string; accent: string; secondTail: string };
  lead: string;
  body?: string;
  cta: { label: string; href: string };
  /** A 4:5 photograph of the hotel. */
  image: Image;
  /** Short visible caption, e.g. "The reception atrium · Sagar". */
  caption: string;
};

/**
 * "The Dipali Experience": the editorial pair below the home hero, on the
 * ivory threshold. The statement on one side; on the other a photograph of the
 * hotel under a shallow lintel (the threshold's own curve), set against a
 * tablet of emerald stone and traced by a fine gold line that draws upward
 * once the photograph is revealed. Server-rendered; the reveals are the shared
 * ScrollReveal (no scroll-linked work), and everything is complete without JS
 * or motion.
 */
export function DipaliExperience({
  headingId,
  eyebrow,
  title,
  lead,
  body,
  cta,
  image,
  caption,
}: DipaliExperienceProps) {
  return (
    <div className="experience">
      <div className="experience-head">
        <ScrollReveal>
          <p className="experience-eyebrow">{eyebrow}</p>
        </ScrollReveal>
        <ScrollReveal variant="mask" delay={60}>
          <h2 id={headingId} className="experience-title">
            <span className="experience-line">{title.first}</span>{" "}
            <span className="experience-line">
              {title.secondLead} <span className="experience-script">{title.accent}</span>
              {title.secondTail}
            </span>
          </h2>
        </ScrollReveal>
      </div>

      <figure className="experience-figure">
        {/* Emerald stone tablet; data-theme needs its own text-ink (CLAUDE.md §E). */}
        <div aria-hidden="true" data-theme="emerald" className="experience-plinth text-ink" />
        <div className="experience-window">
          <ScrollReveal variant="image" delay={80} className="experience-photo">
            <Picture
              image={image}
              fill
              // The window is 88% of the figure: the figure is the column
              // (≤ 34rem) below 1024px, ~6/11 of the container from 1024px.
              sizes="(min-width: 1024px) min(41vw, 34rem), min(80vw, 30rem)"
            />
          </ScrollReveal>
          {/* Drawn once the photograph has been revealed (sibling selector). */}
          <span aria-hidden="true" className="experience-frame" />
          <span aria-hidden="true" className="experience-keystone" />
        </div>
        <figcaption data-theme="emerald" className="experience-caption text-ink">
          {caption}
        </figcaption>
      </figure>

      <ScrollReveal delay={140} className="experience-text">
        <span aria-hidden="true" className="experience-rule" />
        <p className="experience-lead">{lead}</p>
        {body ? <p className="experience-body">{body}</p> : null}
        <a href={cta.href} className="experience-cta btn-secondary btn-cta">
          {cta.label}
        </a>
      </ScrollReveal>
    </div>
  );
}
