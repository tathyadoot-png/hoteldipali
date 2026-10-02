# Hotel Dipali Website — Project Plan

Last updated: 2026-10-02
Current step: 2 — Design tokens & styleguide

## Status legend

`[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Phases and steps

### Phase 0 — Foundation

- [x] 1. Scaffold, CLAUDE.md, PLAN.md, public data notes
- [ ] 2. Design tokens, fonts, component classes, /styleguide
- [ ] 3. Content schemas, loaders, sample data, check:content, docs/data-needed.md
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
- [ ] Hindi version (if approved)

## Decisions log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-02 | Phase 1 is static; site goes dynamic in Phase 2. | Fast, cheap, reliable launch; hotel has no CMS/dev team yet. |
| 2026-10-02 | Hotel has a third-party booking engine; we link out, never build booking. | Avoid duplicating payments/availability systems we don't own. |
| 2026-10-02 | Website palette is the brand master palette; decided in Prompt 2. | Keep visual identity decisions in one dedicated step. |
| 2026-10-02 | No AggregateRating/Review schema on our own pages. | Cannot verify review authenticity; avoid search-engine penalties. |
| 2026-10-02 | No live Instagram feed; static curated strip instead. | Avoid third-party script weight and uptime dependency. |
| 2026-10-02 | docs/ (plural) is the canonical docs folder; existing doc/ was renamed to docs/. | Match CLAUDE.md and PLAN.md path conventions; keep brief.md and marketing-scope.md alongside the rest of the docs. |
| 2026-10-02 | TypeScript pinned to 6.0.3 instead of the newly released 7.x line. | typescript-eslint 8.71.0 (latest) only supports typescript `<6.1.0`; using 7.x would break linting. Revisit once typescript-eslint adds TS 7 support. |

## Open questions

See CLAUDE.md section M:

- Hindi version yes/no.
- Official single address and pincode.
- Room count and categories.
- Booking engine name and URL format.
- Final palette and fonts (Prompt 2).
- Who publishes blogs and offers after launch.

## Change log

- 2026-10-02: Step 1 completed: project scaffolded.
