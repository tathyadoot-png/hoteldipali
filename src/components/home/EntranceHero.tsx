"use client";

import { Fragment, useCallback, useEffect, useRef } from "react";

import { CallLink } from "@/components/links/CallLink";
import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";
import { RICH_MOTION_QUERY } from "@/lib/motion";

type EntranceHeroProps = {
  video: { src: string; poster: string; still: string; width: number; height: number };
  /** e.g. "Sagar, Madhya Pradesh" */
  eyebrow: string;
  /** The hotel name, split into a plain lead and an emphasised word. */
  title: { lead: string; emphasis: string };
  tagline: string;
};

// The tagline arrives word by word between these points of the film (0–1):
// after the gates have parted, finishing as the porte-cochère fills the frame.
const TAGLINE_FROM = 0.2;
const TAGLINE_SPAN = 0.54;
// Below this the opening title still owns the frame.
const OPENING_UNTIL = 0.16;
// Treat sub-frame differences as "already there" so we never queue busy-work.
const SEEK_EPSILON = 0.02;

/**
 * The home page's arrival. On wide, fine-pointer, motion-friendly screens the
 * section becomes a tall runway (see `[data-motion="rich"] .entrance` in
 * theme.css) whose sticky frame holds a film the visitor scrubs by scrolling —
 * forward to enter, backward to step out again. Everyone else gets the same
 * composition as a still frame, with no video downloaded at all.
 *
 * The film is fetched whole into a Blob once the page has loaded, so every
 * seek is served from memory, and seeks are coalesced: while one is in flight
 * we only remember the latest target, then jump straight to it.
 */
export function EntranceHero({ video, eyebrow, title, tagline }: EntranceHeroProps) {
  const rich = useRichMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ready = useRef(false);
  const seeking = useRef(false);
  const wanted = useRef(0);
  const filmEnd = useRef(0.64);
  const stage = useRef("");

  const seek = useCallback((time: number) => {
    wanted.current = time;
    const el = videoRef.current;
    if (!el || !ready.current || seeking.current) return;
    if (Math.abs(el.currentTime - time) < SEEK_EPSILON) return;
    seeking.current = true;
    el.currentTime = time;
  }, []);

  // The film occupies the runway until the arch starts to rise over it, i.e.
  // everything except the last viewport of pinned travel.
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
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [rich]);

  const onProgress = useCallback(
    (p: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const v = Math.min(1, p / filmEnd.current);
      section.style.setProperty("--v", v.toFixed(4));

      const next = p >= filmEnd.current ? "threshold" : v < OPENING_UNTIL ? "open" : "drive";
      if (next !== stage.current) {
        stage.current = next;
        section.dataset.stage = next;
      }

      const el = videoRef.current;
      if (el && ready.current && Number.isFinite(el.duration)) {
        seek(v * Math.max(0, el.duration - 0.05));
      }
    },
    [seek],
  );

  useScrollProgress(sectionRef, { enabled: rich, mode: "pinned", smooth: 0.16, onProgress });

  // Load the film only for rich motion, and only after the page itself has
  // finished loading, so it never competes with the poster, fonts or CSS.
  useEffect(() => {
    const el = videoRef.current;
    if (!rich || !el) return;

    const controller = new AbortController();
    let objectUrl: string | null = null;

    const onLoaded = () => {
      ready.current = true;
      el.dataset.ready = "";
      seek(Number(sectionRef.current?.style.getPropertyValue("--v") || 0) * el.duration);
    };
    const onSeeked = () => {
      seeking.current = false;
      if (Math.abs(el.currentTime - wanted.current) >= SEEK_EPSILON) seek(wanted.current);
    };
    const load = () => {
      fetch(video.src, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`entrance film: HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          objectUrl = URL.createObjectURL(blob);
          el.src = objectUrl;
        })
        // On failure the poster simply stays; the typography still plays.
        .catch(() => undefined);
    };

    el.addEventListener("loadeddata", onLoaded);
    el.addEventListener("seeked", onSeeked);
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });

    return () => {
      controller.abort();
      window.removeEventListener("load", load);
      el.removeEventListener("loadeddata", onLoaded);
      el.removeEventListener("seeked", onSeeked);
      ready.current = false;
      seeking.current = false;
      delete el.dataset.ready;
      el.removeAttribute("src");
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [rich, video.src, seek]);

  const words = tagline.split(/\s+/).filter(Boolean);

  return (
    <section
      ref={sectionRef}
      data-theme="dusk"
      aria-labelledby="home-hero"
      className="entrance -mt-18 bg-surface text-ink md:-mt-22"
    >
      <div className="entrance-frame">
        <picture>
          {/* Rich motion starts on the film's own first frame, so the hand-over
              to the video is seamless; everyone else gets the establishing still. */}
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
          <video
            ref={videoRef}
            className="entrance-media entrance-video"
            muted
            playsInline
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : null}

        <div aria-hidden="true" className="entrance-scrim absolute inset-0" />
        <div aria-hidden="true" className="entrance-grain absolute inset-0" />

        <div className="entrance-content absolute inset-0 z-10 flex flex-col justify-end">
          <div className="container-site">
            <div className="entrance-copy">
              <div className="entrance-open">
                <p className="eyebrow">{eyebrow}</p>
                <hr className="rule-ornament mt-5" aria-hidden="true" />
                <h1 id="home-hero" className="heading-hero mt-6">
                  {title.lead}
                  <br />
                  <em>{title.emphasis}</em>
                </h1>
              </div>

              <p className="entrance-tagline">
                {words.map((word, i) => (
                  <Fragment key={`${word}-${i}`}>
                    <span
                      className="entrance-word"
                      style={
                        {
                          "--s": (TAGLINE_FROM + (i / words.length) * TAGLINE_SPAN).toFixed(3),
                        } as React.CSSProperties
                      }
                    >
                      {word}
                    </span>{" "}
                  </Fragment>
                ))}
              </p>
            </div>

            <div className="entrance-actions mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href="#enquire" className="btn-primary">
                Enquire now
              </a>
              <CallLink className="btn-ghost" />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="entrance-cue absolute right-0 bottom-6 z-10 items-center gap-3 pr-(--gutter)"
        >
          <span className="eyebrow">Scroll to enter</span>
          <svg
            viewBox="0 0 24 48"
            width="12"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-highlight"
          >
            <path d="M12 2v36M6 32l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
