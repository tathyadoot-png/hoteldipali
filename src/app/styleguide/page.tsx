import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { SectionHeading } from "@/components/content/SectionHeading";
import { Botanical } from "@/components/decor/Botanical";
import { OfferCard } from "@/components/cards/OfferCard";
import { OutletCard } from "@/components/cards/OutletCard";
import { RoomCard } from "@/components/cards/RoomCard";
import { VenueCard } from "@/components/cards/VenueCard";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Picture } from "@/components/media/Picture";
import { ThemePreviewToggle } from "@/components/styleguide/ThemePreviewToggle";
import { getOutlets, getRooms, getVenues, type Offer, type Outlet, type Room, type Venue } from "@/content";
import {
  contrastRatio,
  pairsForVariant,
  parseThemeTokens,
  type ThemeTokens,
  type Variant,
} from "@/lib/contrast";

type SampleContent = {
  room: Room;
  venue: Venue;
  outlet: Outlet;
  offer: Offer;
};

export const metadata: Metadata = {
  title: "Hotel Dipali — Design system",
  robots: { index: false, follow: false },
};

// Explicit full class strings so Tailwind detects them (no dynamic concatenation).
const SWATCH_BG: Record<string, string> = {
  surface: "bg-surface",
  "surface-alt": "bg-surface-alt",
  ink: "bg-ink",
  "ink-muted": "bg-ink-muted",
  brand: "bg-brand",
  "brand-ink": "bg-brand-ink",
  accent: "bg-accent",
  "accent-ink": "bg-accent-ink",
  highlight: "bg-highlight",
};

const SWATCH_ORDER = [
  "surface",
  "surface-alt",
  "ink",
  "ink-muted",
  "brand",
  "brand-ink",
  "accent",
  "accent-ink",
  "highlight",
];

const VARIANT_LABEL: Record<Variant, string> = {
  light: "Ivory — the light default. Terracotta clay for actions, antique gold for ornament only.",
  peacock: "Peacock — the dark forest-peacock variant ([data-theme=\"peacock\"]). Antique gold for actions and ornament.",
};

const PLANNING_CHIPS = [
  "a stay",
  "a wedding",
  "a celebration",
  "a meal",
  "a gym membership",
];

function Badge({ pass }: { pass: boolean }) {
  return (
    <span
      className={
        "inline-flex min-h-7 items-center px-2 text-xs font-semibold " +
        (pass ? "bg-brand text-brand-ink" : "bg-accent text-accent-ink")
      }
    >
      {pass ? "AA PASS" : "AA FAIL"}
    </span>
  );
}

function Swatches({ tokens }: { tokens: ThemeTokens }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {SWATCH_ORDER.map((name) => {
        const hex = tokens[name];
        if (!hex) return null;
        const bgClass = SWATCH_BG[name] ?? "";
        return (
          <div key={name} className="card p-0">
            <div className={`h-20 w-full border-b border-line ${bgClass}`} />
            <div className="p-3">
              <p className="body font-semibold">{name}</p>
              <p className="caption not-italic">{hex}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContrastTable({ variant, tokens }: { variant: Variant; tokens: ThemeTokens }) {
  const pairs = pairsForVariant(variant);
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="eyebrow py-2 pr-4">Pair</th>
            <th className="eyebrow py-2 pr-4">Ratio</th>
            <th className="eyebrow py-2 pr-4">Min</th>
            <th className="eyebrow py-2 pr-4">Result</th>
            <th className="eyebrow py-2">Use</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => {
            const fg = tokens[pair.fg];
            const bg = tokens[pair.bg];
            const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
            const pass = ratio >= pair.min;
            return (
              <tr key={`${pair.fg}/${pair.bg}/${pair.kind}`} className="border-t border-line">
                <td className="body py-2 pr-4">
                  {pair.fg} / {pair.bg}
                </td>
                <td className="body py-2 pr-4">{ratio.toFixed(2)}:1</td>
                <td className="body py-2 pr-4">{pair.min}</td>
                <td className="py-2 pr-4">
                  <Badge pass={pass} />
                </td>
                <td className="caption py-2 not-italic">{pair.use}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Sections({
  variant,
  tokens,
  content,
}: {
  variant: Variant;
  tokens: ThemeTokens;
  content: SampleContent;
}) {
  return (
    <div className="container-site section flex flex-col gap-16">
      {/* 1. Colour swatches + contrast */}
      <section aria-labelledby={`${variant}-colours`}>
        <p className="eyebrow">Section 01</p>
        <h2 id={`${variant}-colours`} className="heading-2">
          Colour &amp; <em>contrast</em>
        </h2>
        <p className="body-lg mt-3">{VARIANT_LABEL[variant]}</p>
        <div className="mt-6">
          <Swatches tokens={tokens} />
        </div>
        <ContrastTable variant={variant} tokens={tokens} />
      </section>

      {/* 2. Type specimen */}
      <section aria-labelledby={`${variant}-type`}>
        <p className="eyebrow">Section 02</p>
        <h2 id={`${variant}-type`} className="heading-2">
          Type specimen
        </h2>
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="eyebrow">heading-hero · up to ~12vw desktop, ~15vw phone</p>
            {/* break-words: the specimen sits in a half-width pane side by side. */}
            <p className="heading-hero break-words">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="eyebrow">heading-1</p>
            <p className="heading-1 break-words">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="eyebrow">heading-2 · ~4.8vw desktop</p>
            <p className="heading-2">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="eyebrow">heading-3</p>
            <p className="heading-3">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="eyebrow">eyebrow</p>
            <p className="eyebrow">Entry no. 01 — The gardens</p>
          </div>
          <div>
            <p className="eyebrow">body-lg</p>
            <p className="body-lg">
              A warm, readable paragraph set in the body typeface for lead copy and
              introductions.
            </p>
          </div>
          <div>
            <p className="eyebrow">body</p>
            <p className="body">
              A standard paragraph set in the body typeface, never below sixteen pixels,
              comfortable for long reading on a phone.
            </p>
          </div>
          <div>
            <p className="eyebrow">big-number + eyebrow</p>
            <p className="big-number">350</p>
            <p className="eyebrow">Guests seated (sample)</p>
          </div>
          <div>
            <p className="eyebrow">caption</p>
            <p className="caption">Fig. 1 — The lawns, evening</p>
          </div>
        </div>
      </section>

      {/* 3. Buttons */}
      <section aria-labelledby={`${variant}-buttons`}>
        <p className="eyebrow">Section 03</p>
        <h2 id={`${variant}-buttons`} className="heading-2">
          Buttons
        </h2>
        <p className="body mt-3">
          Architrave buttons: nearly square, a fill that sweeps up on hover or focus
          (nothing moves around them), and the signature enquiry CTA with an inset
          hairline and a stepping arrow. The focus ring appears on Tab.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-primary">
              Primary
            </button>
            <button type="button" className="btn-secondary">
              Secondary
            </button>
            <button type="button" className="btn-ghost">
              Ghost
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-primary btn-cta">
              Enquire now
            </button>
            <a href="#buttons-example" className="link-cta">
              Text link
            </a>
            <button type="button" className="btn-icon" aria-label="Icon button example">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-primary" disabled>
              Primary
            </button>
            <button type="button" className="btn-secondary" disabled>
              Secondary
            </button>
            <button type="button" className="btn-ghost" disabled>
              Ghost
            </button>
          </div>
        </div>
      </section>

      {/* 4. Chips */}
      <section aria-labelledby={`${variant}-chips`}>
        <p className="eyebrow">Section 04</p>
        <h2 id={`${variant}-chips`} className="heading-2">
          Chips
        </h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="body-lg">I&rsquo;m planning&hellip;</span>
          {PLANNING_CHIPS.map((label) => (
            <button
              key={label}
              type="button"
              className="chip"
              aria-pressed={label === "a wedding"}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Card */}
      <section aria-labelledby={`${variant}-card`}>
        <p className="eyebrow">Section 05</p>
        <h2 id={`${variant}-card`} className="heading-2">
          Card
        </h2>
        <div className="mt-6 max-w-sm">
          <article className="card">
            <div className="aspect-[4/3] w-full bg-surface-alt" />
            <div className="flex flex-col gap-2 p-5">
              <p className="caption">Fig. 2 — Garden Deluxe (sample)</p>
              <p className="eyebrow">Stay</p>
              <h3 className="heading-3">Garden Deluxe Room</h3>
              <p className="body">
                A calm room opening to the lawns, dressed in warm paper tones and soft
                linen.
              </p>
              <a href="#card-example" className="link">
                View room
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* 6. Brand band */}
      <section aria-labelledby={`${variant}-band`}>
        <p className="eyebrow">Section 06</p>
        <h2 id={`${variant}-band`} className="heading-2">
          Brand band
        </h2>
        <div className="band-brand mt-6 p-8">
          <p className="eyebrow">Hotel Dipali</p>
          <p className="heading-3">A deep peacock band for the footer and brand moments.</p>
        </div>
      </section>

      {/* 7. Rules & ornament */}
      <section aria-labelledby={`${variant}-rules`}>
        <p className="eyebrow">Section 07</p>
        <h2 id={`${variant}-rules`} className="heading-2">
          Rules &amp; ornament
        </h2>
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="eyebrow">rule</p>
            <hr className="rule mt-2" />
          </div>
          <div>
            <p className="eyebrow">rule-ornament</p>
            <hr className="rule-ornament mt-2" />
          </div>
        </div>
      </section>

      {/* 8. Content components (Step 4b) */}
      <section aria-labelledby={`${variant}-components`}>
        <p className="eyebrow">Section 08</p>
        <h2 id={`${variant}-components`} className="heading-2">
          Content components
        </h2>

        <div className="mt-8 flex flex-col gap-4">
          <p className="eyebrow">Botanical (sprig · flower · vine)</p>
          <div className="flex items-end gap-8 text-highlight">
            <Botanical variant="sprig" className="h-16 w-auto" />
            <Botanical variant="flower" className="h-16 w-auto" />
            <Botanical variant="vine" className="h-8 w-40" />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="eyebrow">SectionHeading</p>
          <SectionHeading
            eyebrow="Entry no. 02 — The rooms"
            title={
              <>
                Rooms with a <em>garden</em> view
              </>
            }
            description="A supporting line of lead copy, set in body-lg, introducing the section below."
            action={{ label: "View all rooms", href: "/rooms/" }}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="eyebrow">Breadcrumbs</p>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Rooms", href: "/rooms/" },
              { label: content.room.name },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="eyebrow">Picture (natural ratio + caption)</p>
          <figure className="max-w-md">
            <Picture image={content.room.images[0]!} />
            <figcaption className="caption mt-2">
              {content.room.images[0]!.caption ?? content.room.images[0]!.shot}
            </figcaption>
          </figure>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="eyebrow">RoomCard · VenueCard · OutletCard</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <RoomCard room={content.room} />
            <VenueCard venue={content.venue} />
            <OutletCard outlet={content.outlet} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="eyebrow">OfferCard (styleguide demo fixture)</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <OfferCard offer={content.offer} />
          </div>
        </div>
      </section>

      {/* 9. EnquiryForm (Step 5) */}
      <section aria-labelledby={`${variant}-form`}>
        <p className="eyebrow">Section 09</p>
        <h2 id={`${variant}-form`} className="heading-2">
          Enquiry form
        </h2>
        <p className="body-lg mt-3 max-w-prose">
          One reusable form for rooms, wedding, event, dining, pool &amp; gym and
          general enquiries. Submits to the hosted form endpoint configured via
          env vars; falls back to a clear notice plus Call/WhatsApp when unset.
        </p>
        <div className="mt-6 max-w-xl">
          <EnquiryForm idPrefix={`${variant}-ef`} />
        </div>
      </section>
    </div>
  );
}

export default async function StyleguidePage() {
  const css = readFileSync(join(process.cwd(), "src", "styles", "theme.css"), "utf8");
  const tokens = parseThemeTokens(css);

  const [rooms, venues, outlets] = await Promise.all([
    getRooms(),
    getVenues(),
    getOutlets(),
  ]);
  const room = rooms[0]!;
  const venue = venues[0]!;
  const outlet = outlets[0]!;

  // offers.json is intentionally empty (Phase 1B); this clearly-labelled fixture
  // only exists to render OfferCard in the styleguide — it is not real content
  // and fabricates no discount or price.
  const offer: Offer = {
    slug: "styleguide-demo-offer",
    title: "Garden staycation",
    summary:
      "A restful two-night stay with breakfast and a poolside evening. Styleguide demo — not a live offer.",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    terms: ["Styleguide demonstration only."],
    cta: { label: "Enquire", href: "/contact/#enquire" },
    image: venue.images[0]!,
    status: "sample",
    note: "styleguide demo fixture — offers.json is intentionally empty",
  };

  const content: SampleContent = { room, venue, outlet, offer };

  return (
    <>
      <div className="container-site pt-10">
        <p className="eyebrow">Internal · not indexed</p>
        <h1 className="heading-1 mt-2">Hotel Dipali — Design system</h1>
      </div>
      <ThemePreviewToggle
        light={<Sections variant="light" tokens={tokens.light} content={content} />}
        peacock={<Sections variant="peacock" tokens={tokens.peacock} content={content} />}
      />
    </>
  );
}
