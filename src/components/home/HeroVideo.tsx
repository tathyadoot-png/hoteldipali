"use client";

import { useEffect, useRef, useState } from "react";

type HeroVideoProps = {
  src: string;
  width: number;
  height: number;
};

type Playback = "waiting" | "playing" | "paused";

/** Tablets and up; phones keep the photograph (CLAUDE.md §K). */
const WIDE_ENOUGH = "(min-width: 768px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M4.5 3v10M11.5 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M5 3.2v9.6L12.6 8z" fill="currentColor" />
    </svg>
  );
}

/**
 * The hotel in motion inside the hero's arched window, laid over the
 * photograph — which is its poster, and stays the picture whenever the video
 * cannot add anything:
 * - only from 768px, without reduced motion, data saver or a slow connection
 *   (html[data-intro="off"]); phones download no video at all;
 * - mounted after the page has loaded and the hero's entrance has finished,
 *   so it never competes with the LCP photograph or the opening;
 * - muted, inline, looping; it fades in only once frames actually play, so a
 *   blocked autoplay or a failed load leaves the photograph untouched;
 * - paused while the arch is off screen or covered by the next section, and
 *   while the tab is hidden;
 * - a pause / play control (WCAG 2.2.2: moving content longer than 5 s).
 */
export function HeroVideo({ src, width, height }: HeroVideoProps) {
  const [enabled, setEnabled] = useState(false);
  const [playback, setPlayback] = useState<Playback>("waiting");
  const marker = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);

  // Decide, then wait for the page and the hero's entrance.
  useEffect(() => {
    const eligible =
      window.matchMedia(WIDE_ENOUGH).matches &&
      !window.matchMedia(REDUCED).matches &&
      document.documentElement.dataset.intro !== "off";
    if (!eligible) return;

    let cancelled = false;
    const windowEl = marker.current?.closest(".entrance-arch-window");
    const settle = async () => {
      if (document.readyState !== "complete") {
        await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
      }
      // The photograph's own entrance (zoom, reveal) finishes first.
      const running = windowEl
        ? [windowEl, ...windowEl.querySelectorAll("img")].flatMap((el) => el.getAnimations())
        : [];
      await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
      if (!cancelled) setEnabled(true);
    };
    void settle();

    const reduce = window.matchMedia(REDUCED);
    const narrow = window.matchMedia(WIDE_ENOUGH);
    const off = () => {
      if (reduce.matches || !narrow.matches) setEnabled(false);
    };
    reduce.addEventListener("change", off);
    narrow.addEventListener("change", off);
    return () => {
      cancelled = true;
      reduce.removeEventListener("change", off);
      narrow.removeEventListener("change", off);
    };
  }, []);

  // Play only while it can be seen.
  useEffect(() => {
    const el = video.current;
    if (!enabled || !el) return;
    const section = el.closest("section");
    const arch = el.closest(".entrance-arch-window");
    const next = section?.nextElementSibling;

    let onScreen = true;
    let covered = false;
    const sync = () => {
      const want = onScreen && !covered && !document.hidden && !userPaused.current;
      if (want && el.paused) {
        el.play().catch(() => {
          // Autoplay refused (power saving, policy): the photograph stays.
          if (!userPaused.current) setEnabled(false);
        });
      } else if (!want && !el.paused) {
        el.pause();
      }
    };

    const seen = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      sync();
    });
    if (arch) seen.observe(arch);
    // The next section rising over the hero: covered once it reaches the top
    // 40% of the viewport (root = that band).
    const cover = new IntersectionObserver(
      ([entry]) => {
        covered = Boolean(entry?.isIntersecting);
        sync();
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    if (next) cover.observe(next);

    const onPlaying = () => setPlayback("playing");
    const onPause = () => {
      if (userPaused.current) setPlayback("paused");
    };
    const onError = () => setEnabled(false);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      seen.disconnect();
      cover.disconnect();
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", sync);
      el.pause();
    };
  }, [enabled]);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    userPaused.current = !el.paused;
    if (userPaused.current) {
      el.pause();
      setPlayback("paused");
    } else {
      void el.play().catch(() => setEnabled(false));
    }
  };

  const paused = playback === "paused";

  return (
    <>
      <span ref={marker} hidden />
      {enabled ? (
        <>
          <video
            ref={video}
            className="entrance-video"
            data-playback={playback}
            src={src}
            width={width}
            height={height}
            muted
            playsInline
            loop
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
          />
          {playback !== "waiting" ? (
            <button
              type="button"
              className="entrance-video-toggle"
              aria-pressed={paused}
              aria-label={paused ? "Play the hotel video" : "Pause the hotel video"}
              onClick={toggle}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
          ) : null}
        </>
      ) : null}
    </>
  );
}
