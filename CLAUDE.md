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
(`@theme` in CSS), pnpm, ESLint + Prettier, Playwright. Hosting: Cloudflare Pages
(static). Forms post to a hosted form endpoint set by an env var. Images are
pre-optimised (AVIF/WebP, multiple widths, srcset, explicit width/height): the hotel's
camera originals live in `public/hotel/` (never renamed, moved or edited by code, never
referenced by pages) and `pnpm make:photos` writes WebP width sets to
`public/images/hotel/` (Playwright's Chromium — no image library); the same script
writes the trimmed logo emblem (`public/images/brand/`, from `public/brand/`) and the
graded palette textures (`public/images/textures/`, from `public/palettes/`). Video
works the same way: source clips in `public/video/` are never served or edited, and
`pnpm make:video` (Playwright's Chromium + WebCodecs — no ffmpeg) writes the cropped,
looped, silent, web-optimised H.264 clip pages use.
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
  `src/components/providers/SiteDataProvider.tsx`.
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
  `surface-alt`, `ink`, `ink-muted`, `brand`, `brand-ink`, `accent`, `accent-ink`,
  `highlight`, `line`, `font-display`, `font-body`, plus `font-royal` (Cormorant
  Garamond), `font-ui` (Manrope) and `font-script` (Great Vibes — one accent word in
  the home hero only) for the opening experience (more may be added in `theme.css`
  only). `pop` was retired on 2026-10-21 — do not reintroduce it without asking.
- `src/app/fonts.ts` is the only file besides `theme.css` allowed to contain font
  names.
- `highlight` (antique gold) is decorative only on light surfaces — rules, hairlines,
  never text. `accent` is terracotta clay on light and antique gold on Peacock; it is
  gated as small text.
- Components use only semantic utilities (`bg-surface`, `text-ink`, `bg-accent`,
  `font-display`…) and component classes defined in `theme.css` (`.heading-hero`,
  `.heading-1/2/3`, `.eyebrow`, `.body-lg`, `.body`, `.caption`, `.big-number`,
  `.heading-page` (inner-page heroes), the button family (`.btn-primary` = the gold
  plaque, booking actions; `.btn-secondary` = fine gold outline, every other action;
  `.btn-ghost`; modifiers `.btn-cta` (stepping arrow) and `.btn-compact` (dense bars);
  colours from the scope: gold = `highlight`, label = `brand`), `.link-cta`,
  `.link-royal` (Emerald text link on a gold rule), `.btn-icon`, `.chip`,
  `.card`,
  `.link`,
  `.section`, `.container-site`, `.band-brand`, `.skip-link`, `.rule`,
  `.rule-ornament`, `.label`, `.input`, `.select`, `.textarea`, `.field-error`,
  `.field-hint`, `.visually-hidden`, `.hero-gradient`, `.hero-tint`, `.paper-grain`,
  `.frame-hairline`, `.frame-arch`, `.img-hover`, `.logo-medallion`, `.threshold`,
  `[data-reveal]` (`""` rise, `"mask"` headings, `"image"` frames, `"wipe-*"`
  photographs opening from one edge, `"slide-*"` sideways text), `.pictures-*`, plus
  the home-experience scene classes `.entrance*` (incl. `.entrance-video*`),
  `.experience*` (The Dipali Experience), `.world*` (A World Within Dipali),
  `.grand-reveal*` (The Grand Reveal), `.living*` (The Living Experiences), the
  layered-section classes `.layers`, `.layer-rise`, `.layer-content`, `.layer-veil`,
  `.room-stage*`,
  `.celebrate-*`, `.journey*`, the opening-loader and ornament classes `.intro*`,
  `.arch-*`, `.ring-*`, `.sprig-line`, `.ribbon-*`, `.stop-*`, `.corner-*`, and the shell classes
  `.header-*` (incl. `.header-band*`), `.menu-*` (incl. `.menu-medallion`,
  `.menu-address`)). Never
  raw hex, never raw Tailwind palette colours
  (`bg-amber-700`), never font names in components.
- Theme variants via `[data-theme="…"]` redefining the same tokens: a dark "Peacock"
  variant (weddings, the bar, the Unwind band, the enquiry close) and "Emerald" — the
  owner's fixed palette (2026-10-24: Deep Emerald #073B30, Botanical Green #0D5145,
  Antique Gold #C5A15E, Warm Ivory #F4EBDD, Muted Sage #B7C2A5, Soft Charcoal #252B26;
  do not change) — for the opening loader, the header, the mobile menu and the home
  hero, with the palette textures as `--texture-stone` / `--texture-botanical`. Gold
  small text belongs on Deep Emerald only (3.8:1 on Botanical Green: UI/large text).
  Every element that sets `data-theme="peacock"` or `"emerald"`
  MUST also carry an explicit `text-ink` (or other colour utility) on that same
  element — `color` inherits the ancestor's already-resolved value, it does not
  re-evaluate `var(--color-ink)` per scope, so without this the Peacock subtree
  silently renders in the parent's (light) ink colour.
- Every text/background pair passes WCAG AA (4.5:1 body, 3:1 large text and UI).
  Gold-like colours are never body text on light backgrounds. The gold logo always
  sits on the deep green (`brand`) on light pages (header niche, `.logo-medallion`).
- Palette: "Peacock & Ivory" — "Ivory" (light, default: warm near-white surfaces,
  near-black green ink, terracotta clay accent, deep forest-peacock brand, antique gold
  ornament) with a dark "Peacock" variant (deep forest-peacock surfaces, pearl ink,
  antique gold accent), tuned against the hotel's photographs. Buttons are nearly
  square ("architrave"); arches appear as the header's doorway niche, the gentle
  section thresholds and `.frame-arch` feature images. Fonts: display Instrument
  Serif, body Figtree; home hero up to ~12vw, inner-page heroes `.heading-page`. See
  `theme.css` and `src/app/fonts.ts`.

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
inputs, 44×44 px touch targets. Mobile Lighthouse ≥ 90, LCP < 2.5 s, CLS < 0.1, mobile
hero image ≤ 150 KB, no autoplay video on mobile (the home hero's clip plays from
768px only, after `load`, never on reduced motion / data saver / 2G–3G, with a
pause control — WCAG 2.2.2). Motion: < 400 ms,
transform/opacity/clip-path only, everything disabled under `prefers-reduced-motion`.
Scrolling: wheel input on mouse/trackpad devices is smoothed by Lenis — never slowed
(wheelMultiplier 1) and never locked except under a modal; touch, keyboard, reduced
motion and Lenis-failure all stay native. Breakpoints 360, 768, 1024, 1280, 1536.
Exception (owner's brief, 2026-10-24): the home page's opening — `IntroLoader` plus the
hero/header entrance — may run sequenced draws and reveals of ~1.5–2.5 s, once per full
page load, never looping. It never blocks input (pointer-events none; any input ends
it), never replays on client-side navigation (`src/lib/app-boot.ts`), is hidden under
reduced motion, and is skipped on data saver / 2G–3G (`html[data-intro="off"]`, set by
the boot script in `src/lib/motion.ts`). No WebGL/Three.js.

Scroll-driven scenes (no animation library): `useScrollProgress` writes a unitless
`--p` (0–1) — on a whole section via `ScrollSection`, on a scene inside one via
`ScrollScene` — and CSS does the animating; with Lenis running it updates from Lenis's
synchronous `scroll` event (same frame, one loop). Code that scrolls the page uses
`scrollToY()` from `src/lib/smooth-scroll.ts`, never `window.scrollTo`, and modals call
`pauseSmoothScroll()` and carry `data-lenis-prevent`. Scenes only activate under
`html[data-motion="rich"]`, set before first paint from `src/lib/motion.ts` (≥1024px,
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
