"use client";

import { useEffect, useRef } from "react";

import { useRichMotion } from "@/components/motion/useScrollProgress";
import type { DepthRenderer } from "@/lib/motion/depth-gl";

type DepthPhotoProps = {
  /** The photograph's grey depth map (pnpm make:depth). */
  depthSrc: string;
  /** The photograph's object-position, e.g. "50% 45%". */
  focus?: string;
  /** The depth that stays still (0 far – 1 near). */
  plane?: number;
  /** How far the nearest plane moves at the pointer's extreme, CSS px. */
  maxShift?: number;
};

function parseFocus(focus: string): { x: number; y: number } {
  const [x = "50%", y = "50%"] = focus.split(/\s+/);
  return { x: Number.parseFloat(x) / 100, y: Number.parseFloat(y) / 100 };
}

/**
 * Gives the photograph in its parent (an ArchWindow) depth: the near and far
 * planes slide against each other as a mouse moves over the section — at
 * most `maxShift` px. Desktop rich motion only (≥1024px, fine pointer, no
 * reduced motion, no data saver); the WebGL code (src/lib/motion/depth-gl.ts)
 * is fetched only then, after the page has loaded. Until it has drawn — and
 * for good if WebGL is missing or fails — the plain photograph shows. The
 * parent carries data-depth="on" while it runs, "off" if it gave up.
 * Renders an inert marker so it can find its parent.
 */
export function DepthPhoto({ depthSrc, focus = "50% 50%", plane = 0.44, maxShift = 8 }: DepthPhotoProps) {
  const rich = useRichMotion();
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = marker.current?.parentElement;
    const photo = host?.querySelector("img");
    if (!rich || !host || !photo) return;
    const section = host.closest("section") ?? host;

    let cancelled = false;
    let renderer: DepthRenderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let visible = true;
    const cleanups: Array<() => void> = [];

    const giveUp = () => {
      renderer?.destroy();
      renderer = null;
      canvas?.remove();
      host.dataset.depth = "off";
    };

    const start = async () => {
      const { createDepthRenderer } = await import("@/lib/motion/depth-gl");
      if (cancelled) return;
      canvas = document.createElement("canvas");
      canvas.className = "depth-canvas";
      canvas.setAttribute("aria-hidden", "true");
      host.append(canvas);
      renderer = await createDepthRenderer(
        canvas,
        photo,
        { depthSrc, focus: parseFocus(focus), plane, maxShift },
        giveUp,
      );
      if (cancelled || !renderer) {
        giveUp();
        return;
      }
      host.dataset.depth = "on";

      const onMove = (event: PointerEvent) => {
        if (!visible || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
        const rect = section.getBoundingClientRect();
        renderer?.point(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          ((event.clientY - rect.top) / rect.height) * 2 - 1,
        );
      };
      const onLeave = () => renderer?.point(0, 0);
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave, { passive: true });

      const resize = new ResizeObserver(() => renderer?.resize());
      resize.observe(host);
      const seen = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      });
      seen.observe(host);

      cleanups.push(() => {
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
        resize.disconnect();
        seen.disconnect();
      });
    };

    // After the page has loaded (and a beat more), so it never competes with
    // the photograph or the text for the first paint.
    let timer = 0;
    const begin = () => {
      timer = window.setTimeout(() => void start(), 250);
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("load", begin);
      for (const cleanup of cleanups) cleanup();
      renderer?.destroy();
      canvas?.remove();
      delete host.dataset.depth;
    };
  }, [rich, depthSrc, focus, plane, maxShift]);

  return <span ref={marker} hidden />;
}
