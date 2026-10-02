/** Routes where the header starts transparent/overlaid on a hero image. */
export const overlayHeaderRoutes: string[] = ["/"];

/** Routes where the mobile StickyCtaBar is hidden entirely. */
export const stickyCtaHiddenRoutes: string[] = [
  "/thank-you/",
  "/styleguide/",
  "/dev/content/",
];

/** Per-route label for the StickyCtaBar's third (primary) button. */
const STICKY_CTA_LABELS: Record<string, string> = {
  "/weddings/": "Plan wedding",
  "/rooms/": "Check availability",
  "/pool-and-gym/": "Join now",
};

export function stickyCtaConfig(pathname: string): { label: string } {
  return { label: STICKY_CTA_LABELS[pathname] ?? "Enquire" };
}

/**
 * Routes whose own page will render an #enquire section (added as each page is
 * built in later steps). Everywhere else falls back to the contact page's form.
 */
const PAGES_WITH_OWN_ENQUIRE_ANCHOR: string[] = [];

/** Anchor the "Enquire" CTA should link to from the current pathname. */
export function enquireHref(pathname: string): string {
  return PAGES_WITH_OWN_ENQUIRE_ANCHOR.includes(pathname)
    ? "#enquire"
    : "/contact/#enquire";
}
