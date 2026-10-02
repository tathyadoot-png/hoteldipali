# Hotel Dipali Website — Project Plan

Last updated: 2026-10-02
Current step: 4 — Global components (Header, MobileMenu, StickyCtaBar, Footer, …)

## Status legend

`[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Phases and steps

### Phase 0 — Foundation

- [x] 1. Scaffold, CLAUDE.md, PLAN.md, public data notes
- [x] 2. Design tokens, fonts, component classes, /styleguide
- [x] 3. Content schemas, loaders, sample data, check:content, docs/data-needed.md
- [ ] 4. Global components (Header, MobileMenu, StickyCtaBar, Footer, WhatsAppLink,
      CallLink, Picture, Botanical, SectionHeading, Breadcrumbs, cards)
- [ ] 5. EnquiryForm + /thank-you/

### Phase 1A — Core pages

- [ ] 6. Home
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

## Open questions

See CLAUDE.md section M:

- Official single address and pincode (platforms conflict — see docs/public-data.md).
- Room count and categories.
- Booking engine name and URL format.
- Who publishes blogs and offers after launch.
- Which number is WhatsApp-enabled? (reservations number assumed for now).
- Is the food veg-only? (listed as vegetarian on OTAs — confirm before claiming).
- Original photos needed before step 6 (Home) — see docs/data-needed.md.

### Pre-launch cleanup (step 18)

- Remove or block the dev-only inspection page `/dev/content/` before launch.

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
