# Hotel Dipali Website — Project Plan

Last updated: 2026-10-13
Current step: 11 — Pool & Gym, Gallery + Lightbox

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
- [x] 7. Rooms + room detail
- [x] 8. Weddings
- [x] 9. Events & Celebrations
- [x] 10. Dining hub
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
| 2026-10-13 | Supersedes the 2026-10-02 wordmark-fallback row: the `reverse` logo variant uses `logo-primary.png` (gold reads on dark grounds), since commit `ef0580e`. | Keep the log accurate; the fallback is still in `Logo.tsx` for a variant without an asset. |
| 2026-10-13 | `pop` retuned from teal to a muted olive-sage (`#626c4b` light / `#9aa57e` dusk) — one contrast accent, not a third colour beside gold. | Creative-overhaul direction. The `#727D5B` reference fails AA with white text (4.38:1), so a slightly deeper value is used; the contrast gate now checks `pop` as *body text* on both surfaces, since sage is used for small labels. |
| 2026-10-13 | Scroll-driven scenes are built natively — sticky runways plus scroll-mapped CSS custom properties (`useScrollProgress`) — with no GSAP or other animation library. | CLAUDE.md §B (no new dependencies without asking); the native approach is a small hook, keeps native scrolling, and animates only transform/opacity/clip-path. |
| 2026-10-13 | Rich motion is gated (≥1024px, fine pointer, no reduced motion, no data-saver) by a pre-paint boot script that sets `html[data-motion="rich"]`; CSS lays scenes out from that attribute. | Switching layouts after hydration made the hero jump (CLS). Phones and reduced-motion visitors get complete static compositions and never download the film. |
| 2026-10-13 | The entrance film is content (`site.entranceVideo`) with trust fields, status `sample`. | It is prototype AI footage of unconfirmed architecture; registering it means `check:content:strict` (and so `pnpm release`) blocks launch until original footage replaces it. |
| 2026-10-13 | On `/` the overlay header ends when the ivory arch reaches it (`[data-header-solid-from]`), observed against a root extended far above the viewport. | Keeps the film immersive. A thin-strip version was tried first and failed: one-frame jump scrolls (anchors, End, flings) leapt over the strip and left the header transparent. |

## Brand assets

- `public/brand/logo-primary.png` (renamed from "Hotel dipali logo.png"): 1080×1080 PNG,
  RGBA with a genuinely transparent background (corners and ~85% of sampled pixels have
  alpha 0). Artwork is a bright/mid-tone gold-bronze lockup (sampled centre pixel
  `#E4A936`) — an "HD" monogram with a small diamond above, and a serif "HOTEL DIPALI"
  wordmark below, stacked in a square canvas.
- Since the artwork is gold (not dark) on a transparent ground, it is usable as the
  `default` logo on the light/ivory surface and — since `ef0580e` — as the `reverse`
  variant on the dark overlay header and the brand-band footer too. The typographic
  wordmark remains only as the fallback for a variant without an asset.
- The PNG is 506 KB and is loaded on every page (header, plus the home keystone marks,
  which reuse the cached file). A resized derivative (e.g. a ~320px WebP) would help
  the Lighthouse budget — see Open questions.
- `public/video/entry.mp4` (prototype) and the frames `entry-poster.webp` (first frame,
  desktop) / `entry-still.webp` (mobile & reduced motion), regenerated with
  `pnpm make:video-frames`.
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
- Optimise the 506 KB logo PNG into a small derivative for the header (not done in the
  creative overhaul to avoid touching brand assets without sign-off).
- Scroll-scrubbing was measured in Chromium only (~22–25 presented fps with real wheel
  input). Test Safari (macOS + iOS iPad at ≥1024px) and Firefox on real devices once the
  final footage is encoded; Firefox/WebKit engines are not installed locally.

### Shoot brief for the home experience

The layouts are built so originals drop in by replacing files — no redesign needed.

- **Entrance film** (replaces `public/video/entry.mp4`): one continuous, stabilised move —
  closed gate → gates open → drive up to the entrance → into the lobby; 15–25 s;
  ≥1920×1080 (ideally 2560×1440), 24–30 fps, H.264 with a keyframe at least every
  0.5 s (or all-intra) so scroll-scrubbing stays smooth; no audio needed. First frame
  becomes the desktop poster, so start on a composed, still gate. Keep the top band
  calm (sky/ceiling) for the transparent header and the left third quieter for the
  title. Ending in the lobby's light, warm tones lets the ivory arch take over
  seamlessly. Then run `pnpm make:video-frames` and mark `site.entranceVideo` verified.
- **Stills**: every shot listed in `docs/data-needed.md` (rooms, venues, outlets, pool,
  gym, gallery). Most impactful for the home page: the Main Lawn wide at dusk (the
  Celebrate window opens to full-bleed), each room's wide shot (the room stage), the
  restaurant, bakery and sweets counters, Poolside at dusk and Infinity Bar at night
  (the dining walk runs day → evening), and the pool wide in portrait (the sage band).

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
- 2026-10-05: Step 6 visual-polish pass finalised (no step change — Step 6 was
  already complete). Re-art-directed the home page: hero recomposed as a
  lower-left editorial cover with a top+bottom scrim (the top band is what keeps
  the overlay header's ink legible over a light image), asymmetric intro, a
  dominant featured room whose copy panel crosses the image edge, a
  campaign-style dusk weddings block with a layered image pair, a dining
  composition with one dominant outlet plus the brand family at alternating
  proportions, and a portrait-crop Pool & Gym with an inset. Added one reusable
  editorial texture (`.paper-grain`, a near-invisible archival grain) plus
  `.hero-tint`, `.section-index`, `.frame-hairline` and `.img-hover` — all
  token-driven, no raw hex. Rewrote `scripts/make-placeholders.ts` to emit calm
  tonal panels per category instead of grey boxes with
  "SAMPLE — replace with original photo" burned into the artwork, which was
  rendering as visitor-facing copy in the hero and every image slot; the shot
  description stays in the SVG `aria-label`, content JSON, `/dev/content/` and
  `docs/data-needed.md`, so nothing claims the placeholders are real photos and
  no trust status changed. Fixed two real bugs found while verifying in-browser:
  (1) `.container-site` lacked `width: 100%`, so `margin-inline: auto` collapsed
  it to fit-content inside any flex parent — this was centring the hero content
  and causing the header wordmark to overlap the nav at 1280px; (2) the featured
  room's image and copy panel never overlapped because grid auto-placement
  avoided the explicitly-placed panel and dropped the image to row 2. Verified at
  360/390/768/1024/1280 with no horizontal overflow, no broken images and no
  console errors. All 120 e2e tests pass.
- 2026-10-06: Step 7 completed: Rooms hub + room detail template. `/rooms/`
  opens with breadcrumb/eyebrow/H1/lead, gives the first room a dominant
  featured block, then lists the remaining rooms as a **comparison rail** —
  hairline rows with the thumbnail, name, summary and size/sleeps/bed aligned
  into columns. The rail is the page's one bold device and is data-led: rooms
  differ along shared axes (280→560 sq ft, sleeps 3→5), so aligned columns carry
  real information and match the job a guest is doing. At mobile the columns
  collapse into labelled inline pairs rather than a squeezed table. Deliberately
  no numbered section markers here — rooms are a set, not a sequence.
  `src/app/rooms/[slug]/page.tsx` is ONE template for all four routes, emitted
  via `generateStaticParams()` from `getRoomSlugs()` (first dynamic route in the
  project; `● (SSG)` in the build output, no runtime dependency). Its hero offsets
  a hairline fact list against a large framed image; DOM order is the mobile
  order (title → image → facts → CTA) so the room is seen before it is specified.
  Then description + highlights, amenities as plain semantic lists from
  `roomAmenities`/`bathroomAmenities` (no icon wall, nothing invented — the
  schema already carries them), an `#enquire` section using the existing
  `EnquiryForm` locked to `enquiryTypes={["rooms"]}` with a per-room `idPrefix`,
  and "Continue your stay" related rooms via `RoomCard` (a different device from
  the hub's rail, and the current room is excluded). `WhatsAppLink` uses the
  existing `context="room"` with `roomName`. Extended `enquireHref()` with a
  route pattern so the sticky CTA targets the on-page `#enquire` on room detail
  pages but not on the hub, which has no form. No booking, availability or
  payment anywhere. Trust preserved: all four rooms stay `sample`, price stays
  hidden behind the existing `priceFrom.showOnSite` gate (a test asserts no price
  renders while that flag is false), and no placeholder developer text reaches
  the page. Added `tests/rooms.spec.ts` (96 checks across both viewports: hub
  structure/links/featured dominance/rail facts, and per-room title, facts,
  amenities, enquiry CTA → form, breadcrumbs, related-room exclusion, absence of
  booking UI and of price, overflow, and axe-core). All 216 e2e tests pass.
  Verified at 360/390/768/1024/1280: no horizontal overflow, no broken images,
  no console errors. No open questions resolved; nothing marked verified.
- 2026-10-06: Step 8 completed: `/weddings/` — Weddings & Celebrations. Dusk
  cinematic hero (Main Lawn image, scrim, bottom-left headline with gold italic
  "celebrations", data-derived metadata line), then an Ivory intro, a Dusk
  featured venue (Main Lawn, the flagship by capacity/area), an Ivory alternating
  showcase for the other three (image side alternates for rhythm, not a grid), an
  Ivory comparison of all four on type/seated/floating/size, an occasions section,
  and a Dusk enquiry close. The page's signature device — distinct from Rooms'
  comparison rail — is the `VenueFrame`: a dominant venue image with a smaller
  `frame-hairline` inset crossing its lower edge, carried through the whole
  showcase (inset is `hidden lg:block`, so mobile shows a single clean image).
  The occasions section is fully derived from venue `suitableFor`: each gathering
  type names the spaces that suit it (e.g. Weddings → Main Lawn · Grand Banquet
  Hall), so it doubles as a finder — no invented occasion list. Comparison and
  the per-venue scale readout collapse to labelled rows on mobile, never a
  squeezed table. Enquiry reuses the existing `EnquiryForm` with
  `enquiryTypes={["wedding", "event"]}` (the page covers weddings AND
  birthdays/ring ceremonies/corporate, so both types are offered) defaulting to
  wedding; `WhatsAppLink` uses the existing `context="wedding"`. Per-venue CTAs
  point at the on-page `#enquire` rather than the not-yet-built
  `/events/venues/<slug>/` detail routes, so the conversion page ships no 404
  links; added `/weddings/` to `PAGES_WITH_OWN_ENQUIRE_ANCHOR` so the sticky
  "Plan wedding" CTA targets the on-page form. Trust preserved: all four venues
  stay `sample`, capacities/sizes shown only in context (not as hero
  superlatives) and labelled "indicative", no price/booking/availability anywhere,
  nothing marked verified, no placeholder developer text visitor-facing. Added
  `tests/weddings.spec.ts` (24 checks per run: title/H1, hero CTA, every venue
  present, comparison counts + capacities, per-venue enquire links, enquiry type
  wiring, occasion derivation, absence of price/booking/SAMPLE text, overflow,
  axe-core). All 240 e2e tests pass. Verified at 360/390/768/1024/1280: no
  horizontal overflow, no broken images, no console errors. No open questions
  resolved; nothing marked verified. Venue detail pages remain a later step, so
  `venueHref()` is still unused on this page by design.
- 2026-10-06: Step 9 completed: `/events/` — Events & Celebrations, built to be
  a different experience from Weddings rather than a re-skin. Weddings is the
  story-forward page (dark full-bleed cinematic hero, VenueFrame showcase);
  Events is the utility-forward page. It opens with a deliberately lighter
  **split hero** (text beside a plain venue image, no dusk, no framed inset —
  H1 "Room for every occasion"), then its signature device: an interactive
  **event-type finder** (`src/components/events/EventFinder.tsx`, a client
  component). The finder is a group of `.chip` toggle buttons (aria-pressed,
  44px targets, keyboard-operable, a polite live-region status) — "All spaces"
  default plus one chip per event type actually present in venue `suitableFor`,
  ordered event-first (the Weddings page leads with wedding occasions; this one
  does not). Selecting a type filters to the venues that list it (e.g.
  Conferences → Grand Banquet Hall only), each shown with image, type,
  indicative capacity line and an on-page enquire link. All matches are computed
  from `suitableFor`, so nothing is invented — the filter only hides/shows real
  content. A restrained Light cross-link band ("Planning a wedding?" → Explore
  Weddings) keeps wedding storytelling on its own page, and a Dusk enquiry close
  ("Let's plan the occasion") reuses `EnquiryForm` with
  `enquiryTypes={["event", "wedding"]}` defaulting to event. Added `/events/` to
  `PAGES_WITH_OWN_ENQUIRE_ANCHOR` so the sticky CTA targets the on-page form.
  Trust preserved: venues stay `sample`, capacities labelled indicative, no
  price/booking/availability, no placeholder developer text visitor-facing,
  nothing marked verified. The event-type label map is defined locally on this
  page (display strings, not a content abstraction) rather than refactoring the
  committed Weddings page. Added `tests/events.spec.ts` (26 checks per run:
  title/H1, light hero, finder chip set derived from data, default All, correct
  filtered matches, keyboard operation + pressed state, per-venue enquire links,
  cross-link, enquiry type/default, absence of price/booking/SAMPLE text,
  overflow, axe-core). All 266 e2e tests pass. Verified at 360/390/768/1024/1280:
  no horizontal overflow, no broken images, no console errors. No open questions
  resolved; nothing marked verified. `/weddings/` left untouched.
- 2026-10-12: Step 10 completed: `/dining/` — the Dipali table, built as a warm
  sensory dining family rather than a directory of outlet cards. A Light hero
  ("The Dipali table") opens into the signature device — a "menu of places"
  index: a menu-style contents list of all five outlets (name + cuisine), each
  row an anchor to that outlet's section below. Then a day-to-evening themed
  journey in which the page literally darkens: Dipali Restaurant (Light, the
  primary experience, with a content-driven menu preview), the Dipali counters
  (Bakery + Sweets, surface-alt pair), Poolside Restaurant (Light, by the
  water), and the Infinity Bar (Dusk "after dark" moment), closing on a Dusk
  dining enquiry. Each outlet is an anchor section with `id={slug}` and
  `scroll-mt-24` (verified: an index/footer `/dining/#slug` jump lands the
  heading at 96px, clear of the 88px sticky header), so the existing footer and
  Home links resolve on-page. The restaurant menu preview is content-driven:
  the six section names from `content/menus/restaurant.json` as an "on the menu"
  index plus the four `signature` items with descriptions — and NO prices, since
  every sample price carries `showOnSite:false`. Deliberately omitted all
  unverified operational facts: no opening hours (sample), no diet/"pure veg"
  claim (public-unverified; CLAUDE.md §G), no order channels, no age-policy
  claim on the bar, no invented drinks/brands/menu items, no reservation or
  ordering UI. Outlets stay at their existing `sample`/`public-unverified`
  statuses; nothing marked verified. Reuses `EnquiryForm` locked to
  `enquiryTypes={["dining"]}` and `WhatsAppLink context="dining"`. Added
  `/dining/` to `PAGES_WITH_OWN_ENQUIRE_ANCHOR`. The index/counters show cuisine
  only (dropping a redundant kind label that read "Bakery · Bakery · Desserts").
  Added `tests/dining.spec.ts` (26 checks per run: title/H1, every outlet +
  index anchors, scroll-margin, dusk bar, restaurant menu preview from content,
  dining-only enquiry, absence of price/booking/ordering/reservation UI, no
  menu-price leak, no unverified timings/diet text, no 404 detail routes,
  overflow, axe-core). All 292 e2e tests pass. Verified at 360/390/768/1024/1280:
  no horizontal overflow, no broken images, no console errors. Individual dining
  outlet pages remain a later step, so `outletHref()` targets the on-page
  anchors by design. No open questions resolved; nothing marked verified.
- 2026-10-13: Home creative overhaul (not a numbered step; current step stays 11; it
  is a down payment on step 16 for the home page only). The home page is rebuilt as
  one narrative — Arrive → Welcome → Stay → Celebrate → Unwind → Dine → Close:
  - **Entrance** (`EntranceHero`): the prototype film at `public/video/entry.mp4`
    (20 s, 854×480, gates → drive → porte-cochère → lobby — note the real path is
    `public/video/`, not `public/videos/`) is pinned in a 380vh runway and scrubbed
    by scroll, forward and in reverse. Loaded whole into a Blob after `load`, so
    seeks are served from memory; seeks are coalesced and progress eased. The title
    lifts away as the gates part, the tagline arrives word by word down the avenue,
    and clears for the lobby. Poster = the film's first frame (no flash at
    hand-over); phones and reduced motion get a 41 KB still and no film at all.
  - **Threshold**: an ivory arch (`.threshold`) rises over the lobby's last frame —
    the lobby's cream/gold flows straight into the ivory surface — with the gold
    logo as a keystone and an oversized index (Stay / Celebrate / Unwind / Dine)
    whose words turn olive-sage italic on hover/focus while a journal-style photo
    settles in.
  - **Stay** (`RoomDiscovery`): rooms as an index; a stage follows hover or keyboard
    focus with a clip-path wipe; phones get each image inline.
  - **Celebrate**: a dusk scene whose venue window opens to full-bleed as it rises
    (`ScrollSection` + `.celebrate-window`) beneath a giant gold "Celebrate".
  - **Unwind**: the single full olive-sage band (`.band-pop`, with ink/focus-ring
    overrides).
  - **Dine** (`DayJourney`): a pinned horizontal walk, 1:1 with scroll, from the
    daytime table to the Infinity Bar at dusk; stacks vertically elsewhere; keyboard
    focus on an off-screen panel scrolls the page to it.
  - **Close**: a dusk arch bookends the ivory one; "Every visit begins with a
    conversation" with the full enquiry form.
  Supporting changes: `pop` → olive-sage (decision log), contrast gate checks `pop`
  as body text; `src/lib/motion.ts` + root-layout boot script (`html[data-motion]`,
  `suppressHydrationWarning` on `<html>`); `useScrollProgress` / `useRichMotion` /
  `ScrollSection`; `Picture` gains `fill`; Header honours `[data-header-solid-from]`;
  `site.entranceVideo` schema + content (status `sample`); `scripts/
  extract-video-frames.ts` (`pnpm make:video-frames` — Playwright decodes the film,
  as there is no ffmpeg here); removed the now-unused `.section-index` and
  `.scroll-cue` classes. Bugs found and fixed while verifying in the browser: the
  hero eyebrow was illegible over the bright pillars (left scrim added); Chrome
  never lazy-loads an image clipped to zero area, so first hovers flashed empty
  frames (peek → opacity/scale; room stage keeps a hidden sliver); the header stayed
  transparent after one-frame jump scrolls (extended IO root); between 1024–1279px
  the sticky CTA bar covered pinned content (extra bottom padding); and a focused
  off-screen link scrolled the journey frame sideways under load because
  `overflow: hidden` is still a scroll container (now `overflow: clip`). Verified in
  Chrome at 360/390/768/1024/1280/1536, reduced motion, film failure (request
  blocked) and reverse scrubbing; production build clean on every route. Tests:
  `tests/entrance.spec.ts` (new — rich scrub forward/back, threshold hand-over,
  failure fallback, room discovery hover + focus, 1:1 pin + keyboard focus, phone
  still with zero film requests, reduced-motion static + axe); home spec's `.card`
  check replaced by "every room is listed and linked" plus a pillar-index check;
  shell spec's "solid after 200px" replaced by the new contract incl. the
  jump-scroll regression. All 316 e2e tests pass. Nothing marked verified.
