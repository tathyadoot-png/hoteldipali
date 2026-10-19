"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";

import { CallLink } from "@/components/links/CallLink";
import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";
import { captureFilm, type FilmFrames } from "@/components/home/film-frames";
import { RICH_MOTION_QUERY } from "@/lib/motion";
import { scrollToY } from "@/lib/smooth-scroll";

type EntranceHeroProps = {
  video: { src: string; poster: string; still: string; width: number; height: number };
  /** e.g. "Sagar, Madhya Pradesh" */
  eyebrow: string;
  /** The hotel name, split into the two gate-pillar inscriptions. */
  title: { lead: string; emphasis: string };
  tagline: string;
  /** The experiences revealed in the lobby, linking to their sections. */
  directory: Array<{ label: string; href: string }>;
};

// Points of the film (0–1) the arrival rail can jump to; they match the
// footage: the closed gate, the palm avenue, the lobby.
const WAYPOINTS = [
  { key: "gate", label: "Gate", at: 0 },
  { key: "avenue", label: "Avenue", at: 0.42 },
  { key: "lobby", label: "Lobby", at: 0.92 },
] as const;

// The arch opens with the gates in the footage (roughly the first 30%).
const OPEN_FROM = 0.02;
const OPEN_TO = 0.3;
const AVENUE_FROM = 0.3;
const LOBBY_FROM = 0.82;

function smoothstep(from: number, to: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/**
 * The home page's arrival. With rich motion the section is a tall runway whose
 * sticky frame holds the film inside an arched aperture on a dusk field; the
 * hotel's name stands either side like inscriptions on the gate pillars.
 * Scrolling opens the aperture with the gates and carries the camera down the
 * avenue into the lobby — backward scrolling reverses it all. Everyone else
 * gets the same story as one still frame, and never downloads the film.
 *
 * The film is shown from a frame cache (see film-frames.ts) drawn to a canvas,
 * never by seeking the video: seeking this footage stalled rendering.
 */
export function EntranceHero({ video, eyebrow, title, tagline, directory }: EntranceHeroProps) {
  const rich = useRichMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useRef<FilmFrames | null>(null);
  const want = useRef(0);
  const shown = useRef(-1);
  const drawing = useRef(false);
  const filmEnd = useRef(0.56);
  const stage = useRef("");
  const opening = useRef("");

  // Shows the cached frame nearest the wanted one. One decode at a time; when
  // it lands, catch up with wherever scrolling has moved on to meanwhile.
  const draw = useCallback(function paint(): void {
    const cache = frames.current;
    const canvas = canvasRef.current;
    if (!cache || !canvas || drawing.current) return;
    const index = cache.nearest(want.current);
    const blob = index >= 0 ? cache.get(index) : undefined;
    if (!blob || index === shown.current) return;
    drawing.current = true;
    createImageBitmap(blob)
      .then((bitmap) => {
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        shown.current = index;
        canvas.dataset.frame = String(index);
        if (!("ready" in canvas.dataset)) canvas.dataset.ready = "";
      })
      .catch(() => undefined)
      .finally(() => {
        drawing.current = false;
        if (frames.current?.nearest(want.current) !== shown.current) paint();
      });
  }, []);

  // The film runs until the arch begins to rise over it: everything except
  // the last viewport of pinned travel. Measured on resize only.
  useEffect(() => {
    if (!rich) return;
    const measure = () => {
      const section = sectionRef.current;
      if (!section) return;
      const vh = window.innerHeight;
      const travel = Math.max(1, section.offsetHeight - vh);
      filmEnd.current = Math.max(0.1, (travel - vh) / travel);
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, [rich]);

  const onProgress = useCallback(
    (p: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const v = Math.min(1, p / filmEnd.current);
      section.style.setProperty("--v", v.toFixed(4));
      const o = smoothstep(OPEN_FROM, OPEN_TO, v).toFixed(4);
      if (o !== opening.current) {
        opening.current = o;
        section.style.setProperty("--o", o);
      }

      const next =
        p >= filmEnd.current
          ? "threshold"
          : v >= LOBBY_FROM
            ? "lobby"
            : v >= AVENUE_FROM
              ? "avenue"
              : "gate";
      if (next !== stage.current) {
        stage.current = next;
        section.dataset.stage = next;
      }

      const cache = frames.current;
      if (cache) {
        want.current = v * (cache.count - 1);
        draw();
      }
    },
    [draw],
  );

  useScrollProgress(sectionRef, { enabled: rich, mode: "pinned", onProgress });

  // Fetch the film once the page has loaded (so it never competes with the
  // poster, fonts or CSS), then build the frame cache from that Blob.
  useEffect(() => {
    if (!rich) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        const res = await fetch(video.src, { signal: controller.signal });
        if (!res.ok) throw new Error(`entrance film: HTTP ${res.status}`);
        objectUrl = URL.createObjectURL(await res.blob());
        const cache = await captureFilm(objectUrl, {
          signal: controller.signal,
          onFrame: () => draw(),
        });
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = cache.width;
          canvas.height = cache.height;
        }
        frames.current = cache;
        want.current = Number(sectionRef.current?.style.getPropertyValue("--v") || 0) * (cache.count - 1);
        draw();
        // Expose capture completion for tests and debugging.
        const markComplete = () => {
          if (cache.complete && canvas) canvas.dataset.captured = "complete";
          else if (!controller.signal.aborted) window.setTimeout(markComplete, 250);
        };
        markComplete();
      } catch {
        // Poster stays; the aperture and typography still play.
      }
    };

    if (document.readyState === "complete") void load();
    else window.addEventListener("load", () => void load(), { once: true });

    return () => {
      controller.abort();
      frames.current?.dispose();
      frames.current = null;
      shown.current = -1;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [rich, video.src, draw]);

  const goTo = (at: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = section.offsetHeight - window.innerHeight;
    scrollToY(top + at * filmEnd.current * travel);
  };

  return (
    <section
      ref={sectionRef}
      data-theme="dusk"
      data-stage="gate"
      aria-labelledby="home-hero"
      className="entrance -mt-18 bg-surface text-ink md:-mt-22"
    >
      <div className="entrance-frame">
        {/* The aperture: an arched doorway the film is seen through. */}
        <div className="entrance-aperture">
          <picture>
            {/* Rich motion starts on the film's own first frame, so the hand-over
                to the frame cache is seamless; everyone else gets the still. */}
            <source media={RICH_MOTION_QUERY} srcSet={video.poster} />
            <img
              src={video.still}
              alt=""
              aria-hidden="true"
              width={video.width}
              height={video.height}
              fetchPriority="high"
              decoding="async"
              className="entrance-media"
            />
          </picture>
          {rich ? (
            <canvas
              ref={canvasRef}
              width={video.width}
              height={video.height}
              aria-hidden="true"
              className="entrance-media entrance-film"
            />
          ) : null}
          <div aria-hidden="true" className="entrance-grain absolute inset-0" />
          <div aria-hidden="true" className="entrance-scrim absolute inset-0" />
        </div>
        <span aria-hidden="true" className="entrance-architrave" />

        <div className="entrance-content absolute inset-0 z-10 flex flex-col justify-end">
          <div className="container-site">
            {/* The name, carved either side of the gate. */}
            <h1 id="home-hero" className="entrance-title heading-hero">
              <span className="entrance-inscription entrance-inscription-l">{title.lead}</span>{" "}
              <span className="entrance-inscription entrance-inscription-r">
                <em>{title.emphasis}</em>
              </span>
            </h1>

            <div className="entrance-plate">
              <p className="eyebrow">{eyebrow}</p>
              <p className="entrance-tagline">{tagline}</p>
              <div className="entrance-actions mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
                <a href="#enquire" className="btn-primary btn-arch">
                  Enquire now
                </a>
                <CallLink className="btn-ghost" />
              </div>
            </div>
          </div>
        </div>

        {/* Arrival rail: where you are on the way in; each point is a jump. */}
        <nav aria-label="Arrival" className="entrance-waypoints">
          <span aria-hidden="true" className="entrance-rail">
            <span className="entrance-rail-marker" />
          </span>
          <ol>
            {WAYPOINTS.map((point) => (
              <li key={point.key} style={{ "--at": point.at } as CSSProperties}>
                <button
                  type="button"
                  data-waypoint={point.key}
                  className="entrance-waypoint"
                  onClick={() => goTo(point.at)}
                >
                  <span className="visually-hidden">Jump to the </span>
                  {point.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* In the lobby, the doors to the rest of the hotel appear. */}
        <nav aria-label="Inside the hotel" className="entrance-directory">
          <p aria-hidden="true" className="eyebrow">
            Inside the hotel
          </p>
          <ul>
            {directory.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
