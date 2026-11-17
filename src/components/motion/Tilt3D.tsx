"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  /** Largest lean, in degrees (at most 6). */
  max?: number;
};

const FINE_POINTER = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * A card that leans a little toward a mouse or pen (perspective tilt, at most
 * 6°, transform only), and settles back when it leaves. Fine pointers only:
 * touch, keyboard and reduced-motion visitors get the card as it is.
 */
export function Tilt3D({ children, className, max = 6 }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(FINE_POINTER).matches) return;
    const limit = Math.min(6, Math.max(0, max));

    let frame = 0;
    let rx = 0;
    let ry = 0;
    const write = () => {
      frame = 0;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rx = -y * 2 * limit;
      ry = x * 2 * limit;
      el.dataset.tilting = "";
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onLeave = () => {
      rx = 0;
      ry = 0;
      delete el.dataset.tilting;
      if (!frame) frame = requestAnimationFrame(write);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [max]);

  return (
    <div ref={ref} className={className ? `tilt ${className}` : "tilt"}>
      {children}
    </div>
  );
}
