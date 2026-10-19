"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

import { prefersRichMotion, RICH_MOTION_QUERY, syncRootMotionAttribute } from "@/lib/motion";

export type ProgressMode = "pinned" | "through";

type Options = {
  /** When false nothing is observed and the CSS variable is never written. */
  enabled?: boolean;
  /**
   * "pinned": 0 when the element's top reaches the viewport top, 1 when its
   * bottom reaches the viewport bottom — for sticky scenes in a tall runway.
   * "through": 0 when its top enters at the bottom, 1 when its bottom leaves
   * at the top — for elements that simply scroll past.
   */
  mode?: ProgressMode;
  /** Custom property written on the element, as a unitless 0–1 number. */
  cssVar?: string;
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
 * - progress maps 1:1 to scroll — no easing loop, so the scene never lags
 *   the visitor's input;
 * - nothing runs unless the element is near the viewport and the page moves.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true, mode = "pinned", cssVar = "--p", onProgress }: Options = {},
) {
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
        mode === "pinned" ? (y - top) / Math.max(1, height - vh) : (y + vh - top) / (vh + height);
      const p = Math.round(Math.min(1, Math.max(0, raw)) * 10000) / 10000;
      if (p === last) return;
      last = p;
      el.style.setProperty(cssVar, String(p));
      callback.current?.(p);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (near) schedule();
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
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty(cssVar);
    };
  }, [ref, enabled, mode, cssVar]);
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
