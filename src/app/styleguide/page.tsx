import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

import { ThemePreviewToggle } from "@/components/styleguide/ThemePreviewToggle";
import {
  contrastRatio,
  pairsForVariant,
  parseThemeTokens,
  type ThemeTokens,
  type Variant,
} from "@/lib/contrast";

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
  pop: "bg-pop",
  "pop-ink": "bg-pop-ink",
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
  "pop",
  "pop-ink",
  "highlight",
];

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
            <th className="eyebrow py-2">Result</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => {
            const fg = tokens[pair.fg];
            const bg = tokens[pair.bg];
            const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
            const pass = ratio >= pair.min;
            return (
              <tr key={`${pair.fg}/${pair.bg}`} className="border-t border-line">
                <td className="body py-2 pr-4">
                  {pair.fg} / {pair.bg}
                </td>
                <td className="body py-2 pr-4">{ratio.toFixed(2)}:1</td>
                <td className="body py-2 pr-4">{pair.min}</td>
                <td className="py-2">
                  <Badge pass={pass} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Sections({ variant, tokens }: { variant: Variant; tokens: ThemeTokens }) {
  return (
    <div className="container-site section flex flex-col gap-16">
      {/* 1. Colour swatches + contrast */}
      <section aria-labelledby={`${variant}-colours`}>
        <p className="eyebrow">Section 01</p>
        <h2 id={`${variant}-colours`} className="heading-2">
          Colour &amp; <em>contrast</em>
        </h2>
        <p className="body-lg mt-3">Variant: {variant}.</p>
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
            <p className="eyebrow">heading-hero</p>
            <p className="heading-hero">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="eyebrow">heading-1</p>
            <p className="heading-1">
              Weddings under the <em>open</em> sky
            </p>
          </div>
          <div>
            <p className="eyebrow">heading-2</p>
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
          Default and disabled shown below. Hover lifts; the focus ring appears on Tab.
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
          <p className="heading-3">A warm brown band for the footer and brand moments.</p>
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
    </div>
  );
}

export default function StyleguidePage() {
  const css = readFileSync(join(process.cwd(), "src", "styles", "theme.css"), "utf8");
  const tokens = parseThemeTokens(css);

  return (
    <>
      <div className="container-site pt-10">
        <p className="eyebrow">Internal · not indexed</p>
        <h1 className="heading-1 mt-2">Hotel Dipali — Design system</h1>
      </div>
      <ThemePreviewToggle
        light={<Sections variant="light" tokens={tokens.light} />}
        dusk={<Sections variant="dusk" tokens={tokens.dusk} />}
      />
    </>
  );
}
