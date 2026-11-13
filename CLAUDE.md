# CLAUDE.md — Hotel Dipali Website

Permanent rules for every session. Read this and `docs/PLAN.md` before any task.

## A. Project

Hotel Dipali is a hotel in Sagar, Madhya Pradesh, India, with rooms, wedding lawns and
banquet halls, a restaurant, Infinity Bar, Dipali Bakery, Dipali Sweets, a swimming pool
and a gym. There is no existing website. Phase 1 is a fully static, production-quality
site whose job is to turn visitors into calls, WhatsApp messages and enquiry-form
submissions. Later phases make it dynamic (CMS, admin panel, booking-engine integration).

Business goals, in priority order:

1. Wedding and event enquiries.
2. Room enquiries / bookings.
3. Dining, bakery and sweets footfall.
4. Gym and pool memberships.
5. Local SEO for Sagar.
6. A premium, editorial, memorable UI that is never slow or confusing.

## B. Stack (fixed — ask before adding ANY dependency)

Next.js App Router, static export (`output: 'export'`), TypeScript strict, Tailwind v4
(`@theme` in CSS), pnpm (pnpm only — never npm or yarn; `preinstall` runs
`only-allow pnpm`, and a `package-lock.json` is never committed), ESLint + Prettier,
Playwright. Hosting: Cloudflare Pages
(static). Forms post to a hosted form endpoint set by an env var. Images are
pre-optimised (AVIF/WebP, multiple widths, srcset, explicit width/height). Source media
lives OUTSIDE `public/`, in `media-source/` (never deployed; never renamed, moved or
edited by code, never referenced by pages): the hotel's camera originals in
`media-source/hotel/` and `media-source/images/hotel/` (night exteriors), the palette
textures in `media-source/palettes/`, the decorative flower downloads in
`media-source/decor/flowers/`, the source video in `media-source/video/`.
`pnpm make:photos` writes WebP width sets to `public/images/hotel/` (Playwright's
Chromium — no image library); the same script writes the trimmed logo emblem
(`public/images/brand/`, from `public/brand/logo-primary.png`) and the decoration,
graded to plum and gold (`public/images/decor/`, never wider than its source; patterns
as seamless tiles). `pnpm make:mask` writes the home hero's cut-out — the lit entrance
lifted out of the night photograph through a hand-traced mask
(`src/lib/hero-cutout.ts`, which also records the signage that must never be in frame).
Video works the same way: `pnpm make:video`
(Playwright's Chromium + WebCodecs — no ffmpeg) writes the cropped, looped, silent,
web-optimised H.264 clip pages use (`public/video/`). Only files pages request belong in
`public/`. `brand-source/` holds brand working files that are not deliverables (e.g. the
traced logo SVG — not a master vector).
Animation:
CSS + IntersectionObserver first. Smooth wheel scrolling: Lenis (approved 2026-10-19),
only through `src/lib/smooth-scroll.ts`.

Not allowed in Phase 1: server code, API routes, middleware, `next/image` optimisation,
CMS, database, auth, localStorage features.

## C. Future-dynamic readiness

- Pages/components NEVER import JSON/MDX directly. All data goes through typed async
  loaders in `src/content/` (`getSite()`, `getRooms()`, `getRoom(slug)`, …) so the
  source can later become a CMS or database without touching pages.
- Client components never call loaders; server components fetch (via the loaders) and
  pass the result down — either as plain props, or, for data many client leaves need
  (e.g. site/outlets in the shell), via a client context provider that the server
  layout instantiates with the already-fetched data. See
  `src/components/providers/SiteDataProvider.tsx`. The footer (`Footer`) is a server
  component the root layout feeds with props (site, outlets, booking URL); its client
  islands are `FooterStage` (motion) and the link components.
- All form submissions go through ONE function: `src/lib/submit-enquiry.ts`.
- Any code that only works because of static export gets a `// STATIC-ONLY:` comment
  saying what changes when dynamic.

## D. Booking engine

The hotel HAS a third-party booking engine (name/URL to be confirmed). We never build
booking. Every "Book Now" / "Check availability" goes through `src/lib/booking.ts` →
`getBookingUrl({ roomSlug?, checkIn?, checkOut?, guests? })`. If no booking URL is
configured it returns `null` and the UI falls back to a prefilled WhatsApp "Check
availability" link. "Book a Stay" (header, menu) is `BookStayLink`, which the root
layout feeds with `getBookingUrl()`'s result. Never embed a booking widget or
third-party script without asking.

## E. Theming (most important technical rule)

- ALL colours, fonts, font sizes, radii, shadows and spacing live ONLY in
  `src/styles/theme.css`. Changing that file must re-theme the whole site.
- Tokens use Tailwind `@theme` (NOT `@theme inline`) with semantic names: `surface`,
  `surface-alt`, `surface-foot` (a darker step: the footer's foot), `ink`, `ink-muted`,
  `brand`, `brand-ink`, `accent`, `accent-ink`, `highlight`, `gold-text`,
  `gold-text-tint`, `lavender` (decorative surfaces and halos), `danger` (form errors),
  `line`, and `logo-gold` (the logo's measured median — a reference value for the
  contrast gate, never a fill); fonts `font-display` (Cormorant Garamond), `font-body`
  (Manrope), their aliases `font-royal` / `font-ui`, and `font-script` (Great Vibes —
  at most one word per page). More may be added in `theme.css` only. `pop` was retired
  on 2026-10-21 — do not reintroduce it without asking.
- `src/app/fonts.ts` is the only file besides `theme.css` allowed to contain font
  names.
- Gold is one family in three shades — never a yellow gold: champagne (`accent` /
  `highlight` on `dark` and `deep`) for actions, small gold text, rules, veins and vines on
  plum; antique (`highlight` on light) for ornament only — rules, hairlines, frames,
  never text; deep (`gold-text`, and `gold-text-tint` on lavender) when gold must be
  read on a light ground. `accent` is plum on light and champagne on `dark` / `deep`;
  it is gated as small text. Form errors use `danger`, which must read as a different
  colour from headings and links (the gate checks the hue distance).
- "Gold foil" is a token-built sheen — one narrow moving highlight, played once — on
  ornaments, rules and display headings only (`.foil`, `.foil-rule`,
  `[data-reveal="foil"]`).
- Gradients may only be built from tokens (var/color-mix) for scrims, veils, depth and
  gold sheen on ornaments. Never multi-hue decorative gradients on text, buttons or
  large surfaces.
- Textures are our own, generated in CSS (`--texture-velvet` on `dark` / `deep`,
  `--texture-paper` on light; neutral SVG noise under 1 KB, tiled at
  `--texture-size`). Images in `media-source/palettes/` are references only and never
  ship.
- Components use only semantic utilities (`bg-surface`, `text-ink`, `bg-accent`,
  `font-display`…) and component classes defined in `theme.css` (`.heading-hero`,
  `.heading-1/2/3`, `.eyebrow` (with its short gold rule), `.body-lg`, `.body`,
  `.caption`, `.big-number`, `.heading-page` (inner-page heroes), the button family
  (`.btn-primary` = the booking action: a plum plaque with a gold hairline inset on
  light, a champagne plaque on plum grounds, the logo's diamond on hover; `.btn-secondary` =
  fine gold outline, every other action; `.btn-ghost`; modifiers `.btn-cta` (stepping
  arrow) and `.btn-compact` (dense bars)), `.link-cta`, `.link-royal`, `.btn-icon`,
  `.chip`, `.card`, `.link`, `.section`, `.container-site`, `.band-brand`,
  `.skip-link`, `.rule`, `.rule-ornament`, `.label`, `.input`, `.select`, `.textarea`,
  `.field-error`, `.field-hint`, `.visually-hidden`, `.hero-gradient`, `.hero-tint`,
  `.paper-grain`, `.frame-hairline`, `.frame-arch`, `.img-hover`, `.threshold`,
  `[data-reveal]` (`""` rise, `"mask"` headings, `"mask-line"` headings line by line
  with `.reveal-line`, `"image"` frames, `"clip-arch"` images opening inside an arch,
  `"foil"` one gleam of gold, `"wipe-*"` photographs opening from one edge, `"slide-*"`
  sideways text); the motion kit's `.arch-window`, `.tilt`, `.glow`, `.thread*`,
  `.foil`, `.foil-rule`, `.cursor*` (the cursor follower); the identity's `.wordmark*`
  (HOTEL over DIPALI), the diamond (`--diamond`, a mask), `.logo-medallion` (the logo
  on plum), `.footer-vine` / `.vine-*`, `.menu-petal*`; decoration `.decor`,
  `.decor-pattern`; `.pictures-*`; the home scenes `.home-hero*`,
  `.experience*` (The Dipali Experience), `.grand-reveal*` and `.portal-*` (The Grand
  Reveal), `.living*` and `.chapter*` (The Living Experiences and its chapter heads),
  the chapters' `.stay-*`, `.room-stage*`, `.room-marker`, `.celebrate-*`, `.dine-*`
  and `.unwind-*`, `.close-*` (the enquiry close), `.enquiry*` (the enquiry tablet —
  every enquiry form), `.lines*` (the contact lines) and `.contact-*` (the contact
  page); the layered-section classes `.layers`, `.layer-rise`, `.layer-content`,
  `.layer-veil`; the opening loader `.intro*`; the ornaments `.ring-*` and `.corner-*`;
  and the shell classes `.header-*`, `.menu-*`, `.sticky-bar*`, `.sticky-link`,
  `.site-footer` and `.footer-*`). Never raw hex, never raw Tailwind palette colours
  (`bg-amber-700`), never font names in components.
- The palette lives only in theme.css. Variants are role-based: light (default), dark,
  deep. Changing the brand palette = editing theme.css token values + regenerating
  graded assets; no code renames.
- Theme variants via `[data-theme="…"]` redefining the same tokens: `dark` (plum
  velvet: weddings, the bar, the enquiry close, dark bands) and `deep` (the night: the
  opening loader, the mobile menu, the phone bar, the footer, the home page's stone —
  the Grand Reveal, the Stay tablet, the Unwind plaque — the enquiry tablet, the
  contact page's front desk, and the home hero; the header takes the deep scope while
  it is transparent over the home hero, and is light everywhere else). Stone that
  carries text sits under a 75% veil of its surface. Every element that sets
  `data-theme="dark"` or `"deep"` MUST also carry an explicit `text-ink` (or other
  colour utility) on that same element — `color` inherits the ancestor's
  already-resolved value, it does not re-evaluate `var(--color-ink)` per scope, so
  without this the dark subtree silently renders in the parent's (light) ink colour.
- Every text/background pair passes WCAG AA (4.5:1 body, 3:1 large text and UI).
  Gold-like colours are never body text on light backgrounds. The client's logo
  (median #ECAE33) only ever sits on `brand`, `dark` or `deep` grounds — on light
  pages inside its plum medallion (`BrandLink`, `.logo-medallion`) — never on light or
  lavender.
- Palette "Plum & Gold" — concept "Midnight Bloom" (R1.1, 2026-11-04): a plum night,
  gold veins, flowers that bloom. Night is deep plum velvet, gold runs through it as fine
  veins and vines, day is ivory and lavender pages set in near-black plum. The recurring
  mark is the small diamond from the logo (the current page, the buttons' hover); the
  opening's veins and dahlia, the menu's petals, the footer's vine and the gold thread's
  flower carry the bloom. Buttons are nearly square; arches appear as the section
  thresholds and `.frame-arch` images. Fonts: Cormorant Garamond for display (the home
  hero's DIPALI spans the screen's width), Manrope for interface and body. See
  `theme.css` and `src/app/fonts.ts`.
- **No diya, lamp, flame or oil-lamp imagery anywhere** (owner, 2026-11-04 — not
  religious, simply not wanted): no such element, class, SVG, motif or wording in the
  UI, the styles or the docs' design language. A test greps the built HTML/CSS and the
  source (`tests/midnight-bloom.spec.ts`; photographs' alt text describing furniture
  lamps is content, not a motif).
- **The wordmark** (`Wordmark`, `.wordmark`): HOTEL small and tracked above DIPALI in
  Cormorant capitals, every length a fraction of `--wm`, so one uniform scale maps any
  copy onto any other. The header shows it as its logotype — type, never the gold logo on
  a light ground (plum on ivory, engraved gold over the night). On the home page under
  rich motion the hero's giant name travels into the header's centre slot over the first
  viewport of scroll (`HeroMorph`: `--h` per frame, the travel's end measured on
  resize) and hands over to the logotype at the same size and place; phones, reduced
  motion and no-JS show the logotype from the start.
- **Decoration** (`content/decor.json`, `DecorFlower`, `.decor*`): flowers and patterns
  that are never the subject — `alt=""`, aria-hidden, no pointer events; at most one
  flower per section, alternating left / right between sections; never behind text (a
  pattern that carries text sits under an 80% veil of its surface, checked on the tile's
  own pixels); a white studio ground multiplies into ivory; a drift of at most 40 px over
  its section under rich motion only. The owner-supplied downloads are `sample` (source =
  the original file, note "downloaded image — usage rights unconfirmed") until their
  rights are confirmed, so `pnpm release` stays blocked. Never the teal mandala, nor the
  duplicate downloads.
- **The cursor follower** (`CursorFollower`, `.cursor*`): only for `(hover: hover) and
  (pointer: fine)` without reduced motion; a 28 px gold ring easing after the pointer
  (lerp ≈ 0.18) and a 6 px plum dot exactly on it; over links/buttons the ring grows to
  56 px with a faint gold tint, over `data-cursor="view"` it reads "View", over
  `data-cursor="drag"` "Drag", over text fields it steps aside, a press tightens it; it
  hides when the pointer leaves the window. Never `cursor: none`; transform only, one
  rAF loop that runs only while it eases; aria-hidden, pointer-events none, below
  dialogs; it changes no hit area and takes no focus.
- `docs/reference/palette-plum.png` is a COLOUR reference only (an AI image of a
  different hotel): never copy its layout, logo, lotus mark, copy or numbers, and never
  put the image in `public/`.

## F. Content & data trust

- All content lives in `/content` (JSON), validated by Zod schemas in
  `src/content/schemas/`.
- Every item has `status: "sample" | "public-unverified" | "verified"`;
  public-unverified items also have a `source`. sample = invented placeholder;
  public-unverified = from `docs/public-data.md`; verified = confirmed by the hotel.
- Trust lives at two levels: collection items carry the trust fields directly
  (`status`, `source?`, `note?`); individual facts inside `site.json` (phones,
  address, timings…) are wrapped as `Tracked<T>` = `{ status, source?, note?, value }`
  so each fact can have its own status. A `public-unverified` status always requires
  a `source` (enforced by Zod).
- Every image entry records status, intended shot description, aspect ratio and
  credit, so originals can replace files later. Photo entries also carry `widths`
  (the WebP set), optional `focus` (object-position) and optional `small` (a phone
  crop). The owner-supplied photographs are `public-unverified` with their original
  file as `source`, plus a `note` wherever the room/venue/outlet shown was inferred.
  Never present placeholder or AI imagery as the hotel; pick features with
  `featureImage()` / `isPhoto()` (`src/lib/images.ts`) so prominent slots prefer real
  photographs.
- Import rule: pages and components import content ONLY from the `@/content` barrel
  (typed async loaders) — never raw JSON (`@content/*`) or loader/schema internals
  (`@/content/*`). ESLint enforces this everywhere except `src/content/`, `scripts/`
  and `tests/`.
- `pnpm check:content` prints a trust report (exit 0). `pnpm check:content:strict`
  fails if anything is not `verified`. `pnpm release` = `check:content:strict && build`
  — production deploys run this. Plain `pnpm build` does NOT run the strict gate.
  `pnpm content:report` regenerates `docs/data-needed.md`; `pnpm make:placeholders`
  regenerates the labelled sample SVGs in `public/sample/`.
- Never invent awards, star ratings or quotes attributed to real people. Never copy
  review text from Google/Tripadvisor/OTAs. Placeholder phone for sample data:
  `+91 00000 00000` (allowed only when the fact's status is `sample`).
- What the shell shows from content (footer, contact page, contact lines): a contact
  whose phone is `sample` is never offered as a number to call (`reachableContacts`,
  `src/lib/contacts.ts`); social links render only when `verified`; a content-driven
  link renders only when its page exists (`isBuiltRoute` / `BUILT_PAGES` in
  `src/lib/routes.ts` — add each route there as its page is built).

## G. Brand & scope

Canonical name "Hotel Dipali". "Hotel Deepali" appears only in the footer line "Also
searched as Hotel Deepali" and in schema `alternateName`. Brand family: Hotel Dipali
(master) → Dipali Bakery, Dipali Sweets, Infinity Bar (others to be confirmed). Do NOT
mention Dipali Residency, Dipali Regency, Deepali Palace or Dipali Plaza until
confirmed. Do not claim "pure vegetarian" until verified.

## H. Out of scope in Phase 1

Building booking, payments, login, guest dashboard, admin panel; live Instagram feed or
any third-party social widget (use a static curated photo strip linking to Instagram).

## I. SEO

Title pattern "{Page} | Hotel Dipali, Sagar"; unique descriptions; canonical URLs;
trailing slashes. Never output `AggregateRating` or `Review` schema on our own pages.
Omit schema fields that are not verified. The site is English-only; the sole permitted
Devanagari is the schema.org `alternateName` "होटल दीपाली" (plain text, SEO only, added
in the SEO step — never rendered in the UI). Planned for the SEO step: `sitemap.xml`,
`robots.txt` explicitly allowing GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
Google-Extended; `llms.txt`; remove the temporary `noindex` in `layout.tsx`.

## J. Analytics (planned, not now)

GA4, Meta Pixel, Google Ads conversions on `call_click`, `whatsapp_click`,
`enquiry_submit`, `booking_click`, plus `directions_click`, `menu_view`,
`gallery_open`; loaded only after consent; IDs from env vars.
All analytics events go through ONE function: `track()` in `src/lib/analytics.ts`.
Never call `window.dataLayer.push` or a vendor SDK directly from a component.

## K. Quality bars

WCAG 2.2 AA, semantic landmarks, one H1 per page, skip link, visible focus, labelled
inputs, 44×44 px touch targets. Mobile Lighthouse ≥ 90, LCP < 2.5 s (the home page
≤ 2.0 s on a throttled phone), CLS < 0.1, mobile hero image ≤ 150 KB, no autoplay video
on mobile (the home hero shows no video for now; the clip and its content entry stay,
status `sample`). Breakpoints 360, 768, 1024, 1280, 1536.

Motion (the motion kit: `src/lib/motion/` + `src/components/motion/`): native CSS,
IntersectionObserver, Lenis and scroll-mapped CSS custom properties. Transform /
opacity / clip-path, and filter on small elements only; every animation ≤ 600 ms
(scroll-mapped scenes are exempt); no scroll-jacking and no pin longer than one
viewport; everything still under `prefers-reduced-motion`, and the opening skipped on
data saver / 2G–3G; phones get a simplified version of every scene; no layout shift.
Primitives: `ScrollReveal` variants, `ArchWindow`, `GoldThread` / `ThreadStop`,
`Tilt3D` (fine pointer, ≤ 6°), `.glow`, `CursorFollower`, `HeroMorph`.
- GSAP (+ScrollTrigger) only if it replaces hand-rolled code or an effect provably
  needs it — say which and its size; not used today.
- No WebGL in use. The home hero's WebGL depth effect (R1) was removed in R1.1: the
  cut-out standing in front of the name, and the two planes moving apart with scroll,
  give the depth it faked. Any future WebGL needs the same conditions as before (raw
  WebGL or OGL, ≤ 25 KB gzip, lazy after `load`, desktop rich motion only, no idle
  loop, a plain fallback). No Three.js.
Scrolling: wheel input on mouse/trackpad devices is smoothed by Lenis — never slowed
(wheelMultiplier 1) and never locked except under a modal; touch, keyboard, reduced
motion and Lenis-failure all stay native.
Exception (owner's brief): the home page's opening — `IntroLoader` ("Midnight Bloom":
gold veins from the corners, a drawn dahlia blooming, the logo at its heart, the name's
letters rising, the name flying into the hero) plus the hero/header entrance — may run
its sequence for ≤ 2.2 s, once per browser session (sessionStorage, every access
guarded) and on full page loads only, never looping. It never blocks input
(pointer-events none; any input skips to the end), never replays on client-side
navigation (`src/lib/app-boot.ts`), is hidden under reduced motion, fades on its own
without JS, adds no download (the flower is SVG), never delays the hero's cut-out (it is
preloaded) and is skipped on data saver / 2G–3G and when already seen
(`html[data-intro="off"]`, set by the boot script in `src/lib/motion/index.ts`).
The header hides while the page scrolls down past 1.5 viewports and returns on any
scroll up (transform only) — never while it holds focus or the menu is open.
The footer grows its gold vine once when it arrives (`FooterStage` →
`data-revealed`): a small flower opens at the centre, then each stem segment draws in
< 400 ms, staggered over ~1.3 s; complete at once under reduced motion, as soon as
keyboard focus enters it (`data-revealed="instant"`), and without JS. The
enquiry form's sending line eases over 1.6 s while a submission is in flight —
progress feedback, not decoration, never looping. The enquiry tablet (`.enquiry`) uses
`content-visibility: auto` below 1024px only, with a block-size placeholder only (an
inline size would widen the page) — from 1024px the serif is already loaded and laying
the tablet out as it arrived cost a 50 ms frame mid-scroll; the footer is `overflow: clip`, so nothing in it can lengthen or widen
the page.

Scroll-driven scenes (no animation library): `useScrollProgress` writes a unitless
`--p` (0–1) — on a whole section via `ScrollSection`, on a scene inside one via
`ScrollScene` — and CSS does the animating; with Lenis running it updates from Lenis's
synchronous `scroll` event (same frame, one loop). Code that scrolls the page uses
`scrollToY()` from `src/lib/smooth-scroll.ts`, never `window.scrollTo`, and modals call
`pauseSmoothScroll()` and carry `data-lenis-prevent`. Scenes only activate under
`html[data-motion="rich"]`, set before first paint from `src/lib/motion/index.ts` (≥1024px,
fine pointer, no reduced motion, no data-saver); every scene must have a complete
static layout without it. Pin with `position: sticky` inside a tall runway — scenes
themselves never listen to wheel/touch events — and use `overflow: clip` (not
`hidden`) on pinned frames, which a focused element could otherwise scroll sideways.
Layered sections (`LayeredSection`): a section rising over the previous one writes
`--cover` (0–1) on it and CSS makes it recede (transform/opacity only); the home hero
holds (sticky) only inside `.layers`, so the hold ends once it is covered. A focused
element under a rising section scrolls back into view (WCAG 2.4.11). Each custom
property write re-styles its element's whole subtree: write only variables CSS reads,
and give what moves every frame `will-change`.

## L. Workflow (every task, no exceptions)

1. Read `CLAUDE.md` and `docs/PLAN.md` first.
2. Do only what the prompt asks; if something is unclear or conflicts, stop and ask one
   short question.
3. Before finishing run lint, typecheck, build, test:e2e; all must pass.
4. UPDATE `docs/PLAN.md`: tick the step, set "Current step" to the next one, add a
   dated Change log line, add any new decisions or open questions.
5. Commit with a conventional message (`feat:`, `fix:`, `chore:`, `docs:`).
6. End the reply with: files changed, what to check in the browser, and real
   data/photos still needed.

## M. Open decisions (never guess)

Official single address and pincode; room count and categories; booking engine name and
URL format; who publishes blogs and offers after launch.
