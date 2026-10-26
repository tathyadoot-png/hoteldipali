import type { CSSProperties } from "react";

import { CornerOrnament } from "@/components/brand/Ornaments";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Picture } from "@/components/media/Picture";
import { ScrollScene } from "@/components/motion/ScrollScene";
import type { Image } from "@/content";

type GrandRevealProps = {
  /** id of the h2, for the enclosing section's aria-labelledby. */
  headingId: string;
  eyebrow: string;
  /** The heading, line by line; `accent` is its last line, in italic gold. */
  title: { lines: string[]; accent: string };
  lead: string;
  /** The wide view of the building (tablet and up), with a portrait crop for
   * phones as `small`. */
  image: Image;
  /** Short visible caption, e.g. "The façade at night · Sagar". */
  caption: string;
  /** Carved along the portal's arch, e.g. "Hotel Dipali · Sagar". */
  inscription: string;
  cta: { label: string; href: string };
};

const CORNERS = ["tl", "tr", "br", "bl"] as const;

/**
 * "The Grand Reveal": the whole hotel, lit for the evening — the home page's
 * signature moment. A centred, staggered heading over a wide photograph of the
 * façade at night, set in a fine antique-gold frame with corner ornaments and
 * a keystone.
 *
 * Under rich motion it is a walk through a portal (ScrollScene's --p on the
 * stage): the photograph first shows through an arched doorway over the
 * entrance porch — the hero's arch, here built of stone jambs and an archivolt
 * with the hotel's name carved along it. As the stage rises the visitor passes
 * through: the doorway and its architecture grow toward and past the viewer
 * while the photograph behind settles from a slight zoom, two planes moving at
 * different rates; then the gold frame draws outward and the ornaments set.
 * Transform, clip-path and opacity only; nothing is pinned and no input is
 * handled. Elsewhere there is no portal: the photograph opens once from the
 * centre and the frame draws after it; with reduced motion or no JS everything
 * is simply there. Server-rendered.
 */
export function GrandReveal({
  headingId,
  eyebrow,
  title,
  lead,
  image,
  caption,
  inscription,
  cta,
}: GrandRevealProps) {
  const lines = [...title.lines, title.accent];
  return (
    <div className="grand-reveal">
      <div className="grand-reveal-head container-site">
        <ScrollReveal>
          <p className="grand-reveal-eyebrow">{eyebrow}</p>
        </ScrollReveal>
        {/* One mask for the heading; its lines follow one another (CSS). */}
        <ScrollReveal variant="mask" delay={60} className="grand-reveal-title-wrap">
          <h2 id={headingId} className="grand-reveal-title">
            {lines.map((line, i) => (
              <span
                key={line}
                className={i === lines.length - 1 ? "grand-reveal-line grand-reveal-accent" : "grand-reveal-line"}
                style={{ "--i": i } as CSSProperties}
              >
                {i === lines.length - 1 ? <em>{line}</em> : line}
                {i < lines.length - 1 ? " " : null}
              </span>
            ))}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={320} className="grand-reveal-lead">
          <span aria-hidden="true" className="grand-reveal-rule" />
          <p>{lead}</p>
        </ScrollReveal>
      </div>

      <ScrollScene className="grand-reveal-stage">
        <ScrollReveal variant="wipe-centre" className="grand-reveal-window">
          <Picture
            image={image}
            fill
            // The stage is the viewport less its gutters (≤ 100rem), shown
            // 1.14× from tablet width up (theme.css); phones get the
            // portrait crop (`small`), sized by Picture.
            sizes="(min-width: 768px) min(calc(114vw - 4.5rem), 114rem), 100vw"
          />
        </ScrollReveal>
        {/* The portal (rich motion only): stone jambs, an archivolt carved with
            the hotel's name and a keystone around the doorway, in units of 1%
            of the stage's width (its 21:9 frame is 100 × 42.857). The
            doorway's opening itself is the photograph's clip-path (theme.css),
            which follows the same geometry. */}
        <div aria-hidden="true" className="grand-reveal-portal">
          <svg className="portal-arch" viewBox="0 0 100 42.857" preserveAspectRatio="none" fill="none">
            <defs>
              <path id="portal-name-path" d="M52.25 24A10.75 10.75 0 0 1 73.75 24" />
            </defs>
            <path className="portal-stone" d="M50.5 42.857V24H54V42.857ZM72 42.857V24H75.5V42.857Z" />
            <path className="portal-band" d="M50.5 24A12.5 12.5 0 0 1 75.5 24H72A9 9 0 0 0 54 24Z" />
            <path className="portal-line" d="M50.5 42.857V24A12.5 12.5 0 0 1 75.5 24V42.857" />
            <path className="portal-line" d="M54 42.857V24A9 9 0 0 1 72 24V42.857" />
            <path className="portal-line portal-line-fine" d="M51.4 42.857V24.6M74.6 42.857V24.6" />
            <path className="portal-line" d="M49.4 24H55.1M70.9 24H76.6M47.5 42.5H78.5" />
            <path className="portal-key" d="M63 10.4L64.1 11.5L63 12.6L61.9 11.5Z" />
            <text className="portal-name">
              <textPath href="#portal-name-path" startOffset="50%" textAnchor="middle">
                {inscription.toUpperCase()}
              </textPath>
            </text>
          </svg>
        </div>
        {/* Drawn after the photograph (sibling selector, or --p). */}
        <div aria-hidden="true" className="grand-reveal-frame">
          <span className="grand-reveal-edge grand-reveal-edge-top" />
          <span className="grand-reveal-edge grand-reveal-edge-right" />
          <span className="grand-reveal-edge grand-reveal-edge-bottom" />
          <span className="grand-reveal-edge grand-reveal-edge-left" />
          {CORNERS.map((corner) => (
            <span key={corner} className={`grand-reveal-corner grand-reveal-corner-${corner}`}>
              <CornerOrnament className="grand-reveal-ornament" />
            </span>
          ))}
          <span className="grand-reveal-key" />
        </div>
      </ScrollScene>

      <div className="grand-reveal-foot">
        <ScrollReveal delay={120}>
          <p className="grand-reveal-caption">{caption}</p>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <a href={cta.href} className="link-royal">
            {cta.label}
          </a>
        </ScrollReveal>
      </div>
    </div>
  );
}
