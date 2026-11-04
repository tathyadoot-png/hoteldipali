"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Emblem } from "@/components/brand/Logo";
import { hasBooted } from "@/lib/app-boot";

/**
 * "First lamp" — the opening on the home page's first load. On the plum
 * night a single flame lights at the foot of an arch; its light runs along a
 * row of small lamps tracing the arch; the logo appears inside, on plum; then
 * the arch flies onto the hero's arch window while the night dissolves.
 *
 * How it stays out of the way:
 * - Server-rendered with a CSS-only timeline: it plays from first paint and,
 *   without JS, leaves on its own at ~1.6 s. It never blocks the page: the
 *   overlay ignores the pointer, and any input (pointer, key, wheel, touch)
 *   ends it at once.
 * - JS takes over after hydration: it leaves at EXIT_AT ms after page start,
 *   flies the arch (transform + opacity only) and, if the visitor skipped,
 *   starts the hero's own entrance (CSS animations named "intro-*") now.
 * - Full page loads only: arriving on the home page by client-side navigation
 *   never shows it (app-boot.ts).
 * - Reduced motion, data saver or a slow connection (<html data-intro="off">,
 *   set by the boot script): never shown, and JS ends it immediately.
 */

const EXIT_AT = 1150; // ms after navigation start; mirrors --intro in theme.css
const LEAVE_MS = 440;
const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

// The lamps along the arch (box 100 × 100/0.72: straight jambs under a
// semicircular head), from the left foot, over the top, to the right foot.
const LAMP_COUNT = 17;
const BOX_H = 100 / 0.72;
const RADIUS = 50;

function archPoint(t: number): { x: number; y: number } {
  const jamb = BOX_H - RADIUS;
  const arc = Math.PI * RADIUS;
  let d = t * (2 * jamb + arc);
  if (d <= jamb) return { x: 0, y: BOX_H - d };
  d -= jamb;
  if (d <= arc) {
    const angle = Math.PI - d / RADIUS;
    return { x: RADIUS + RADIUS * Math.cos(angle), y: RADIUS - RADIUS * Math.sin(angle) };
  }
  d -= arc;
  return { x: 100, y: RADIUS + d };
}

const LAMPS = Array.from({ length: LAMP_COUNT }, (_, i) => {
  const { x, y } = archPoint(i / (LAMP_COUNT - 1));
  return { x: `${x.toFixed(2)}%`, y: `${((y / BOX_H) * 100).toFixed(2)}%` };
});

export function IntroLoader() {
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

      // Skipped early: start the hero/header entrance now, not at EXIT_AT.
      const early = EXIT_AT - performance.now();
      if (early > 0) {
        for (const animation of document.getAnimations()) {
          if (!(animation instanceof CSSAnimation)) continue;
          if (!animation.animationName.startsWith("intro-")) continue;
          const target = (animation.effect as KeyframeEffect | null)?.target;
          if (target instanceof Element && target.closest(".intro")) continue;
          animation.currentTime = (Number(animation.currentTime) || 0) + early;
        }
      }

      // Fly the arch onto the hero's arch window (same 0.72 aspect, so one
      // uniform scale fits) — only if that window is on screen.
      const arch = el.querySelector<HTMLElement>(".intro-arch");
      const target = document.querySelector<HTMLElement>(".home-hero-art .arch-window");
      if (!instant && arch && target) {
        const a = arch.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        if (t.bottom > 0 && t.top < window.innerHeight && a.width > 0) {
          el.style.setProperty("--fx", `${t.left + t.width / 2 - (a.left + a.width / 2)}px`);
          el.style.setProperty("--fy", `${t.top + t.height / 2 - (a.top + a.height / 2)}px`);
          el.style.setProperty("--fs", (t.width / a.width).toFixed(4));
        }
      }
      el.dataset.state = "leave";
      doneTimer = window.setTimeout(finish, instant ? 200 : LEAVE_MS);
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
    // Deep scope + text-ink: the loader sits outside every themed section.
    <div ref={ref} data-theme="deep" className="intro text-ink" aria-hidden="true">
      <div className="intro-ground" />
      <div className="intro-arch">
        <div className="intro-panel">
          <Emblem className="intro-emblem" sizes="(min-width: 768px) 6rem, 5rem" priority />
        </div>
        <div className="intro-lamps">
          {LAMPS.map((lamp, i) => (
            <span
              key={i}
              className="intro-lamp"
              style={{ "--x": lamp.x, "--y": lamp.y, "--i": i } as CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
