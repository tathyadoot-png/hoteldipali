import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/home/ScrollReveal";

type LivingExperiencesProps = {
  /** id of the h2, for the enclosing section's aria-labelledby. */
  headingId: string;
  eyebrow: string;
  /** "The" + `accent` (italic) on the first line, `tail` stepped in below. */
  title: { lead: string; accent: string; tail: string };
  intro: string;
  /** The chapters that follow, for the in-page index. */
  chapters: { href: string; numeral: string; label: string }[];
  /** The chapters themselves (Stay, Celebrate, Dine, Unwind). */
  children: ReactNode;
};

/**
 * "The Living Experiences": the home page's one telling of the hotel's four
 * experiences — Stay, Weddings & Events, Dining, Pool & Gym. A stepped
 * heading, the introduction and an index of the four chapters, then the
 * chapters themselves, each composed and moving in its own way (see their
 * components). Server-rendered; complete without JS or motion.
 */
export function LivingExperiences({
  headingId,
  eyebrow,
  title,
  intro,
  chapters,
  children,
}: LivingExperiencesProps) {
  return (
    <>
      <div className="living container-site">
        <div className="living-head">
          <ScrollReveal className="living-eyebrow-wrap">
            <p className="living-eyebrow">{eyebrow}</p>
          </ScrollReveal>
          <ScrollReveal variant="mask" delay={60} className="living-title-wrap">
            <h2 id={headingId} className="living-title">
              <span className="living-title-line">
                {title.lead} <em>{title.accent}</em>
              </span>{" "}
              <span className="living-title-line living-title-step">{title.tail}</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="slide-left" delay={200} className="living-intro">
            <p>{intro}</p>
          </ScrollReveal>
        </div>

        <nav aria-label="The four experiences" className="living-index">
          <ol>
            {chapters.map((chapter, i) => (
              <li key={chapter.href}>
                <ScrollReveal delay={260 + i * 70}>
                  <a href={chapter.href} className="living-index-link">
                    <span aria-hidden="true" className="living-index-numeral">
                      {chapter.numeral}
                    </span>
                    {chapter.label}
                  </a>
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      {children}
    </>
  );
}
