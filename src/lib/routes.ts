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
const PAGES_WITH_OWN_ENQUIRE_ANCHOR: string[] = ["/"];

/**
 * Route shapes whose every page renders its own #enquire section. Room detail
 * pages do; the /rooms/ hub does not, so this must not match it.
 */
const ROUTES_WITH_OWN_ENQUIRE_ANCHOR: RegExp[] = [/^\/rooms\/[^/]+\/$/];

/** Anchor the "Enquire" CTA should link to from the current pathname. */
export function enquireHref(pathname: string): string {
  const hasOwnAnchor =
    PAGES_WITH_OWN_ENQUIRE_ANCHOR.includes(pathname) ||
    ROUTES_WITH_OWN_ENQUIRE_ANCHOR.some((pattern) => pattern.test(pathname));
  return hasOwnAnchor ? "#enquire" : "/contact/#enquire";
}

// Canonical URLs for content entities. Kept here so pages and cards never
// hand-build paths. Some targets (room/venue detail pages) are built in later
// steps; linking to them now is expected to 404 until then.
export const roomHref = (slug: string): string => `/rooms/${slug}/`;
export const venueHref = (slug: string): string => `/events/venues/${slug}/`;
// Outlets are sections on the dining hub (see Footer), not standalone pages yet.
export const outletHref = (slug: string): string => `/dining/#${slug}`;
export const offerHref = (slug: string): string => `/offers/${slug}/`;
