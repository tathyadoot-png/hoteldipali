import type { CSSProperties, ReactNode } from "react";

import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Picture } from "@/components/media/Picture";
import { ScrollScene } from "@/components/motion/ScrollScene";
import type { Image } from "@/content";

type DineHandoffProps = {
  /** The chapter's opening (ChapterHead) and introduction. */
  children: ReactNode;
  /** The family of places, from the daytime table to the evening bar. */
  outlets: { name: string; href: string; mood: string; summary: string }[];
  /** Where the list ends: the dining page. */
  more: { label: string; href: string };
  /** The two photographs (without both: no frame, the menu only). */
  day?: { image: Image; label: string };
  evening?: { image: Image; label: string };
};

/**
 * Dine: from the table into the evening — the hand-off from one experience to
 * the next. The places to eat and drink are listed like a menu, in the order
 * of a day; beside them one frame holds the restaurant by day and the
 * Infinity Bar after dark. Under rich motion the chapter's own --p
 * (ScrollScene) drives the hand-off: as the reader goes down the menu, dusk
 * is drawn down across the frame — the evening photograph over the day's,
 * behind a fine gold horizon — and each place's marker lights as the evening
 * reaches it. The frame stays beside the menu (sticky in its column); nothing
 * is pinned. Without rich motion the evening photograph is layered over the
 * day's corner.
 */
export function DineHandoff({ children, outlets, more, day, evening }: DineHandoffProps) {
  return (
    <ScrollScene className="dine container-site">
      <div className="dine-copy">{children}</div>

      {day && evening ? (
        <div className="dine-stage">
          <figure className="dine-day">
            <ScrollReveal variant="wipe-down" className="dine-photo">
              <Picture image={day.image} fill sizes="(min-width: 1024px) 42vw, 88vw" />
            </ScrollReveal>
            <figcaption className="dine-label">{day.label}</figcaption>
          </figure>
          <figure data-theme="peacock" className="dine-evening text-ink">
            <ScrollReveal variant="wipe-down" delay={160} className="dine-photo">
              <Picture image={evening.image} fill sizes="(min-width: 1024px) 42vw, 44vw" />
            </ScrollReveal>
            <figcaption className="dine-label">{evening.label}</figcaption>
          </figure>
          <span aria-hidden="true" className="dine-horizon" />
        </div>
      ) : null}

      <div className="dine-list">
        <ol className="dine-menu">
          {outlets.map((outlet, i) => (
            <li key={outlet.href} style={{ "--i": i, "--n": outlets.length } as CSSProperties}>
              <ScrollReveal delay={i * 60} className="dine-item">
                <span aria-hidden="true" className="dine-marker" />
                <p className="dine-mood">{outlet.mood}</p>
                <a href={outlet.href} className="dine-name">
                  {outlet.name}
                </a>
                <p className="dine-summary">{outlet.summary}</p>
              </ScrollReveal>
            </li>
          ))}
        </ol>
        <ScrollReveal>
          <a href={more.href} className="link-royal dine-more">
            {more.label}
          </a>
        </ScrollReveal>
      </div>
    </ScrollScene>
  );
}
