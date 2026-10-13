/**
 * When to give a visitor the scroll-driven scenes: a wide viewport, a fine
 * pointer, no reduced-motion request (and, at runtime, no data-saver). Kept in
 * a plain module because the root layout (a Server Component) needs the boot
 * script string, which a "use client" module could not hand it.
 */
export const RICH_MOTION_QUERY =
  "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Inline script for the root layout. It sets <html data-motion="rich"> before
 * first paint so CSS lays the scroll scenes out from the very first frame —
 * switching layouts after hydration would make the hero jump (CLS).
 */
export const RICH_MOTION_BOOT_SCRIPT = `(function(){try{var c=navigator.connection;if(c&&c.saveData)return;if(window.matchMedia(${JSON.stringify(
  RICH_MOTION_QUERY,
)}).matches)document.documentElement.setAttribute("data-motion","rich")}catch(e){}})();`;

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
