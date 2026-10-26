"use client";

import { useEffect, useRef } from "react";

import { useRichMotion } from "@/components/motion/useScrollProgress";

/**
 * Pointer depth for the home hero: writes the pointer's position over the hero
 * as --mx / --my (−1…1) on the hero section, at most once per animation frame,
 * and CSS shifts a few layers by a handful of pixels (the ribbon one way, the
 * photograph the other). Rich motion only (≥1024px, fine pointer, no reduced
 * motion); no React state, nothing on touch. Renders an inert marker so it can
 * find its section.
 */
export function HeroDepth() {
  const rich = useRichMotion();
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = marker.current?.parentElement;
    if (!rich || !section) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      section.style.setProperty("--mx", x.toFixed(3));
      section.style.setProperty("--my", y.toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const rect = section.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(write);
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      section.style.removeProperty("--mx");
      section.style.removeProperty("--my");
    };
  }, [rich]);

  return <span ref={marker} hidden />;
}
