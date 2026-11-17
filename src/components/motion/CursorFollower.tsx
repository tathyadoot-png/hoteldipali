"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/** Who gets the follower: a hovering fine pointer (mouse, trackpad), no reduced motion. */
const CURSOR_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
// The ring's easing toward the pointer per 60 Hz frame (frame-rate independent below).
const LERP = 0.18;

type CursorState = "" | "link" | "view" | "drag" | "text";

const TEXT_FIELDS =
  'input:not([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"],[type="range"],[type="color"],[type="file"]), textarea, select, [contenteditable=""], [contenteditable="true"]';
const ACTIONS = 'a[href], button, [role="button"], label[for], summary';

/** What the pointer is over: a text field, a labelled target, an action, or nothing. */
function stateFor(target: EventTarget | null): { state: CursorState; label: string } {
  if (!(target instanceof Element)) return { state: "", label: "" };
  if (target.closest(TEXT_FIELDS)) return { state: "text", label: "" };
  const labelled = target.closest<HTMLElement>("[data-cursor]");
  const kind = labelled?.dataset.cursor;
  if (kind === "view") return { state: "view", label: "View" };
  if (kind === "drag") return { state: "drag", label: "Drag" };
  if (target.closest(ACTIONS)) return { state: "link", label: "" };
  return { state: "", label: "" };
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia(CURSOR_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A cursor follower for mouse and trackpad: a fine gold ring (28 px) easing
 * after the pointer and a small plum dot exactly on it. Over links and
 * buttons the ring grows to 56 px with a faint gold tint; over an element
 * marked data-cursor="view" (a photograph that opens) it reads "View", over
 * data-cursor="drag" (a swipe rail) "Drag"; over text fields it steps aside;
 * a press tightens it; it hides when the pointer leaves the window.
 *
 * The system cursor always stays (never cursor: none). The follower changes
 * no hit area and takes no focus: aria-hidden, pointer-events none. One rAF
 * loop runs only while the ring is still easing; it writes transforms alone.
 * Not rendered for touch, coarse pointers or reduced motion.
 */
export function CursorFollower() {
  const enabled = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(CURSOR_QUERY).matches,
    () => false,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!enabled || !root || !ring || !dot || !label) return;

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let last = 0;
    let frame = 0;
    let state: CursorState = "";
    root.dataset.hidden = "";

    const place = (el: HTMLElement, px: number, py: number) => {
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    };

    const tick = (time: number) => {
      const dt = last ? Math.min(64, time - last) : 16.7;
      last = time;
      const k = 1 - (1 - LERP) ** (dt / 16.7);
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      if (Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1) {
        rx = x;
        ry = y;
        frame = 0;
        last = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      place(ring, rx, ry);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      x = event.clientX;
      y = event.clientY;
      if (root.dataset.hidden !== undefined) {
        // Arriving: start on the pointer instead of sweeping in from afar.
        if (rx < -50) {
          rx = x;
          ry = y;
        }
        delete root.dataset.hidden;
      }
      place(dot, x, y);
      const next = stateFor(event.target);
      if (next.state !== state) {
        state = next.state;
        root.dataset.state = state;
        label.textContent = next.label;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onDown = () => {
      root.dataset.press = "";
    };
    const onUp = () => {
      delete root.dataset.press;
    };
    const onLeave = (event: PointerEvent) => {
      if (!event.relatedTarget) root.dataset.hidden = "";
    };
    const onBlur = () => {
      root.dataset.hidden = "";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onBlur);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} aria-hidden="true" className="cursor" data-hidden="">
      <div ref={ringRef} className="cursor-ring">
        <svg className="cursor-shape" viewBox="0 0 64 64" focusable="false">
          <circle cx={32} cy={32} r={31.5} />
        </svg>
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
