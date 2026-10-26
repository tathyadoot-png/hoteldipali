"use client";

import { useEffect, useRef, useState } from "react";

import { Emblem } from "@/components/brand/Logo";
import { ArchFrame } from "@/components/brand/Ornaments";
import { hasBooted } from "@/lib/app-boot";

/**
 * The opening moment on the home page's first load. Fine gold lines draw an
 * arch around the real Hotel Dipali emblem on the emerald botanical canvas;
 * then the arch itself flies onto the hero's arched window — the insignia
 * becomes the doorway onto the hotel — while the canvas dissolves.
 *
 * How it stays out of the way:
 * - Server-rendered with a CSS-only timeline: it plays from first paint and,
 *   without JS, fades itself out at ~1.9 s. It never blocks the page: the
 *   overlay ignores the pointer, and any input (pointer, key, wheel, touch)
 *   ends it at once.
 * - JS takes over after hydration: it leaves at EXIT_AT ms after page start,
 *   flies the arch (transform + opacity only) and, if the visitor skipped,
 *   shifts the hero's own entrance (CSS animations named "intro-*") to start
 *   now instead of waiting.
 * - Full page loads only: arriving on the home page by client-side navigation
 *   (from another page, or back home) never shows it — see app-boot.ts.
 * - Reduced motion, data saver or a slow connection (<html data-intro="off">,
 *   set by the boot script): never shown (CSS), and JS ends it immediately.
 */

const EXIT_AT = 1450; // ms after navigation start; mirrors --intro in theme.css
const LEAVE_MS = 820;
const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

type IntroLoaderProps = {
  /** e.g. "Sagar · Madhya Pradesh" */
  caption: string;
};

export function IntroLoader({ caption }: IntroLoaderProps) {
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

      // Fly the loader's arch onto the hero's arch (same 0.72 aspect, so one
      // uniform scale fits) — only if that arch is on screen.
      const arch = el.querySelector<HTMLElement>(".intro-arch");
      // Box to box: both arches are 0.72 boxes; their frames overhang alike.
      const target = document.querySelector<HTMLElement>(".entrance-arch");
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
      doneTimer = window.setTimeout(finish, instant ? 320 : LEAVE_MS);
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
    // Emerald scope + text-ink: the loader sits outside every themed section.
    <div ref={ref} data-theme="emerald" className="intro text-ink" aria-hidden="true">
      <div className="intro-canvas" />
      <div className="intro-panel" />
      <div className="intro-stage">
        <div className="intro-arch">
          <ArchFrame className="intro-arch-frame" />
          <Emblem className="intro-emblem" sizes="(min-width: 768px) 8rem, 6rem" priority />
          <span className="intro-sweep" />
        </div>
        <span className="intro-base" />
        <p className="intro-caption">{caption}</p>
      </div>
    </div>
  );
}
