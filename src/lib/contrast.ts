// Shared WCAG contrast utilities and the token pairs the design system must pass.
// Used by scripts/check-contrast.ts (build gate) and the /styleguide page.

export type Rgb = { r: number; g: number; b: number };

export type Variant = "light" | "peacock" | "emerald";

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
 * Parse the Light (@theme) and Peacock ([data-theme="peacock"]) colour tokens
 * from theme.css. Only hex values are returned; rgba tokens (e.g. line) are
 * skipped.
 */
export function parseThemeTokens(css: string): Record<Variant, ThemeTokens> {
  const lightBlock = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const peacockBlock = /\[data-theme="peacock"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const emeraldBlock = /\[data-theme="emerald"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

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

  return { light: parse(lightBlock), peacock: parse(peacockBlock), emerald: parse(emeraldBlock) };
}

export const BODY_MIN = 4.5;
export const UI_MIN = 3;

type PairSpec = readonly [fg: string, bg: string, use: string];

// Body text pairs (≥ 4.5:1) checked in both variants.
const BODY_PAIRS: ReadonlyArray<PairSpec> = [
  ["ink", "surface", "body text"],
  ["ink", "surface-alt", "body text; .btn-secondary hover"],
  ["ink-muted", "surface", "secondary text"],
  ["ink-muted", "surface-alt", "secondary text"],
  ["accent-ink", "accent", ".btn-primary; pressed .chip"],
  ["brand-ink", "brand", "brand band, footer"],
  // Copper (light) / brass (Peacock) is also small text: .field-error, the
  // current header link, menu hover — so it must pass as body text, not only
  // as a UI colour.
  ["accent", "surface", "small accent text (.field-error, current nav link)"],
  ["accent", "surface-alt", "small accent text on alt sections"],
  // Buttons: the gold plaque (.btn-primary, .btn-secondary on hover) carries a
  // deep emerald label in every scope.
  ["brand", "highlight", ".btn-primary label; .btn-secondary hover"],
];

// UI / large-text pairs (≥ 3:1) checked in both variants.
const UI_PAIRS: ReadonlyArray<PairSpec> = [
  ["ink", "surface", ".btn-secondary border"],
  ["ink", "surface-alt", ".btn-secondary border on alt sections"],
  ["accent", "surface", "markers: menu current, room, journey progress"],
  ["accent", "surface-alt", "markers on alt sections"],
];

// UI pairs checked for Peacock only. On light grounds brass (highlight) is
// decorative only — rules and hairlines, never text — so it is not gated there.
const PEACOCK_ONLY_UI_PAIRS: ReadonlyArray<PairSpec> = [
  ["highlight", "surface", "brass rules and ornaments on Peacock"],
  ["highlight", "surface-alt", "brass rules and ornaments on Peacock"],
];

// Pairs checked for the light variant only: on ivory, deep emerald is also
// small text (the .btn-secondary label) and the script accent word.
const LIGHT_ONLY_BODY_PAIRS: ReadonlyArray<PairSpec> = [
  ["brand", "surface", ".btn-secondary label on ivory; script accent word"],
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
  }
  if (variant === "peacock" || variant === "emerald") {
    pairs.push(...PEACOCK_ONLY_UI_PAIRS.map(toPair(UI_MIN, "ui")));
  }
  if (variant === "emerald") {
    // Antique Gold reads as small text on Deep Emerald (5.1:1) but not on
    // Botanical Green (3.8:1): there it is a UI / large-text colour only.
    return pairs.map((p) =>
      p.fg === "accent" && p.bg === "surface-alt" && p.kind === "body"
        ? { ...p, min: UI_MIN, kind: "ui" as const, use: "gold on Botanical Green: large text / UI only" }
        : p,
    );
  }
  return pairs;
}
