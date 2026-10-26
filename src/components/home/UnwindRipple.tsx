import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Picture } from "@/components/media/Picture";
import { ScrollScene } from "@/components/motion/ScrollScene";
import type { Image } from "@/content";

type UnwindRippleProps = {
  /** The pool from above; its round plunge pools are where the ripple starts
   * (none: no photograph, the plaque only). */
  image?: Image;
  /** The chapter's opening (ChapterHead), copy and call to action. */
  children: ReactNode;
};

/**
 * Unwind: the water, seen from above. The aerial photograph of the pool opens
 * in a widening circle from its round plunge pools, as rings spread across the
 * surface — under rich motion, from the stage's own --p (ScrollScene); a
 * one-time reveal elsewhere. The chapter's copy sits on an emerald stone
 * plaque laid over the photograph's foot. Without motion the photograph is
 * simply there, with the rings resting on the water.
 */
export function UnwindRipple({ image, children }: UnwindRippleProps) {
  return (
    <div className="unwind">
      {image ? (
        <ScrollScene className="unwind-stage">
          <ScrollReveal variant="wipe-centre" className="unwind-photo">
            <Picture image={image} fill sizes="(min-width: 1024px) min(100vw, 100rem), 100vw" />
          </ScrollReveal>
          <svg aria-hidden="true" className="unwind-rings" viewBox="0 0 100 100" fill="none">
            <circle className="unwind-ring" cx="50" cy="50" r="12" />
            <circle className="unwind-ring" cx="50" cy="50" r="24" />
            <circle className="unwind-ring" cx="50" cy="50" r="36" />
          </svg>
        </ScrollScene>
      ) : null}
      <div className="unwind-body container-site">
        {/* Emerald stone plaque; data-theme needs its own text-ink (CLAUDE.md §E). */}
        <ScrollReveal delay={80} className="unwind-plaque">
          <div data-theme="emerald" className="unwind-plaque-inner text-ink">
            {children}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
