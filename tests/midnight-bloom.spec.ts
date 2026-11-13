import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { contrastRatio, parseThemeTokens } from "../src/lib/contrast";

// R1.1 "Midnight Bloom" (2026-11-04): the owner wants no diya, lamp or flame
// imagery anywhere; a cursor follower for mouse and trackpad; and decorative
// flowers that are never the subject, never behind text, and `sample` until
// their rights are confirmed.

const ROOT = process.cwd();

/** Every file under `dir` whose name matches `pattern`. */
function filesUnder(dir: string, pattern: RegExp): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path, pattern));
    else if (pattern.test(entry.name)) out.push(path);
  }
  return out;
}

// "clamp" is not a lamp.
const MOTIF = /(?<!c)lamp|flame|diya/i;

test.describe("No lamps, flames or diyas", () => {
  test("not in the built pages' classes, ids or markup names, nor in the built CSS", () => {
    const css = filesUnder(join(ROOT, "out", "_next"), /\.css$/);
    expect(css.length).toBeGreaterThan(0);
    for (const file of css) {
      const hit = MOTIF.exec(readFileSync(file, "utf8"));
      expect(hit?.[0], file).toBeUndefined();
    }
    const pages = filesUnder(join(ROOT, "out"), /\.html$/);
    expect(pages.length).toBeGreaterThan(5);
    for (const file of pages) {
      const html = readFileSync(file, "utf8");
      // Class names, ids and data-* names are the motif's carriers; alt text
      // and photograph file names describing furniture are content, not motifs.
      const names = [
        ...[...html.matchAll(/\sclass="([^"]*)"/g)].map((m) => m[1]),
        ...[...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]),
        ...[...html.matchAll(/\s(data-[a-z-]+)=/g)].map((m) => m[1]),
      ].join(" ");
      const hit = MOTIF.exec(names);
      expect(hit?.[0], file).toBeUndefined();
    }
  });

  test("not in the source: components, styles, scripts or tests", () => {
    const files = [
      ...filesUnder(join(ROOT, "src"), /\.(tsx?|css)$/),
      ...filesUnder(join(ROOT, "scripts"), /\.ts$/),
    ];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      // The photographs' slug "lounge-lamps" names furniture in a photograph.
      const hit = MOTIF.exec(text.replaceAll("lounge-lamps", ""));
      expect(hit?.[0], file).toBeUndefined();
    }
  });
});

/** Waits until the follower is listening (after hydration): it shows on a move. */
async function cursorReady(page: Page) {
  await expect(page.locator(".cursor")).toBeAttached();
  let n = 0;
  await expect
    .poll(async () => {
      n += 1;
      await page.mouse.move(300 + (n % 7), 300);
      return page.locator(".cursor").getAttribute("data-hidden");
    })
    .toBeNull();
}

test.describe("Cursor follower — mouse and trackpad", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("follows the pointer: a ring that eases, a dot exactly on it; no hit area, no focus", async ({ page }) => {
    await page.goto("/rooms/");
    await cursorReady(page);
    await page.mouse.move(420, 320, { steps: 4 });
    const cursor = page.locator(".cursor");
    await expect(cursor).toHaveAttribute("aria-hidden", "true");
    await expect(cursor).not.toHaveAttribute("data-hidden");
    const dot = page.locator(".cursor-dot");
    await expect
      .poll(() => dot.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41))
      .toBe(420);
    // The ring settles on the pointer too.
    await expect
      .poll(() => page.locator(".cursor-ring").evaluate((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41)))
      .toBe(420);
    for (const selector of [".cursor", ".cursor-ring", ".cursor-dot"]) {
      await expect(page.locator(selector)).toHaveCSS("pointer-events", "none");
    }
    expect(await page.locator(".cursor [tabindex], .cursor a, .cursor button").count()).toBe(0);
  });

  test("never hides the system cursor", async ({ page }) => {
    await page.goto("/styleguide/");
    const css = await page.evaluate(() =>
      [...document.styleSheets].flatMap((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText);
        } catch {
          return [];
        }
      }),
    );
    expect(css.some((rule) => /cursor:\s*none/.test(rule))).toBe(false);
    const link = page.getByRole("link", { name: "A link" });
    await link.hover();
    await expect(link).toHaveCSS("cursor", "pointer");
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).not.toBe("none");
  });

  test("grows over a link, reads View over a photograph and Drag over a rail, steps aside over a text field", async ({
    page,
  }) => {
    await page.goto("/styleguide/");
    await cursorReady(page);
    const cursor = page.locator(".cursor");
    const ring = page.locator(".cursor-shape");

    await page.getByRole("link", { name: "A link" }).hover();
    await expect(cursor).toHaveAttribute("data-state", "link");
    await expect.poll(() => ring.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(0.875, 2);
    // The link under the ring is still the element at the pointer.
    const box = await page.getByRole("link", { name: "A link" }).boundingBox();
    expect(
      await page.evaluate(
        ([x, y]) => document.elementFromPoint(x!, y!)?.closest("a")?.textContent?.trim(),
        [box!.x + box!.width / 2, box!.y + box!.height / 2],
      ),
    ).toBe("A link");

    await page.locator('[data-cursor="view"]').first().hover();
    await expect(cursor).toHaveAttribute("data-state", "view");
    await expect(page.locator(".cursor-label")).toHaveText("View");

    await page.locator('[data-cursor="drag"]').first().hover();
    await expect(cursor).toHaveAttribute("data-state", "drag");
    await expect(page.locator(".cursor-label")).toHaveText("Drag");

    await page.locator("input.input:visible").first().hover();
    await expect(cursor).toHaveAttribute("data-state", "text");
    await expect(page.locator(".cursor-ring")).toHaveCSS("opacity", "0");

    // A press tightens the ring.
    await page.getByRole("link", { name: "A link" }).hover();
    await page.mouse.down();
    await expect(cursor).toHaveAttribute("data-press", "");
    await page.mouse.up();
    await expect(cursor).not.toHaveAttribute("data-press");
  });

  test("hides when the pointer leaves the window", async ({ page }) => {
    await page.goto("/rooms/");
    await cursorReady(page);
    await page.evaluate(() =>
      document.documentElement.dispatchEvent(new PointerEvent("pointerleave", { relatedTarget: null })),
    );
    await expect(page.locator(".cursor")).toHaveAttribute("data-hidden", "");
  });

  test("reduced motion: no follower", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/rooms/");
    await page.mouse.move(300, 300);
    await expect(page.locator(".cursor")).toHaveCount(0);
  });
});

test.describe("Cursor follower — touch", () => {
  test.use({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });

  test("no follower on a touch screen", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.tap("body");
    await expect(page.locator(".cursor")).toHaveCount(0);
  });
});

type DecorItem = {
  id: string;
  kind: string;
  ground: string;
  src: string;
  widths: number[];
  width: number;
  height: number;
  half?: string;
  blend?: string;
  tile?: number;
  status: string;
  source?: string;
  note?: string;
};

const decor = JSON.parse(readFileSync(join(ROOT, "content", "decor.json"), "utf8")) as DecorItem[];
const fileFor = (item: DecorItem, width: number) =>
  join(ROOT, "public", item.src.replace(/-\d+\.webp$/, `-${width}.webp`));

test.describe("Decoration (content/decor.json)", () => {
  test("every flower is sample until its rights are confirmed, citing its downloaded original", () => {
    expect(decor.map((d) => d.id).sort()).toEqual(
      [
        "chrysanthemum-bud",
        "chrysanthemum-bud-ivory",
        "chrysanthemum-dewy",
        "dahlia-left",
        "dahlia-right",
        "orchid-veins-dark",
        "orchid-veins-light",
      ].sort(),
    );
    for (const item of decor) {
      expect(item.status, item.id).toBe("sample");
      expect(item.source, item.id).toMatch(/^media-source\/decor\/flowers\//);
      expect(item.note, item.id).toBe("downloaded image — usage rights unconfirmed");
      // Never the teal mandala nor the duplicate downloads.
      expect(item.source, item.id).not.toMatch(/Mandala|download \(\d\)/i);
    }
  });

  test("every file exists and stays within its size limit", () => {
    for (const item of decor) {
      for (const width of item.widths) {
        const bytes = statSync(fileFor(item, width)).size;
        const limit = item.kind === "pattern" ? 120_000 : 150_000;
        expect(bytes, `${item.id}-${width}`).toBeLessThanOrEqual(limit);
      }
    }
    // The hero's cut-out: ≤ 120 KB at 1440 px, and a 720 px file for phones.
    expect(statSync(join(ROOT, "public/images/hotel/entrance-night-cutout-1440.webp")).size).toBeLessThanOrEqual(120_000);
    expect(statSync(join(ROOT, "public/images/hotel/entrance-night-cutout-720.webp")).size).toBeLessThanOrEqual(80_000);
  });

  test("the dahlia's halves are two halves of one flower, not one half mirrored", async ({ page }) => {
    const left = decor.find((d) => d.id === "dahlia-left")!;
    const right = decor.find((d) => d.id === "dahlia-right")!;
    expect(left.half).toBe("left");
    expect(right.half).toBe("right");
    expect(left.height).toBe(right.height);
    await page.goto("/rooms/");
    const difference = await page.evaluate(
      async ([a, b]) => {
        const load = async (src: string) => createImageBitmap(await (await fetch(src)).blob());
        const [l, r] = await Promise.all([load(a!), load(b!)]);
        const w = Math.min(l.width, r.width);
        const h = Math.min(l.height, r.height);
        const draw = (bitmap: ImageBitmap, mirror: boolean) => {
          const canvas = new OffscreenCanvas(w, h);
          const ctx = canvas.getContext("2d")!;
          if (mirror) {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(bitmap, 0, 0, w, h);
          return ctx.getImageData(0, 0, w, h).data;
        };
        const p = draw(l, false);
        const q = draw(r, true);
        let sum = 0;
        for (let i = 0; i < p.length; i += 4) sum += Math.abs(p[i]! - q[i]!) + Math.abs(p[i + 3]! - q[i + 3]!);
        return sum / (p.length / 4);
      },
      [left.src, right.src],
    );
    expect(difference).toBeGreaterThan(20);
  });

  test("a pattern under text: the veil keeps it readable, measured on the tile's own pixels", async ({ page }) => {
    const tokens = parseThemeTokens(readFileSync(join(ROOT, "src/styles/theme.css"), "utf8"));
    await page.goto("/styleguide/");
    const extremes = await page.evaluate(async (items) => {
      const out: Record<string, { brightest: number[]; darkest: number[] }> = {};
      for (const item of items) {
        const bitmap = await createImageBitmap(await (await fetch(item.src)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        const px = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
        let hi = -1;
        let lo = 999;
        let brightest = [0, 0, 0, 0];
        let darkest = [0, 0, 0, 0];
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3]! < 40) continue;
          const lum = 0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!;
          if (lum > hi) {
            hi = lum;
            brightest = [px[i]!, px[i + 1]!, px[i + 2]!, px[i + 3]!];
          }
          if (lum < lo) {
            lo = lum;
            darkest = [px[i]!, px[i + 1]!, px[i + 2]!, px[i + 3]!];
          }
        }
        out[item.id] = { brightest, darkest };
      }
      return out;
    }, decor.filter((d) => d.kind === "pattern").map((d) => ({ id: d.id, src: d.src })));

    const hex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
    const toRgb = (h: string) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
    const mix = (fg: number[], bg: number[], a: number) => fg.map((c, i) => c * a + bg[i]! * (1 - a));
    // The veil: 80% of the surface over the tile (theme.css, .decor-pattern[data-veil]).
    const veiled = (pixel: number[], surface: string) => {
      const ground = toRgb(surface);
      const onGround = mix(pixel.slice(0, 3), ground, pixel[3]! / 255);
      return hex(mix(onGround, ground, 0.2));
    };
    const dark = extremes["orchid-veins-dark"]!;
    const deep = tokens.deep;
    expect(contrastRatio(deep.ink!, veiled(dark.brightest, deep.surface!))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(deep.accent!, veiled(dark.brightest, deep.surface!))).toBeGreaterThanOrEqual(4.5);
    const light = extremes["orchid-veins-light"]!;
    const day = tokens.light;
    expect(contrastRatio(day.ink!, veiled(light.darkest, day.surface!))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(day["ink-muted"]!, veiled(light.darkest, day.surface!))).toBeGreaterThanOrEqual(4.5);
  });
});
