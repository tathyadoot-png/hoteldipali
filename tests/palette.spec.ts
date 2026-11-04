import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  contrastRatio,
  DISTINCT_CHECKS,
  hexToRgb,
  hueDistance,
  hueOf,
  pairsForVariant,
  parseThemeTokens,
  type Variant,
} from "../src/lib/contrast";

// The plum & gold palette (R1, 2026-11-04), checked without a browser: the
// tokens, the contrast gate's pairs, and that nothing of the old emerald /
// teal identity — or a yellow gold — is left in the theme or the assets.

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/styles/theme.css"), "utf8");
const tokens = parseThemeTokens(css);
const VARIANTS: Variant[] = ["light", "dark", "deep"];

/** HSV saturation (0–1) of a hex colour. */
function saturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
}

/** Every #rrggbb in a text, upper-cased and de-duplicated. */
function hexes(text: string): string[] {
  return [...new Set((text.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toUpperCase()))];
}

/** Green or teal: the hues of the retired emerald / peacock identity. */
const isGreenOrTeal = (hex: string) => {
  const hue = hueOf(hex);
  return saturation(hex) > 0.15 && hue >= 90 && hue <= 200;
};

/** A yellow gold: a saturated hue past the warm golds (the brief rules it out). */
const isYellowGold = (hex: string) => {
  const hue = hueOf(hex);
  return saturation(hex) > 0.6 && hue > 44 && hue < 66;
};

test.describe("Palette", () => {
  test("every gated pair passes WCAG AA in every variant", () => {
    for (const variant of VARIANTS) {
      for (const pair of pairsForVariant(variant)) {
        const fg = tokens[variant][pair.fg];
        const bg = tokens[variant][pair.bg];
        expect(fg && bg, `${variant}: ${pair.fg}/${pair.bg} tokens exist`).toBeTruthy();
        expect(contrastRatio(fg!, bg!), `${variant}: ${pair.fg}/${pair.bg} (${pair.use})`).toBeGreaterThanOrEqual(
          pair.min,
        );
      }
    }
  });

  test("the plum & gold tokens exist in every variant", () => {
    for (const variant of VARIANTS) {
      for (const name of ["gold-text", "gold-text-tint", "lavender", "danger", "surface-foot", "logo-gold"]) {
        expect(tokens[variant][name], `${variant}: ${name}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
    expect(tokens.light.brand).toBe("#480950");
    expect(tokens.deep["surface-foot"]).toBe("#0f0515");
  });

  test("the gate covers the new pairs", () => {
    const names = (variant: Variant) => pairsForVariant(variant).map((p) => `${p.fg}/${p.bg}`);
    for (const variant of VARIANTS) {
      expect(names(variant)).toEqual(
        expect.arrayContaining(["danger/surface", "danger/surface-alt", "gold-text/surface", "gold-text/surface-alt"]),
      );
    }
    expect(names("light")).toEqual(
      expect.arrayContaining(["ink/lavender", "brand/lavender", "gold-text-tint/lavender", "logo-gold/brand"]),
    );
    expect(names("deep")).toEqual(
      expect.arrayContaining(["ink/surface-foot", "ink-muted/surface-foot", "logo-gold/surface"]),
    );
  });

  test("a form error reads as a different colour from headings and links", () => {
    for (const variant of VARIANTS) {
      for (const check of DISTINCT_CHECKS) {
        const distance = hueDistance(tokens[variant][check.a]!, tokens[variant][check.b]!);
        expect(distance, `${variant}: ${check.use}`).toBeGreaterThanOrEqual(check.minHue);
      }
    }
  });

  test("no emerald, teal or yellow gold is left in the theme or the generated assets", () => {
    const sources: Array<[string, string]> = [["src/styles/theme.css", css]];
    for (const file of readdirSync(join(ROOT, "public/sample")).filter((f) => f.endsWith(".svg"))) {
      sources.push([`public/sample/${file}`, readFileSync(join(ROOT, "public/sample", file), "utf8")]);
    }
    sources.push(["src/app/icon.svg", readFileSync(join(ROOT, "src/app/icon.svg"), "utf8")]);
    for (const [file, text] of sources) {
      for (const hex of hexes(text)) {
        expect(isGreenOrTeal(hex), `${file}: ${hex} is green/teal`).toBe(false);
        // The logo's measured median (a reference value for the gate) is the
        // client's own gold, not a palette colour.
        if (hex !== "#ECAE33") expect(isYellowGold(hex), `${file}: ${hex} is a yellow gold`).toBe(false);
      }
    }
  });

  test("the palette reference images are not shipped, nor textures made from them", () => {
    expect(existsSync(join(ROOT, "public/palettes"))).toBe(false);
    expect(existsSync(join(ROOT, "public/images/textures"))).toBe(false);
    expect(css).not.toMatch(/url\(["']?\/images\/textures\//);
    // Our own textures are generated in CSS, each well under 8 KB.
    for (const name of ["--texture-velvet", "--texture-paper"]) {
      const value = new RegExp(`${name}: (url\\([^;]+\\));`).exec(css)?.[1] ?? "";
      expect(value.length, name).toBeGreaterThan(0);
      expect(value.length, name).toBeLessThan(8 * 1024);
    }
  });
});
