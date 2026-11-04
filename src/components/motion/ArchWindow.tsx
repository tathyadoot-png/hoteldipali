import type { CSSProperties, ReactNode } from "react";

type ArchWindowProps = {
  children: ReactNode;
  className?: string;
  /** Width / height of the window (default 0.72, the hero's). */
  aspect?: number;
  /**
   * How far the arch has opened toward a full frame (0–1), as a CSS value —
   * usually a scroll progress, e.g. "var(--p, 0)". Default: closed (0); an
   * owner can also set --open on .arch-window from its own CSS.
   */
  open?: string;
};

/**
 * Media framed in an arch: a semicircular head over straight sides. As
 * --open rises from 0 to 1 the head flattens into a plain rectangle (the
 * clip-path's corner radii shrink), so the window opens toward a full frame.
 * Children are the media: a Picture (fill) and, optionally, a DepthPhoto.
 */
export function ArchWindow({ children, className, aspect = 0.72, open }: ArchWindowProps) {
  const style = { "--aspect": aspect, ...(open ? { "--open": open } : {}) } as CSSProperties;
  return (
    <div className={className ? `arch-window ${className}` : "arch-window"} style={style}>
      {children}
    </div>
  );
}
