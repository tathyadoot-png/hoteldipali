"use client";

import { useEffect, useRef, useState } from "react";

import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";
import { lengthAtY, threadGutters, threadPath } from "@/lib/motion/thread";

// Where the drawn tip sits on the screen: this far down the viewport.
const TIP = 0.62;
const FLOWER_PETALS = [0, 72, 144, 216, 288];
const SAMPLES = 240;

/**
 * One fine gold line drawn down the page as it scrolls: it runs down one
 * gutter, crosses to the other at each <ThreadStop>, and ends in a small gold
 * flower that opens above the footer. Desktop rich motion only (the stops are short
 * static gold rules otherwise). The line is measured from the stops on
 * resize, never per frame; per frame only `--p` is written on the SVG.
 * Decorative: aria-hidden, no pointer events.
 */
export function GoldThread() {
  const rich = useRichMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const samples = useRef<Array<readonly [number, number]>>([]);
  const total = useRef(1);
  const span = useRef({ top: 0, height: 1 });
  const [layout, setLayout] = useState<{ d: string; w: number; h: number; cx: number; cy: number } | null>(
    null,
  );

  // Measure the stops and build the line (on mount and whenever the page reflows).
  useEffect(() => {
    if (!rich) return;
    let frame = 0;
    const build = () => {
      frame = 0;
      const stops = Array.from(document.querySelectorAll<HTMLElement>(".thread-stop")).map(
        (el) => el.getBoundingClientRect().top + window.scrollY,
      );
      const footer = document.querySelector("footer");
      if (stops.length === 0 || !footer) return;
      const end = footer.getBoundingClientRect().top + window.scrollY - 36;
      const width = document.documentElement.clientWidth;
      const gutters = threadGutters(width);
      const d = threadPath({ stops, end, ...gutters });
      span.current = { top: Math.min(...stops), height: Math.max(1, end - Math.min(...stops)) };
      setLayout({ d, w: width, h: end + 40, cx: gutters.centre, cy: end });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(build);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    schedule();
    return () => {
      resize.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rich]);

  // Sample the built line: document y → length along it.
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !layout) return;
    const length = path.getTotalLength();
    total.current = Math.max(1, length);
    const list: Array<readonly [number, number]> = [];
    let maxY = -Infinity;
    for (let i = 0; i <= SAMPLES; i += 1) {
      const at = (length * i) / SAMPLES;
      const y = path.getPointAtLength(at).y;
      if (y > maxY) {
        maxY = y;
        list.push([y, at] as const);
      }
    }
    samples.current = list;
    svgRef.current?.setAttribute("data-ready", "");
  }, [layout]);

  // Scroll: the thread's own progress (Lenis-synchronised), turned into the
  // length at the tip's y and written as --p (0–1) on the SVG alone.
  useScrollProgress(svgRef, {
    enabled: rich && layout !== null,
    mode: "through",
    cssVar: null,
    onProgress: () => {
      const svg = svgRef.current;
      if (!svg) return;
      const y = window.scrollY + window.innerHeight * TIP;
      const p = lengthAtY(samples.current, y) / total.current;
      svg.style.setProperty("--p", (Math.round(p * 10000) / 10000).toString());
    },
  });

  if (!rich || !layout) return null;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="thread"
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      fill="none"
    >
      <path ref={pathRef} className="thread-path" pathLength={1} d={layout.d} />
      <g transform={`translate(${layout.cx} ${layout.cy + 4})`}>
        <g className="thread-flower">
          {FLOWER_PETALS.map((angle) => (
            <ellipse key={angle} cx={0} cy={-6} rx={3} ry={5.6} transform={`rotate(${angle})`} />
          ))}
          <circle r={2.4} />
        </g>
      </g>
    </svg>
  );
}

/**
 * A stop for the gold thread, at the top of a section: where it crosses to
 * the other gutter. Without rich motion (phones, reduced motion) it is a short
 * static gold rule between sections instead.
 */
export function ThreadStop() {
  return <span aria-hidden="true" className="thread-stop" />;
}
