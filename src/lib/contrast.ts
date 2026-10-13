// Shared WCAG contrast utilities and the token pairs the design system must pass.
// Used by scripts/check-contrast.ts (build gate) and the /styleguide page.

export type Rgb = { r: number; g: number; b: number };

export type Variant = "light" | "dusk";

export type ThemeTokens = Record<string, string>;

export type ContrastPair = {
  fg: string;
  bg: string;
  min: number;
  kind: "body" | "ui";
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
 * Parse the Light (@theme) and Dusk ([data-theme="dusk"]) colour tokens from
 * theme.css. Only hex values are returned; rgba tokens (e.g. line) are skipped.
 */
export function parseThemeTokens(css: string): Record<Variant, ThemeTokens> {
  const lightBlock = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const duskBlock = /\[data-theme="dusk"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

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

  return { light: parse(lightBlock), dusk: parse(duskBlock) };
}

export const BODY_MIN = 4.5;
export const UI_MIN = 3;

// Body text pairs (≥ 4.5:1) checked in both variants.
const BODY_PAIRS: ReadonlyArray<[string, string]> = [
  ["ink", "surface"],
  ["ink", "surface-alt"],
  ["ink-muted", "surface"],
  ["ink-muted", "surface-alt"],
  ["accent-ink", "accent"],
  ["pop-ink", "pop"],
  ["brand-ink", "brand"],
  // Olive-sage is used for small labels, so it must read as body text on both
  // surfaces — not merely as a UI colour.
  ["pop", "surface"],
  ["pop", "surface-alt"],
];

// UI / large-text pairs (≥ 3:1) checked in both variants.
const UI_PAIRS: ReadonlyArray<[string, string]> = [
  ["accent", "surface"],
  ["accent", "surface-alt"],
];

// UI pairs checked for Dusk only.
const DUSK_ONLY_UI_PAIRS: ReadonlyArray<[string, string]> = [
  ["highlight", "surface"],
];

/** The contrast pairs that must pass for a given variant. */
export function pairsForVariant(variant: Variant): ContrastPair[] {
  const pairs: ContrastPair[] = [
    ...BODY_PAIRS.map(([fg, bg]) => ({ fg, bg, min: BODY_MIN, kind: "body" as const })),
    ...UI_PAIRS.map(([fg, bg]) => ({ fg, bg, min: UI_MIN, kind: "ui" as const })),
  ];
  if (variant === "dusk") {
    pairs.push(
      ...DUSK_ONLY_UI_PAIRS.map(([fg, bg]) => ({ fg, bg, min: UI_MIN, kind: "ui" as const })),
    );
  }
  return pairs;
}
