"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { prefersRichMotion, RICH_MOTION_QUERY, syncRootMotionAttribute } from "@/lib/motion";

export type ProgressMode = "pinned" | "through" | "rise" | "enter";

type Options = {
  /** When false nothing is observed and the CSS variable is never written. */
  enabled?: boolean;
  /**
   * "pinned": 0 when the element's top reaches the viewport top, 1 when its
   * bottom reaches the viewport bottom — for sticky scenes in a tall runway.
   * "through": 0 when its top enters at the bottom, 1 when its bottom leaves
   * at the top — for elements that simply scroll past.
   * "rise": 0 when its top enters at the bottom, 1 when its top reaches the
   * top — for a section rising over the one before it (LayeredSection).
   * "enter": 0 when its top enters at the bottom, 1 once it is wholly in view
   * (or, if taller than the viewport, when its top reaches the top) — for the
   * last element on a page, whose top may never reach the top (the footer).
   */
  mode?: ProgressMode;
  /**
   * Custom property written on the element, as a unitless 0–1 number — or
   * null to only report through onProgress (writing a custom property
   * re-styles the element's whole subtree, so skip it when no CSS reads it).
   */
  cssVar?: string | null;
  /** Called with the progress whenever it changes. */
  onProgress?: (progress: number) => void;
};

/**
 * Maps an element's scroll position to 0–1 and writes it to a CSS custom
 * property, so scenes animate in CSS (transform / opacity / clip-path).
 *
 * Built to stay off the critical path while scrolling:
 * - the element's document offset is measured only on resize / reflow
 *   (ResizeObserver), never per frame — each frame reads `scrollY` alone, so
 *   there is no forced layout during scroll;
 * - progress maps 1:1 to the rendered scroll position — no easing of its own;
 * - with smooth scrolling (Lenis) it updates inside Lenis's frame, right after
 *   the window moves, so there is one animation loop and the scene is never a
 *   frame behind the page; with native scrolling it uses one rAF per change;
 * - nothing runs unless the element is near the viewport and the page moves.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true, mode = "pinned", cssVar = "--p", onProgress }: Options = {},
) {
  const lenis = useSmoothScroll();
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let top = 0;
    let height = 1;
    let vh = window.innerHeight;
    let near = false;
    let frame = 0;
    let last = -1;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      height = rect.height;
      vh = window.innerHeight;
    };

    const tick = () => {
      frame = 0;
      const y = window.scrollY;
      const raw =
        mode === "pinned"
          ? (y - top) / Math.max(1, height - vh)
          : mode === "rise"
            ? (y + vh - top) / vh
            : mode === "enter"
              ? (y + vh - top) / Math.max(1, Math.min(vh, height))
              : (y + vh - top) / (vh + height);
      const p = Math.round(Math.min(1, Math.max(0, raw)) * 10000) / 10000;
      if (p === last) return;
      last = p;
      if (cssVar) el.style.setProperty(cssVar, String(p));
      callback.current?.(p);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (near) schedule();
    };

    // Lenis emits after moving the window (and after native scrolls it
    // observes): compute in the same frame rather than the next one.
    const onLenisScroll = () => {
      if (!near) return;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      tick();
    };

    // Proximity gate; when the element leaves, one last frame lands it on 0 / 1.
    const observer = new IntersectionObserver(
      ([entry]) => {
        near = Boolean(entry?.isIntersecting);
        schedule();
      },
      { rootMargin: "25% 0px" },
    );

    // Offsets change when anything above reflows (fonts, images, a runway
    // switching on), so re-measure on body and element resizes — not on scroll.
    const resize = new ResizeObserver(() => {
      measure();
      schedule();
    });

    measure();
    observer.observe(el);
    resize.observe(document.body);
    resize.observe(el);
    const offLenis = lenis?.on("scroll", onLenisScroll);
    if (!lenis) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    // Write the first value now, so re-subscribing (e.g. when Lenis starts
    // after mount) never leaves a frame without the property.
    tick();

    return () => {
      observer.disconnect();
      resize.disconnect();
      offLenis?.();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      if (cssVar) el.style.removeProperty(cssVar);
    };
  }, [ref, enabled, mode, cssVar, lenis]);
}

function subscribeToRichMotion(onChange: () => void) {
  const query = window.matchMedia(RICH_MOTION_QUERY);
  // Only react to genuine changes (e.g. a window resized below 1024px); the
  // boot script already set the root attribute for the first paint.
  const handle = () => {
    syncRootMotionAttribute();
    onChange();
  };
  query.addEventListener("change", handle);
  return () => query.removeEventListener("change", handle);
}

/**
 * Whether this visitor gets scroll-driven scenes (see RICH_MOTION_QUERY).
 * Always false on the server, so SSR and no-JS visitors get static layouts.
 */
export function useRichMotion(): boolean {
  return useSyncExternalStore(subscribeToRichMotion, prefersRichMotion, () => false);
}
