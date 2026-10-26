"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";
import { scrollToY } from "@/lib/smooth-scroll";

type LayeredSectionProps = ComponentPropsWithoutRef<"section"> & {
  /**
   * The section this one rises over: a selector, or (default) the previous
   * sibling element.
   */
  covers?: string;
  /** Also write --p ("through") on this section, for a scene of its own. */
  scene?: boolean;
};

/**
 * A <section> that rises over the one before it, like a panel sliding up
 * across a still scene. Under rich motion only:
 * - writes --cover on the covered section (0 → 1 while this section's top
 *   travels from the bottom of the viewport to the top), which CSS turns into
 *   that section receding — transform and opacity only;
 * - with `scene`, writes --p ("through") on itself, for its own scene.
 * Only those two are written (each write re-styles a whole subtree).
 * Scrolling stays native: nothing is pinned here and no wheel or touch input
 * is handled. Without rich motion nothing is written and the sections simply
 * stack. Children stay server-rendered.
 *
 * Keyboard: if focus moves into the covered section while this one hides the
 * focused element, the page scrolls back to where the cover began, so the
 * element shows (WCAG 2.4.11, focus not obscured).
 */
export function LayeredSection({ covers, scene = false, children, ...rest }: LayeredSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const rich = useRichMotion();

  const covered = () => {
    const el = ref.current;
    if (!el) return null;
    const target = covers ? document.querySelector(covers) : el.previousElementSibling;
    return target instanceof HTMLElement ? target : null;
  };

  useScrollProgress(ref, {
    enabled: rich,
    mode: "rise",
    cssVar: null,
    onProgress: (p) => covered()?.style.setProperty("--cover", String(p)),
  });
  useScrollProgress(ref, { enabled: rich && scene, mode: "through" });

  useEffect(() => {
    const el = ref.current;
    const target = covered();
    if (!rich || !el || !target) return;

    // Back to where this section had not started to cover it (--cover 0): the
    // covered section is then exactly as laid out (it un-recedes while we
    // scroll, so an overlap measured now would undershoot).
    const onFocus = (event: FocusEvent) => {
      const focused = event.target;
      if (!(focused instanceof HTMLElement)) return;
      const top = el.getBoundingClientRect().top;
      if (focused.getBoundingClientRect().bottom + 24 <= top) return;
      scrollToY(Math.max(0, top + window.scrollY - window.innerHeight));
    };
    target.addEventListener("focusin", onFocus);
    return () => {
      target.removeEventListener("focusin", onFocus);
      target.style.removeProperty("--cover");
    };
    // `covers` is a constant selector per instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rich]);

  return (
    <section ref={ref} {...rest}>
      {children}
    </section>
  );
}
