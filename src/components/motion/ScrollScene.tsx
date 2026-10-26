"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";

import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";

/**
 * A <div> that exposes its own scroll progress as `--p` ("through": 0 when
 * its top enters at the bottom of the viewport, 1 when its bottom leaves at
 * the top — 0.5 when it is centred), for a scene inside a section rather than
 * the whole section (compare ScrollSection). Rich motion only; otherwise `--p`
 * is never written and CSS falls back to the scene's finished state. Children
 * stay server-rendered.
 */
export function ScrollScene({ children, ...rest }: ComponentPropsWithoutRef<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const rich = useRichMotion();
  useScrollProgress(ref, { enabled: rich, mode: "through" });

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
