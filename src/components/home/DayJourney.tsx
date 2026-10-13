"use client";

import { useEffect, useRef, type FocusEvent, type ReactNode } from "react";

import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";

type DayJourneyProps = {
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
};

/**
 * A walk sideways through the dining family, from the daytime table to the
 * evening bar. With rich motion the section becomes a runway exactly as tall
 * as the track is wide, and the sticky frame slides the track left 1:1 with
 * scroll — native scrolling throughout, nothing intercepted. Everyone else
 * gets the same panels stacked vertically in the same light-to-dusk order.
 *
 * Panels must carry `data-panel` so keyboard focus can bring them into view.
 */
export function DayJourney({ id, labelledBy, className, children }: DayJourneyProps) {
  const rich = useRichMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useScrollProgress(sectionRef, { enabled: rich, mode: "pinned", smooth: 0.18 });

  // The runway's extra height is the track's overflow, measured from content.
  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const track = trackRef.current;
    if (!rich || !section || !frame || !track) return;

    const measure = () => {
      const travel = Math.max(0, track.scrollWidth - frame.clientWidth);
      section.style.setProperty("--journey-travel", `${travel}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(frame);
    return () => {
      observer.disconnect();
      section.style.removeProperty("--journey-travel");
    };
  }, [rich]);

  // Tabbing into an off-screen panel: scroll the page to the point where the
  // track shows that panel. The frame is overflow:clip so the browser cannot
  // scroll it sideways; the scrollLeft reset only matters for engines that
  // fall back to overflow:hidden.
  const onFocusCapture = (event: FocusEvent<HTMLElement>) => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    if (!rich || !section || !frame) return;
    const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-panel]");
    if (!panel) return;

    requestAnimationFrame(() => {
      frame.scrollLeft = 0;
      const travel = Number.parseFloat(section.style.getPropertyValue("--journey-travel")) || 0;
      if (!travel) return;
      const inset = frame.clientWidth * 0.06;
      const x = Math.min(travel, Math.max(0, panel.offsetLeft - inset));
      const runway = section.offsetHeight - window.innerHeight;
      const top = section.getBoundingClientRect().top + window.scrollY + (x / travel) * runway;
      window.scrollTo({ top, behavior: "instant" });
    });
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={labelledBy}
      className={`journey ${className ?? ""}`}
      onFocusCapture={onFocusCapture}
    >
      <div ref={frameRef} className="journey-frame">
        <div ref={trackRef} className="journey-track">
          {children}
        </div>
        <div aria-hidden="true" className="journey-progress-track">
          <div className="journey-progress" />
        </div>
      </div>
    </section>
  );
}
