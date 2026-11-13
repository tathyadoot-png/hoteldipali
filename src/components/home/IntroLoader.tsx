"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Emblem } from "@/components/brand/Logo";
import { Wordmark } from "@/components/brand/Wordmark";
import { hasBooted } from "@/lib/app-boot";
import { INTRO_SEEN_KEY } from "@/lib/motion";

/**
 * "Midnight Bloom" — the opening on the home page's first load in a session.
 * On the plum night, gold veins grow in from the four corners; where they
 * meet, a plum dahlia blooms (layered petals — drawn, not a photograph, so it
 * costs no download and renders on the first paint — with a soft gold rim of
 * light) and the logo surfaces on its medallion at the flower's heart; the
 * letters of the name rise into a line beneath. Then that line flies into
 * the hero's own name — each word placed on its hero rectangle and released
 * from where it stood (FLIP, transform only) — while the veins draw back and
 * the night lifts.
 *
 * How it stays out of the way:
 * - Server-rendered with a CSS-only timeline: it plays from first paint and,
 *   without JS, fades on its own at ~1.6 s. It never blocks the page: the
 *   overlay ignores the pointer, and any input (pointer, key, wheel, touch)
 *   skips to the end at once.
 * - JS takes over after hydration: it leaves at EXIT_AT ms after page start
 *   and, if the visitor skipped, starts the hero's own entrance (CSS
 *   animations named "intro-*") now. Done by ~2.1 s.
 * - Once per browser session (sessionStorage, guarded — the boot script skips
 *   it when already seen) and on full page loads only: arriving on the home
 *   page by client-side navigation never shows it (app-boot.ts).
 * - Reduced motion, data saver or a slow connection (<html data-intro="off">,
 *   set by the boot script): never shown, and JS ends it immediately.
 */

const EXIT_AT = 1600; // ms after navigation start; mirrors --intro in theme.css
const FLY_MS = 480;
const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

// The veins, drawn in a 100 × 100 box: one from each corner toward the flower,
// with smaller branches curling off it (delays in ms). They are drawn into a
// landscape (160 × 100) and a portrait (100 × 180) frame — never stretched,
// so their strokes and dashes stay true — and CSS shows the one that fits.
const VEINS: Array<{ d: string; delay: number; branch?: boolean }> = [
  { d: "M0 0C14 6 20 20 30 26S38 32 41.5 35", delay: 0 },
  { d: "M100 0C87 7 81 18 70 25S61 31 58.5 35", delay: 60 },
  { d: "M100 100C88 95 80 80 70 73S61 62 59 56", delay: 120 },
  { d: "M0 100C12 93 19 82 30 74S39 63 41 56", delay: 180 },
  { d: "M13 7.5C15 3 21 2 23 5", delay: 260, branch: true },
  { d: "M24 22C22 28 25 31 29 31", delay: 340, branch: true },
  { d: "M88 7C86 2.5 80 2 78 5.5", delay: 300, branch: true },
  { d: "M75 21C78 26 75 30 71 30", delay: 380, branch: true },
  { d: "M87 94C85 99 79 99 77 96", delay: 320, branch: true },
  { d: "M76 77C80 73 79 69 75 68", delay: 400, branch: true },
  { d: "M12 93C14 98 20 98.5 22 95.5", delay: 280, branch: true },
  { d: "M24 79C21 75 23 71 27 71", delay: 360, branch: true },
];

const FRAMES = [
  { name: "landscape", width: 160, height: 100, sx: 1.6, sy: 1 },
  { name: "portrait", width: 100, height: 180, sx: 1, sy: 1.8 },
] as const;

/** Scales an all-absolute path (M/C/S pairs) from the 100 × 100 box into a frame. */
function scalePath(d: string, sx: number, sy: number): string {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = Number(n) * (i++ % 2 === 0 ? sx : sy);
    return String(Math.round(v * 100) / 100);
  });
}

// The dahlia: three rings of cupped, round-tipped petals, outer first.
const RINGS = [
  { petal: "M0 -12C8 -18 10 -33 4.5 -43Q0 -48 -4.5 -43C-10 -33 -8 -18 0 -12Z", count: 16, offset: 0, delay: 420 },
  { petal: "M0 -8C7 -13 8 -25 3.5 -33Q0 -37 -3.5 -33C-8 -25 -7 -13 0 -8Z", count: 12, offset: 15, delay: 500 },
  { petal: "M0 -5C5.5 -9 6.5 -17 2.8 -23Q0 -26 -2.8 -23C-6.5 -17 -5.5 -9 0 -5Z", count: 8, offset: 22.5, delay: 580 },
];

/** The opening's two words and the hero's matching ones (the flight's ends). */
const FLIGHTS = [
  [".intro-name .wordmark-hotel", ".home-hero-name .wordmark-hotel"],
  [".intro-name .wordmark-dipali", ".home-hero-name .wordmark-dipali"],
] as const;

/**
 * Flies the opening's words onto the hero's: each word is placed on its hero
 * rectangle at the hero's size, inverted back onto where it stands now, then
 * released (theme.css, .intro-fly). Only if the hero's name is on screen.
 */
function fly(root: HTMLElement): void {
  const plans: Array<{ word: HTMLElement; first: DOMRect; last: DOMRect; size: string }> = [];
  for (const [from, to] of FLIGHTS) {
    const word = root.querySelector<HTMLElement>(from);
    const target = document.querySelector<HTMLElement>(to);
    if (!word || !target) return;
    const first = word.getBoundingClientRect();
    const last = target.getBoundingClientRect();
    if (last.bottom <= 0 || last.top >= window.innerHeight || first.width === 0 || last.width === 0) return;
    plans.push({ word, first, last, size: getComputedStyle(target).fontSize });
  }
  for (const { word, last, size } of plans) {
    word.classList.add("intro-fly");
    word.style.fontSize = size;
    word.style.left = `${last.left}px`;
    word.style.top = `${last.top}px`;
  }
  for (const plan of plans) {
    const placed = plan.word.getBoundingClientRect();
    const scale = plan.first.width / placed.width;
    plan.word.style.transform = `translate(${plan.first.left - placed.left}px, ${plan.first.top - placed.top}px) scale(${scale})`;
  }
  // Two frames: the inverted position must be painted before the release.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      for (const { word } of plans) word.dataset.go = "";
    }),
  );
}

export function IntroLoader({ name }: { name: string }) {
  // Decided once per mount. During the first hydration the app has not booted
  // yet, so the client renders exactly the server's markup; on any later
  // (client-side) mount it renders nothing.
  const [show] = useState(() => !hasBooted());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finish = () => {
      el.dataset.state = "done";
    };
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.intro === "off"
    ) {
      finish();
      return;
    }
    // It plays now: not again in this session.
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Storage unavailable (privacy mode, blocked): it may play again — fine.
    }
    // Hydrated very late: the CSS fallback is already fading it — just end it.
    if (performance.now() > EXIT_AT + 350) {
      finish();
      return;
    }
    el.dataset.state = "ready"; // takes over from the CSS-only fallback

    let left = false;
    let exitTimer = 0;
    let doneTimer = 0;

    const leave = (instant = false) => {
      if (left) return;
      left = true;
      window.clearTimeout(exitTimer);
      for (const type of SKIP_EVENTS) window.removeEventListener(type, skip, true);

      // Skipped early: complete the opening at once (so the line is whole
      // before it flies) and start the hero/header entrance now, not at EXIT_AT.
      const early = EXIT_AT - performance.now();
      if (early > 0) {
        for (const animation of el.getAnimations({ subtree: true })) animation.finish();
        for (const animation of document.getAnimations()) {
          if (!(animation instanceof CSSAnimation)) continue;
          if (!animation.animationName.startsWith("intro-")) continue;
          const target = (animation.effect as KeyframeEffect | null)?.target;
          if (target instanceof Element && target.closest(".intro")) continue;
          animation.currentTime = (Number(animation.currentTime) || 0) + early;
        }
      }

      if (!instant) fly(el);
      el.dataset.state = "leave";
      doneTimer = window.setTimeout(finish, instant ? 200 : FLY_MS + 40);
    };
    const skip = () => leave();

    for (const type of SKIP_EVENTS) {
      window.addEventListener(type, skip, { capture: true, passive: true });
    }
    // Arriving mid-page (restored scroll, a #hash link): get out of the way.
    if (window.scrollY > 40 || window.location.hash) leave(true);
    else exitTimer = window.setTimeout(() => leave(), Math.max(0, EXIT_AT - performance.now()));

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      for (const type of SKIP_EVENTS) window.removeEventListener(type, skip, true);
    };
  }, []);

  if (!show) return null;

  return (
    // Deep scope + text-ink: the opening sits outside every themed section.
    <div ref={ref} data-theme="deep" className="intro text-ink" aria-hidden="true">
      <div className="intro-ground" />
      {FRAMES.map((frame) => (
        <svg
          key={frame.name}
          className={`intro-veins intro-veins-${frame.name}`}
          viewBox={`0 0 ${frame.width} ${frame.height}`}
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          {VEINS.map((vein, i) => (
            <path
              key={i}
              className={vein.branch ? "intro-vein intro-vein-branch" : "intro-vein"}
              pathLength={1}
              d={scalePath(vein.d, frame.sx, frame.sy)}
              style={{ "--d": `${vein.delay}ms` } as CSSProperties}
            />
          ))}
        </svg>
      ))}
      <div className="intro-stage">
        <div className="intro-bloom">
          <span className="intro-glow" />
          <svg className="intro-dahlia" viewBox="-50 -50 100 100" focusable="false">
            <defs>
              {RINGS.map((ring, r) => (
                <path key={r} id={`intro-petal-${r + 1}`} d={ring.petal} />
              ))}
            </defs>
            {RINGS.map((ring, r) => (
              <g key={r} className={`intro-ring intro-ring-${r + 1}`} style={{ "--d": `${ring.delay}ms` } as CSSProperties}>
                {Array.from({ length: ring.count }, (_, i) => (
                  <use
                    key={i}
                    className="intro-petal"
                    href={`#intro-petal-${r + 1}`}
                    transform={`rotate(${ring.offset + (i * 360) / ring.count})`}
                  />
                ))}
              </g>
            ))}
          </svg>
          <span className="logo-medallion intro-medallion">
            <Emblem sizes="(min-width: 768px) 3rem, 2.5rem" priority />
          </span>
        </div>
        <div className="intro-name">
          <Wordmark name={name} letterClassName="intro-letter" />
        </div>
      </div>
    </div>
  );
}
