/**
 * When to give a visitor the scroll-driven scenes: a wide viewport, a fine
 * pointer, no reduced-motion request (and, at runtime, no data-saver). Kept in
 * a plain module because the root layout (a Server Component) needs the boot
 * script string, which a "use client" module could not hand it.
 */
export const RICH_MOTION_QUERY =
  "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Inline script for the root layout, run before first paint:
 * - <html data-motion="rich"> so CSS lays the scroll scenes out from the very
 *   first frame — switching layouts after hydration would make the hero jump
 *   (CLS);
 * - <html data-intro="off"> on data saver or a slow connection (effective type
 *   2G/3G): the home page's opening loader is skipped there, so it never adds
 *   to a slow load (see IntroLoader).
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{var c=navigator.connection,d=document.documentElement;if(c&&(c.saveData||/2g|3g/.test(c.effectiveType||"")))d.setAttribute("data-intro","off");if(c&&c.saveData)return;if(window.matchMedia(${JSON.stringify(
  RICH_MOTION_QUERY,
)}).matches)d.setAttribute("data-motion","rich")}catch(e){}})();`;

export function prefersRichMotion(): boolean {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  if (connection?.saveData) return false;
  return window.matchMedia(RICH_MOTION_QUERY).matches;
}

export function syncRootMotionAttribute(): void {
  if (prefersRichMotion()) document.documentElement.setAttribute("data-motion", "rich");
  else document.documentElement.removeAttribute("data-motion");
}

/**
 * When to smooth wheel scrolling (Lenis, see smooth-scroll.ts): a device with a
 * hovering fine pointer — i.e. a mouse or trackpad that produces wheel events —
 * and no reduced-motion request. Width does not matter. Touch screens keep
 * native, momentum-driven touch scrolling regardless.
 */
export const SMOOTH_SCROLL_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
