"use client";

import { useRef } from "react";

import { srcSetFor } from "@/components/media/Picture";
import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";
import type { Decor } from "@/content";

type DecorFlowerProps = {
  /** From getDecorItem() (content/decor.json), passed down by a server component. */
  decor: Decor;
  /** Placement (theme.css): e.g. "footer-decor". */
  className: string;
  /** Rendered width hint for the srcset. */
  sizes: string;
  /** A slow vertical drift (≤ 40 px over the section) under rich motion. */
  drift?: boolean;
};

/**
 * A decorative flower (content/decor.json) — ornament only: alt="", hidden
 * from assistive technology, no pointer events, lazy. A white studio ground
 * multiplies into a light surface (data-blend). Under rich motion it drifts
 * a little as its section scrolls past (--p, transform only).
 */
export function DecorFlower({ decor, className, sizes, drift = true }: DecorFlowerProps) {
  const ref = useRef<HTMLImageElement>(null);
  const rich = useRichMotion();
  useScrollProgress(ref, { enabled: rich && drift, mode: "through" });

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation
    <img
      ref={ref}
      src={decor.src}
      srcSet={srcSetFor(decor.src, decor.widths)}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      width={decor.width}
      height={decor.height}
      loading="lazy"
      decoding="async"
      draggable={false}
      data-decor={decor.id}
      data-blend={decor.blend}
      data-drift={drift ? "" : undefined}
      className={`decor ${className}`}
    />
  );
}
