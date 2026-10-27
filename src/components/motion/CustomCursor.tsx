"use client";

import { useEffect, useRef } from "react";

// Desktop mouse / trackpad only; touch screens and keyboards are never touched.
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// What the cursor becomes over an element (nearest match first, in this
// order). Where typing or choosing happens, or a control is disabled, it
// steps aside and the native cursor shows (the I-beam, not-allowed…).
const NATIVE =
  "input:not([type='hidden']), textarea, select, [contenteditable=''], [contenteditable='true'], [data-cursor='native'], :disabled, [aria-disabled='true']";
const LABELLED = "[data-cursor-label]";
const FRAMED = ".btn-primary, .btn-secondary, .btn-ghost, [data-cursor='frame']";
const MAGNETIC = ".btn-primary, [data-cursor-magnetic]";
const LINKED = "a[href], button, [role='button'], label[for], summary, [data-cursor='link']";
const MEDIA = "img, picture, video, [data-cursor='media']";
const TEXT =
  "p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, dd, dt, address, td, th, label";

type Mode = "default" | "link" | "frame" | "label" | "media" | "text" | "native";

// Ring sizes (CSS px): the resting ring, the labelled disc, the frame's
// margin around a button. Scales are relative to the ring's box.
const RING = 34;
const DISC = 84;
const FRAME_PAD = 7;
const SCALE: Record<Mode, number> = {
  default: 1,
  link: 0.62,
  frame: 1,
  label: 1,
  media: 1.5,
  text: 1,
  native: 1,
};
// The magnetic pull: how far a plaque leans toward the pointer (share of the
// distance, capped), and how far its frame follows the pointer.
const PULL = 0.18;
const PULL_MAX = 6;
const FRAME_FOLLOW = 0.1;

function resolve(target: EventTarget | null): { mode: Mode; node: HTMLElement | null } {
  if (!(target instanceof Element)) return { mode: "default", node: null };
  const order: [Mode, string][] = [
    ["native", NATIVE],
    ["label", LABELLED],
    ["frame", FRAMED],
    ["link", LINKED],
    ["media", MEDIA],
  ];
  for (const [mode, selector] of order) {
    const node = target.closest<HTMLElement>(selector);
    if (node) return { mode, node };
  }
  const text = target.closest<HTMLElement>(TEXT);
  if (text && text.textContent?.trim()) return { mode: "text", node: text };
  return { mode: "default", node: null };
}

/**
 * The custom cursor, for desktop pointers only: a small gold diamond (the
 * site's keystone) at the pointer, and a fine gold ring that follows it with
 * a soft lag; a bead on the ring turns toward the way it travels and settles
 * at its crown. Over a link the ring draws in around the diamond; over a
 * button it becomes a gold frame around it (the site's framing device), and
 * gold plaques lean a few pixels toward the pointer; over large linked rows
 * it opens into an emerald disc with a word ("View", "Explore", from
 * `data-cursor-label`); over a photograph it widens like a lens; over text
 * the diamond becomes a slim caret. Over fields, disabled controls and open
 * dialogs it steps aside for the native cursor.
 *
 * Built to stay out of the way: one passive pointer listener; positions and
 * scales are written to two or three elements' individual transform
 * properties inside one rAF loop that stops once everything has settled (no
 * React state per movement, no layout reads per frame, no filters); the
 * element never takes pointer events. The native cursor is hidden only once
 * this has started and seen the mouse (`html[data-cursor="on"]`, theme.css),
 * so if anything fails the native cursor simply stays. Touch input hands
 * back to the native cursor at once. Reduced motion: the ring sits exactly
 * on the pointer, nothing trails, nothing leans.
 */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const orbit = orbitRef.current;
    const core = coreRef.current;
    const label = labelRef.current;
    if (!root || !ring || !orbit || !core || !label) return;

    const html = document.documentElement;
    const fine = window.matchMedia(FINE_POINTER);
    const reducedQuery = window.matchMedia(REDUCED_MOTION);
    let reduced = reducedQuery.matches;

    let x = -200;
    let y = -200;
    let rx = -200;
    let ry = -200;
    let w = RING;
    let h = RING;
    let sx = 1;
    let sy = 1;
    let angle = 0;
    let mode: Mode = "default";
    let node: HTMLElement | null = null;
    let last: EventTarget | null = null;
    let frameRect: DOMRect | null = null;
    let magnet: HTMLElement | null = null;
    let lean = { x: 0, y: 0 };
    let pressed = false;
    let raf = 0;
    let previous = 0;
    let listening = false;
    let scrollTimer = 0;

    const show = (on: boolean) => {
      root.dataset.visible = on ? "true" : "false";
    };

    const release = () => {
      if (magnet) magnet.style.translate = "";
      magnet = null;
      lean = { x: 0, y: 0 };
    };

    // A new box size keeps the ring's drawn size continuous (the scale makes
    // up the difference), then the scale eases to the mode's own.
    const resize = (nextW: number, nextH: number) => {
      sx = (w * sx) / nextW;
      sy = (h * sy) / nextH;
      w = nextW;
      h = nextH;
      ring.style.width = `${w}px`;
      ring.style.height = `${h}px`;
    };

    const setMode = (next: Mode, nextNode: HTMLElement | null) => {
      if (next === mode && nextNode === node) return;
      if (node !== nextNode) release();
      mode = next;
      node = nextNode;
      root.dataset.mode = next;
      frameRect = null;
      if (next === "frame" && nextNode) {
        frameRect = nextNode.getBoundingClientRect();
        resize(frameRect.width + FRAME_PAD * 2, frameRect.height + FRAME_PAD * 2);
        if (!reduced && nextNode.matches(MAGNETIC)) magnet = nextNode;
      } else if (next === "label") {
        resize(DISC, DISC);
        label.textContent = nextNode?.dataset.cursorLabel ?? "";
      } else {
        resize(RING, RING);
      }
      show(next !== "native");
      schedule();
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = previous ? Math.min(64, now - previous) : 16.7;
      previous = now;
      const ease = (rate: number) => (reduced ? 1 : 1 - Math.pow(1 - rate, dt / 16.7));

      // Where the ring is going: the pointer, or the framed button's centre
      // (leaning with it, following the pointer a little).
      let tx = x;
      let ty = y;
      if (mode === "frame" && frameRect) {
        const cx = frameRect.left + frameRect.width / 2 + lean.x;
        const cy = frameRect.top + frameRect.height / 2 + lean.y;
        tx = cx + (x - cx) * FRAME_FOLLOW;
        ty = cy + (y - cy) * FRAME_FOLLOW;
      }
      const target = SCALE[mode] * (pressed ? 0.88 : 1);

      rx += (tx - rx) * ease(0.24);
      ry += (ty - ry) * ease(0.24);
      sx += (target - sx) * ease(0.2);
      sy += (target - sy) * ease(0.2);

      // The bead points the way the ring is travelling, then settles on top.
      const dx = tx - rx;
      const dy = ty - ry;
      const travel = Math.hypot(dx, dy);
      const aim = travel > 2.5 ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : 0;
      const turn = ((((aim - angle) % 360) + 540) % 360) - 180;
      angle += turn * ease(0.16);

      core.style.translate = `${x}px ${y}px`;
      ring.style.translate = `${rx - w / 2}px ${ry - h / 2}px`;
      ring.style.scale = `${sx} ${sy}`;
      orbit.style.translate = `${rx - RING / 2}px ${ry - RING / 2}px`;
      orbit.style.rotate = `${angle}deg`;

      const settled =
        travel < 0.1 &&
        Math.abs(target - sx) < 0.002 &&
        Math.abs(target - sy) < 0.002 &&
        Math.abs(turn) < 0.2;
      if (!settled) raf = requestAnimationFrame(tick);
      else previous = 0;
    };

    function schedule() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        // Touch on a hybrid device: the native cursor is back in charge.
        show(false);
        delete html.dataset.cursor;
        return;
      }
      if (html.dataset.cursor !== "on") {
        html.dataset.cursor = "on";
        // First sight of the mouse: start exactly at the pointer.
        rx = event.clientX;
        ry = event.clientY;
      }
      x = event.clientX;
      y = event.clientY;
      // Over the page's own scrollbar the native cursor shows.
      const onScrollbar = x >= html.clientWidth || y >= html.clientHeight;
      if (event.target !== last || onScrollbar) {
        last = onScrollbar ? null : event.target;
        if (onScrollbar) setMode("native", null);
        else {
          const next = resolve(event.target);
          setMode(next.mode, next.node);
        }
      }
      if (mode !== "native") show(true);
      if (magnet && frameRect) {
        const cx = frameRect.left + frameRect.width / 2;
        const cy = frameRect.top + frameRect.height / 2;
        const clamp = (v: number) => Math.max(-PULL_MAX, Math.min(PULL_MAX, v));
        lean = { x: clamp((x - cx) * PULL), y: clamp((y - cy) * PULL) };
        magnet.style.translate = `${lean.x}px ${lean.y}px`;
      }
      schedule();
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      pressed = true;
      root.dataset.pressed = "true";
      schedule();
    };

    const onUp = () => {
      pressed = false;
      delete root.dataset.pressed;
      schedule();
    };

    const onLeave = () => {
      show(false);
      release();
      last = null;
    };

    // The page moved under a still pointer: look again once it settles.
    const onScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        if (html.dataset.cursor !== "on") return;
        const under = document.elementFromPoint(x, y);
        last = under;
        const next = resolve(under);
        setMode(next.mode, next.node);
      }, 90);
    };

    const start = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("blur", onLeave);
      html.addEventListener("mouseleave", onLeave);
    };

    const stop = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onLeave);
      html.removeEventListener("mouseleave", onLeave);
      window.clearTimeout(scrollTimer);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      release();
      show(false);
      delete html.dataset.cursor;
    };

    const sync = () => {
      if (fine.matches) start();
      else stop();
    };
    const onReduced = () => {
      reduced = reducedQuery.matches;
      if (reduced) release();
    };

    try {
      sync();
    } catch {
      // Never strand a visitor without a cursor.
      stop();
    }
    fine.addEventListener("change", sync);
    reducedQuery.addEventListener("change", onReduced);
    return () => {
      fine.removeEventListener("change", sync);
      reducedQuery.removeEventListener("change", onReduced);
      stop();
    };
  }, []);

  return (
    // Decorative and inert: the native cursor's meaning is unchanged.
    <div
      ref={rootRef}
      aria-hidden="true"
      data-theme="emerald"
      data-mode="default"
      data-visible="false"
      className="cursor text-ink"
    >
      <div ref={ringRef} className="cursor-ring">
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={orbitRef} className="cursor-orbit">
        <span className="cursor-bead" />
      </div>
      <div ref={coreRef} className="cursor-core" />
    </div>
  );
}
