"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";

/**
 * The <footer> element of the finale (Footer.tsx), and its motion:
 * - once its top is a fifth of the way up the viewport it is marked
 *   `data-revealed`, and CSS plays the sequence (one gold line draws the
 *   gateway, the archivolts spread, the emblem and the invitation rise) —
 *   once, at once under reduced motion or when keyboard focus arrives first,
 *   and never hidden without JS (theme.css);
 * - under rich motion only, its entrance progress ("enter") is written as
 *   `--p` on the gateway, its archivolts and the stone, so the gateway rises
 *   into place while the stone behind it lags. Only those elements are
 *   written to (each write re-styles a subtree); scrolling stays native,
 *   nothing is pinned.
 * Children stay server-rendered.
 */
export function FooterStage({ children, ...rest }: ComponentPropsWithoutRef<"footer">) {
  const ref = useRef<HTMLElement>(null);
  const movers = useRef<HTMLElement[]>([]);
  const rich = useRichMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    movers.current = Array.from(
      el.querySelectorAll<HTMLElement>(".finale-gate, .finale-orders, .finale-stone"),
    );
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.revealed = "";
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
    // shown at once (data-revealed="instant", theme.css), so a focused link
    // is never still transparent (WCAG 2.4.7).
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

  useScrollProgress(ref, {
    enabled: rich,
    mode: "enter",
    cssVar: null,
    onProgress: (p) => {
      for (const mover of movers.current) mover.style.setProperty("--p", String(p));
    },
  });

  return (
    <footer ref={ref} {...rest}>
      {children}
    </footer>
  );
}
