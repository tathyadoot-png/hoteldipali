// Shared WCAG contrast utilities and the token pairs the design system must pass.
// Used by scripts/check-contrast.ts (build gate) and the /styleguide page.

export type Rgb = { r: number; g: number; b: number };

export type Variant = "light" | "dark" | "deep";

export type ThemeTokens = Record<string, string>;

export type ContrastPair = {
  fg: string;
  bg: string;
  min: number;
  kind: "body" | "ui";
  /** Where the pair is used on the site. */
  use: string;
};

/** Parse a #rgb / #rrggbb hex string into 0–255 channels. */
export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse the light (@theme), dark ([data-theme="dark"]) and deep
 * ([data-theme="deep"]) colour tokens from theme.css. Only hex values are
 * returned; rgba tokens (e.g. line) are skipped.
 */
export function parseThemeTokens(css: string): Record<Variant, ThemeTokens> {
  const lightBlock = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const darkBlock = /\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const deepBlock = /\[data-theme="deep"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

  const parse = (block: string): ThemeTokens => {
    const tokens: ThemeTokens = {};
    const re = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\b/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(block)) !== null) {
      const name = match[1];
      const value = match[2];
      if (name && value) tokens[name] = value;
    }
    return tokens;
  };

  // A variant inherits every token it does not redefine (as in the cascade).
  const light = parse(lightBlock);
  return { light, dark: { ...light, ...parse(darkBlock) }, deep: { ...light, ...parse(deepBlock) } };
}

export const BODY_MIN = 4.5;
export const UI_MIN = 3;

type PairSpec = readonly [fg: string, bg: string, use: string];

// Body text pairs (≥ 4.5:1) checked in every variant.
const BODY_PAIRS: ReadonlyArray<PairSpec> = [
  ["ink", "surface", "body text"],
  ["ink", "surface-alt", "body text; .btn-secondary hover"],
  ["ink-muted", "surface", "secondary text, eyebrows"],
  ["ink-muted", "surface-alt", "secondary text on alt sections"],
  ["accent-ink", "accent", ".btn-primary on plum grounds; pressed .chip"],
  ["brand-ink", "brand", ".btn-primary on light; brand band"],
  // Plum (light) / champagne (dark, deep) is also small text: headings' em,
  // menu numerals, footer line labels — so it must pass as body text.
  ["accent", "surface", "small accent text"],
  ["accent", "surface-alt", "small accent text on alt sections"],
  ["danger", "surface", ".field-error: form errors"],
  ["danger", "surface-alt", ".field-error on alt sections"],
  ["gold-text", "surface", "gold as text (current-page diamond, phone bar links)"],
  ["gold-text", "surface-alt", "gold as text on alt sections"],
  ["brand", "highlight", "plum label on a gold plaque"],
];

// UI / large-text pairs (≥ 3:1) checked in every variant.
const UI_PAIRS: ReadonlyArray<PairSpec> = [
  ["ink", "surface", ".btn-secondary / .btn-ghost borders"],
  ["ink", "surface-alt", "borders on alt sections"],
  ["accent", "surface", "markers: pressed chip, menu current, room"],
  ["accent", "surface-alt", "markers on alt sections"],
];

// UI pairs checked for dark and deep only. On light grounds antique gold
// (highlight) is decorative only — rules and hairlines, never text — so it is
// not gated there.
const DARK_SCOPE_UI_PAIRS: ReadonlyArray<PairSpec> = [
  ["highlight", "surface", "gold rules, frames, veins and the vine on plum"],
  ["highlight", "surface-alt", "gold rules on plum alt surfaces"],
  // The client's logo (its measured median gold) on every plum ground.
  ["logo-gold", "surface", "the logo on the plum ground"],
  ["logo-gold", "surface-alt", "the logo on plum alt surfaces"],
  ["logo-gold", "brand", "the logo in its plum medallion"],
];

// Pairs checked for the light variant only: plum is also small text on ivory
// (the .btn-secondary label, the script accent word), and the decorative
// lavender surfaces must carry text legibly.
const LIGHT_ONLY_BODY_PAIRS: ReadonlyArray<PairSpec> = [
  ["brand", "surface", ".btn-secondary label on ivory; the header's logotype"],
  ["brand", "surface-alt", "plum text on alt sections"],
  ["ink", "lavender", "body text on a lavender surface"],
  ["ink-muted", "lavender", "secondary text on lavender"],
  ["brand", "lavender", "plum text on lavender; .btn-secondary hover"],
  ["gold-text-tint", "lavender", "gold as text on lavender"],
];

const LIGHT_ONLY_UI_PAIRS: ReadonlyArray<PairSpec> = [
  // The logo always sits on plum on light pages (the medallion).
  ["logo-gold", "brand", "the logo in its plum medallion"],
];

// Pairs checked for deep only: the footer's foot (surface-foot), where the
// legal line, its links and their hover sit; and the menu's petals (lavender,
// surface-alt), which the links, numerals and address lie over.
const DEEP_ONLY_BODY_PAIRS: ReadonlyArray<PairSpec> = [
  ["ink", "surface-foot", "footer foot: legal and social links"],
  ["ink-muted", "surface-foot", "footer foot: the legal line"],
  ["accent", "surface-foot", "footer foot: gold text"],
  ["ink", "lavender", "menu links over its petals"],
  ["ink-muted", "lavender", "the menu's address over its petals"],
  ["accent", "lavender", "menu numerals and current diamond over its petals"],
];

/** The contrast pairs that must pass for a given variant. */
export function pairsForVariant(variant: Variant): ContrastPair[] {
  const toPair =
    (min: number, kind: ContrastPair["kind"]) =>
    ([fg, bg, use]: PairSpec): ContrastPair => ({ fg, bg, min, kind, use });
  const pairs: ContrastPair[] = [
    ...BODY_PAIRS.map(toPair(BODY_MIN, "body")),
    ...UI_PAIRS.map(toPair(UI_MIN, "ui")),
  ];
  if (variant === "light") {
    pairs.push(...LIGHT_ONLY_BODY_PAIRS.map(toPair(BODY_MIN, "body")));
    pairs.push(...LIGHT_ONLY_UI_PAIRS.map(toPair(UI_MIN, "ui")));
  }
  if (variant === "dark" || variant === "deep") {
    pairs.push(...DARK_SCOPE_UI_PAIRS.map(toPair(UI_MIN, "ui")));
  }
  if (variant === "deep") {
    pairs.push(...DEEP_ONLY_BODY_PAIRS.map(toPair(BODY_MIN, "body")));
  }
  return pairs;
}

/** Hue of a hex colour, in degrees (0–360). */
export function hueOf(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Shortest distance between two hues, in degrees (0–180). */
export function hueDistance(a: string, b: string): number {
  const d = Math.abs(hueOf(a) - hueOf(b)) % 360;
  return d > 180 ? 360 - d : d;
}

export type DistinctCheck = { a: string; b: string; minHue: number; use: string };

// Colours that must read as different colours, not only as lighter/darker:
// a form error must never look like a heading or a link.
export const DISTINCT_CHECKS: ReadonlyArray<DistinctCheck> = [
  { a: "danger", b: "brand", minHue: 30, use: "form errors differ from plum headings" },
  { a: "danger", b: "accent", minHue: 30, use: "form errors differ from accent links" },
];
