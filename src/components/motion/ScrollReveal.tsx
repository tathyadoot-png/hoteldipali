"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

type RevealVariant =
  | "rise"
  | "mask"
  | "image"
  // Photographs revealed through a clipping mask that opens in one direction.
  | "wipe-up"
  | "wipe-down"
  | "wipe-left"
  | "wipe-right"
  | "wipe-centre"
  // Text that arrives sideways, toward the photograph it belongs to.
  | "slide-left"
  | "slide-right"
  // A heading's lines rise out of their own masks in turn (see RevealLines).
  | "mask-line"
  // An image opens upward inside an arch.
  | "clip-arch"
  // One narrow pass of gold foil crosses the text (display headings only).
  | "foil";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** "rise" (default) fades content up; "mask" lifts a heading out of a
   * mask; "image" opens a frame from its base while the photo settles;
   * "wipe-*" open a photograph's frame from one edge (or the centre);
   * "slide-*" fade content in while it moves left or right; "mask-line"
   * raises a heading line by line (wrap the lines in RevealLines);
   * "clip-arch" opens an image inside an arch; "foil" passes one gleam of
   * gold across display text. */
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
 * Marks the element `data-revealed` once as it approaches the viewport (at
 * once under reduced motion), for CSS to reveal from — the hook behind
 * ScrollReveal, for components that reveal an element of their own.
 */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.revealed = "";
      return;
    }
    return observe(el);
  }, [ref]);
}

/**
 * Reveals its children once as they approach the viewport. Reduced-motion
 * visitors and no-JS visitors (see the <noscript> rule in the root layout)
 * get the content immediately.
 */
export function ScrollReveal({ children, className, variant = "rise", delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);

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

/**
 * The lines of a heading for the "mask-line" reveal: each rises out of its
 * own mask, one after another. Put it inside the heading, inside a
 * <ScrollReveal variant="mask-line">.
 */
export function RevealLines({ lines }: { lines: ReactNode[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className="reveal-line" style={{ "--line": index } as CSSProperties}>
          <span>{line}</span>
        </span>
      ))}
    </>
  );
}
