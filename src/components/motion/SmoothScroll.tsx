"use client";

import { useEffect, useSyncExternalStore } from "react";
import type Lenis from "lenis";

import { SMOOTH_SCROLL_QUERY } from "@/lib/motion";
import {
  getSmoothScroll,
  startSmoothScroll,
  stopSmoothScroll,
  subscribeSmoothScroll,
} from "@/lib/smooth-scroll";

/**
 * Turns smooth wheel scrolling on for visitors with a mouse/trackpad and no
 * reduced-motion request, and off again if that changes (e.g. the OS setting
 * is switched mid-visit). Renders nothing. Mounted once, in the root layout.
 * If Lenis cannot start, the page simply keeps native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia(SMOOTH_SCROLL_QUERY);
    const sync = () => {
      if (query.matches) startSmoothScroll();
      else stopSmoothScroll();
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      stopSmoothScroll();
    };
  }, []);

  return null;
}

/** The running Lenis instance, or null when scrolling is native. */
export function useSmoothScroll(): Lenis | null {
  return useSyncExternalStore(subscribeSmoothScroll, getSmoothScroll, () => null);
}
