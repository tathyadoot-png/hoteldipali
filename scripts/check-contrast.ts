import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  contrastRatio,
  DISTINCT_CHECKS,
  hueDistance,
  pairsForVariant,
  parseThemeTokens,
  type ThemeTokens,
  type Variant,
} from "../src/lib/contrast";

const here = dirname(fileURLToPath(import.meta.url));
const themePath = join(here, "..", "src", "styles", "theme.css");
const css = readFileSync(themePath, "utf8");
const tokens = parseThemeTokens(css);

const variants: Variant[] = ["light", "dark", "deep"];
let failures = 0;

console.log("\nWCAG AA contrast check — src/styles/theme.css\n");

for (const variant of variants) {
  const set: ThemeTokens = tokens[variant];
  console.log(`[${variant.toUpperCase()}]`);
  console.log(
    "  " +
      "pair".padEnd(28) +
      "ratio".padEnd(10) +
      "min".padEnd(7) +
      "result".padEnd(8) +
      "use",
  );

  for (const pair of pairsForVariant(variant)) {
    const fgHex = set[pair.fg];
    const bgHex = set[pair.bg];
    if (!fgHex || !bgHex) {
      console.log(`  ${`${pair.fg}/${pair.bg}`.padEnd(28)}MISSING TOKEN`);
      failures += 1;
      continue;
    }
    const ratio = contrastRatio(fgHex, bgHex);
    const pass = ratio >= pair.min;
    if (!pass) failures += 1;
    console.log(
      "  " +
        `${pair.fg}/${pair.bg}`.padEnd(28) +
        `${ratio.toFixed(2)}:1`.padEnd(10) +
        `${pair.min}`.padEnd(7) +
        (pass ? "PASS" : "FAIL").padEnd(8) +
        pair.use,
    );
  }
  for (const check of DISTINCT_CHECKS) {
    const a = set[check.a];
    const b = set[check.b];
    if (!a || !b) {
      console.log(`  ${`${check.a}≠${check.b}`.padEnd(28)}MISSING TOKEN`);
      failures += 1;
      continue;
    }
    const distance = hueDistance(a, b);
    const pass = distance >= check.minHue;
    if (!pass) failures += 1;
    console.log(
      "  " +
        `${check.a}≠${check.b}`.padEnd(28) +
        `${distance.toFixed(0)}°`.padEnd(10) +
        `${check.minHue}°`.padEnd(7) +
        (pass ? "PASS" : "FAIL").padEnd(8) +
        check.use,
    );
  }
  console.log("");
}

if (failures > 0) {
  console.error(`✖ ${failures} contrast pair(s) failed WCAG AA.\n`);
  process.exit(1);
}

console.log("✓ All contrast pairs pass WCAG AA.\n");
process.exit(0);
