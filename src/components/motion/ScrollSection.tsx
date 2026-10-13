"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";

import {
  useRichMotion,
  useScrollProgress,
  type ProgressMode,
} from "@/components/motion/useScrollProgress";

type ScrollSectionProps = ComponentPropsWithoutRef<"section"> & {
  mode?: ProgressMode;
  smooth?: number;
};

/**
 * A <section> that exposes its scroll progress as `--p` for CSS-driven scenes.
 * Only active for rich motion; otherwise `--p` is never written and CSS falls
 * back to the scene's finished state. Children stay server-rendered.
 */
export function ScrollSection({
  mode = "through",
  smooth = 0,
  children,
  ...rest
}: ScrollSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const rich = useRichMotion();
  useScrollProgress(ref, { enabled: rich, mode, smooth });

  return (
    <section ref={ref} {...rest}>
      {children}
    </section>
  );
}
