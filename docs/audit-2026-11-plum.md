# Audit — "Royal Plum & Gold" re-theme and wow-motion feasibility

Date: 2026-11-03 · Inspection only: no app code, content, CSS, test or config was changed.
The only new file is this one.

**Sources for every number below.** Each figure is one of the following:

- **measured today:** scripts run against the repo at `3f30fac` (contrast via the project's own
  `src/lib/contrast.ts`, images via PIL, bundle sizes via gzip of a fresh `pnpm build`,
  file sizes via `find`);
- **quoted from `docs/PLAN.md`:** dated rows or change-log entries, cited by date;
- **estimate:** labelled as such, with the reason no measurement was possible. Nothing may be
  installed during this audit.

**Snapshot (Step 0).** At the start `git status` was clean on `main`, and `git log --oneline -5`
was `3f30fac fixes · acfc2f4 fixes · 73e2721 fixes · e7ea455 fixes · 5586dd5 image add`. With
nothing to commit, no snapshot commit was made and no branch was created. During the audit an
untracked folder appeared that this audit did not create: `public/svg/hotel-dipali-logo-vector.svg`
(see G1). The branch and commit steps are left for the owner's approval.

**Conflicts with standing instructions** (each needs a decision before Phase 1):

- CLAUDE.md §E names Emerald "the owner's fixed palette … do not change". The plum palette
  supersedes it, so §E needs rewriting.
- `docs/brief.md` §14.6 says "Keep Instrument Serif + Figtree and the existing Ivory & Gold
  tokens unless I approve a change", and §14.7 cites "344 existing e2e tests". Both are stale:
  the site already runs Cormorant/Manrope/Great Vibes and Peacock/Emerald, and PLAN.md
  (2026-10-27) records 454 tests. §14 should be updated or retired.
- CLAUDE.md §K: "No WebGL/Three.js". See G for the exact change the recommendation needs.

---

## A. Theme inventory

### Tokens today (`src/styles/theme.css`)

| Token | Light (`@theme`, l.29–41) | `peacock` (l.71–83) | `emerald` (l.91–112) |
| --- | --- | --- | --- |
| surface | #f8f4ec | #0f2e2a | #073b30 |
| surface-alt | #efe7da | #0a211e | #0d5145 |
| ink | #13221e | #f6f1e7 | #f4ebdd |
| ink-muted | #4a5752 | #c5cec8 | #b7c2a5 |
| brand | #0f2e2a | #0a211e | #073b30 |
| brand-ink | #f8f4ec | #f6f1e7 | #f4ebdd |
| accent | #9a4527 (terracotta) | #cda866 | #c5a15e |
| accent-ink | #ffffff | #0a211e | #252b26 (Soft Charcoal) |
| highlight | #b89a5e | #cda866 | #c5a15e |
| line | rgba(19,34,30,.14) | rgba(246,241,231,.16) | rgba(197,161,94,.34) |
| emerald-only | — | — | `--gold-glint`, `--gold-shade` (color-mix), `--texture-stone`, `--texture-botanical` (+ phone override l.116–120) |

Non-colour tokens: 5 fonts (`display`, `body`, `royal`, `ui`, `script`), 2 radii, 2 shadows,
5 breakpoints, 3 layout and 3 motion tokens. `:root` adds `--arch`, plus `--arrow`, `--check` and
`--noise` as data-URI SVG masks. The component-scoped variables that matter for the re-theme are
`--stone-veil` (l.4562, `color-mix(surface 75%)`) and `--field-rule` (the enquiry fields).

There is no `data-theme="light"`: light is the default (no attribute). "light" appears only as a
styleguide pane/mode name (`ThemePreviewToggle.tsx`, `styleguide/page.tsx`) and in
`contrast.ts`'s `Variant` type.

### Where the variants are used (attribute or variant-string occurrences, measured today)

| `peacock` | | `emerald` | |
| --- | --- | --- | --- |
| src/styles/theme.css | 7 | src/styles/theme.css | 6 |
| src/lib/contrast.ts | 4 | src/lib/contrast.ts | 4 |
| src/components/styleguide/ThemePreviewToggle.tsx | 4 | tests/shell.spec.ts | 4 |
| tests/home.spec.ts | 3 | tests/home.spec.ts | 3 |
| src/app/weddings/page.tsx | 3 | src/components/home/DipaliExperience.tsx | 2 |
| src/app/page.tsx | 2 | src/app/page.tsx, contact/page.tsx | 1 + 1 |
| src/app/dining/page.tsx | 2 | Header, MobileMenu, Footer | 1 each |
| src/app/events, rooms, rooms/[slug], styleguide pages | 1 each | IntroLoader, EntranceHero, RoomDiscovery, UnwindRipple | 1 each |
| src/components/home/DineHandoff.tsx | 1 | src/components/forms/EnquiryForm.tsx | 1 |
| tests/weddings, events, dining specs | 1 each | src/components/motion/CustomCursor.tsx (unused) | 1 |
| | | tests/contact.spec.ts | 1 |

Counting every mention (class comments, labels, docs): `peacock` has 79 hits in 14 src files,
18 in 5 test files and 2 in scripts; `emerald` has 92 hits in 17 src files, 17 in 4 test files
and 5 in scripts. Quoted `"peacock"`/`"emerald"` string literals: **68** in src/tests/scripts.

Identifiers tied to the names besides `data-theme`:

- the asset `emerald-stone-1024.webp` (`theme.css:110`, `EntranceHero.tsx:29` preload, and the
  `make-photos.ts` slug);
- the selector lists `:is([data-theme="emerald"], [data-theme="peacock"])` at `theme.css:413–414`
  and `522–523`;
- `[data-theme="peacock"].paper-grain` at l.1406–1407;
- the styleguide label "Peacock", and `contrast.ts`'s parser regexes (l.63–64) and `Variant` type.

No CSS class or custom property contains either word.

### Rename effort: peacock → `dark`, emerald → `deep`

Mechanical, about 30 files.

| Area | Files | Effort |
| --- | --- | --- |
| theme.css selectors, texture path, comments | 1 (selectors on 8 lines; ~60 comment mentions) | small |
| contrast gate | `contrast.ts`, `scripts/check-contrast.ts` | small |
| `data-theme` attributes | ~20 TSX files | small |
| styleguide toggle labels | 2 | small |
| tests (attribute and label strings only; no test asserts a colour value; the shell test checks only `rgba(0, 0, 0, 0)` for transparency) | 8 specs (home, shell, styleguide, contact, dining, events, weddings, entrance) | small |
| asset rename `emerald-stone-*` → role name | theme.css, EntranceHero, make-photos | small |
| docs | CLAUDE.md §E/§K, PLAN.md | small |

**Estimate:** 2–3 hours including a full e2e run. This is an estimate: nothing was renamed.

**Proof of safety:** do the rename with no value changes, as its own commit. `pnpm check:contrast`
must then print the same ratios (47 pair checks today: 14 light, 15 peacock, 18 emerald,
measured) under the new labels.

**Naming note:** the two proposed new tokens `gold-text` and `lavender` are colour names, which
contradicts "role-based so future palette changes never rename code". Suggested role names:
`highlight-ink` (gold when it must be text on light) and `surface-tint` (decorative wash).

---

## B. Colour leaks (hex / rgb / hsl outside the token blocks)

Searched: `src/**/*.{ts,tsx,css,svg}`, `scripts/*.ts`, `public/**/*.svg`, `content/**/*.json`,
`tests/*.ts`.

| Where | What | Verdict |
| --- | --- | --- |
| `theme.css` l.49 `--shadow-lift` | `rgba(8, 24, 21, .45)`: green-black | **must change** (derive from ink, e.g. `color-mix(in srgb, var(--color-ink) 45%, transparent)`) |
| `theme.css` l.820, 917, 1830, 2585, 2760, 3628, 4606, 4664, 4784, 5456 | 10 box-shadows in `rgba(8, 18, 15, …)` / `rgba(4, 14, 11, …)`: green-black | **must change** (same: token-derived) |
| `theme.css` l.1267 | `rgba(0, 0, 0, .3)`: neutral | fine |
| `theme.css` data-URI masks (`--arrow`, `--check`, `--noise`) | `stroke='black'`, used as masks only | fine |
| `theme.css` 38 gradient declarations | all built from `var(--color-*)` / `color-mix`, so they re-theme automatically (classified under "Gradients" below) | fine |
| `src/**/*.ts(x)` | **no** colour literals | fine |
| `src/app/icon.svg` | `#FAF6EE` ground, `#8A5A14` bronze "D", `font-family="Georgia…"` | **must change** (placeholder favicon; also a font name outside `fonts.ts`) |
| `scripts/make-photos.ts:153` | stone filter `hue-rotate(-14deg) saturate(.9) brightness(.95)` (toward emerald) | **must change** (see C) |
| `scripts/make-photos.ts:162` | botanical filter `sepia(.18) saturate(.95) hue-rotate(-6deg) brightness(.66) contrast(1.08)` | **must change / drop** (see C) |
| `scripts/make-placeholders.ts:38–48` | 6 category palettes in sand/olive; `bar` = `#0B2F2E/#0E3B3A` (old peacock); comment l.32–33 still says "sandstone" | **regenerate** after updating the map |
| `public/sample/*.svg` (54 files) | 14 distinct sand/olive hexes; 25 placeholders still referenced by content (`check:content`, measured) | **regenerate** (`pnpm make:placeholders`) |
| `src/lib/contrast.ts` | no hex; pairs are keyed by variant names and contain an emerald-specific downgrade (l.151–157) | **must change** (rename; the downgrade becomes unnecessary, since gold on deep surface-alt = 7.60:1; add new pairs from D) |
| `public/svg/hotel-dipali-logo-vector.svg` (untracked) | 5 gold gradient stops and 1 stroke hex (yellow golds `#FFF0A8`, `#FFF1A6`) | fine as an asset, but its provenance is unknown (G1) |
| OG / social images | none exist yet (PLAN step 14) | n/a; create in the plum palette |
| `content/**/*.json` | no colour data | fine |
| `tests/*.ts` | no colour values asserted | fine |

### Gradients: the rule versus the code

The proposed rule says "still none on surfaces or text", but the code has 38 gradient
declarations today, all token-derived (measured, classified by selector):

| Kind | Count | Examples |
| --- | --- | --- |
| Flat veils over textures (one colour, gradient syntax) | 9 | `.header-shell[solid]`, `.menu-dialog`, `.stay-tablet`, `.enquiry`, `.contact-hero` |
| Legibility scrims over photographs | 10 | `.hero-gradient` ×2, `.hero-tint`, `.celebrate-shade` ×2, `.grand-reveal-window::after`, `.pictures-caption` |
| Lighting / glow on an object | 5 | `.menu-medallion`, `.finale-medallion`, `.finale-door`, `.intro-canvas` glow, `.grand-reveal-section` glow |
| Gold line fades | 7 | `.link-royal::after`, `.intro-base`, `.finale-course-l/-r`, `.enquiry-progress` |
| One-pass sheens | 2 | `.btn-primary::before` glint, `.intro-sweep` |
| Tonal surface deepening (surface → accent-ink) | 2 | `.grand-reveal-section`, `.finale-stone` |
| Scrollbar thumb (metallic gold) | 2 | `html::-webkit-scrollbar-thumb` (+ hover) |
| Mask | 1 | `.intro-panel` |

**Recommendation.** Reword the rule rather than add "two exceptions". Proposed wording:

> No gradient between two hues on any surface or text. Same-hue veils and legibility scrims,
> lighting on an object, gold line fades and one-pass foil sheens are allowed, all built from
> tokens.

That covers the two proposed exceptions, (1) lighting and (2) the foil sheen. Both already exist
(the `.btn-primary` glint, the medallion lighting) and pass review. The two tonal surface
deepenings need a decision under the new palette (see D, "footer foot").

---

## C. Emerald-bound assets

Measured today. Median hue is over pixels with saturation > 15%.

| Asset | Today | Measured | Used by | Recommendation |
| --- | --- | --- | --- | --- |
| `--texture-stone` → `images/textures/emerald-stone-1024.webp` (23 KB) | from `public/palettes/3.png` (1672×941, 2.0 MB), graded by `hue-rotate(-14deg)` | source median hue 180° (teal); output mean `#09221e`, median hue 170°, brightest `#105547` | 10 rules: header (solid), loader canvas, Experience plinth, Stay tablet, Unwind plaque, footer stone and gate, contact front desk, enquiry tablet | **Replace with our own generated texture:** an SVG `feTurbulence` + `feColorMatrix` "stone" in the deep/dark plum ramp, baked to WebP by `make:photos` (the Chromium path it already uses), so there is no runtime filter cost and no rights question. Rename it by role (`texture-stone-1024.webp`). Do **not** regrade: plum sits ~110–115° of hue away, and the CSS `hue-rotate()` matrix does not preserve luminance or saturation at large angles (known behaviour of the filter's linear approximation; not tested here). |
| `--texture-botanical` → `botanical-panel-{480,736}.webp` | from `public/palettes/9.jfif` (gold foliage on teal) | source median hue 181°; output mean `#14312b`, brightest `#817260` | 2 rules: `.menu-dialog` (l.1123), `.intro-panel` (l.2028) | **Drop**, and redraw the foliage as SVG line art (`Botanical` and `.sprig-line` already exist) over the generated stone. A hue-rotate would turn the gold leaves the wrong colour along with the ground. If it must stay, grade with a luminance gradient-map (dark → plum, light → gold) in `make:photos`, not with hue-rotate. Either way, the usage-rights question remains. |
| Loader panel (`IntroLoader`, `.intro-*`) | botanical panel + stone + token glows | token parts follow the theme | loader | Follows the texture decisions above; nothing else to do. |
| `.logo-medallion`, `.menu-medallion`, `.finale-medallion`, header niche | `bg-brand` / token radial | becomes plum `#3E0F4A`; logo median gold on it is 7.78:1 | welcome, menu, footer, header | fine (token-driven) |
| Emblem WebPs `images/brand/logo-emblem-{120…480}.webp` | made from `logo-primary.png`, **no** colour filter | logo median `#ecae33`, hue 40°, saturation 78%; p95 highlight `#fffb8d` (hue 58°) | header, menu, footer, loader | Keep. The logo is the client's mark and must never be regraded without the client's sign-off. Note that the logo **is** a saturated yellow-gold, so "no yellow golds" can only govern UI tokens. Champagne `#C9A45C` has the same hue (40°) at 54% saturation, so the two read as one family, with the logo the brighter metal. |
| `public/brand/lawn.png` (2.3 MB) | referenced nowhere in src/content/scripts | | | Unused; it ships in the export (`out/brand` 2.8 MB). Delete only with the owner's OK. |
| Hero video, photographs | not colour-graded | | | fine |

**Open rights question, unchanged since 2026-10-24 (PLAN.md):** `public/palettes/` look like
downloaded reference images (Pinterest-size, 736 px). Generated textures remove the question for
the site. Note also that the whole folder (5.2 MB, including `--3.png` 2.5 MB and `3.png` 2.0 MB)
is copied into the export today (`out/palettes`, measured), whether or not it is used.

---

## D. Proposed-palette contrast dry run

Method (measured today): the project's own `contrastRatio()` and `pairsForVariant()` from
`src/lib/contrast.ts` were imported and fed the proposed values. Variant mapping:
light → light, peacock → `dark`, emerald → `deep`. **Assumption:** `deep.brand-ink` is not in the
proposal, so `#F6EFE9` (as in `dark`) was used. The gate itself was not edited.

### Existing gate pairs, new values

| Pair | Min | Light | Dark | Deep | Use |
| --- | --- | --- | --- | --- | --- |
| ink / surface | 4.5 | 16.90 | 16.26 | 16.89 | body text |
| ink / surface-alt | 4.5 | 15.14 | 14.91 | 15.67 | body text; `.btn-secondary` hover |
| ink-muted / surface | 4.5 | 7.59 | 10.54 | 10.95 | secondary text |
| ink-muted / surface-alt | 4.5 | 6.80 | 9.67 | 10.16 | secondary text |
| accent-ink / accent | 4.5 | 15.31 | 7.89 | 8.19 | `.btn-primary`; pressed `.chip` |
| brand-ink / brand | 4.5 | 14.25 | 13.44 | 13.44 | brand band |
| accent / surface | 4.5 | 14.25 | 7.89 | 8.19 | small accent text (`.field-error`, current nav) |
| accent / surface-alt | 4.5 (deep: 3) | 12.77 | 7.23 | 7.60 | small accent text on alt |
| brand / highlight | 4.5 | 5.29 | 7.84 | 7.84 | gold plaque label |
| ink / surface (UI) | 3 | 16.90 | 16.26 | 16.89 | `.btn-secondary` border |
| ink / surface-alt (UI) | 3 | 15.14 | 14.91 | 15.67 | border on alt |
| accent / surface (UI) | 3 | 14.25 | 7.89 | 8.19 | markers |
| accent / surface-alt (UI) | 3 | 12.77 | 7.23 | 7.60 | markers on alt |
| brand / surface (light only) | 4.5 | 14.25 | — | — | `.btn-secondary` label; script word |
| highlight / surface (dark, deep) | 3 | — | 9.48 | 9.85 | gold rules |
| highlight / surface-alt (dark, deep) | 3 | — | 8.69 | 9.14 | gold rules |
| ink / accent-ink (deep only) | 4.5 | — | — | 16.89 | footer foot |
| ink-muted / accent-ink (deep only) | 4.5 | — | — | 10.95 | footer foot legal line |
| accent / accent-ink (deep only) | 4.5 | — | — | 8.19 | footer foot link hover |

**All 47 existing checks PASS.**

### New pairs

| Pair | Ratio | Min | Result |
| --- | --- | --- | --- |
| gold-text `#7E5F27` / surface `#FAF6F4` | 5.50 | 4.5 | PASS |
| gold-text / surface-alt `#F1E8EE` | 4.93 | 4.5 | PASS (thin margin) |
| **gold-text / lavender `#DCC7E2`** | **3.75** | 4.5 | **FAIL** |
| plum (brand = accent) / lavender | 9.70 | 4.5 | PASS |
| ink / lavender | 11.51 | 4.5 | PASS |
| ink-muted / lavender | 5.17 | 4.5 | PASS |
| gold (accent) / plum band `#3E0F4A` | 6.52 | 4.5 | PASS |
| ink-muted / plum band | 8.72 | 4.5 | PASS |
| highlight / plum band (ornament) | 7.84 | 3 | PASS |
| logo median `#ecae33` / brand `#3E0F4A` | 7.78 | 3 (graphic) | PASS |
| logo median / deep surface `#170820` | 9.77 | 3 | PASS |
| logo median / dark surface `#1F0B26` | 9.41 | 3 | PASS |
| logo median / deep surface-alt `#22102B` | 9.06 | 3 | PASS |
| logo (mean / p05 shade / p95 highlight) / brand | 7.17 / 2.09 / 14.17 | — | p05 is the logo's own painted shading; logos are exempt from WCAG 1.4.3 |
| logo median / light surface · lavender | 1.83 · 1.25 | — | the logo must never sit on light or lavender (the existing rule "gold logo always on brand" stays) |

**The one FAIL, with the smallest hue-preserving fix.** `gold-text` is HLS 38.6° / 32.4% /
52.7%. Lowering only the lightness:

- `#6E5322` (L 28.4%): 4.55 on lavender, 6.69 on surface, 5.99 on surface-alt;
- `#6D5222` (L 28.1%): 4.62 on lavender, for a margin.

Alternative (no colour change): rule that gold text never sits on lavender; plum on lavender is
9.70. **Recommended:** the alternative if no gold text is planned on lavender, otherwise
`#6D5222`.

### Not FAILs, but decisions the gate cannot see

1. **Light `accent` = `brand` = plum.** Every light accent pair duplicates a brand pair. Error
   text (`.field-error` uses `accent`, `theme.css:1320`) becomes the same plum as headings and
   labels, losing today's distinct terracotta. Proposed: a `danger` token, e.g. `#8E1B2E`
   (8.33 on surface, 7.47 on surface-alt, 5.67 on lavender).
2. **Deep `accent-ink` = deep `surface` (`#170820`).** The footer foot and the Grand Reveal's
   "deepening to charcoal" (`.finale-stone`, `.grand-reveal-section`) lose their tonal step;
   the three deep-only footer-foot pairs collapse into the surface pairs. Darker is not an
   option, because `#170820` is already near-black (`#0E0414` is a 1.04 step). Today's emerald
   foot is a *lighter* charcoal (step 1.16). A desaturated plum-charcoal keeps the effect:
   - `#2A2230` (step 1.25): ink 13.46, muted 8.73, gold 6.53, label on gold 6.53;
   - `#262029` (step 1.21): ink 13.96, muted 9.05, gold 6.77.
3. **Gold ornament on light.** Antique `#B8924F` is 2.69 on surface, 2.41 on surface-alt and
   1.83 on lavender. That is decorative only and allowed, the same as today (`#b89a5e` on
   `#f8f4ec` = 2.45). The gold plaque button on ivory is identified by its 5.29:1 label, as
   today.
4. **Hairline `line`** (14% ink) is about 1.32:1 over surface: decorative, as today. Form
   fields use `--field-rule` and must be re-measured (≥ 3:1, WCAG 1.4.11) on the new stone.
5. **Stone with text:** the measured 2026-10-27 guarantee (gold ≥ 4.60:1 on the texture's
   brightest pixel under the 75% veil) is invalid once the texture changes. Re-measure it
   whichever texture is chosen.

---

## E. Reference-image check — NOT PERFORMED (blocked)

`docs/reference/palette-plum.png` does not exist. The `docs/reference/` folder does not exist, and
no file matching `*plum*` exists in the repo, `D:\tmp` or the other working directories.

Two moodboards in `~/Downloads` were checked and are **not** the plum reference:
`Hotel Dipali Luxury Palette Moodboard.png` (ivory/sand, sky, sage, misty blue and blush
palettes, dated 2026-10-24) and `Luxury Hotel Brand Moodboard.png` (same date). Neither was
used.

**To finish E,** place the image at `docs/reference/palette-plum.png` (not in `public/`). The
sampling method is ready: median colour of hand-picked regions per swatch with PIL, then
ΔE/contrast against the proposed values.

---

## F. Motion inventory

| System | Files | Used where | Gating | Notes |
| --- | --- | --- | --- | --- |
| Lenis smooth wheel | `src/lib/smooth-scroll.ts`, `motion/SmoothScroll.tsx` | every page (root layout) | `(hover: hover) and (pointer: fine)`, no reduced motion | lerp 0.10, wheelMultiplier 1; a notch settles ~716 ms, reversal 37 ms (PLAN 2026-10-21) |
| `useScrollProgress` | `motion/useScrollProgress.ts` | modes `pinned` (DayJourney, unused), `through` (ScrollScene, LayeredSection's scene), `rise` (LayeredSection), `enter` (FooterStage) | IO proximity gate; offsets cached on resize | 1:1, no easing; updates inside Lenis's frame |
| `ScrollScene` (`--p` per scene) | `motion/ScrollScene.tsx` | GrandReveal, CelebrateScene, DineHandoff, UnwindRipple, PicturesAssemble (5) | rich motion | |
| `LayeredSection` (`--cover`) | `motion/LayeredSection.tsx` | home: hero → Experience, Experience → Grand Reveal (2) | rich, viewport ≥ 600 px tall | |
| `ScrollReveal` (one shared IO) | `home/ScrollReveal.tsx` | 7 pages + Footer + EnquiryForm; 58 default `rise`, 8 `mask`, 3 `image`, 2 `wipe-down`, 2 `wipe-centre`, 2 `slide-left` (counted in TSX; other variants used through components) | `<noscript>` and reduced motion show all | 380 ms |
| `TypeFill` | `home/TypeFill.tsx` | CelebrateScene "Celebrate" | rich | copies the `<img>`'s `currentSrc` |
| `HeroDepth` (pointer `--mx/--my`) | `home/HeroDepth.tsx` | home hero | rich | the only pointer handler |
| `HeroVideo` | `home/HeroVideo.tsx` | home hero | ≥ 768 px, after `load`; not reduced motion / data saver / 2G–3G; pause control | AI clip, `sample` |
| `IntroLoader` + `app-boot.ts` | `home/IntroLoader.tsx` | home, once per full load | skipped on `data-intro="off"`; hidden on reduced motion | 1.45 s FLIP, fades by 1.9 s without JS |
| `FooterStage` (`data-revealed`, `--p` enter) | `layout/FooterStage.tsx` | every page | sequence once; instant on focus | ~1.4 s staggered |
| `RoomDiscovery` stage | `home/RoomDiscovery.tsx` | home Stay chapter | hover/focus | |
| `EventFinder` | `events/EventFinder.tsx` | /events/ | | filter, not motion |
| **`CustomCursor`** | `motion/CustomCursor.tsx` (355 lines + 8 CSS rules) | **imported nowhere** | | added in `3f30fac`; contradicts the 2026-10-22 decision "No custom cursor"; undocumented |
| `ScrollSection`, `DayJourney`, `WorldWithin` | | imported nowhere (`ScrollSection` appears only in a comment in `ScrollScene.tsx`) | | PLAN lists DayJourney/WorldWithin for deletion on approval; CLAUDE.md says ScrollSection stays |

### Measured performance, quoted from PLAN.md, with today's bundle sizes

| Metric | Value | Source | Budget | Flag |
| --- | --- | --- | --- | --- |
| Phone LCP / (390×844, 4× CPU, 150 ms RTT, 1.6 Mbps) | 1.66 s | PLAN 2026-10-27 | < 2.5 s | ok |
| Phone LCP /rooms/ | **2.86 s** | PLAN 2026-10-27 | < 2.5 s | **over budget** (the featured room photo; was 2.83 s before the footer work) |
| Phone LCP /contact/ | 2.01 s | PLAN 2026-10-27 | < 2.5 s | watch |
| Phone LCP /weddings/ | 1.23 s | PLAN 2026-10-27 | | ok |
| CLS /weddings/ outlier | 0.27 (1 of 15 runs) | PLAN 2026-10-27 | < 0.1 | watch in field data |
| Home CLS desktop | 0.0062–0.0095 (font swap under the loader) | PLAN 2026-10-24/26 | < 0.1 | ok |
| Home chapters frame time (HD 530, 1440×900) | p95 16.8 ms, 0 frames > 33 ms | PLAN 2026-10-27 | | ok |
| Grand Reveal | 4–5 of ~345 frames at two vsyncs, worst 34 ms | PLAN 2026-10-27 | | **near budget** |
| Hero → Experience (layered) | 18 of 392 frames at two vsyncs (HD 530); 4× CPU p95 39.9 ms, 19/343 > 33 ms (GTX 1660) | PLAN 2026-10-26/27 | | **near budget** |
| First wheel frame during the hero entrance | 77 ms (vs 32 ms at rest) | PLAN 2026-10-24 | | watch |
| Home JS | 8 scripts, 621.6 KB raw / **191.2 KB gzip** | measured today (fresh build) | | baseline for G |
| CSS | 117.9 KB raw / 21.9 KB gzip (+0.9 KB) | measured today | | |
| Fonts | 7 woff2 files, 177 KB total (Great Vibes alone 42.8 KB for one script word; Instrument Serif + Figtree still in use: `font-display` 9, `font-body` 12 uses) | measured today | | no palette problem; a weight note for step 17 |

Not measured anywhere: Safari, Firefox, real phones; frame timing of the footer's scroll depth.

---

## G. 3D / next-level motion feasibility

Weights for libraries that are not installed are **estimates from their published bundle sizes,
not measured** (installing was not allowed). Home JS today is 191.2 KB gzip (measured), so a
~150 KB library would be about +80%.

**About the logo vector.** `public/svg/hotel-dipali-logo-vector.svg` appeared, untracked, during
this audit; this audit did not create it. Measured: 18 polygon paths with **619 straight
segments on integer pixel coordinates and no curves**. Its own `<desc>` reads "Vector silhouette
traced from the supplied Hotel Dipali logo". It is a pixel trace, not the client's master
artwork, and git has no history of it.

From the PNG (measured): 1080×1080; the silhouette is 14 shapes with 4 counters; a crisp edge
band (alpha 33–224, ~10k px) plus a faint glow fringe (alpha 1–32, ~24k px) to discard; wordmark
serifs as thin as 2 px. The bevels and facets are **painted shading** (2.8% of interior pixels sit
on strong luminance edges), not geometry.

| | 1. 3D gold medallion (logo) | 2. Depth-parallax of a real photo | 3. Gold particles / diya field | 4. No-WebGL layered depth |
| --- | --- | --- | --- | --- |
| Shows | the HD emblem as a coin that turns with scroll | the hotel's own night façade with real depth, inside the Grand Reveal portal | drifting points of light | photographs cut into 3–4 planes (sky / building / porch / forecourt) moving at different rates, as the portal already does with two |
| Honesty | honest: the client's own mark. But extruding painted bevels double-shades them, and a trace changes the letterforms. | honest if subtle: the real photo, only displaced, with stretching at depth edges at small amplitude | decorative; claims nothing, but duplicates the footer's lamp motif and reads as generic "luxury" | honest, but the gaps behind cut planes must be filled (invented sky/wall pixels) |
| JS (gzip) | Three.js + `SVGLoader` ≈ 150–170 KB (estimate) | raw WebGL, one shader ≈ 4–8 KB (estimate) | canvas2D ≈ 2–4 KB, or WebGL | ~0 KB (CSS on the existing `--p`) |
| Assets | a real vector (none yet) | a depth map ≈ 15–30 KB WebP (estimate); the photo is already loaded | none | 3–4 alpha WebP layers (≈ +100–200 KB, estimate) |
| GPU | small mesh; a WebGL context | one quad, 2 textures ≈ 7.9 MB VRAM (1920×823 + 960×412 RGBA, computed) | per-frame fill; a continuous loop | compositor layers only |
| Gating | rich motion + WebGL | rich motion + WebGL + no data saver | would need its own | rich motion |
| Static fallback | the emblem WebP | today's CSS portal composition | none needed | today's composition |
| Accessibility | decorative (`aria-hidden`); reduced motion → still | the same | **a continuous loop conflicts with §K (never looping) and needs a WCAG 2.2.2 pause** | the same as the existing scenes |
| Effort (estimate) | 2–3 days, **plus** the client's master vector (AI/EPS/PDF/SVG with curves) | 1.5–2 days | 1 day | 2–3 days (mask authoring + inpainting) |
| Verdict | not without the master vector; the trace is stair-stepped at close-up scale | **recommended** | rejected | fallback if WebGL is refused |

### Recommendation: one signature 3D moment

**Depth-parallax of the hotel's real night façade, in The Grand Reveal (`#reveal`), behind the
existing portal arch.**

- **What it is:** as the visitor passes through the archway, the façade separates into depth: the
  porch and columns move against the building and the sky. This replaces the photograph's
  current flat "settles from 12% closer" scale; the arch, frame and inscription stay as they are.
- **Why this one:** it deepens the page's existing signature with the real hotel instead of adding
  a new device, and it serves goals 1–2 (the building sells the weddings and stays). It costs
  ~4–8 KB of JS rather than ~150 KB.
- **The depth map** is hand-authored as SVG polygons with gradient fills (sky far, tower, façade,
  porch, forecourt near) and rasterised and blurred by `make:photos` in Chromium. That needs no
  ML model and no new tool, and stays honest and controllable. (A generated depth map would mean
  installing a depth model, which needs approval.)
- **Rendering:** draws only on Lenis/scroll events, with no idle rAF loop. The context is released
  off-screen, and the canvas is never the LCP (the photo stays the `<img>` underneath).
- **Prerequisites:** the photo's open questions (usage rights, the "HOTEL DEEPALI" tower kept out
  of frame at every parallax offset, the wet forecourt) should be settled first, because a depth
  map is authored per photograph. A dry blue-hour replacement needs a new map (~2 h, estimate).

**The exact rule change it needs (CLAUDE.md §K).** Replace "No WebGL/Three.js." with:

> No Three.js or other 3D / animation library. One WebGL scene is allowed: the Grand Reveal's
> depth-parallax photograph, written as raw WebGL in one component (≤ 8 KB gzip), mounted only
> under `html[data-motion="rich"]` when a WebGL context is available, drawing only on scroll
> (never an idle loop), releasing its context off-screen. The existing CSS portal is its complete
> static fallback (phones, reduced motion, data saver, no WebGL, context loss).

PLAN decision 2026-10-27 ("3D investigated, not used") already names exactly this unlock ("a
depth map … for a parallax-displaced photograph"). If WebGL stays forbidden, option 4 achieves
most of the effect with no rule change.

**The foil sheen and lighting exceptions** (B) can be used without WebGL. For example, one pass
of `.btn-primary::before`-style sheen across the emblem and gold rules when the gate opens fits
the new gold family at 0 KB.

---

## H. Launch readiness

**Remaining PLAN steps:**

- 11: Pool & Gym, Gallery + Lightbox
- 12: About, FAQ (Contact is done)
- 13: wedding campaign LP, legal pages, 404
- 14: SEO (metadata, sitemap, robots, `llms.txt`, JSON-LD, OG)
- 15: analytics + consent
- 16: motion polish
- 17: QA
- 18: Cloudflare deploy

The build at HEAD passes (measured today: 16 routes, contrast gate clean).

### Deploy blockers and risks (measured today unless noted)

| Item | Finding | Blocks? |
| --- | --- | --- |
| Export size | `out/` = **515 MB, 359 files** | uploads every deploy; not a hard limit |
| Files > 25 MiB | none. The largest is `DSC_3355.JPG` at 25,782,590 B = **24.6 MiB**, 1.6 MiB under Cloudflare Pages' 25 MiB per-file limit (limit from Cloudflare's docs, not tested). PLAN's "files up to 26 MB" is decimal MB. Any original ≥ 26,214,400 B would fail the deploy. | risk |
| `public/hotel/` originals | 27 files, 447 MB, all copied into the export | **yes** (privacy/weight; move out of `public/` with sign-off) |
| Night originals in `public/images/hotel/` | 3 × 7.5–7.8 MiB (`…0038`, `…0041` (unused, "DIPALI RESIDENCY"), `…0042`) | yes (move with sign-off) |
| `public/video/1.mp4` | 12.9 MB AI source, in the export (`out/video` 14 MB) | yes |
| `public/palettes/` | 5.2 MB in the export | yes (see C) |
| `public/brand/lawn.png` | 2.3 MB, unreferenced | cleanup |
| Git repo | originals are tracked: `git count-objects` 499.6 MiB | slow Cloudflare git clones; consider a source folder outside git or LFS |
| Lockfiles | **both `pnpm-lock.yaml` and `package-lock.json` are tracked** (the latter since `73e2721`); `package.json` has no `packageManager` field. A CI that picks npm installs a different tree (PLAN 2026-10-26: npm pulled `playwright-core` 1.64.1 and typecheck broke). | **yes:** keep one lockfile and add `packageManager` |
| `/dev/content/` | built into the export (`○ /dev/content`) | yes (PLAN pre-launch list) |
| `noindex` in `layout.tsx` | present (`robots:` at l.22) | yes, removed in step 14 |
| No sitemap, robots, `llms.txt`, custom 404 | `out/404.html` is Next's default | steps 13–14 |
| Form endpoint | `NEXT_PUBLIC_FORM_ENDPOINT` unset; every form shows the call/WhatsApp notice | yes (owner supplies it) |
| Content gate | `check:content`: 87 sample, 46 public-unverified, 0 verified; 25 placeholder images, 5 placeholder phones, 3 reviews without permission | `pnpm release` blocks by design |
| AI hero video | `sample`; launch blocked until original footage | yes |
| Unused code | `CustomCursor.tsx` (+8 CSS rules), `DayJourney.tsx`, `WorldWithin.tsx` (+ any CSS left for them); `ScrollSection.tsx` kept by rule | cleanup (owner OK) |
| Favicon | placeholder `icon.svg` (bronze "D") | yes (real mark) |

**Open questions that block launch:** official address and pincode; usage rights for the
photographs and `public/palettes/`; the "Dipali Residency" / "Hotel Deepali" signage; real
footage for the hero; the booking engine URL; the form endpoint; real numbers for the outlets; the
`logo-reverse` mark and favicon (or the master vector, which also unlocks G1); whether the food is
veg-only; and **the plum reference image (E)**.

---

## I. Recommended phases (one per future prompt)

| # | Phase | Files touched | Tests affected | Risk | Rollback point |
| --- | --- | --- | --- | --- | --- |
| 1a | **Variant rename** (no value change): peacock → `dark`, emerald → `deep`; role-named texture file | theme.css, contrast.ts, check-contrast.ts, ~20 TSX, styleguide toggle, make-photos slug, EntranceHero preload, CLAUDE.md §E | 8 specs: strings only. The gate must print identical ratios. | low | the commit before 1a |
| 1b | **Palette swap**: plum values; `highlight-ink` and `surface-tint` (role names); `danger`; deep `accent-ink` plum-charcoal; token-derived shadows (11); generated stone texture; botanical dropped or redrawn; placeholders regenerated; favicon; gate pairs added (D) and the emerald downgrade removed; stone-veil and `--field-rule` re-measured; §E and the gradient wording rewritten | theme.css, contrast.ts, make-photos.ts, make-placeholders.ts, `public/sample/*` (regenerated), `public/images/textures/*`, `icon.svg`, Ornaments/Botanical if redrawn, CLAUDE.md, PLAN.md | the contrast gate; screenshot review at 360/768/1024/1440; probably no spec changes | medium (visual) | the 1a commit |
| 2 | **Remaining pages**: steps 11, 12 (About, FAQ) and 13 (wedding LP, 404); nav anchors (`/#unwind`, `/#gallery`) become real routes; `BUILT_PAGES` grows. Likely 2–3 prompts, one per step. | new `src/app/*` routes, routes.ts, content loaders, nav content | new specs per page; shell nav test updated | low–medium (content is mostly `sample`) | the commit before each step |
| 3 | **3D signature** (after the §K change): depth-parallax façade in the Grand Reveal | new `DepthPhoto.tsx`, GrandReveal.tsx, theme.css, make-photos (depth job + SVG source), CLAUDE.md §K | entrance spec: canvas only under rich motion + WebGL; portal fallback with WebGL disabled; no depth-map request on phones or reduced motion; frame timing measured | medium–high (GPU variance, Safari untested) | the component is additive: removing it restores today's portal |
| 4 | **Scroll choreography** (step 16): carry the chapter motion language to the inner pages; fix the near-budget scenes (Grand Reveal, hero → Experience) | theme.css, ScrollReveal, inner pages | entrance, home and per-page specs | medium (performance) | the commit before 4 |
| 5 | **Legal, SEO, analytics** (steps 13-legal, 14, 15): policy pages, metadata, sitemap, robots (named AI crawlers), `llms.txt`, JSON-LD without unverified fields, plum OG images, consented `track()` | `src/app/*`, layout.tsx (noindex off **only at launch**), analytics.ts, routes.ts | new SEO spec; footer legal links appear | low | per-step commits |
| 6 | **QA and deploy** (steps 17–18): originals, video source, palettes and night originals out of `public/` (sign-off); `/dev/content/` removed; one lockfile + `packageManager`; unused components deleted (owner OK); Lighthouse and real devices (Android mid-range, iOS Safari, Firefox); `/rooms/` LCP under 2.5 s; Cloudflare `_headers` caching | `public/` moves, package.json, `.gitignore`, deploy config | full e2e + accessibility; `pnpm release` must pass, which needs verified content | high (irreversible moves; content readiness) | the commit before 6; originals backed up outside the repo first |

**Order of the next prompts:** 1a → 1b → (place the reference image and finish E before or with
1b) → 2 → 3 (only after the §K decision) → 4 → 5 → 6.
