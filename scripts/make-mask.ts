import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "@playwright/test";

import { CUTOUT_CROP, CUTOUT_FOOT_FADE, CUTOUT_GARDEN, CUTOUT_TOWER } from "../src/lib/hero-cutout";

/**
 * The home hero's cut-out (the giant wordmark stands behind it): the lit
 * entrance tower, porch and garden from the night photograph, with the sky —
 * and with it the rooftop signage — made transparent. The mask is drawn, not
 * guessed: the tower's silhouette is a traced polygon (straight architecture,
 * src/lib/hero-cutout.ts), and below it the garden fades out sideways and at
 * its foot into the night. Nothing is retouched; pixels are only kept or let
 * go.
 *
 * Writes WebP with alpha at 720 / 1080 / 1440 px wide to
 * public/images/hotel/entrance-night-cutout-<w>.webp (≤ 120 KB at 1440).
 * Uses Playwright's Chromium (canvas), like make-photos — no image library.
 *
 * Run: pnpm make:mask
 */

const ROOT = process.cwd();
const SRC = "media-source/images/hotel/DJI_20260909011702_0042_D.JPG";
const OUT = "public/images/hotel";
const SLUG = "entrance-night-cutout";
// Quality per width: the alpha plane is stored losslessly, so the widest
// file trades a little colour detail to stay under 120 KB.
const WIDTHS = [720, 1080, 1440];
const QUALITY: Record<number, number> = { 720: 0.8, 1080: 0.72, 1440: 0.58 };

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route("http://mask.local/**", (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
    if (!path) return route.fulfill({ body: "<!doctype html>", contentType: "text/html" });
    return route.fulfill({ body: readFileSync(join(ROOT, path)), contentType: "image/jpeg" });
  });
  // tsx keeps function names with an `__name` helper; the page needs it too.
  await page.addInitScript("window.__name = (f) => f;");
  await page.goto("http://mask.local/");

  const files = await page.evaluate(
    async ({ url, crop, tower, garden, foot, widths, quality }) => {
      const photo = await createImageBitmap(await (await fetch(url)).blob());
      const W = photo.width;
      const H = photo.height;
      const cx = Math.round(crop.x * W);
      const cy = Math.round(crop.y * H);
      const cw = Math.round(crop.w * W);
      const ch = Math.round(crop.h * H);
      // Source fractions → crop pixels.
      const X = (fx: number) => fx * W - cx;
      const Y = (fy: number) => fy * H - cy;

      // The mask, at full resolution.
      const mask = new OffscreenCanvas(cw, ch);
      const m = mask.getContext("2d")!;
      // 1. The tower: hard-edged, a pixel of softening against the sky.
      m.filter = "blur(1px)";
      m.fillStyle = "#fff";
      m.beginPath();
      tower.forEach(([fx, fy], i) => (i ? m.lineTo(X(fx), Y(fy)) : m.moveTo(X(fx), Y(fy))));
      m.closePath();
      m.fill();
      m.filter = "none";
      // 2. The garden: opaque between `inner`, gone at `outer`, coming in
      //    from `top` to `full`.
      const band = new OffscreenCanvas(cw, ch);
      const b = band.getContext("2d")!;
      const across = b.createLinearGradient(X(garden.outer[0]), 0, X(garden.outer[1]), 0);
      const span = garden.outer[1] - garden.outer[0];
      const at = (fx: number) => (fx - garden.outer[0]) / span;
      across.addColorStop(0, "rgba(255,255,255,0)");
      across.addColorStop(at(garden.inner[0]), "rgba(255,255,255,1)");
      across.addColorStop(at(garden.inner[1]), "rgba(255,255,255,1)");
      across.addColorStop(1, "rgba(255,255,255,0)");
      b.fillStyle = across;
      b.fillRect(0, Y(garden.top), cw, ch - Y(garden.top));
      b.globalCompositeOperation = "destination-in";
      const down = b.createLinearGradient(0, Y(garden.top), 0, Y(garden.full));
      down.addColorStop(0, "rgba(0,0,0,0)");
      down.addColorStop(1, "rgba(0,0,0,1)");
      b.fillStyle = down;
      b.fillRect(0, 0, cw, ch);
      m.globalCompositeOperation = "lighter";
      m.drawImage(band, 0, 0);
      // 3. The foot fades out (the text below sits on the plain night).
      m.globalCompositeOperation = "destination-in";
      const fade = m.createLinearGradient(0, Y(foot.from), 0, Y(foot.to));
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      m.fillStyle = fade;
      m.fillRect(0, 0, cw, ch);

      // The photograph through the mask.
      const cut = new OffscreenCanvas(cw, ch);
      const c = cut.getContext("2d")!;
      c.drawImage(photo, cx, cy, cw, ch, 0, 0, cw, ch);
      c.globalCompositeOperation = "destination-in";
      c.drawImage(mask, 0, 0);
      const full = await createImageBitmap(cut);

      const out: Array<{ width: number; height: number; data: string }> = [];
      for (const width of widths) {
        const height = Math.round((ch * width) / cw);
        const scaled = await createImageBitmap(full, {
          resizeWidth: width,
          resizeHeight: height,
          resizeQuality: "high",
        });
        const canvas = new OffscreenCanvas(width, height);
        canvas.getContext("2d")!.drawImage(scaled, 0, 0);
        const webp = await canvas.convertToBlob({ type: "image/webp", quality: quality[width] });
        const buf = new Uint8Array(await webp.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        out.push({ width, height, data: btoa(bin) });
      }
      return out;
    },
    {
      url: `http://mask.local/${SRC}`,
      crop: CUTOUT_CROP,
      tower: CUTOUT_TOWER.map(([x, y]) => [x, y] as [number, number]),
      garden: {
        top: CUTOUT_GARDEN.top,
        full: CUTOUT_GARDEN.full,
        outer: [CUTOUT_GARDEN.outer[0], CUTOUT_GARDEN.outer[1]] as [number, number],
        inner: [CUTOUT_GARDEN.inner[0], CUTOUT_GARDEN.inner[1]] as [number, number],
      },
      foot: CUTOUT_FOOT_FADE,
      widths: WIDTHS,
      quality: QUALITY,
    },
  );

  mkdirSync(join(ROOT, OUT), { recursive: true });
  for (const { width, height, data } of files) {
    const buf = Buffer.from(data, "base64");
    writeFileSync(join(ROOT, OUT, `${SLUG}-${width}.webp`), buf);
    console.log(`${OUT}/${SLUG}-${width}.webp  ${width}×${height}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
  await browser.close();
}

await main();
