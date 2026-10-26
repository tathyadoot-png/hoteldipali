# Hotel Dipali Website — Project Plan

Last updated: 2026-10-26
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
| 2026-10-19 | The entrance film is scrubbed from a frame cache drawn to a `<canvas>` (`film-frames.ts`), never by seeking the `<video>`. After `load` the film plays once, muted and offscreen at 2.5×, and `requestVideoFrameCallback` captures frames as JPEG blobs (12 slots/s); scroll draws the nearest cached frame. | Measured root cause of the scroll jank: seeking this sparse-keyframe H.264 stalled frame presentation (p95 40 ms, max 53–120 ms with the film; 13.5 ms with it removed). Playback is cheap where seeking is not. Costs ~14 MB of blobs and ~8 s of background capture; nearest-neighbour fills missed slots. |
| 2026-10-19 | Scroll progress is mapped 1:1, with no easing/lerp, from offsets cached on resize (no per-frame layout reads). | Easing made the film trail the scrollbar and kept rAF loops running after scrolling stopped; the brief forbids slowing native scroll to mask cost. |
| 2026-10-19 | Header = two nav wings flanking a centred, hanging logo "keystone" (inverted-arch foot); a small gold arch glides to the hovered/focused link and rests on the current page; solid state shrinks the keystone and draws a gold hairline outward. Below xl: Menu · keystone · call. | The navigation's signature, built from the site's arch motif. One `<nav aria-label="Primary">`; nothing is hover-only. |
| 2026-10-19 | Mobile menu = two brand-colour gate leaves that part onto a dusk hall, links framed in a hairline doorway arch; current page marked by a sage arch. | "Entering another part of the hotel"; uses `@starting-style` + native `<dialog>`, so focus trap/Escape/focus return are unchanged. |
| 2026-10-19 | Home hero = "the aperture": the film is seen through an arched doorway (clip-path) that opens with the gates; "Hotel" / "Dipali" are inscriptions on the two pillars and part with them; an arrival rail (Gate · Avenue · Lobby) shows progress and jumps; in the lobby a directory plaque offers Stay / Celebrate / Unwind / Dine. Static (phones, reduced motion) keeps the full-frame still and stacked name. | One signature idea instead of more animated text: the typography belongs to the architecture of the arrival. |
| 2026-10-19 | Smooth wheel scrolling with Lenis 1.3.27 (first runtime dependency beyond Next/React/Zod; requested by the owner, CLAUDE.md §B/§K updated). One instance in `src/lib/smooth-scroll.ts`: `lerp` 0.14, `wheelMultiplier` 1, `syncTouch` off, `anchors` on, `stopInertiaOnNavigate` on; Lenis's own rAF loop off — a loop runs only during a glide. Mounted by `SmoothScroll` for `(hover: hover) and (pointer: fine)` without reduced motion. | Measured cause of the "abrupt stop": native wheel scrolling moves each notch ~100 px in one frame with no deceleration (no app code involved). Lenis keeps real window scrolling (sticky, IO, anchors, scrollbar) so the existing architecture holds. |
| 2026-10-19 | A wheel notch against a glide in progress drops the rest of the glide first (Lenis `virtualScroll` hook). | Lenis adds notches to its target, so a reversing notch only shortened the glide: in testing the page never moved back. Now it moves back within ~37 ms. Consequence: the untravelled part of the glide is discarded, as with trackpad/touch momentum. |
| 2026-10-19 | `scrollToY()` re-measures Lenis (`resize()`) before every code-initiated scroll, and before hash-link clicks. | Lenis clamps to a scroll limit refreshed 250 ms after a height change; the dining walk sizes itself after hydration, so an early keyboard-focus jump was cut short (caught by the existing e2e test). |
| 2026-10-21 | Theme replaced: "Peacock & Sandstone" supersedes Ivory & Gold / Dusk / olive-sage. Light "Sandstone" (surface #EFE6D6, surface-alt #E4D6BF, ink #0F2422, ink-muted #3E5552, accent copper, brand peacock #0E3B3A, highlight brass #C9A45C); dark variant renamed Dusk → **Peacock** (`[data-theme="peacock"]`: surface #0E3B3A, surface-alt #082624, ink pearl #F7F2E9, ink-muted #C9D1CB, accent brass). Semantic token names kept, so components re-theme from `theme.css`. | Owner's new art direction. Approved in the run brief (overrides brief §14.6 "keep Ivory & Gold unless I approve"). |
| 2026-10-21 | Copper is **#914922**, not the proposed #9A4E25; the contrast gate now checks `accent` as small text (4.5:1) on both surfaces in both variants. | Copper is used as small text (`.field-error`, current header link). #9A4E25 measured 4.20:1 on surface-alt; #914922 gives 5.33 / 4.61:1 and 6.60:1 with white text. Owner chose this option. |
| 2026-10-21 | `pop` retired. Unwind band → `data-theme="peacock"`; pressed chips, menu current marker, pillar hover, room marker, journey progress → `accent` (copper on light, brass on Peacock); `.btn-secondary` → outline (ink/pearl border and text, hover surface-alt); `.band-pop` deleted. Gate pairs added for each. | Owner's mapping: one fewer colour; the peacock family already supplies the dark band. |
| 2026-10-21 | The gold logo always sits on a peacock ground on light pages: header keystone background = `brand` in both states; `.logo-medallion` in the welcome section. | Sampled logo golds (#a25507–#ffd75c) measure ~1.3–1.9:1 on sandstone vs 5–8:1 on peacock. |
| 2026-10-21 | Display scale enlarged: `.heading-hero` clamp(3.25rem, 1rem + 11vw, 11.5rem) (~15.4vw at 360, ~12vw at 1440), `.heading-1` clamp(2.5rem, 1rem + 6vw, 8rem), `.heading-2` clamp(2rem, 0.75rem + 4vw, 5rem) (~4.8vw at 1440). | Editorial feel requested. Consequence: half-column heroes (Events, Weddings) break one or two words per line on wide screens and push their CTAs toward the fold — left for the hero redesign (prompt 4). |
| 2026-10-21 | Entrance film removed: `film-frames.ts`, the 330vh runway, aperture/rail/directory, `public/video/*`, `scripts/extract-video-frames.ts` + `make:video-frames`, `site.entranceVideo`. Temporary static hero (server component): full-bleed `site.homeHero` placeholder image + H1 + CTAs, Peacock variant. | Owner decision: the prototype footage was unverified AI video of unconfirmed architecture, and prompt 4 redesigns the hero. Removes ~1 MB of video plus the capture pass from every desktop visit. |
| 2026-10-21 | Lenis `lerp` 0.14 → **0.10** (wheelMultiplier 1). Tried 0.10 / 0.09 / 0.08: 50% of a notch at 128 / 143 / 166 ms, 90% at 395 / 436 / 486 ms, settled ~716 / ~796 / ~900 ms; reversal 37 / 39 / 31 ms. | "Buttery" requested; 0.10 is the softest setting that still stops in < 0.75 s. Reversal stays instant via the `virtualScroll` hook. |
| 2026-10-22 | The hotel's own photographs replace placeholders wherever a photo matches the slot (24 of 27 used). Originals stay untouched in `public/hotel/`; `pnpm make:photos` (new, Playwright Chromium) writes WebP sets (480–2560 w, plus a portrait phone crop of the hero) to `public/images/hotel/`; image schema gains `widths`, `focus`, `small`; `Picture` emits `srcset` and a phone `<source>`. Entries are `public-unverified` (source = original file). | The originals are 8–26 MB each (447 MB total) — unservable as-is. 17 MB of derivatives; pages load only the width they need. `public-unverified` keeps `pnpm release` blocked until usage rights and captions are confirmed. |
| 2026-10-22 | Not used: the two night exteriors (DJI_…0041, …0044) and the "Game Zone" building (DJI_…0068). | The night photos show rooftop signage reading "DIPALI RESIDENCY" (CLAUDE.md §G: not to be presented until confirmed); "Game Zone" is a facility the content does not list. |
| 2026-10-22 | Where the subject of a photo is inferred, only one item gets it: the four room photos (one room type) go to Garden Deluxe + Premium; the three banquet photos (one hall) to Grand Banquet Hall; cocktails to Infinity Bar. Executive/Family suites, Celebration Hall, Main Lawn, Poolside Lawn, gym, bakery, sweets and Poolside Restaurant keep labelled placeholders. | Avoids presenting one room or hall as several. Each inferred mapping carries a `note` to confirm. |
| 2026-10-22 | Palette "Peacock & Ivory": light surfaces warm near-white (#F8F4EC / #EFE7DA), ink #13221E, accent terracotta clay #9A4527, brand deep forest-peacock #0F2E2A, ornament antique gold #B89A5E; Peacock variant #0F2E2A / #0A211E with pearl ink and gold accent #CDA866. | Owner brief: less beige and washed-out, more depth; chosen against the photographs (wood, cream, teal upholstery, lawns, pool). All 26 gated pairs pass with margin (terracotta as small text 5.88 / 5.26:1). |
| 2026-10-22 | Header = "doorway in the architrave": a hairline along the bar's base rises into an arched deep-green niche holding the logo (inside the bar — no longer hanging over content); links uppercase-tracked with a sliding, resizing hairline indicator; solid state is 95% ivory without backdrop blur. | Owner: generic navbar, logo collisions. Blur behind a sticky bar repaints every scroll frame, so it is avoided. |
| 2026-10-22 | Buttons = "architrave": 2px radius, a fill that sweeps up on hover/focus (transform only), `.btn-cta` (inset hairline + stepping arrow) for the enquiry CTA (replaces the dome-topped `.btn-arch`); `.link-cta`, `.btn-icon` added. | Owner: pill/dome shapes looked generic and inconsistent. |
| 2026-10-22 | Motion: one shared IntersectionObserver for reveals (earlier trigger, −8% bottom margin), variants rise / mask (headings) / image (frames), CSS-applied stagger; `<noscript>` shows reveal content without JS; hero copy rises on load in CSS; hero photo parallax under rich motion only (transform via `--p`). No custom cursor. | Short (380 ms), consistent patterns; a cursor follower would add a pointermove/rAF loop for no information gain. |
| 2026-10-22 | `.heading-1` back to clamp(2.5rem, 1.25rem + 3.4vw, 5rem); new `.heading-page` for inner-page heroes; headings get `overflow-wrap: break-word`. | At the 2026-10-21 scale, "conversation" overflowed its 5-column cell over the enquiry form at 1920 px. |
| 2026-10-24 | **Emerald** variant (`[data-theme="emerald"]`) = the owner's fixed palette: Deep Emerald #073B30 (surface/brand), Botanical Green #0D5145 (surface-alt), Antique Gold #C5A15E (accent/highlight), Warm Ivory #F4EBDD (ink), Muted Sage #B7C2A5 (ink-muted), Soft Charcoal #252B26 (accent-ink). Used by the opening loader, header (always), mobile menu and home hero; the rest of the site keeps Ivory/Peacock. Contrast gate gains the variant: ink 10.60 / 7.80, muted 6.72 / 4.94, accent-ink on gold 5.95, gold on Deep Emerald 5.15; gold on Botanical Green 3.79 is gated as UI/large text only. | Owner brief ("Do not change the palette"). Scoping it to the opening keeps every inner page and its tested contrast pairs untouched. |
| 2026-10-24 | Palette textures: `public/palettes/3` (watercolour stone, frame cropped off) → `--texture-stone`; `/9` (botanical panel) → `--texture-botanical` (loader panel, menu), both graded toward Deep Emerald by `make:photos`. 1 (gold ribbon), 6 (ring) and 7 (line leaves) are references only — redrawn as SVG line art; 2, 5, 8 unused. | Brief: textured emerald canvas, not flat green, and no full-page reference screenshot as a background. |
| 2026-10-24 | Fonts (self-hosted OFL woff2, latin): Cormorant Garamond 400 + italic (display), Manrope variable (UI), Great Vibes (one script word). Bodoni Moda rejected (hairline serifs break up at the small, tracked sizes and fight the fine gold lines); Birthstone rejected (thin, low-contrast script that reads poorly over texture). | Brief's shortlist; evaluated at hero and nav sizes on the emerald canvas. |
| 2026-10-24 | Opening loader (`IntroLoader`): server-rendered, CSS-only timeline from first paint — gold arch draws around the real emblem on the botanical panel, a light sweep, caption — then JS (after hydration) flies the arch onto the hero's arch (FLIP, transform/opacity) at 1.45 s. Ends early on any input (and fast-forwards the hero's `intro-*` animations), fades itself at 1.9 s without JS, hidden under reduced motion, never replays on client navigation (`app-boot.ts` / `BootMarker`), skipped on data saver or 2G/3G (`html[data-intro="off"]`). No spinner, no progress bar. | Brief: short, branded, non-blocking, no replay, no hydration errors or CLS. |
| 2026-10-24 | Header = "engraved band": two gold double rules from each end meet a medallion (double ring, beads) holding the emblem; links sit inside the band (3 + 3) with a gold bead sliding on the lower rule; ends: call link (xl) / menu (below xl) and a chamfered gold-line "Book a Stay" (`BookStayLink` → booking URL or WhatsApp availability). End columns share a minimum width so the medallion is on the centre line at every width. Transparent over the home hero, emerald stone when solid. | Brief: distinctive, not a centred-logo bar with a rounded CTA; fine gold outlines. |
| 2026-10-24 | Nav mapping (no invented routes): Stay → /rooms/, Weddings → /weddings/, Events → /events/, Dining → /dining/, Experiences → /#unwind, Gallery → /#gallery. "Celebrations" is split into the existing Weddings/Events pages; **About** has no page and is not linked. Experiences and Gallery are provisional anchors until those pages exist (step 11). | Brief: no dead links; mark unresolved destinations. The old nav linked to /pool-and-gym/, /gallery/ and /contact/, which do not exist. |
| 2026-10-24 | Home hero: emerald stone canvas; the lit entrance (DJI_…0042, cropped **below** the rooftop "DIPALI RESIDENCY" sign) inside an arched window with a double gold frame, botanical sprigs and one gold ribbon; copy per brief, "Beyond" in script; CTAs "Explore the Experience" → #explore, "Discover Hotel Dipali" → #welcome. Pointer depth (rich motion only) via `--mx/--my`. Supersedes the 2026-10-22 row for this photo: the sign is cropped out, so §G is respected — confirm the naming (open question). | Brief: one art direction, a real hotel photograph, choreographed entrance; no fictional building. |
| 2026-10-24 | No Three.js / R3F / WebGL. The opening is SVG line art + CSS animations + one small pointer handler. | Brief: lightest approach; the focal point is a real photograph, and nothing in the design needs 3D. Saves ~150 KB+ of JS and a GPU context on phones. |
| 2026-10-24 | SVG line drawing uses `pathLength={1}` + dash offset **without** `vector-effect: non-scaling-stroke`; stroke widths are set per breakpoint instead. | In Chromium the two combined compute dashes in screen space, so scaled-up frames drew only partly (even with animation off). |
| 2026-10-26 | Palette texture swap: the owner saved a new stone under `public/palettes/3.jfif` (1024×576 landscape folded teal stone; the old framed watercolour stone is now `11.jfif`, unused). `make:photos` grades it toward emerald (`hue-rotate(-14deg) saturate(0.9) brightness(0.95)`, no crop) into `emerald-stone-1024.webp` (23 KB, was 56 KB); `--texture-stone` and the hero preload point at it; the stale `emerald-stone-479.webp` was deleted. | Owner's instruction: keep using the newly selected texture for now. Ungraded it read teal against the fixed Deep Emerald. |
| 2026-10-26 | "The Dipali Experience" replaces the welcome block's logo medallion + "Step inside" heading (same `#welcome` section, threshold, `#home-intro` heading id; the pillar index `#explore` stays below it). Statement (eyebrow, two-line Cormorant heading with "Remember" in Great Vibes, gold rule, Cormorant italic lead, Manrope body = `site.shortDescription`, emerald-tablet `.btn-royal-solid` CTA) beside the reception atrium as a 4:5 portrait under a shallow lintel (the threshold's elliptical curve, not the hero's round arch), on an emerald stone tablet with a vertical caption, traced by one gold line that draws upward after the photo reveals; a gold thread continues down from the threshold keystone. Reveals reuse `ScrollReveal` (380 ms); no scroll-linked work. | Owner brief: editorial, architectural, emerald + ivory + gold, no repeat of the hero composition, lightweight. |
| 2026-10-26 | New content image `site.homeExperience` (schema `imageSchema`): `reception-atrium-portrait-{480,720,960,1200}.webp`, a 4:5 crop of DSC_1632 below the ceiling band (36–146 KB; phones load 480 w). The "In pictures" mosaic skips the photo the section shows (matched on `source`). | A cover-crop of the landscape set made phones fetch 150–224 KB to show half of it; a dedicated crop keeps the trust fields and explicit dimensions. |
| 2026-10-26 | Contrast gate: light-only large-text pair `brand`/`surface` (13.25:1) for the script accent word on ivory. | Every text/background pair is gated (CLAUDE.md §E). |
| 2026-10-26 | Hero video = `public/video/1.mp4` (owner's), which is an **AI animation** (Google Veo watermark) of the night photo DJI_…0042 with the "DIPALI RESIDENCY" sign in view. Owner's decision: use it **as `sample`** content (`site.homeHeroVideo`, new `heroVideoSchema`), so `pnpm release` blocks launch until real footage replaces it. | CLAUDE.md §F (never present AI imagery as the hotel) — the trust system keeps it a placeholder, as with the 2026-10-13 entrance film. |
| 2026-10-26 | `pnpm make:video` (new, `scripts/make-video.ts`): Playwright Chromium grabs every frame during quarter-speed playback (seeking returns stale frames headless), crops to the hero photo's arch crop (clear of the pillarbox, the watermark and — under the arch's round top — the sign), ends at 7.0 s (the source dissolves into a wide shot of other buildings from 7.2 s), dissolves its last 0.75 s back to frame 0 so every loop restarts on the poster's framing, encodes H.264 Constrained Baseline with WebCodecs at exact 1/24 s timestamps, and writes a faststart MP4 in Node (no audio). 532×740, 7.0 s, ~1.0 MB (source 12.9 MB, 1920×1080, ~13 Mbit/s, audio, index at the end). | No ffmpeg or muxing dependency. MediaRecorder was tried first: wall-clock capture gave 8–91 ms frame durations (visible judder). Poster → first frame differs as little as two consecutive frames; loop seam likewise. |
| 2026-10-26 | Phones get the poster only (owner: "Poster on phones"). `HeroVideo` mounts from 768px, without reduced motion / data saver / 2G–3G, after `load` and after the photo's entrance zoom; fades in only once frames play (autoplay refused or a load error leave the photo); pauses off screen, when covered by the next section and when the tab is hidden; a pause / play control (WCAG 2.2.2). The photograph is the poster. | CLAUDE.md §K (no autoplay video on mobile); the brief's fallback and no-blocking requirements. |
| 2026-10-26 | One button family on the shared classes: `.btn-primary` = antique-gold plaque with deep emerald label (booking: header, menu, sticky bar, enquiry), hover draws an engraved hairline 4px inside; `.btn-secondary` = fine gold outline, ivory label on emerald/Peacock and deep emerald on ivory, gold rises into it on hover; Manrope 0.75rem small capitals, 48px, 2px radius; `.btn-compact` for the phone sticky bar. `.btn-royal*` (chamfered border-image) retired. Contrast gate adds `brand`/`highlight` (5.41 / 7.52 / 5.15:1) and `brand`/`surface` on ivory (13.25:1) as body pairs. | Owner: polygon corners too prominent and inconsistent. Changing the shared classes also turns other pages' primary buttons from clay to gold — consistent with the identity, flagged for review. |
| 2026-10-26 | Layered scroll: the hero holds (sticky inside `.layers`, rich motion, viewport ≥ 600px tall) while The Dipali Experience rises over it — the hero's content eases back (−6vh, scale 0.94, opacity 0.6) under a charcoal veil; then A World Within Dipali (emerald, a straight panel edge with a doorway crown and keystone) rises over the Experience, which lags (+16vh) and dims under a deep-green veil. `LayeredSection` + new `useScrollProgress` mode `"rise"` write `--cover` on the covered section; no new dependency. Reduced motion / touch / narrow: sections stack with their edges overlapping. | Owner's "most important" requirement, without scroll-jacking: native scrolling, nothing pinned beyond the cover, no wheel/touch handling. |
| 2026-10-26 | "A World Within Dipali" replaces the "Explore the hotel" word index (owner's decision) and takes `#explore` (both hero CTAs and "Discover Our Story" still land on real sections). Celebrate featured (weddings first) on an ivory plaque; Stay, Unwind, Dine supporting in a desktop zig-zag (4:5 / 3:4 / 16:9 / 4:3), each a stretched link: /weddings/ (+ /events/), /rooms/, #unwind (no pool & gym page yet), /dining/. Photos the sections further down do not lead with. Reveals: heading mask + staggered accent line, photographs wipe from four directions (new `ScrollReveal` variants), captions rise, gold rules draw after; rich motion adds transform-only drift. | Owner brief: editorial gallery, featured vs supporting, no equal cards; only facilities in CLAUDE.md §A, no invented claims. |
| 2026-10-26 | Measured with real GPU compositing (new-headless Chromium + ANGLE D3D11 on the GTX 1660 SUPER, 75 Hz): scrolling the whole layered sequence down and back, p50 13.3 ms, p95 13.5 ms, 0 frames > 33 ms (1× CPU); 4× CPU p50 26.6 ms, p95 39.9 ms, 19 of 343 frames > 33 ms. Default headless (SwiftShader) is ~4× slower and is not representative. | Fixes found by measuring: LayeredSection no longer writes custom properties no CSS reads (each re-styled a whole subtree per frame; 4× CPU p95 53 → 40 ms) and per-frame movers get `will-change`. |
| 2026-10-24 | Performance: the stone texture (the home page's largest paint, CSS-only) is preloaded from `EntranceHero`; the hero photo's `sizes` match the arch's CSS width; the botanical panel is the 480 w file below 768 px; the welcome/enquiry logos use the 7–20 KB emblem set instead of the 506 KB PNG. | Measured on a throttled phone (4× CPU, 150 ms RTT, 1.6 Mbps): LCP 3.0 s → 1.67 s, home weight 643 → 579 KB. |
| 2026-10-26 | The interrupted homepage prompt is finished on a second machine: "The Grand Reveal" and "The Living Experiences" are added after A World Within Dipali, before Stay; nothing existing is removed or restyled. The office machine had produced only the reveal's image crops (`make-photos.ts` job + `reveal-night-*` WebPs, commit `e7ea455`). | The run's brief: finish only what is missing and preserve every completed section. The overlap with World Within and the older sections is an open question. |
| 2026-10-26 | The Grand Reveal = the night panorama of the whole lit façade (DJI_…0038) as `site.homeReveal` (`public-unverified`; new aspect `21:9`; the portrait crop as `small` for phones), on emerald deepening to charcoal, with a centred, line-by-line heading and a fine gold frame (`CornerOrnament` corners, a keystone). Tablet and up show it at a fixed 1.14 zoom toward the porch (`scale`, origin 76% 28%, focus 75% 50%), which leaves the far-left tower and its "HOTEL DEEPALI" sign out of frame and trims the wet forecourt; a charcoal shade settles over the forecourt. Rich motion, from the stage's own `--p` (new `ScrollScene`): an arched doorway over the porch (22% wide, 63% across, round head) opens to the full frame over p 0.04–0.40 (smoothstep) while the photograph settles from 12% closer; the frame's edges draw from their centres over 0.26–0.46 and the corners and keystone set over 0.40–0.52 — complete before the stage is centred, so nothing is pinned. Otherwise one `wipe-centre` reveal, then the frame draws. | Brief: a cinematic architectural reveal of real imagery, a restrained gold frame, choreographed scroll-linked motion, no heavy pinned scene or scroll hijacking. CLAUDE.md §G keeps the variant spelling to the footer line and schema, so the sign is framed out without editing the file. |
| 2026-10-26 | The Living Experiences = Stay, Weddings & Events, Dining and Pool & Gym as four asymmetrical compositions on ivory, under the threshold's arch rising over the night: each photograph on an emerald stone tablet with an offset gold frame line behind it, alternating sides and proportions (3:2 / 4:3 / 16:10 / 3:4; desktop columns 1–7, 7–12, 2–7, 8–11); Dining layers an Infinity Bar photograph over its corner. Its motion is horizontal, unlike the Grand Reveal's opening: photographs open sideways from their text (`wipe-left` / new `wipe-right`), the text slides toward its photograph (new `slide-left` / `slide-right`) and the frame lines extend along the same line. Rich motion adds each composition's own `--p` (`ScrollScene`): tablet, photograph, frame line and inset drift sideways at different rates, and an ivory veil (max 0.45) lifts from the photograph as it reaches the viewport's centre — text is never dimmed. | Brief: an asymmetrical, layered photographic composition with directional reveals, subtle horizontal movement and controlled shifts of focus; no card grid, no pinned scene. |
| 2026-10-26 | The Living Experiences' photographs: for each experience, the first real photograph of its kind that no other section of the page shows (`room-double-3`, `banquet-hall-wide`, `food-serving` with `cocktail-blue` over it); a reused one only when none is left. The pool's two aerials are both shown elsewhere, so its pool-centred portrait crop (`aerial-pool-grounds-portrait`, already made by `make:photos`, unused) is now the pool's second content image (`leisure.pool.images[1]`, `public-unverified`). The copy is display copy in `page.tsx`, as for World Within: it describes the photographs and the facilities in CLAUDE.md §A only. | No repeated, stock or fabricated imagery. There is no gym photograph, so "Pool & Gym" shows the pool only. |
| 2026-10-26 | `node_modules.npm-backup/` (the npm-built tree kept during the switch to pnpm) is excluded in `.gitignore`, `tsconfig.json` and the ESLint ignores. | It sits in the project root: TypeScript's `**/*.ts` include picked up 3,832 of its files, ESLint and Tailwind's source scan would read it, and `git add -A` would have committed it. |

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
- Since 2026-10-24 pages load the trimmed emblem instead (`public/images/brand/
  logo-emblem-{120,240,360,480}.webp`, 7–54 KB, made by `pnpm make:photos` from the
  PNG); the 506 KB PNG is no longer requested by any page.
- `public/video/entry.mp4` (prototype) and the frames `entry-poster.webp` (first frame,
  desktop) / `entry-still.webp` (mobile & reduced motion), regenerated with
  `pnpm make:video-frames`.
- `src/app/icon.svg`: a flat bronze "D" monogram placeholder favicon — replace with a
  real logo mark when available.

## Open questions

See CLAUDE.md section M:

- **Photos (2026-10-22):** confirm usage rights and captions for the 24 placed
  photographs; confirm which room type DSC_6534–6542 show, that DSC_3324–3352 are the
  Grand Banquet Hall, and that the cocktails were shot at the Infinity Bar.
- **"Dipali Residency" signage** appears on the night exteriors — is it the same
  property/brand? Until confirmed those photos stay unused.
- **"Game Zone"** (DJI_…0068) — is it a hotel facility to list?
- **Still needed:** Executive Suite, Family Suite, Celebration Hall, Main Lawn,
  Poolside Lawn, gym, bakery, sweets and Poolside Restaurant photos (landscape,
  ≥2400 px wide); a daytime exterior/entrance photo without signage issues.
- **Deploy:** `public/hotel/` originals (447 MB, files up to 26 MB) are copied into the
  static export; Cloudflare Pages rejects files over 25 MB. Move the originals out of
  `public/` (e.g. to a `photos/` source folder and point `make:photos` at it) before
  deploying — not done, as the brief said not to move them.

- Official single address and pincode (platforms conflict — see docs/public-data.md).
- Room count and categories.
- Booking engine name and URL format.
- Who publishes blogs and offers after launch.
- Which number is WhatsApp-enabled? (reservations number assumed for now).
- Is the food veg-only? (listed as vegetarian on OTAs — confirm before claiming).
- Original photos needed before step 6 (Home) — see docs/data-needed.md.
- Need `logo-reverse.png` (a light/gold mark legible on dark backgrounds) and a proper
  logo mark (square monogram) for the favicon — see "Brand assets" above.
- ~~Optimise the 506 KB logo PNG~~ — done 2026-10-24 (emblem WebP set; the PNG itself
  is untouched).
- **Opening experience (2026-10-24):**
  - The brief called the hero photo "Hotel Dipali Residency", and DJI_…0042/0038 show
    "DIPALI RESIDENCY" / "HOTEL DEEPALI" signage. Is Dipali Residency the same property
    and brand? The hero crops the sign out until this is confirmed (CLAUDE.md §G).
  - Usage rights for `public/palettes/` (they look like downloaded reference images,
    ~736 px): may their textures ship on the site? Two are used as graded textures.
  - The three night originals were placed in `public/images/hotel/` (8 MB each) — that
    folder is deployed. Move them next to the other originals (`public/hotel/`, or a
    non-public source folder) before deploying; not done (originals are never moved by
    code without sign-off).
  - Navigation: "About" has no page; "Experiences" (/#unwind) and "Gallery" (/#gallery)
    are provisional anchors until the Pool & Gym and Gallery pages exist. The footer
    still links to /pool-and-gym/, /gallery/ and /contact/, which do not exist yet.
  - The phone sticky bar (Call · WhatsApp · Enquire) is ivory/terracotta over the
    emerald hero — outside this phase; decide whether it joins the Emerald identity.
  - Measured in headless Chromium only (software raster). Check the opening on a
    real mid-range Android phone and on Safari/iOS.
- **The Dipali Experience (2026-10-26):** "Discover Our Story" points at A World Within
  Dipali (`#explore`) until an About / story page exists. Its body copy is
  `site.shortDescription`, still `sample` — replace with verified wording. Confirm the
  caption "The reception atrium · Sagar" and `11.jfif` (now unused) can be removed.
- **Hero video (2026-10-26):** it is AI-generated (Veo) and marked `sample`; launch is
  blocked until original footage (a slow night push-in to the porch, ≥1080 px tall, no
  signage in view) replaces it. The 12.9 MB source `public/video/1.mp4` is copied into
  the export — move it out of `public/` before deploying (not done: the brief says not
  to alter it).
- **Buttons (2026-10-26):** the shared `.btn-primary` is now gold on every page (it was
  clay on ivory pages) — confirm this is wanted site-wide.
- **A World Within Dipali:** "Unwind" links to the home section `#unwind` until a Pool &
  Gym page exists; the room, venue and outlet facts behind the four experiences are
  still `sample` content.
- **The Grand Reveal (2026-10-26):** the tower on the far left of DJI_…0038 carries a
  "HOTEL DEEPALI" sign; tablet and up frame it out (CSS zoom) and phones never show it
  (portrait crop) — confirm with the hotel, with the usage rights and the caption "The
  façade at night · Sagar". The forecourt is wet in this photograph: a dry, blue-hour
  version of the same view would serve better.
- **The Living Experiences (2026-10-26):** it covers the same four experiences as A
  World Within Dipali and as the older Stay / Celebrate / Unwind / Dine sections below
  it, which are still in the 2026-10-13 design language. Decide whether to retire or
  restyle those (not done: this run preserved every completed section). "Pool & Gym"
  shows the pool only until a gym photograph is supplied. Confirm the display copy.
- **No JavaScript (pre-existing):** the header keeps its transparent overlay state, so its
  links barely show over ivory sections. Not changed here (the navbar was preserved).
- Smooth scrolling was tuned with synthetic wheel input (100 px notches) in Chromium on
  Windows. Confirm the feel on real hardware: a notched mouse on Windows, a Mac
  trackpad (its own momentum + Lenis), a Magic Mouse, and Safari/Firefox. Touch was
  verified only with emulated touch in Chromium.
- Scroll-scrubbing was measured in Chromium only (2026-10-19, frame cache: p95 13.5 ms
  on a 75 Hz display, zero frames >33 ms through the pinned hero with real wheel
  input, forward and reverse). Test Safari (macOS + iOS iPad at ≥1024px) and Firefox on real devices once the
  final footage is encoded; Firefox/WebKit engines are not installed locally.

### Shoot brief for the home experience

The layouts are built so originals drop in by replacing files — no redesign needed.

- **Home hero photo** (`site.homeHero`, now the lit entrance DJI_…0042, portrait crop
  3:4 below the rooftop sign): a portrait (3:4) view of the main entrance — evening or
  blue hour, warm lights on — with no signage in frame, ≥1600×2130, would make the
  crop unnecessary.
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
- 2026-10-19: Premium interaction & navigation overhaul (not a numbered step; current
  step stays 11).
  - **Smoothness — measured, then fixed.** Production build, 1440×900, Chromium, real
    wheel input. Before: fast scroll p95 40 ms, max 53–120 ms, long animation frames
    without script attribution. Isolation runs: no grain p95 39.9 ms, no scrims 40 ms,
    **no film 13.5 ms** → the cost was seeking the sparse-keyframe H.264, not CSS or
    JS. A seek-based frame capture would itself jank (11 s of seeks), so
    `src/components/home/film-frames.ts` plays the Blob once offscreen at 2.5× and
    captures presented frames (`requestVideoFrameCallback`, rAF fallback) into JPEG
    blobs; `EntranceHero` draws the nearest frame to `.entrance-film` (one
    `createImageBitmap` decode in flight, catching up afterwards). The capture
    `<video>` is removed when done; nothing is ever seeked. `useScrollProgress`
    rewritten: offsets cached via ResizeObserver, per-frame work reads only
    `scrollY`, 1:1 mapping (the `smooth` option is gone from it, `ScrollSection` and
    `DayJourney`), IntersectionObserver gate, passive listeners, writes only on change.
    Runway 380vh → 330vh. After: hero slow/fast/reverse p95 13.4–13.5 ms, **0 frames
    >33 ms over 6 fast passes**, 0 long animation frames; scrolling during capture
    p95 ≤26.7 ms, 0 >33 ms; leaving the pin is clean. Remaining: the first trip past
    the hero can show a few 40–53 ms frames while lazy images below decode for the
    first time (clean on the second pass); measured in Chromium only.
  - **Aperture hero** (`EntranceHero`, `.entrance-aperture/-architrave/-inscription/
    -plate/-waypoints/-directory`): see decision log. `--o` (aperture opening,
    smoothstep over the first 30% of the film) is written only when it changes.
    Removed the word-by-word tagline and the "Scroll to enter" cue (+ its keyframes).
  - **Keystone header** (`Header`, `NavDesktop` wings + `.header-glide`,
    `.header-*` classes) and **gate menu** (`MobileMenu`, `.menu-gate*`,
    `.menu-arch`, `.menu-link`); `.btn-arch` modifier for the signature CTAs. `Logo`
    gains `imgClassName`; `CallLink` gains `labelClassName` (the header call link is
    icon-only below 1536px but keeps the number as its accessible name).
  - Fixed while verifying: the static desktop hero lost its left scrim (restored for
    the static layout only); the plate crossed into the doorway at 1536 (width now
    accounts for the centred container).
  - Verified in Chrome: 360/390/768/1024/1280/1536 — CLS 0, no horizontal overflow, no
    console errors; reduced motion (static composition); film request blocked (poster
    stays, aperture still works); Escape/focus return and route-change close in the
    menu; every nav destination via tests. Tests: entrance spec now asserts the
    canvas frame cache (forward/back/top, capture completes, no `<video>` left), the
    aperture opening/closing, rail jumps (click + keyboard) and the lobby directory,
    rail hidden at the threshold/phone/reduced motion, full-frame static still;
    shell spec adds keystone centring, glide rest/hover/focus, gate leaves parting
    off-screen without blocking taps, dusk hall, current-page marker and menu
    navigation. All 326 e2e tests pass; lint, typecheck, contrast gate clean.
    Nothing marked verified.
- 2026-10-19: Smooth scrolling with Lenis (not a numbered step; current step stays 11).
  - **Diagnosis** (production build, 1440×900, Chromium, Playwright wheel input, same
    script before/after): natively every notch moved the page exactly 100 px in one
    frame and stopped dead — moving frames = number of notches, last step = largest
    step (ratio 1.0), 0 ms of motion after the last input. No wheel listeners exist in
    the app; the abruptness is native wheel behaviour. Side effect found: each 100 px
    jump spans ~21 film frames, and the async frame decode drew one frame late, so the
    hero showed a frame up to 21 indices stale on every notch.
  - **Implementation:** `src/lib/smooth-scroll.ts` (Lenis lifecycle, on-demand clock,
    keyboard/popstate hand-over, reversal handling, `scrollToY`, `pauseSmoothScroll`),
    `src/components/motion/SmoothScroll.tsx` (media-query lifecycle + `useSmoothScroll`),
    `SMOOTH_SCROLL_QUERY` in `src/lib/motion.ts`, `lenis/dist/lenis.css` imported in the
    layout, `html.lenis { scroll-behavior: auto }`. `useScrollProgress` subscribes to
    Lenis's `scroll` event (same frame) and writes its first value synchronously;
    hero rail and dining-walk focus use `scrollToY`; the mobile menu pauses Lenis and
    is `data-lenis-prevent`. `.playwright-mcp/` added to ESLint ignores.
  - **Before → after** (same input): moving frames 8→160 (slow notches), 5→53 (flick),
    12→134 (repeated), 8→63 (reverse), 6→57 (pin exit); largest step 100→13–30 px;
    final/largest step 1.0→0.03–0.08 (eased stop); motion after last input 0→650–790
    ms (to the final 1 px); end positions identical (no slow-down); frame p95 13.4–13.5
    ms both, 0 frames >33 ms; film more than 3 frames from the scroll position: max 21 →
    max 3–5, on ≤1 frame per scenario. Single notch at lerp 0.14: 50% in ~100 ms, 90% in
    ~285 ms, settled ~520 ms over ~30 frames (0.12 measured 113/339/606 ms). Reversal
    after the fix: page moves back 37 ms after the opposing notch (before: never).
  - **Verified:** rail Gate/Avenue/Lobby land within 1 px with the film in step during
    the programmatic glide (124/125 frames within 3); hash links glide, honour
    `scroll-margin-top`, update the URL, and Back restores the position; End pressed
    mid-glide reaches the bottom; route change mid-glide starts the new page at the
    top with a solid header; menu open freezes the page, close restores wheel and
    focus; reduced motion → no Lenis, native 100 px steps, still image; phone (touch,
    no fine pointer) → no Lenis, native touch scrolling; touch on a fine-pointer device
    with Lenis running stays native (fling included, in headed Chrome); CLS 0, no
    overflow, no console errors at 360–1536. Lenis-failure fallback (constructor throws
    → native) is code-reviewed, not exercised in a browser.
  - Tests: `tests/smooth-scroll.spec.ts` (new, 9 × 2 projects). All 344 e2e tests pass;
    lint, typecheck, contrast gate and production build clean. Nothing marked verified.
- 2026-10-21/22: Theme "Peacock & Sandstone"; entrance film removed (not a numbered
  step; current step stays 11). See the decision rows of 2026-10-21.
  - **Tokens/CSS:** new values in `theme.css`; `[data-theme="dusk"]` renamed to
    `"peacock"` across pages, components and tests; `pop` removed and its uses mapped
    to `accent` / the Peacock variant; outline `.btn-secondary`; keystone on `brand`;
    `.logo-medallion`; larger display scale; film/aperture CSS replaced by a small static
    hero block; the overlap rule `.entrance + .threshold` removed.
  - **Contrast gate** (`src/lib/contrast.ts`, `scripts/check-contrast.ts`): variants
    light + peacock; pop pairs removed; accent-as-text, outline-button border and marker
    pairs added; each pair now prints where it is used. Results — Light: ink 13.09 /
    11.32, ink-muted 6.46 / 5.59, accent-ink on accent 6.60, brand-ink on brand 11.04,
    accent as text 5.33 / 4.61 (surface / surface-alt). Peacock: ink 11.04 / 14.34,
    ink-muted 7.90 / 10.26, accent-ink on accent 6.81, brand-ink on brand 14.34, accent
    as text 5.25 / 6.81, highlight 5.25 / 6.81. All 26 pairs pass.
  - **Film removal:** files and assets deleted; `site.homeHero` image entry (sample)
    replaces `site.entranceVideo`; `make:placeholders` generates
    `property-home-hero.svg` (53 SVGs; bar tone moved to peacock); `docs/data-needed.md`
    regenerated (127 items, 53 photos).
  - **Styleguide:** "Sandstone" / "Peacock" / side-by-side toggle, no pop swatches,
    variant descriptions, contrast table with a "Use" column, scale notes on the type
    specimen.
  - **Lenis:** lerp 0.10 (see decision row; measured with the production build at
    1440×900 after bringing the browser to the front — a backgrounded window
    throttled rAF to ~1 fps and produced one invalid reading, discarded).
  - **Tests:** `entrance.spec.ts` film-only tests removed (runway, scrub, aperture, rail,
    directory, film failure, phone/reduced-motion film checks) and replaced by
    static-hero checks (H1, image loaded, CTAs, one viewport tall, no video/canvas, zero
    `/video/` requests on desktop and phone); scene tests kept unchanged.
    `smooth-scroll.spec.ts`: "hero film in step" and "arrival rail" removed, replaced by
    "a pinned scene's `--p` stays in step with a glide" (the dining walk). Dusk →
    Peacock and Light → Sandstone renames in home, shell, dining, events, weddings,
    styleguide, components and enquiry-form specs (labels only, same assertions). All
    336 e2e tests pass (344 − 8 film-only); lint, typecheck, contrast gate, build clean.
  - **Verified (headless Chromium):** /, /rooms/, /weddings/, /events/, /dining/,
    /styleguide/ at 360/390/768/1024/1280/1536 — no horizontal overflow, no console
    errors, CLS 0, zero `/video/` requests; keystone and medallion logo legible.
    Known: half-column hero headings on Events/Weddings wrap word-by-word on wide
    screens (see decision row). Nothing marked verified.
- 2026-10-22: Visual polish & client demo (not a numbered step; current step stays 11;
  uncommitted per the brief — "do not commit").
  - **Photos:** `scripts/make-photos.ts` + `pnpm make:photos` (119 + 3 crop files,
    17.2 MB from 447 MB of originals); content mapped as in the decision rows; hero =
    aerial pool & gardens (DJI_…0351) with a portrait phone crop (131 KB at 720 w;
    283 KB at 1080 w on 3× phones); Unwind = aerial pool & lawns (…0354) in an arched
    frame; Celebrate window = seated banquet event; Weddings hero = dressed tables;
    Events hero = hall during an event; Dining = restaurant interior + dishes; Infinity
    Bar = cocktails; rooms = DSC_6534–6542; new home "In pictures" mosaic = reception
    atrium, portico courtyard, lounge, sitting areas. Placeholders 53 → 25.
  - **Design:** palette, header, buttons, reveals, heading scale as in the decision rows;
    hero rebuilt (photo, forest gradient only where copy sits, CSS rise-in, parallax);
    thresholds gentler (`--arch` clamp(1.75rem, 4.5vw, 4.5rem)) with a gold hairline;
    `.frame-arch`; weddings/events/dining heroes use real photos via `featureImage()`;
    stronger `.hero-tint` for busy photos; styleguide shows the new button family and
    "Ivory" / "Peacock" toggle.
  - **Smoothness (headless Chromium, production build, wheel input over the whole home
    page, down and back):** 1440×900 first pass 1 frame > 33 ms of 1,058 (one 66 ms
    long animation frame while photos first decode), second pass 0; 1920×1080 both
    passes 0 frames > 33 ms, 0 long frames; Lenis active once (`html.lenis`). Not
    measured on real devices or Safari/Firefox.
  - **Verified (headless Chromium):** 6 routes × 360/390/768/1024/1440/1920 — no
    horizontal overflow, no console errors, CLS 0, no requests for `/hotel/` originals
    or video; no heading spills outside its column; screenshots reviewed at 390, 1024,
    1440, 1920 (hero, header overlay/solid, menu, Celebrate, Unwind, pictures, enquiry,
    footer, rooms, weddings, events, dining, bar). Fixed while verifying: phone number
    colliding with ROOMS at ≥1536 (wing gap), enquiry heading overflowing at 1920,
    niche crown clipped, mosaic leading with a room photo, Celebrate using a placeholder.
  - **Tests:** hero tests now assert the real photograph (landscape set on desktop,
    portrait crop on phones, `srcset`); new `tests/photos.spec.ts` (6 routes: no
    originals requested, every photo has a `srcset`); shell spec adds logo-niche
    containment (desktop + phone); "Sandstone" → "Ivory" toggle label in three helpers.
    All 352 e2e tests pass; lint, typecheck, contrast gate and build clean.
- 2026-10-24 → 26: Premium royal experience, phase 1 — opening loader, navigation and
  home hero (not a numbered step; current step stays 11; uncommitted per the brief).
  - **Built:** Emerald variant + contrast pairs; fonts (Cormorant Garamond, Manrope,
    Great Vibes, self-hosted); `make:photos` generalised (entrance crop, logo emblem,
    stone + botanical textures); `IntroLoader` + `app-boot.ts`/`BootMarker`; engraved-band
    `Header`, `NavDesktop` (6 links, 3 + 3), emerald `MobileMenu` (roman-numbered links,
    Book a Stay, call, WhatsApp, address); `BookStayLink`; `Ornaments` (arch frame,
    medallion ring, sprig); `EntranceHero` rewritten + `HeroDepth`; `.btn-royal` family;
    `site.homeHero` → the night entrance; `site.navigation.main` remapped; boot script
    skips the loader on data saver / 2G–3G.
  - **Tests:** shell (6 links, `data-state` overlay/solid, Stay/Events/Gallery bead,
    emerald menu, new "primary nav only links to routes and anchors that exist"); home
    (emerald hero, the two CTAs, new "every emerald scope carries text-ink"); entrance
    (night-entrance photo + srcset, CTAs, phone width ≤ 720 w; new loader tests: plays
    and leaves without blocking the pointer, a key ends it early, slow connection skips
    it, client navigation never replays it, CSS-only exit without JS; reduced motion
    checks `.entrance-subline`); smooth-scroll hash test uses "Explore the Experience"
    → #explore (112 px, scroll-mt-28). **All 366 e2e tests pass**; lint, typecheck,
    contrast gate (light/peacock/emerald), build clean.
  - **Measured (headless Chromium, production build):** no horizontal overflow on 5
    routes at 360–1920; no console errors; CLS 0 except the home page at 1024/1440/1536
    (0.006–0.0095: the headline's web-font swap at ~250 ms, under the loader). Throttled
    phone (4× CPU, 150 ms RTT, 1.6 Mbps): FCP 1.58–1.83 s, LCP 1.67–1.86 s, CLS 0,
    531–579 KB. Wheel scrolling during the hero entrance (1440×900, Lenis): first scroll
    frame 77 ms after the wheel vs 32 ms at rest; frame pacing unchanged at 1× CPU
    (mean 17.9 vs 17.5 ms), slightly worse at 4× (24.4 vs 20.9 ms). A trace shows
    the cost is rasterisation (software in headless), not main-thread work. Not
    measured on real devices, Safari or Firefox.
- 2026-10-26: "The Dipali Experience" — the section below the home hero (not a numbered
  step; current step stays 11; uncommitted per the brief).
  - **Built:** `DipaliExperience` (server component) in the `#welcome` section; `.experience*`
    and `.btn-royal-solid` in theme.css; `site.homeExperience` + schema; portrait crop job;
    new palette-3 texture graded and wired; mosaic de-duplication; contrast pair.
  - **Tests:** home spec — the section's heading, optimised portrait photo (srcset,
    explicit 1200×1500) and CTA → `#explore`; entrance reduced-motion test — copy,
    photo and gold frame complete with nothing clipped. **All 368 e2e tests pass**;
    lint, typecheck, contrast gate, build clean.
  - **Measured (headless Chromium, production build) at 360/390/768/1024/1280/1440/1920:**
    no horizontal overflow, no console errors, CLS 0 from the section (home total
    unchanged: 0.0095 at 1024, 0.0062 at 1440 from the hero font swap). Reduced motion:
    everything visible at once; no JS: frame and photo shown unclipped.
- 2026-10-26: Hero video, button system, layered scroll and "A World Within Dipali" (not a
  numbered step; current step stays 11; uncommitted per the brief).
  - **Built:** `scripts/make-video.ts` + `pnpm make:video` → `public/video/entrance-night-arch-532.mp4`;
    `site.homeHeroVideo` + schema; `HeroVideo`; shared button family rewritten
    (`.btn-royal*` retired, `.btn-compact` added; header, menu, hero, Experience and the
    sticky bar switched); `LayeredSection` + `useScrollProgress` `"rise"` mode and
    `cssVar: null`; `.layers` wrapper; `WorldWithin` + `ScrollReveal` wipe variants;
    pillar index and its CSS removed; contrast pairs.
  - **Tests:** entrance — hero video plays muted/inline after load, the pause control,
    autoplay refused and load failure keep the photo, reduced motion and phones fetch no
    video (and never the 13 MB source), the hero holds then scrolls away, World rises
    over the Experience, keyboard focus is never covered, reduced motion stacks; home —
    A World Within Dipali's four items, links, photos and keyboard; button selectors.
    **All 388 e2e tests pass**; lint, typecheck, contrast gate, build clean.
  - **Measured (production build):** no horizontal overflow and no console errors at
    1440 / 820 / 390; home CLS 0.0062 at 1440 (the known font swap), 0 at 820 and 390;
    throttled phone (4× CPU, slow 4G): LCP 1.38–1.86 s, CLS 0, 572 KB, no video request;
    desktop clip requested ~4.1 s after navigation (after `load` and the opening);
    34 Tab stops all visible and on top; a mid-page reload restores the held, covered
    state. Scroll pacing in the decision rows. Not tested on Safari/Firefox or real phones.
- 2026-10-26: Claude Code permissions for this repo (tooling only, not a numbered step;
  current step unchanged; no app code touched; uncommitted).
  - **Added:** personal, git-ignored `.claude/settings.local.json` — allow rules for the
    `package.json` scripts and in-project edits; ask rules for commit/push, history-rewriting
    git, deletes, dependency installs, deploys (`wrangler`), `.env*` files and the source
    media in `public/hotel|video|brand|palettes`.
  - **Local toolchain is off-spec:** no `pnpm` on PATH, Node 20.20.0 (`.nvmrc` 24.19.0 is
    not installed), `node_modules` installed by npm (untracked `package-lock.json`). npm
    pulled `playwright-core` 1.64.1 beside 1.63.0 (pnpm lockfile pins 1.63.0 only), so
    typecheck and build fail locally on `tests/*.spec.ts` (`Page` type mismatch); lint and
    contrast pass; e2e not run. Fix: Node 24.19.0 + `pnpm install --frozen-lockfile`.
  - **Resolved the same day** (by the owner of this machine): Node 24.19.0, pnpm 12.15.0
    (corepack), `pnpm install --frozen-lockfile` and Playwright's Chromium; the npm tree is
    kept as `node_modules.npm-backup/` (now ignored — see the decision row) and the untracked
    `package-lock.json` is kept, both pending a decision. Typecheck and build pass.
- 2026-10-26: Interrupted homepage work finished — "The Grand Reveal" and "The Living
  Experiences" (not a numbered step; current step stays 11; uncommitted).
  - **Recovered state:** the office machine had pushed only the reveal's image crops
    (`make-photos.ts` job + 8 `reveal-night-*` WebPs, `e7ea455`) — no component, CSS,
    content entry, tests or docs; nothing of the Living Experiences existed.
  - **Built:** `GrandReveal`, `LivingExperiences`, `ScrollScene` (a scene's own `--p`),
    `CornerOrnament`; `ScrollReveal` variants `wipe-right`, `slide-left`, `slide-right`;
    `.grand-reveal*`, `.living*` and `.corner-*` in theme.css; `site.homeReveal` + schema
    and the `21:9` aspect; the pool's portrait crop as `leisure.pool.images[1]`; `page.tsx`
    places both after `#explore` (`#reveal`, `#living`). CLAUDE.md class list updated;
    `docs/data-needed.md` regenerated (133 items, 25 photos).
  - **Tests:** home — the reveal's photograph (panorama, phone crop, explicit size), its
    frame parts and call to action; the four Living experiences in order, their links,
    real sized photographs and layers, and no photograph repeated from elsewhere on the
    page. Entrance — rich motion: the doorway shows the porch while the far side of the
    frame is still closed, then the whole photograph shows and the frame completes before
    the stage is centred; a Living composition is veiled entering and clear, shifted
    sideways, at the centre, its text never dimmed; reduced motion: nothing clipped,
    offset or veiled and no `--p`; phone: the portrait crop, a one-time reveal, no
    overflow. **All 402 e2e tests pass** (388 before + 14 new); lint, typecheck,
    contrast gate, content check and build clean (Node 24.19.0, pnpm 12.15.0).
  - **Checked in headless Chromium (production build):** 360 and 390 (touch), 768 (touch),
    1024×768, 1280×800, 1366×768, 1440×900, 1536×864 and 1920×1080 — no horizontal
    overflow; rich motion from 1024; reduced motion and no JS show the complete static
    compositions. Not checked on Safari/Firefox or real devices; the new scenes were not
    frame-timed.
  - **Environment:** `node_modules.npm-backup/` excluded (decision row). The first baseline
    e2e run failed 12 enquiry-form tests only because the reused preview build lacked the
    test form endpoint (Playwright sets it just for a server it starts itself); built with
    it, all 36 pass.
