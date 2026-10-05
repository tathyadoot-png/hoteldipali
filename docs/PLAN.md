# Hotel Dipali Website — Project Plan

Last updated: 2026-10-05
Current step: 7 — Rooms + room detail

## Status legend

`[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Phases and steps

### Phase 0 — Foundation

- [x] 1. Scaffold, CLAUDE.md, PLAN.md, public data notes
- [x] 2. Design tokens, fonts, component classes, /styleguide
- [x] 3. Content schemas, loaders, sample data, check:content, docs/data-needed.md
- [x] 4a. Site shell (Header, MobileMenu, StickyCtaBar, Footer, Call/WhatsApp links,
      booking + analytics helpers, logo, favicon)
- [x] 4b. Content components (Picture + image pipeline, Botanical, SectionHeading,
      Breadcrumbs, Room/Venue/Outlet/Offer cards)
- [x] 5. EnquiryForm + /thank-you/

### Phase 1A — Core pages

- [x] 6. Home
- [ ] 7. Rooms + room detail
- [ ] 8. Weddings
- [ ] 9. Events & Celebrations
- [ ] 10. Dining hub
- [ ] 11. Pool & Gym, Gallery + Lightbox
- [ ] 12. About, Contact, FAQ
- [ ] 13. Wedding campaign LP, legal pages, 404
- [ ] 14. SEO layer (metadata, sitemap, robots, llms.txt, JSON-LD, OG)
- [ ] 15. Analytics + consent
- [ ] 16. Motion / "wow" polish pass
- [ ] 17. QA: accessibility, performance, mobile
- [ ] 18. Cloudflare Pages deployment + launch checklist

### Phase 1B — More pages

- [ ] Dining outlet pages; Corporate events; Venue detail pages
- [ ] Offers (auto-hide after end date)
- [ ] Explore Sagar + 4 local guides
- [ ] Blog + post template
- [ ] Campaign LPs (staycation, membership, dining, rooms)

### Phase 1C — Real data swap

- [ ] Replace all sample/public-unverified content with verified data
- [ ] Replace sample photos with original shoot photos
- [ ] check:content passes in production mode

### Phase 2 — Dynamic (later)

- [ ] Booking engine integration (deep links / widget decision)
- [ ] CMS or admin for blogs, offers, menus, gallery
- [ ] Own API for enquiries + lead sheet for reception
- [ ] Hosting move if server runtime needed
- [ ] Hindi version — declined (English only)

## Decisions log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-02 | Phase 1 is static; site goes dynamic in Phase 2. | Fast, cheap, reliable launch; hotel has no CMS/dev team yet. |
| 2026-10-02 | Hotel has a third-party booking engine; we link out, never build booking. | Avoid duplicating payments/availability systems we don't own. |
| 2026-10-02 | Website palette is the brand master palette; decided in Prompt 2. | Keep visual identity decisions in one dedicated step. |
| 2026-10-02 | No AggregateRating/Review schema on our own pages. | Cannot verify review authenticity; avoid search-engine penalties. |
| 2026-10-02 | No live Instagram feed; static curated strip instead. | Avoid third-party script weight and uptime dependency. |
| 2026-10-02 | docs/ (plural) is the canonical docs folder; existing doc/ was renamed to docs/. | Match CLAUDE.md and PLAN.md path conventions; keep brief.md and marketing-scope.md alongside the rest of the docs. |
| 2026-10-02 | TypeScript pinned to 6.0.x and ESLint to 9.x for typescript-eslint / eslint-plugin-react compatibility — revisit later. | typescript-eslint 8.71.0 only supports typescript `<6.1.0`, and eslint-config-next's eslint-plugin-react 7.37.5 crashes under ESLint 10's flat-config API. |
| 2026-10-02 | Palette "Ivory & Gold" (Palette A) is the final brand master palette, with a dark "Dusk" variant for weddings, Infinity Bar and dark bands. | Warm editorial identity matching the "Garden Journal by day, Dusk by night" direction; one palette re-themes the whole site. |
| 2026-10-02 | Language: English only. No Hindi version, no Hindi font, no Devanagari in the UI. | Simpler build and content pipeline; the only permitted Devanagari is schema.org `alternateName` "होटल दीपाली" (SEO only). |
| 2026-10-02 | Desktop nav (all 7 links + phone + Enquire) shows from the `xl` (1280px) breakpoint; `lg` (1024px) was tested and is too tight. | Avoids wrapping/cramming; `lg` and below get the MobileMenu instead. |
| 2026-10-02 | Header overlay uses the logo's typographic wordmark fallback (no `logo-reverse.png` yet), not the primary PNG. | The only supplied logo file is gold-on-transparent, sized for a light/ivory ground; the wordmark (token-coloured) reads correctly on both the dark overlay header and the Dusk footer. |
| 2026-10-02 | Component classes that hardcode a token colour (`.link`, `.eyebrow`, `.caption` → `ink`/`ink-muted`) need an explicit override wherever they render on a surface those tokens weren't validated against (e.g. `.band-brand`). | `color` inherits the ancestor's already-resolved value rather than re-reading custom properties per scope; discovered via axe-core catching ~1.7:1 contrast in the footer. Fixed with a scoped `.band-brand .link/.eyebrow/.caption` rule in theme.css. |

## Brand assets

- `public/brand/logo-primary.png` (renamed from "Hotel dipali logo.png"): 1080×1080 PNG,
  RGBA with a genuinely transparent background (corners and ~85% of sampled pixels have
  alpha 0). Artwork is a bright/mid-tone gold-bronze lockup (sampled centre pixel
  `#E4A936`) — an "HD" monogram with a small diamond above, and a serif "HOTEL DIPALI"
  wordmark below, stacked in a square canvas.
- Since the artwork is gold (not dark) on a transparent ground, it is usable as the
  `default` logo on the light/ivory surface. There is no `logo-reverse.png` yet, so the
  `reverse` variant (used on the dark overlay header and in the Dusk footer) falls back
  to the typographic wordmark, coloured via tokens, as designed.
- `src/app/icon.svg`: a flat bronze "D" monogram placeholder favicon — replace with a
  real logo mark when available.

## Open questions

See CLAUDE.md section M:

- Official single address and pincode (platforms conflict — see docs/public-data.md).
- Room count and categories.
- Booking engine name and URL format.
- Who publishes blogs and offers after launch.
- Which number is WhatsApp-enabled? (reservations number assumed for now).
- Is the food veg-only? (listed as vegetarian on OTAs — confirm before claiming).
- Original photos needed before step 6 (Home) — see docs/data-needed.md.
- Need `logo-reverse.png` (a light/gold mark legible on dark backgrounds) and a proper
  logo mark (square monogram) for the favicon — see "Brand assets" above.

### Pre-launch cleanup (step 18)

- Remove or block the dev-only inspection page `/dev/content/` before launch.
- Swap in `logo-reverse.png` and a real favicon mark once supplied (see "Brand assets").

## Change log

- 2026-10-02: Step 1 completed: project scaffolded.
- 2026-10-02: Step 2 completed: design system — "Ivory & Gold" tokens (Light + Dusk),
  self-hosted fonts (Instrument Serif + Figtree), component classes, contrast gate
  (`check:contrast` wired to `prebuild`), and the `/styleguide` page. All contrast pairs
  pass WCAG AA with no hex adjustments. Fixed the `preview` script (dropped `serve -s`,
  which collapsed multi-page routes to the home page).
- 2026-10-02: Step 3 completed: content layer — Zod schemas, typed async loaders
  (`@/content` barrel + `@content/*` alias), sample data for all collections (4 rooms,
  4 venues, 5 outlets, restaurant menu, pool/gym + 9 memberships, 15 FAQs, 3 reviews,
  18 gallery items), 52 generated placeholder SVGs, `check:content` (report + `--strict`),
  `content:report` → `docs/data-needed.md`, a `/dev/content/` inspector, and an ESLint
  rule enforcing `@/content`-only imports. Added zod. Status counts: 113 sample,
  13 public-unverified, 0 verified.
- 2026-10-02: Step 4a completed: site shell — Header (overlay/solid via a 1px
  IntersectionObserver sentinel, not a scroll listener), NavDesktop, MobileMenu (native
  `<dialog>`, native focus trap, `@starting-style` entrance animation), StickyCtaBar,
  Footer (4 columns, fully content-driven), Logo (+ `icon.svg` favicon), CallLink/
  WhatsAppLink, and `src/lib/{analytics,whatsapp,booking,routes}.ts`. Added a
  `SiteDataProvider`/`MobileMenuProvider` context pair so client shell components never
  call loaders directly. Added `@axe-core/playwright`; `tests/shell.spec.ts` covers
  breakpoints, the header transition, focus trap, link formats, the footer, and axe
  (zero serious/critical violations on `/` and `/styleguide/` at both widths). Fixed
  several real bugs along the way: `preview`'s old `serve -s` masking 404s, an inverted
  `rootMargin` sign, the header needing its own `text-ink` to re-resolve `color` inside
  `data-theme="dusk"`, and the brand-band contrast gaps described in the decisions log.
- 2026-10-02: Step 4b completed: content components — `Picture` (static-export <img>,
  optional aspect-crop via `object-cover`, width/height to prevent CLS), `Botanical`
  (decorative inline-SVG sprig/flower/vine, `currentColor`, `aria-hidden`), `SectionHeading`
  (eyebrow/title/description/action, semantic `h1`–`h3`), `Breadcrumbs` (semantic
  `nav` > `ol`, `aria-current="page"`, wraps at 360px), and `RoomCard`/`VenueCard`/
  `OutletCard`/`OfferCard` built from the existing schemas. Added entity route helpers
  (`roomHref`/`venueHref`/`outletHref`/`offerHref`) and `src/lib/format.ts`
  (`formatMoney`/`formatIsoDate`). Cards respect trust conventions: RoomCard shows a
  price only when `priceFrom.showOnSite`, and OutletCard omits diet policy/timings
  (unverified; CLAUDE.md §G). All components are showcased in `/styleguide/` Section 08
  (Light + Dusk); `tests/components.spec.ts` covers Picture, breadcrumb semantics/current
  state, card rendering + route-helper hrefs, and price-gating; axe-core on `/styleguide/`
  (both widths) now also covers the new components. No new dependencies.
- 2026-10-05: Step 5 completed: `src/lib/submit-enquiry.ts` (the one function all
  form submissions go through — posts to `NEXT_PUBLIC_FORM_ENDPOINT`, Web3Forms/
  Formspree-style JSON payload, no API route/server/DB), `src/lib/validation.ts`
  (Indian-mobile + email checks for visitor-typed input, distinct from the stricter
  stored-data `indianMobileSchema`), and the reusable `EnquiryForm` component (one
  component for rooms/wedding/event/dining/pool-gym/general — configurable via
  `enquiryTypes`/`defaultEnquiryType`, not duplicated per use case). Added new
  token-driven form classes to `theme.css` (`.label`, `.input`, `.select`,
  `.textarea`, `.field-error`, `.field-hint`, `.visually-hidden`); focus ring is
  the existing global `:focus-visible` rule, not redefined. Native HTML semantics
  throughout (labelled fields, `required`, correct input types) with `noValidate`
  for full control over error copy/placement; invalid fields get `aria-invalid` +
  `aria-describedby`, and focus moves to the first invalid field on a failed
  validation attempt. Honeypot (`company`, visually hidden, `tabIndex=-1`,
  `aria-hidden`) silently drops spam without a network call. When
  `NEXT_PUBLIC_FORM_ENDPOINT` is unset (today's default — `.env.example` stays
  empty, no credentials invented), the fieldset is disabled behind a calm notice
  and Call/WhatsApp (existing `CallLink`/`WhatsAppLink`) are the working path;
  on a real submission failure the error is shown inline, the form stays filled
  for retry, and Call/WhatsApp remain visible throughout. Added
  `src/app/thank-you/page.tsx` (noindex; confirms receipt without inventing a
  response-time promise, Call/WhatsApp alternatives, link back to `/`). Showcased
  as `/styleguide/` Section 09 (`idPrefix` prop added to `EnquiryForm` so the
  simultaneously-rendered Light/Dusk panes don't collide on element ids — same
  need `${variant}-*` ids already solved elsewhere in the styleguide). Added
  `tests/enquiry-form.spec.ts` (labels/options, required + phone + email
  validation with focus management, a genuine success/failure/retry round-trip
  against a real `fetch()` intercepted via `page.route()` on a reserved
  `*.test` domain — configured only in `playwright.config.ts`'s `webServer.env`,
  never in a committed env file — honeypot drops the request entirely, thank-you
  page content/links, and axe-core at 360/768/1024/1280 with zero serious/
  critical violations). Fixed one real bug found during testing: an unscoped
  `page.getByRole("alert")` collided with Next.js's own global route-announcer
  element, which also has `role="alert"`. All 88 e2e tests pass. No open
  questions changed; nothing marked verified.
- 2026-10-05: Step 6 completed: editorial home page — 7 sections (Hero, Intro,
  Rooms, Weddings & Celebrations, Dining, Pool & Gym, Enquiry) with deliberate
  Light→Dusk visual rhythm. Hero: full-viewport dusk section with gallery-property-1
  background, `hero-gradient` overlay using `color-mix()`, heading-hero H1,
  location from `site.address`, Enquire/Call CTAs, scroll-cue animation. Intro:
  asymmetric 2:3 grid, site tagline + shortDescription. Rooms: featured room
  (image + text side-by-side) + remaining RoomCards in responsive grid. Weddings:
  dusk full-width venue image, centred botanical vine, heading-1, Plan your wedding
  CTA. Dining: SectionHeading + featured restaurant (image + text) + editorial list
  of other outlets with 1:1 thumbnails. Pool & Gym: split grid with pool image and
  combined pool/gym summaries. Enquiry: dusk #enquire anchor, 2-col grid with
  Botanical/Call/WhatsApp left, EnquiryForm right. Added `ScrollReveal` client
  component (IntersectionObserver + `data-reveal`/`data-revealed`, respects
  `prefers-reduced-motion`). Added theme.css classes: `.hero-gradient`,
  `[data-reveal]`/`[data-revealed]`, `@keyframes scroll-cue`/`.scroll-cue`.
  Updated `routes.ts`: "/" added to `PAGES_WITH_OWN_ENQUIRE_ANCHOR`. Page metadata
  from content via `generateMetadata()`. Added `tests/home.spec.ts` (14 tests
  covering structure, sections, dusk theming, links, form presence, room cards,
  scroll-reveal, aria-labelledby, axe-core, console errors, meta). All 120 e2e
  tests pass. No open questions changed; nothing marked verified.
