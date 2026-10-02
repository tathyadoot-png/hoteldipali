# MASTER PROMPT — Hotel Dipali Static Website

Paste everything below into a new chat.

---

You are my senior frontend lead and prompt writer. I am building a **static website for Hotel Dipali, Sagar (Madhya Pradesh, India)** using **Claude Code inside VS Code**. Your job is NOT to write the code yourself. Your job is to understand this whole project and then give me **one prompt at a time** that I will paste into Claude Code. After I tell you the result of each prompt, you give me the next one.

Read this entire brief before replying. In your first reply, give me: (1) a 5-line summary of what we are building, (2) the numbered list of build steps you plan, (3) Prompt #1 only.

## 1. Project in one paragraph

Hotel Dipali is a hotel in Sagar, MP, with rooms, wedding lawns and banquet halls, a restaurant, Dipali Bakery, Dipali Sweets, the Infinity Bar, a swimming pool and a gym. There is **no existing website** — we build from scratch. Phase 1 is a **fully static, production-quality website** that showcases everything and turns visitors into **calls, WhatsApp messages and enquiry form submissions**. Room booking, if any, will later link to the hotel's existing third-party booking engine; we do **not** build booking, login, admin or a database now.

- Canonical name: **Hotel Dipali**. "Hotel Deepali" is a common misspelling; mention it once in the footer ("Also searched as Hotel Deepali") and in schema `alternateName`.
- Brand family: Hotel Dipali (master) → Dipali Bakery, Dipali Sweets, Infinity Bar (sub-brands).
- Location line we can use: "Near Makronia Railway Crossing, Jabalpur Road, Sagar, Madhya Pradesh".

## 2. Goals (in priority order)

1. Wedding and event enquiries (highest value).
2. Direct room enquiries by call / WhatsApp (and later "Book Now" to the hotel's booking engine).
3. Dining, bakery and sweets footfall and orders.
4. Gym and pool membership enquiries from locals.
5. Strong local SEO for Sagar.
6. A UI that feels **premium, editorial and memorable** — "wow", but never slow or confusing.

## 3. Audiences

Wedding families (local and nearby districts), wedding planners, highway and business travellers, families on short stays, corporate organisers, local diners, local gym/pool members, outstation guests attending events.

## 4. Tech stack (fixed — do not change without asking me)

- **Next.js** (latest stable, App Router) with **static export** (`output: 'export'`), **TypeScript strict**.
- **Tailwind CSS (latest stable, v4 style `@theme` in CSS)**.
- **pnpm**. ESLint + Prettier. Playwright for smoke tests.
- Hosting target: **Cloudflare Pages** (static). No server code in Phase 1.
- Forms: post to a **configurable hosted form endpoint** (e.g. Web3Forms / Formspree) set by env var; plus WhatsApp `wa.me` links and `tel:` links.
- Images: static export disables Next's runtime image optimisation, so use pre-optimised images (AVIF/WebP, multiple widths, `srcset`, explicit width/height) via a build-time optimiser or a small custom `<Picture>` component.
- Animation: CSS + IntersectionObserver first. A small library (e.g. Motion) is allowed only if a specific effect needs it.
- No CMS, no database, no auth, no booking engine, no localStorage-based features.

## 5. Theming rule (most important technical rule)

**All colours, fonts, font sizes, radii, shadows and spacing live in ONE file: `src/styles/theme.css`.** Changing that file must re-theme the entire site.

- Define tokens with Tailwind's `@theme` using **semantic names**, e.g. `--color-surface`, `--color-surface-alt`, `--color-ink`, `--color-ink-muted`, `--color-brand`, `--color-accent`, `--color-accent-ink`, `--color-highlight`, `--color-line`, `--font-display`, `--font-body`, `--font-hindi`.
- Components use **only** semantic utilities: `bg-surface`, `text-ink`, `bg-accent`, `font-display`, etc. **Never** raw hex codes, raw Tailwind palette colours (`bg-amber-700`) or font names inside components.
- Create **dedicated reusable classes** in `@layer components` in the same theme file for repeated styles: `.heading-hero`, `.heading-1`, `.heading-2`, `.heading-3`, `.eyebrow`, `.body-lg`, `.body`, `.caption`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.chip`, `.card`, `.link`, `.section`, `.container-site`. Pages use these classes so typography and buttons change everywhere from one place.
- A **dark "Dusk" variant**: `[data-theme="dusk"]` redefines the same semantic tokens. Weddings, Infinity Bar and dark bands on Home use it.
- Build a `/styleguide` page (noindex) that shows every token, type class, button, chip, card and both themes.

## 6. Visual direction — "Garden Journal by day, Dusk by night"

The concept: the hotel's real strengths are its **gardens, food and weddings**. By day the site reads like a beautifully printed **garden journal**; wedding and bar sections switch to **Dusk** — lit lawns, warm light, flat gold.

### Colour palette (Garden Journal — default)

| Token | Hex | Use |
| --- | --- | --- |
| surface | `#F5F0E6` | Page background (warm paper) |
| surface-alt | `#EDE5D6` | Alternate bands, cards |
| ink | `#1F2A22` | Main text |
| ink-muted | `#4A5A4E` | Secondary text, captions |
| brand | `#2F4A36` | Garden green: footer, brand moments |
| accent | `#A6492A` | Terracotta: primary buttons and key words |
| accent-ink | `#FFFFFF` | Text on accent |
| highlight | `#D99A2B` | Marigold: tiny decorative details only, never body text |
| line | `rgba(31,42,34,0.15)` | Hairlines, borders |

### Colour palette (Dusk variant)

| Token | Hex |
| --- | --- |
| surface | `#15171A` |
| surface-alt | `#1C1E21` |
| ink | `#EDE6D6` |
| ink-muted | `#CFC7B6` |
| brand | `#2F4A36` |
| accent | `#C9A45C` (flat gold; never gradients) |
| accent-ink | `#15171A` |
| line | `rgba(237,230,214,0.15)` |

All text/background pairs must meet WCAG AA contrast (4.5:1 body, 3:1 large text/UI).

### Fonts (Google Fonts, self-hosted via `next/font`)

- **Display: "Instrument Serif"** (regular + italic) — elegant, high-contrast, editorial. Used large (56–120 px desktop, 40–56 px mobile). Italic used for one emphasised word per heading, coloured accent.
- **Body/UI: "Figtree"** (400/500/600) — warm, very readable on phones.
- **Hindi: "Tiro Devanagari Hindi"** — for occasional Hindi lines (e.g. "होटल दीपाली, सागर").
- Fallback stack in tokens. Swappable alternative display font to keep in mind: "Fraunces".

### Layout and style rules

- 12-column grid desktop, 4-column mobile, generous whitespace, max content width ~1280 px.
- Square or 2 px corners — no bubbly rounded cards. Hairline borders instead of heavy shadows.
- Photography carries the page; no gradients, no glassmorphism, no stock-SaaS look, no emoji icons.
- Breakpoints: 360, 768, 1024, 1280, 1536.

### The "wow" details (signature ideas — implement tastefully)

1. **Journal captions:** small eyebrows like "Entry no. 01 — The gardens" and italic figure captions under photos ("Fig. 1 — The lawns, evening").
2. **Hand-drawn botanical line illustrations** (simple inline SVG strokes: leaf sprigs, bougainvillea, hibiscus) as section dividers and icons. One reusable `<Botanical variant="sprig|flower|vine" />` component.
3. **"I'm planning…" sentence chips** under the hero: "I'm planning… a stay / a wedding / a celebration / a meal / a gym membership" — each opens a prefilled WhatsApp message or the right form.
4. **Day-to-dusk scroll transition:** as the user scrolls into the Weddings band on Home, the background smoothly shifts from paper to night (CSS transition triggered by IntersectionObserver).
5. **Editorial image reveals:** photos unmask with a gentle clip-path reveal on scroll; captions fade in after.
6. **Time-of-day tint (subtle):** after 6 pm local time, the paper surface warms slightly. Optional, behind a single flag.
7. **Swipe rails on mobile** for rooms, venues and dining with the next card peeking.
8. **Big serif numbers** for wedding facts (venues, capacity, rooms).

Motion rules: every animation < 400 ms, transform/opacity/clip-path only, no scroll-jacking, and **everything disabled under `prefers-reduced-motion`**. Wow comes from typography and art direction, not heavy animation.

## 7. Content and sample-data rule

We do not have the hotel's real data yet. Use **sample data**, but keep it safe:

- All content lives in typed files under `/content` (JSON/MDX), validated with **Zod**. Pages never hard-code content.
- Every item has `sample: true` until replaced with real data. Sample text must be realistic but obviously replaceable (e.g. room "Garden Deluxe Room", capacity "350 seated" marked sample).
- **Images/videos:** use free-licence placeholders (Unsplash / Pexels) stored in `/public/sample/` with a `credits.json`, or labelled placeholder boxes. Each image entry records `sample: true`, intended shot (e.g. "decorated lawn at night"), and aspect ratio, so we can swap in originals later by replacing files only.
- A script `pnpm check:content` lists every remaining sample item and **fails** in production mode if any remain. Generate `docs/data-needed.md` (what real data/photos each page still needs).
- Never invent awards, star ratings, review quotes attributed to real people, or real phone numbers/emails — use clearly fake placeholders like `+91 00000 00000`.

## 8. Sitemap (Phase 1)

Build in this order. Phase 1A first, then 1B.

**Phase 1A**
- `/` Home
- `/rooms/` and `/rooms/[slug]/` (3–4 sample categories)
- `/weddings/` (Dusk theme)
- `/events/` Events & Celebrations (birthdays, ring ceremonies, anniversaries, corporate teaser)
- `/dining/` Dining hub (restaurant, bakery, sweets, Infinity Bar)
- `/pool-and-gym/` (with membership enquiry)
- `/gallery/` (filters: Stay, Dining, Weddings, Events, Pool & Gym, Property)
- `/about/`
- `/contact/` (address, map link, department contacts, how to reach, form)
- `/faq/`
- `/lp/weddings/` campaign landing page (noindex, no main nav)
- `/thank-you/` (noindex)
- `/privacy-policy/`, `/terms/`, `/booking-cancellation-policy/` (draft banner)
- 404 page

**Phase 1B**
- `/dining/[slug]/` for restaurant, infinity-bar, bakery, sweets
- `/corporate-events/`
- `/events/venues/[slug]/`
- `/offers/` (offers auto-hide after their end date at build time)
- `/explore-sagar/` + 4 guides (Eran; near Dr Hari Singh Gour University; near Bundelkhand Medical College; NH-44 highway stopover)
- `/blog/` + post template
- `/lp/[campaign]/` (staycation, membership, dining, rooms)

## 9. Page contents (Phase 1A)

- **Home:** hero (one strong photo, H1 with brand + Sagar, positioning line, WhatsApp + Call) · "I'm planning…" chips · introduction with botanical illustration · weddings band (Dusk, big numbers, "Plan your wedding") · rooms rail · "Eat & drink" tiles (restaurant, bakery, sweets, bar) · pool & gym · events & celebrations · gallery strip · reviews strip (sample) · location with static map image + "Get directions" · final CTA band.
- **Rooms:** category cards (photo, name, size, bed, guests, optional "from ₹" price flag) · included with every stay · policies summary · enquiry band.
- **Room detail:** gallery · key facts row · description · room and bathroom amenities · policies · other rooms · "Enquire for this room" (WhatsApp prefilled with room name). A "Book Now" button appears **only** if `site.bookingEngineUrl` is set in content; otherwise "Check availability" opens WhatsApp.
- **Weddings (Dusk):** hero · 4 big facts · venue cards (lawn/hall, seated/floating) · catering · décor & vendor policy · stay for wedding guests · real weddings gallery · "From first call to vidaai" 4 steps · wedding FAQ · enquiry form (date, guests, venue preference).
- **Events:** occasion tiles · venue comparison (table desktop, cards mobile) · packages · catering & décor · form.
- **Dining:** outlet cards · signature dishes · HTML menu for the main restaurant · breakfast & room dining · private dining.
- **Pool & Gym:** pool · gym · membership plans · membership form.
- **Gallery:** filterable grid with accessible lightbox (keyboard + swipe).
- **About:** story · milestones · Dipali family of brands · our people.
- **Contact:** address · map link · department contacts (rooms, events, restaurant, bakery/sweets, gym) · how to reach (station, bus stand, NH-44, Bhopal, Jabalpur) · form.
- **FAQ:** ~15 questions in groups: Stay, Weddings & Events, Dining, Pool & Gym, Policies.

## 10. Global components

Header (transparent over hero, solid on scroll) · MobileMenu (full-screen, focus-trapped, contact buttons at bottom) · **StickyCtaBar on mobile** (Call · WhatsApp · Enquire; label changes per page, e.g. "Plan wedding") · Footer (address, contacts, sub-brands, socials, legal, "Also searched as Hotel Deepali") · WhatsAppLink (builds prefilled messages per page) · CallLink · EnquiryForm (name, phone with Indian mobile validation, enquiry type, date, guests, message, honeypot; success → `/thank-you/`) · Breadcrumbs · Picture (responsive, pre-optimised) · Gallery + Lightbox · Botanical · SectionHeading · Cards (room, venue, outlet, offer) · ReviewStrip · MapBlock (static image linking to Google Maps).

## 11. SEO, analytics, performance, accessibility

- Metadata helper with title pattern "{Page} | Hotel Dipali, Sagar"; unique descriptions; canonical URLs; trailing slashes; `sitemap.xml` and `robots.txt` generated at build; Open Graph images.
- JSON-LD: Hotel (with `alternateName`), HotelRoom, Restaurant, EventVenue, BreadcrumbList, FAQPage, Organization. Omit any field that is still sample data. No self-served AggregateRating.
- Analytics helper with events: `call_click`, `whatsapp_click`, `enquiry_submit`, `room_enquiry`, `wedding_enquiry`, `membership_enquiry`, `directions_click`, `menu_view`, `gallery_open`. GA4 / Meta Pixel IDs via env vars, loaded after consent.
- Performance: mobile Lighthouse ≥ 90; LCP < 2.5 s; CLS < 0.1; hero image ≤ 150 KB mobile; no autoplay video on mobile (video only on tap, with poster).
- Accessibility: WCAG 2.2 AA, semantic landmarks, one H1 per page, skip link, visible focus, labelled inputs, 44×44 px touch targets, reduced-motion support.

## 12. Project files Claude Code should create early

- `CLAUDE.md` in the repo root summarising sections 4–11 of this brief as permanent rules.
- `src/styles/theme.css` (all tokens + component classes), `/content` with Zod schemas and loaders in `src/content/`, `scripts/check-content.ts`, `docs/data-needed.md`, `/styleguide` page.

## 13. How you (the prompt-writer chat) must work

1. Give me **one prompt at a time**, sized so Claude Code can finish it in one go (one feature or 1–2 pages).
2. Each prompt must include: **Goal**, **Files to create/edit**, **Exact requirements**, **Acceptance checklist** (what I should verify in the browser at 360 px and 1280 px), and "Do not do" items.
3. Every prompt must remind Claude Code to: read `CLAUDE.md`, use only theme tokens/classes, keep content in `/content` with `sample: true`, and finish with a summary of what changed plus what real data that page still needs.
4. Suggested order: (1) scaffold + CLAUDE.md → (2) theme.css tokens, fonts, component classes, /styleguide → (3) content schemas, loaders, sample data, check script → (4) global components → (5) enquiry form + thank-you → (6) Home → (7) Rooms + room detail → (8) Weddings → (9) Events → (10) Dining → (11) Pool & Gym, Gallery → (12) About, Contact, FAQ → (13) wedding LP, legal pages, 404 → (14) SEO layer → (15) analytics + consent → (16) motion/"wow" polish pass → (17) QA: accessibility, performance, mobile → (18) Cloudflare Pages deployment guide → then Phase 1B pages.
5. If I paste an error or screenshot, give me a focused fix prompt before moving on.
6. If something in this brief conflicts or is unclear, ask me one short question instead of guessing.