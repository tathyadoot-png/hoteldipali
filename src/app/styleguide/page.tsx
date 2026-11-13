import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { Wordmark } from "@/components/brand/Wordmark";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { SectionHeading } from "@/components/content/SectionHeading";
import { Botanical } from "@/components/decor/Botanical";
import { DecorFlower } from "@/components/decor/DecorFlower";
import { OfferCard } from "@/components/cards/OfferCard";
import { OutletCard } from "@/components/cards/OutletCard";
import { RoomCard } from "@/components/cards/RoomCard";
import { VenueCard } from "@/components/cards/VenueCard";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { FooterVine } from "@/components/layout/FooterVine";
import { MenuPetals } from "@/components/layout/MenuPetals";
import { Picture } from "@/components/media/Picture";
import { ArchWindow } from "@/components/motion/ArchWindow";
import { ThreadStop } from "@/components/motion/GoldThread";
import { RevealLines, ScrollReveal } from "@/components/motion/ScrollReveal";
import { ScrollScene } from "@/components/motion/ScrollScene";
import { Tilt3D } from "@/components/motion/Tilt3D";
import { ThemePreviewToggle } from "@/components/styleguide/ThemePreviewToggle";
import {
  getDecor,
  getOutlets,
  getSite,
  getRooms,
  getVenues,
  type Decor,
  type Offer,
  type Outlet,
  type Room,
  type Venue,
} from "@/content";
import {
  contrastRatio,
  pairsForVariant,
  parseThemeTokens,
  type ThemeTokens,
  type Variant,
} from "@/lib/contrast";
import { isPhoto } from "@/lib/images";

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
  "surface-foot": "bg-surface-foot",
  ink: "bg-ink",
  "ink-muted": "bg-ink-muted",
  brand: "bg-brand",
  "brand-ink": "bg-brand-ink",
  accent: "bg-accent",
  "accent-ink": "bg-accent-ink",
  "gold-text": "bg-gold-text",
  "gold-text-tint": "bg-gold-text-tint",
  highlight: "bg-highlight",
  lavender: "bg-lavender",
  danger: "bg-danger",
  "logo-gold": "bg-logo-gold",
};

const SWATCH_ORDER = Object.keys(SWATCH_BG);

const VARIANTS: ReadonlyArray<{ variant: Variant; title: string; role: string }> = [
  {
    variant: "light",
    title: "Light",
    role: "The default: ivory and lavender pages set in near-black plum; plum actions; antique gold for ornament only.",
  },
  {
    variant: "dark",
    title: "Dark",
    role: "Plum velvet for weddings, the bar and dark bands: ivory type, champagne gold for actions and ornament.",
  },
  {
    variant: "deep",
    title: "Deep",
    role: "The night itself: the opening, the menu, the footer, the phone bar and the stone surfaces; surface-foot is its darker step.",
  },
];

const GOLDS: ReadonlyArray<{ name: string; token: string; theme?: Variant; rule: string }> = [
  {
    name: "Champagne",
    token: "accent",
    theme: "deep",
    rule: "On plum grounds: actions, small gold text, rules, frames, veins and vines.",
  },
  {
    name: "Antique",
    token: "highlight",
    rule: "On light grounds: ornament only — rules, hairlines, frames. Never text.",
  },
  {
    name: "Deep",
    token: "gold-text",
    rule: "When gold must be read on a light ground (gold-text-tint on lavender).",
  },
];

const PLANNING_CHIPS = ["a stay", "a wedding", "a celebration", "a meal", "a gym membership"];

function Badge({ pass }: { pass: boolean }) {
  return (
    <span
      className={
        "inline-flex min-h-7 items-center px-2 text-xs font-semibold " +
        (pass ? "bg-brand text-brand-ink" : "bg-danger text-accent-ink")
      }
    >
      {pass ? "AA PASS" : "AA FAIL"}
    </span>
  );
}

function Swatches({ tokens }: { tokens: ThemeTokens }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {SWATCH_ORDER.map((name) => {
        const hex = tokens[name];
        if (!hex) return null;
        return (
          <div key={name} className="card bg-surface p-0">
            <div className={`h-14 w-full border-b border-line ${SWATCH_BG[name] ?? ""}`} />
            <div className="p-2.5">
              <p className="text-sm font-semibold">{name}</p>
              <p className="caption text-sm not-italic">{hex}</p>
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
    <div className="mt-6">
      <table className="w-full table-fixed border-collapse text-left">
        <thead>
          <tr>
            <th className="py-2 pr-4 text-xs font-semibold tracking-widest uppercase">Pair</th>
            <th className="py-2 pr-4 text-xs font-semibold tracking-widest uppercase">Ratio</th>
            <th className="py-2 pr-4 text-xs font-semibold tracking-widest uppercase">Min</th>
            <th className="py-2 pr-4 text-xs font-semibold tracking-widest uppercase">Result</th>
            <th className="py-2 text-xs font-semibold tracking-widest uppercase">Use</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => {
            const fg = tokens[pair.fg];
            const bg = tokens[pair.bg];
            const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
            return (
              <tr key={`${pair.fg}/${pair.bg}/${pair.kind}`} className="border-t border-line">
                <td className="body py-2 pr-4 break-all">
                  {pair.fg} / {pair.bg}
                </td>
                <td className="body py-2 pr-4">{ratio.toFixed(2)}:1</td>
                <td className="body py-2 pr-4">{pair.min}</td>
                <td className="py-2 pr-4">
                  <Badge pass={ratio >= pair.min} />
                </td>
                <td className="caption py-2 not-italic break-words">{pair.use}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The system as a whole: rendered once, above the per-variant previews. */
/** A pattern tile (content/decor.json) as a background, 1× and 2×. */
function patternStyle(decor: Decor): CSSProperties {
  const at = (w: number) => decor.src.replace(/-\d+\.webp$/, `-${w}.webp`);
  const [one, two] = decor.widths;
  return {
    "--decor-tile": `image-set(url("${at(one ?? decor.width)}") 1x, url("${at(two ?? decor.width)}") 2x)`,
    "--decor-size": `${decor.tile ?? 320}px`,
  } as CSSProperties;
}

function System({
  tokens,
  photo,
  decor,
  name,
}: {
  tokens: Record<Variant, ThemeTokens>;
  photo: Room["images"][number];
  decor: Record<string, Decor | undefined>;
  name: string;
}) {
  return (
    <div className="container-site section flex flex-col gap-20">
      {/* Palettes */}
      <section aria-labelledby="sys-palettes">
        <p className="eyebrow">The palette</p>
        <h2 id="sys-palettes" className="heading-2 mt-3">
          Plum, ivory, lavender and gold
        </h2>
        <p className="body-lg mt-4 max-w-prose">
          Midnight Bloom: a plum night with gold veins, and flowers that bloom. Night is deep
          plum velvet, gold runs through it in fine lines, and day is ivory and lavender pages.
          Three role-based variants redefine the same tokens; a palette change edits theme.css
          only.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {VARIANTS.map(({ variant, title, role }) => (
            <div
              key={variant}
              data-theme={variant === "light" ? undefined : variant}
              className="bg-surface p-5 text-ink"
            >
              <h3 className="heading-3">{title}</h3>
              <p className="body mt-2 text-ink-muted">{role}</p>
              <div className="mt-5">
                <Swatches tokens={tokens[variant]} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gold */}
      <section aria-labelledby="sys-gold">
        <p className="eyebrow">Gold</p>
        <h2 id="sys-gold" className="heading-2 mt-3">
          One family, three shades
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {GOLDS.map((gold) => (
            <div
              key={gold.name}
              data-theme={gold.theme}
              className="card bg-surface p-5 text-ink"
            >
              <div
                className={`h-16 ${gold.token === "accent" ? "bg-accent" : gold.token === "highlight" ? "bg-highlight" : "bg-gold-text"}`}
              />
              <h3 className="heading-3 mt-4">{gold.name}</h3>
              <p className="caption not-italic">{tokens[gold.theme ?? "light"][gold.token]}</p>
              <p className="body mt-2">{gold.rule}</p>
            </div>
          ))}
        </div>
        <p className="body mt-6 max-w-prose">
          No yellow golds. Gold foil is a token-built sheen — one narrow highlight, played
          once — on ornaments, rules and display headings only. The client&rsquo;s logo
          (median gold {tokens.light["logo-gold"]}) sits on plum grounds only.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-10">
          <ScrollReveal variant="foil">
            <p className="font-display text-6xl text-brand uppercase">Dipali</p>
          </ScrollReveal>
          <ScrollReveal>
            <span className="foil-rule block h-px w-48" />
          </ScrollReveal>
        </div>
      </section>

      {/* Type */}
      <section aria-labelledby="sys-type">
        <p className="eyebrow">Typography</p>
        <h2 id="sys-type" className="heading-2 mt-3">
          Cormorant, Manrope and one script word
        </h2>
        <div className="mt-8 flex flex-col gap-7">
          <div>
            <p className="caption not-italic">
              wordmark · the home hero&rsquo;s name (DIPALI spans the screen) and the header&rsquo;s
              logotype — one composition, sized by --wm
            </p>
            <div data-theme="deep" className="mt-3 overflow-hidden bg-surface px-4 py-10 text-center text-ink">
              <Wordmark name={name} className="sg-wordmark-hero" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-10 bg-surface-alt px-6 py-5">
              <Wordmark name={name} className="sg-wordmark-logotype" />
              <span data-theme="deep" className="bg-surface px-6 py-4 text-ink">
                <Wordmark name={name} className="sg-wordmark-logotype" />
              </span>
            </div>
          </div>
          <div>
            <p className="caption not-italic">heading-page · inner-page heroes</p>
            <p className="heading-page break-words">Weddings under the open sky</p>
          </div>
          <div>
            <p className="caption not-italic">heading-1</p>
            <p className="heading-1">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="caption not-italic">heading-2</p>
            <p className="heading-2">Lawns, halls and room for everyone</p>
          </div>
          <div>
            <p className="caption not-italic">heading-3 (Manrope)</p>
            <p className="heading-3">Garden Deluxe Room</p>
          </div>
          <div>
            <p className="caption not-italic">eyebrow · Manrope capitals with a short gold rule</p>
            <p className="eyebrow">Welcome to</p>
          </div>
          <div>
            <p className="caption not-italic">body-lg · body</p>
            <p className="body-lg max-w-prose">
              Lead copy, set in Manrope at 18px with generous leading.
            </p>
            <p className="body mt-2 max-w-prose">
              Body copy at 16px, never smaller, comfortable for long reading on a phone.
            </p>
          </div>
          <div>
            <p className="caption not-italic">caption · font-script (one word per page at most)</p>
            <p className="caption">The reception atrium, Sagar</p>
            <p className="mt-2 font-script text-5xl text-brand">Celebrate</p>
          </div>
        </div>
      </section>

      {/* Textures */}
      <section aria-labelledby="sys-textures">
        <p className="eyebrow">Textures</p>
        <h2 id="sys-textures" className="heading-2 mt-3">
          Paper by day, velvet by night
        </h2>
        <p className="body mt-4 max-w-prose">
          Both are generated in CSS (SVG noise, under 1 KB each, no image files): neutral grain
          laid over the surface colour, so they follow the palette.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="paper-grain h-40 bg-surface-alt p-5">
            <p className="relative caption not-italic">paper-grain on light</p>
          </div>
          <div data-theme="deep" className="paper-grain h-40 bg-surface p-5 text-ink">
            <p className="relative caption not-italic">velvet on deep</p>
          </div>
        </div>
      </section>

      {/* Decoration */}
      <section aria-labelledby="sys-decor">
        <p className="eyebrow">Decoration</p>
        <h2 id="sys-decor" className="heading-2 mt-3">
          Flowers, never the subject
        </h2>
        <p className="body mt-4 max-w-prose">
          Downloaded flower images, graded to plum and gold (pnpm make:photos) — sample content
          until their rights are confirmed, so a release is blocked until then. At most one
          flower per section, alternating left and right; never behind text (a pattern under
          text sits beneath a veil of its surface); a slow drift of at most 40 px under rich
          motion; a white studio ground multiplies into ivory.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div data-theme="deep" className="relative h-72 overflow-hidden bg-surface p-6 text-ink">
            {decor["dahlia-right"] ? (
              <DecorFlower
                decor={decor["dahlia-right"]}
                className="top-0 left-0 h-full w-auto"
                sizes="9rem"
                drift={false}
              />
            ) : null}
            <p className="body relative ml-auto max-w-[15rem]">
              The dahlia&rsquo;s right half opens from the left edge — and its left half from the
              right edge in the next section: two halves of one flower, never one mirrored.
            </p>
          </div>
          <div className="relative h-72 overflow-hidden bg-surface p-6">
            {decor["chrysanthemum-bud-ivory"] ? (
              <DecorFlower
                decor={decor["chrysanthemum-bud-ivory"]}
                className="top-0 right-0 h-full w-auto"
                sizes="14rem"
                drift={false}
              />
            ) : null}
            <p className="body relative max-w-[14rem]">
              On ivory the bud&rsquo;s white studio ground is multiplied away.
            </p>
          </div>
          <div data-theme="deep" className="relative h-72 overflow-hidden bg-surface p-6 text-ink">
            {decor["orchid-veins-dark"] ? (
              <div data-veil="" className="decor-pattern" style={patternStyle(decor["orchid-veins-dark"])} />
            ) : null}
            <p className="body relative max-w-prose">
              The orchid pattern on the night, under a veil of the surface so text reads on it
              (the gate checks it against the tile&rsquo;s brightest pixel).
            </p>
          </div>
          <div className="relative h-72 overflow-hidden bg-surface p-6">
            {decor["orchid-veins-light"] ? (
              <div data-veil="" className="decor-pattern" style={patternStyle(decor["orchid-veins-light"])} />
            ) : null}
            <p className="body relative max-w-prose">The same orchids, cut out, on ivory.</p>
          </div>
        </div>
      </section>

      {/* Motion kit */}
      <section aria-labelledby="sys-motion">
        <p className="eyebrow">Motion</p>
        <h2 id="sys-motion" className="heading-2 mt-3">
          The motion kit
        </h2>
        <p className="body mt-4 max-w-prose">
          Transform, opacity and clip-path only; each animation under 600 ms; scroll-mapped
          scenes on desktop rich motion only. Under reduced motion everything below is simply
          shown, still.
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="heading-3">Reveal: rise</h3>
            <ScrollReveal className="mt-4">
              <p className="body-lg">Content rises into place as it reaches the viewport.</p>
            </ScrollReveal>
          </div>
          <div>
            <h3 className="heading-3">Reveal: mask-line</h3>
            <ScrollReveal variant="mask-line" className="mt-4">
              <p className="heading-2">
                <RevealLines lines={["Every visit", "begins with", "a conversation"]} />
              </p>
            </ScrollReveal>
          </div>
          <div>
            <h3 className="heading-3">Reveal: clip-arch</h3>
            <ScrollReveal variant="clip-arch" className="relative mt-4 aspect-[0.72] w-48 overflow-hidden">
              <Picture image={photo} fill sizes="12rem" />
            </ScrollReveal>
          </div>
          <div>
            <h3 className="heading-3">Reveal: foil</h3>
            <ScrollReveal variant="foil" className="mt-4">
              <p className="heading-1 text-brand">A stay to remember</p>
            </ScrollReveal>
          </div>
          <div>
            <h3 className="heading-3">ArchWindow</h3>
            <p className="body mt-2">
              Under rich motion its arch opens toward a full frame as it scrolls through the
              viewport.
            </p>
            <ScrollScene className="mt-4 w-56">
              <ArchWindow open="var(--p, 0)">
                <Picture image={photo} fill sizes="14rem" />
              </ArchWindow>
            </ScrollScene>
          </div>
          <div>
            <h3 className="heading-3">Tilt3D</h3>
            <p className="body mt-2">A card leans toward a mouse (at most 6°).</p>
            <Tilt3D className="mt-4 max-w-xs">
              <div className="card p-6">
                <p className="eyebrow">Stay</p>
                <p className="heading-3 mt-3">Garden Deluxe Room</p>
                <p className="body mt-2">Point at this card and move.</p>
              </div>
            </Tilt3D>
          </div>
          <div data-theme="deep" className="bg-surface p-8 text-ink">
            <h3 className="heading-3">Glow</h3>
            <p className="body mt-2 text-ink-muted">A soft glow warms behind a CTA on plum grounds.</p>
            <span className="glow mt-6">
              <a href="#sys-motion" className="btn-primary">
                Book a Stay
              </a>
            </span>
          </div>
          <div>
            <h3 className="heading-3">The diamond</h3>
            <p className="body mt-2">
              The small diamond from the logo: under the current page in the header (and after it
              in the menu), and at the start of a button on hover or focus.
            </p>
            <ul className="header-links mt-6">
              <li>
                <a href="#sys-motion" aria-current="page" className="header-link">
                  Stay
                </a>
              </li>
              <li>
                <a href="#sys-motion" className="header-link">
                  Weddings
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h3 className="heading-3">The vine</h3>
            <p className="body mt-2">
              Along the footer&rsquo;s top edge: a small flower opens, then the vine grows out from
              it to both sides, segment by segment (each step under 400 ms), once.
            </p>
            <ScrollReveal className="mt-4">
              <div data-theme="deep" className="bg-surface px-4 pb-6 text-ink">
                <FooterVine />
              </div>
            </ScrollReveal>
          </div>
          <div>
            <h3 className="heading-3">The petals</h3>
            <p className="body mt-2">
              Behind the menu&rsquo;s links: plum petals that unfold from the centre as it opens.
              At rest:
            </p>
            <div data-theme="deep" className="relative mt-4 h-64 overflow-hidden bg-surface text-ink">
              <MenuPetals className="sg-petals" />
            </div>
          </div>
          <div>
            <h3 className="heading-3">Cursor follower</h3>
            <p className="body mt-2">
              With a mouse or trackpad: a fine gold ring eases after the pointer, a plum dot sits
              on it. It grows over links, reads &ldquo;View&rdquo; over a photograph and
              &ldquo;Drag&rdquo; over a swipe rail, and steps aside over text fields. The system
              cursor always stays.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <a href="#sys-motion" className="card grid min-h-24 place-items-center p-3 text-center">
                A link
              </a>
              <div data-cursor="view" className="relative min-h-24 overflow-hidden">
                <Picture image={photo} fill sizes="10rem" />
              </div>
              <div data-cursor="drag" className="card grid min-h-24 place-items-center p-3 text-center">
                A rail
              </div>
            </div>
          </div>
          <div>
            <h3 className="heading-3">GoldThread</h3>
            <p className="body mt-2">
              On the home page, desktop rich motion: one gold line drawn down the page with
              scroll, crossing at each stop, ending in a small gold flower above the footer.
              Elsewhere each stop is this short static rule:
            </p>
            <div className="mt-4">
              <ThreadStop />
            </div>
          </div>
        </div>
      </section>
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
      {/* 1. Colour + contrast */}
      <section aria-labelledby={`${variant}-colours`}>
        <p className="eyebrow">Contrast</p>
        <h2 id={`${variant}-colours`} className="heading-2 mt-3">
          Every pair, gated
        </h2>
        <p className="body mt-3 max-w-prose">
          The pairs the build checks for this variant (pnpm check:contrast runs before every
          build).
        </p>
        <ContrastTable variant={variant} tokens={tokens} />
      </section>

      {/* 2. Buttons */}
      <section aria-labelledby={`${variant}-buttons`}>
        <p className="eyebrow">Buttons</p>
        <h2 id={`${variant}-buttons`} className="heading-2 mt-3">
          One family
        </h2>
        <p className="body mt-3 max-w-prose">
          Primary is the booking action (plum on light, champagne on plum); secondary is a fine
          gold outline. Hover or focus shows the logo&rsquo;s diamond at the start and sends one
          glint across the primary. The focus ring appears on Tab.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-primary">
              Book a Stay
            </button>
            <button type="button" className="btn-secondary">
              Plan a Wedding
            </button>
            <button type="button" className="btn-ghost">
              Call
            </button>
            <button type="button" className="btn-primary btn-compact">
              Enquire
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-secondary btn-cta">
              Send an enquiry
            </button>
            <a href={`#${variant}-buttons`} className="link-royal">
              Text link
            </a>
            <a href={`#${variant}-buttons`} className="link-cta">
              Link with arrow
            </a>
            <button type="button" className="btn-icon" aria-label="Icon button example">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-primary" disabled>
              Disabled
            </button>
            <button type="button" className="btn-secondary" disabled>
              Disabled
            </button>
            <button type="button" className="btn-ghost" disabled>
              Disabled
            </button>
          </div>
        </div>
      </section>

      {/* 3. Chips */}
      <section aria-labelledby={`${variant}-chips`}>
        <p className="eyebrow">Chips</p>
        <h2 id={`${variant}-chips`} className="heading-2 mt-3">
          Choices
        </h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="body-lg">I&rsquo;m planning&hellip;</span>
          {PLANNING_CHIPS.map((label) => (
            <button key={label} type="button" className="chip" aria-pressed={label === "a wedding"}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Form fields */}
      <section aria-labelledby={`${variant}-fields`}>
        <p className="eyebrow">Fields</p>
        <h2 id={`${variant}-fields`} className="heading-2 mt-3">
          Form fields
        </h2>
        <div className="mt-6 grid max-w-xl gap-5">
          <div>
            <label htmlFor={`${variant}-f-name`} className="label">
              Name
            </label>
            <input id={`${variant}-f-name`} className="input" defaultValue="Asha Verma" />
          </div>
          <div>
            <label htmlFor={`${variant}-f-phone`} className="label">
              Phone
            </label>
            <input
              id={`${variant}-f-phone`}
              className="input"
              defaultValue="12345"
              aria-invalid="true"
              aria-describedby={`${variant}-f-phone-error`}
            />
            <p id={`${variant}-f-phone-error`} className="field-error mt-1">
              Enter a 10-digit Indian mobile number.
            </p>
          </div>
          <div>
            <label htmlFor={`${variant}-f-type`} className="label">
              Enquiry
            </label>
            <select id={`${variant}-f-type`} className="select" defaultValue="wedding">
              <option value="stay">A stay</option>
              <option value="wedding">A wedding</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${variant}-f-msg`} className="label">
              Message (optional)
            </label>
            <textarea id={`${variant}-f-msg`} className="textarea" rows={3} />
            <p className="field-hint mt-1">Dates, guests, anything we should know.</p>
          </div>
        </div>
      </section>

      {/* 5. Card, band, rules */}
      <section aria-labelledby={`${variant}-card`}>
        <p className="eyebrow">Surfaces</p>
        <h2 id={`${variant}-card`} className="heading-2 mt-3">
          Card, band and rules
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="card">
            <div className="aspect-[4/3] w-full bg-surface-alt" />
            <div className="flex flex-col gap-2 p-5">
              <p className="eyebrow">Stay</p>
              <h3 className="heading-3">Garden Deluxe Room</h3>
              <p className="body">A calm room opening to the lawns.</p>
              <a href={`#${variant}-card`} className="link">
                View room
              </a>
            </div>
          </article>
          <div className="flex flex-col gap-6">
            <div className="band-brand p-8">
              <p className="eyebrow">Hotel Dipali</p>
              <p className="heading-3 mt-3">The brand band, plum.</p>
            </div>
            <hr className="rule" />
            <hr className="rule-ornament" />
          </div>
        </div>
      </section>

      {/* 6. Content components */}
      <section aria-labelledby={`${variant}-components`}>
        <p className="eyebrow">Components</p>
        <h2 id={`${variant}-components`} className="heading-2 mt-3">
          Content components
        </h2>

        <div className="mt-8 flex flex-col gap-4">
          <p className="caption not-italic">Botanical (sprig · flower · vine)</p>
          <div className="flex items-end gap-8 text-highlight">
            <Botanical variant="sprig" className="h-16 w-auto" />
            <Botanical variant="flower" className="h-16 w-auto" />
            <Botanical variant="vine" className="h-8 w-40" />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="caption not-italic">SectionHeading</p>
          <SectionHeading
            eyebrow="The rooms"
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
          <p className="caption not-italic">Breadcrumbs</p>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Rooms", href: "/rooms/" },
              { label: content.room.name },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="caption not-italic">Picture (natural ratio + caption)</p>
          <figure className="max-w-md">
            <Picture image={content.room.images[0]!} />
            <figcaption className="caption mt-2">
              {content.room.images[0]!.caption ?? content.room.images[0]!.shot}
            </figcaption>
          </figure>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="caption not-italic">RoomCard · VenueCard · OutletCard</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <RoomCard room={content.room} />
            <VenueCard venue={content.venue} />
            <OutletCard outlet={content.outlet} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <p className="caption not-italic">OfferCard (styleguide demo fixture)</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <OfferCard offer={content.offer} />
          </div>
        </div>
      </section>

      {/* 7. EnquiryForm */}
      <section aria-labelledby={`${variant}-form`}>
        <p className="eyebrow">The form</p>
        <h2 id={`${variant}-form`} className="heading-2 mt-3">
          Enquiry form
        </h2>
        <p className="body-lg mt-3 max-w-prose">
          One reusable form for rooms, wedding, event, dining, pool &amp; gym and general
          enquiries. Submits to the hosted form endpoint configured via env vars; falls back to
          a clear notice plus Call/WhatsApp when unset.
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

  const [site, rooms, venues, outlets, decorItems] = await Promise.all([
    getSite(),
    getRooms(),
    getVenues(),
    getOutlets(),
    getDecor(),
  ]);
  const decor = Object.fromEntries(decorItems.map((item) => [item.id, item]));
  const room = rooms[0]!;
  const venue = venues[0]!;
  const outlet = outlets[0]!;
  const photo = rooms.flatMap((r) => r.images).find(isPhoto) ?? room.images[0]!;

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
        <h1 className="heading-1 mt-3">Hotel Dipali — Design system</h1>
      </div>
      <System tokens={tokens} photo={photo} decor={decor} name={site.name} />
      <ThemePreviewToggle
        light={<Sections variant="light" tokens={tokens.light} content={content} />}
        dark={<Sections variant="dark" tokens={tokens.dark} content={content} />}
        deep={<Sections variant="deep" tokens={tokens.deep} content={content} />}
      />
    </>
  );
}
