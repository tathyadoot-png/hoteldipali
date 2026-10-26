"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealVariant =
  | "rise"
  | "mask"
  | "image"
  // Photographs revealed through a clipping mask that opens in one direction.
  | "wipe-up"
  | "wipe-down"
  | "wipe-left"
  | "wipe-centre";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** "rise" (default) fades content up; "mask" lifts a heading out of a
   * mask; "image" opens a frame from its base while the photo settles;
   * "wipe-*" open a photograph's frame from one edge (or the centre). */
  variant?: RevealVariant;
  /** Stagger after the element enters, in ms (applied in CSS, not a timer). */
  delay?: number;
};

// One observer for every reveal on the page. It fires as content approaches
// the viewport (10% before it is fully in view), reveals once, and forgets.
let observer: IntersectionObserver | null = null;

function observe(el: HTMLElement) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.revealed = "";
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

/**
 * Reveals its children once as they approach the viewport. Reduced-motion
 * visitors and no-JS visitors (see the <noscript> rule in the root layout)
 * get the content immediately.
 */
export function ScrollReveal({ children, className, variant = "rise", delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.revealed = "";
      return;
    }
    return observe(el);
  }, []);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      data-reveal={variant === "rise" ? "" : variant}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
