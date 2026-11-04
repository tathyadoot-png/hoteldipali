"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/**
 * The <footer> element, and its one moment: once its top is a fifth of the
 * way up the viewport it is marked `data-revealed`, and CSS lights the row of
 * lamps along its top edge, one after another (theme.css, .footer-lamps).
 * Once only; at once under reduced motion or when keyboard focus arrives
 * first (`data-revealed="instant"`); without JS the lamps are simply lit.
 * Children stay server-rendered.
 */
export function FooterStage({ children, ...rest }: ComponentPropsWithoutRef<"footer">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.revealed = "instant";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.revealed ??= "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0 },
    );
    observer.observe(el);

    // Keyboard focus never waits for the sequence: everything inside is
    // shown at once, so a focused link is never still hidden (WCAG 2.4.7).
    const onFocusIn = () => {
      if (el.dataset.revealed === "instant") return;
      el.dataset.revealed = "instant";
      for (const pending of el.querySelectorAll<HTMLElement>("[data-reveal]")) {
        pending.dataset.revealed = "";
      }
      observer.disconnect();
    };
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return (
    <footer ref={ref} {...rest}>
      {children}
    </footer>
  );
}
