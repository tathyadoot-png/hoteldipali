import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/home/ScrollReveal";
import { TypeFill } from "@/components/home/TypeFill";
import { Picture } from "@/components/media/Picture";
import { ScrollScene } from "@/components/motion/ScrollScene";
import type { Image } from "@/content";

type CelebrateSceneProps = {
  /** The word set in the photograph, e.g. "Celebrate". */
  word: string;
  /** A wide photograph of a celebration venue (none: no scene, copy only). */
  image?: Image;
  /** Short visible caption for the photograph. */
  caption: string;
  /** The chapter's opening (ChapterHead), copy and calls to action. */
  children: ReactNode;
  /** The venues, listed on the programme card. */
  venues: { name: string; kind: string }[];
};

/**
 * Celebrate: typography that is part of the scene. A giant word set over the
 * photograph of the hall. Under rich motion (the stage's own --p, ScrollScene)
 * its letters are windows onto the chandeliers (TypeFill), around a band of
 * the same photograph that opens as the stage rises until the whole room
 * shows — the letters dissolve into the picture and remain as a fine gold
 * outline. The venues follow on an ivory programme card. The word is
 * decorative (aria-hidden); the chapter's heading carries the meaning.
 * Without rich motion the picture is simply open, the word outlined over it.
 */
export function CelebrateScene({ word, image, caption, children, venues }: CelebrateSceneProps) {
  return (
    <>
      {image ? (
        <ScrollScene className="celebrate-stage">
          <ScrollReveal variant="image" className="celebrate-photo">
            <Picture image={image} fill sizes="100vw" />
          </ScrollReveal>
          <span aria-hidden="true" className="celebrate-shade" />
          <ScrollReveal className="celebrate-word-wrap">
            <TypeFill scope=".celebrate-stage" className="celebrate-word">
              {word}
            </TypeFill>
          </ScrollReveal>
          <p className="celebrate-caption">{caption}</p>
        </ScrollScene>
      ) : null}

      <div className="celebrate-body container-site">
        <div className="celebrate-copy">{children}</div>
        <ScrollReveal variant="slide-left" delay={120} className="celebrate-program">
          <p className="celebrate-program-title">The venues</p>
          <ul className="celebrate-venues">
            {venues.map((venue) => (
              <li key={venue.name}>
                <span className="celebrate-venue-name">{venue.name}</span>
                <span className="celebrate-venue-kind">{venue.kind}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </>
  );
}
