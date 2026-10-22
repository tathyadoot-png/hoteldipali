import Lenis from "lenis";

/**
 * Smooth wheel scrolling (Lenis), shared by the whole client app.
 *
 * Why: a mouse wheel scrolls in discrete notches — natively each notch moves
 * the page ~100px in a single frame and stops dead, with no inertia. Lenis
 * turns each notch into a short, decelerating glide. It still scrolls the real
 * window (position: sticky, IntersectionObserver, anchors, find-in-page and
 * the scrollbar all keep working) and leaves touch scrolling native.
 *
 * Integration rules for this site:
 * - One clock. Lenis's own always-on rAF loop is off; `loop` runs only while a
 *   glide is in progress and stops itself when it settles.
 * - Same-frame scenes. Lenis emits "scroll" synchronously right after it moves
 *   the window, so useScrollProgress subscribes to that instead of scheduling
 *   its own frame — scenes and the hero film update in the frame they move.
 * - Native wins over a glide. Keyboard scrolling, history navigation and
 *   route changes hand control straight back to the browser.
 * - Code-initiated scrolls go through `scrollToY`, never `window.scrollTo`, so
 *   they cannot fight a glide in progress.
 *
 * STATIC-ONLY: nothing here depends on static export.
 */

/**
 * Glide strength. Lenis damps exponentially with a time constant of
 * 1 / (lerp × 60) s, independent of frame rate. Measured per 100px wheel notch
 * in Chromium (production build, 1440×900; see docs/PLAN.md):
 *
 *   lerp   50% of notch   90%      settled   frames   reversal
 *   0.14    97 ms         283 ms   ~520 ms   30       37 ms   (2026-10-19)
 *   0.10   128 ms         395 ms   ~716 ms   38       37 ms   ← chosen
 *   0.09   143 ms         436 ms   ~796 ms   41       39 ms
 *   0.08   166 ms         486 ms   ~900 ms   44       31 ms
 *
 * 0.10 gives the longer, softer glide asked for (2026-10-21) while a notch is
 * still 90% done in ~0.4 s and at rest in ~0.7 s; 0.08–0.09 took up to ~0.9 s
 * to stop. Reversal stays instant at every setting (see `virtualScroll`
 * below). wheelMultiplier stays 1: a notch travels exactly as far as it does
 * natively — never slower.
 */
const LERP = 0.1;

/** Keys whose default action scrolls the page. */
const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", "Tab"]);

let lenis: Lenis | null = null;
let frame = 0;
let paused = false;
let teardown: (() => void) | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function loop(time: number) {
  const instance = lenis;
  if (!instance) {
    frame = 0;
    return;
  }
  // rAF time is the frame's start; never let the clock run backwards.
  if (time < instance.time) instance.time = time;
  instance.raf(time);
  frame = instance.isScrolling === "smooth" ? requestAnimationFrame(loop) : 0;
}

/** Starts the clock for a glide, measured from the input that caused it. */
function kick(timeStamp = performance.now()) {
  if (!lenis || frame) return;
  lenis.time = timeStamp;
  frame = requestAnimationFrame(loop);
}

/** Abandons a glide in progress so a native scroll can take over. */
function handOver() {
  if (!lenis || paused || lenis.isScrolling !== "smooth") return;
  lenis.stop();
  lenis.start();
}

/** Smooth scrolling is active (Lenis running) for this visitor right now. */
export function getSmoothScroll(): Lenis | null {
  return lenis;
}

export function subscribeSmoothScroll(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Creates the Lenis instance. Returns false (and leaves native scrolling in
 * place) if it cannot start.
 */
export function startSmoothScroll(): boolean {
  if (lenis) return true;
  let instance: Lenis;
  try {
    instance = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      // Touch keeps the platform's own momentum scrolling.
      syncTouch: false,
      autoRaf: false,
      // Same-page hash links glide; the browser still updates the URL,
      // history and focus starting point (Lenis does not preventDefault).
      anchors: true,
      stopInertiaOnNavigate: true,
      // Let text areas and selects scroll themselves.
      prevent: (node) => node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement,
      // Reversing must answer at once: Lenis adds each notch to its target,
      // so a notch against a glide would only shorten it (the page keeps
      // sliding the old way). Drop the remaining glide first, so the notch
      // moves the page back from where it actually is.
      virtualScroll: ({ deltaY }) => {
        const current = lenis;
        if (current?.isScrolling === "smooth") {
          const remaining = current.targetScroll - current.animatedScroll;
          if (deltaY !== 0 && remaining !== 0 && Math.sign(deltaY) !== Math.sign(remaining)) {
            current.targetScroll = current.animatedScroll;
          }
        }
        return true;
      },
    });
  } catch {
    return false;
  }
  lenis = instance;

  const offWheel = instance.on("virtual-scroll", ({ event }) => kick(event.timeStamp));
  // Anchor glides start inside Lenis's own click handler (which runs after
  // this capture listener): make sure its scroll limit is current first.
  const onClick = (event: MouseEvent) => {
    if ((event.target as Element | null)?.closest?.('a[href*="#"]')) instance.resize();
    kick(event.timeStamp);
  };
  const onKey = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) handOver();
  };
  window.addEventListener("click", onClick, { capture: true });
  window.addEventListener("keydown", onKey, { capture: true });
  window.addEventListener("popstate", handOver);

  teardown = () => {
    offWheel();
    window.removeEventListener("click", onClick, { capture: true });
    window.removeEventListener("keydown", onKey, { capture: true });
    window.removeEventListener("popstate", handOver);
  };
  notify();
  return true;
}

export function stopSmoothScroll(): void {
  if (!lenis) return;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  teardown?.();
  teardown = null;
  lenis.destroy();
  lenis = null;
  paused = false;
  notify();
}

/** Freezes page scrolling (e.g. under a modal); wheel stays native inside
 * elements marked `data-lenis-prevent`. */
export function pauseSmoothScroll(pause: boolean): void {
  paused = pause;
  if (!lenis) return;
  if (pause) lenis.stop();
  else lenis.start();
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Scrolls the window to `top`. `smooth` travels at a pace that grows with the
 * distance (0.45–1.2 s); otherwise it jumps. Works with or without Lenis.
 */
export function scrollToY(top: number, { smooth = true }: { smooth?: boolean } = {}): void {
  if (lenis) {
    // Lenis clamps to a scroll limit it re-measures 250 ms after the page
    // height changes; scenes that size themselves after hydration (the
    // dining walk) would otherwise cut a jump short.
    lenis.resize();
    if (smooth) {
      const distance = Math.abs(top - window.scrollY);
      lenis.scrollTo(top, {
        duration: Math.min(1.2, 0.45 + distance / 2400),
        easing: easeInOutCubic,
      });
      kick();
    } else {
      lenis.scrollTo(top, { immediate: true, force: true });
    }
    return;
  }
  window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
}
