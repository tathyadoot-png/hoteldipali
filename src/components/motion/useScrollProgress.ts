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
  /** 0 = follow scroll exactly; 0–1 = ease toward it each frame (inertia). */
  smooth?: number;
  /** Custom property written on the element, as a unitless 0–1 number. */
  cssVar?: string;
  /** Called with the (eased) progress on every frame that changes it. */
  onProgress?: (progress: number) => void;
};

/**
 * Maps an element's scroll position to 0–1 and writes it to a CSS custom
 * property, so scenes animate in CSS (transform / opacity / clip-path) while
 * JS does almost nothing. Work only happens while the element is near the
 * viewport and the page is scrolling; with `smooth`, a short rAF loop eases
 * toward the target and then stops — there is no idle animation loop.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true, mode = "pinned", smooth = 0, cssVar = "--p", onProgress }: Options = {},
) {
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let frame = 0;
    let near = false;
    let current = -1;

    const read = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw =
        mode === "pinned"
          ? -rect.top / Math.max(1, rect.height - vh)
          : (vh - rect.top) / (vh + rect.height);
      return Math.min(1, Math.max(0, raw));
    };

    const tick = () => {
      frame = 0;
      const target = read();
      current = current < 0 || !smooth ? target : current + (target - current) * smooth;
      if (Math.abs(target - current) < 0.0005) current = target;
      el.style.setProperty(cssVar, current.toFixed(4));
      callback.current?.(current);
      // Keep easing only until we arrive; then go quiet until the next scroll.
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (near) schedule();
    };

    // Gate the scroll work on proximity; when the element leaves, run one last
    // frame so a fast flick past it still lands exactly on 0 or 1.
    const observer = new IntersectionObserver(
      ([entry]) => {
        near = Boolean(entry?.isIntersecting);
        schedule();
      },
      { rootMargin: "25% 0px" },
    );

    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty(cssVar);
    };
  }, [ref, enabled, mode, smooth, cssVar]);
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
