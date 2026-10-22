import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium, type Page } from "@playwright/test";

/**
 * Makes web-ready derivatives of the hotel's original photographs.
 *
 * The originals in public/hotel/ are camera files (8–26 MB each, up to
 * 8256 px). They are read only — never renamed, moved or overwritten. For each
 * photo listed below this writes WebP files at several widths to
 * public/images/hotel/<slug>-<width>.webp, which content entries reference
 * (`src` = the widest file, `widths` = all of them; see Picture.tsx).
 *
 * Uses the Chromium that Playwright already installs (no image library):
 * createImageBitmap applies EXIF orientation and resamples with
 * resizeQuality "high"; OffscreenCanvas encodes WebP.
 *
 * Run: pnpm make:photos   (re-run after adding or replacing an original)
 */

const SRC_DIR = join(process.cwd(), "public", "hotel");
const OUT_DIR = join(process.cwd(), "public", "images", "hotel");
const WIDTHS = [480, 960, 1440, 1920, 2560];
const QUALITY = 0.8;

/** Original file → slug used in content. Only photos placed on the site. */
const PHOTOS: Record<string, string> = {
  "DJI_20260831173307_0351_D.JPG": "aerial-pool-grounds",
  "DJI_20260831173334_0354_D.JPG": "aerial-pool-lawns",
  "DSC_0646.JPG": "lounge-sofas",
  "DSC_1601.JPG": "sitting-area-view",
  "DSC_1621.JPG": "sitting-area-gallery",
  "DSC_1632.JPG": "reception-atrium",
  "DSC_1690.JPG": "restaurant-interior",
  "DSC_1971 (2).JPG": "food-pasta",
  "DSC_1975.JPG": "food-pasta-close",
  "DSC_1988.JPG": "food-serving",
  "DSC_1996.JPG": "food-paneer-tikka",
  "DSC_3240.JPG": "lounge-armchairs",
  "DSC_3242.JPG": "lounge-lamps",
  "DSC_3324.JPG": "banquet-hall-event",
  "DSC_3329.JPG": "banquet-hall-tables",
  "DSC_3352.JPG": "banquet-hall-wide",
  "DSC_3355.JPG": "portico-courtyard",
  "DSC_3482.JPG": "cocktail-blue",
  "DSC_3490.JPG": "cocktail-red",
  "DSC_3493.JPG": "cocktail-martini",
  "DSC_6534.JPG": "room-double-1",
  "DSC_6535.JPG": "room-double-2",
  "DSC_6536.JPG": "room-double-3",
  "DSC_6542.JPG": "room-double-4",
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Art-directed crops for small screens: a region of an original (fractions of
 * its width/height) exported as its own set — e.g. a portrait crop of the hero
 * centred on the pool, so phones download a small file that frames the subject.
 */
const CROPS: Array<{ file: string; slug: string; rect: Rect; widths: number[]; quality: number }> = [
  {
    file: "DJI_20260831173307_0351_D.JPG",
    slug: "aerial-pool-grounds-portrait",
    rect: { x: 0.4, y: 0, w: 0.42, h: 1 },
    widths: [480, 720, 1080],
    quality: 0.66,
  },
];

type Exported = { width: number; height: number; data: string };

/** Decodes one original in the page and returns a base64 WebP per width. */
async function exportSet(
  page: Page,
  file: string,
  widths: number[],
  quality: number,
  rect?: Rect,
): Promise<Exported[]> {
  statSync(join(SRC_DIR, file)); // fail loudly if an original is missing
  return page.evaluate(
    async ({ url, widths, quality, rect }) => {
      const blob = await (await fetch(url)).blob();
      const whole = await createImageBitmap(blob);
      const full = rect
        ? await createImageBitmap(
            whole,
            Math.round(rect.x * whole.width),
            Math.round(rect.y * whole.height),
            Math.round(rect.w * whole.width),
            Math.round(rect.h * whole.height),
          )
        : whole;
      const out: Exported[] = [];
      for (const target of widths) {
        const width = Math.min(target, full.width);
        const height = Math.round((full.height * width) / full.width);
        const scaled = await createImageBitmap(full, {
          resizeWidth: width,
          resizeHeight: height,
          resizeQuality: "high",
        });
        const canvas = new OffscreenCanvas(width, height);
        canvas.getContext("2d")!.drawImage(scaled, 0, 0);
        scaled.close();
        const webp = await canvas.convertToBlob({ type: "image/webp", quality });
        const buf = new Uint8Array(await webp.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) {
          bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        }
        out.push({ width, height, data: btoa(bin) });
        if (width === full.width) break;
      }
      if (full !== whole) full.close();
      whole.close();
      return out;
    },
    { url: `http://photos.local/${encodeURIComponent(file)}`, widths, quality, rect },
  );
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Serve the originals to the page from disk through a fake origin.
  await page.route("http://photos.local/**", (route) => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
    if (!name) return route.fulfill({ body: "<!doctype html>", contentType: "text/html" });
    return route.fulfill({ body: readFileSync(join(SRC_DIR, name)), contentType: "image/jpeg" });
  });
  await page.goto("http://photos.local/");

  let written = 0;
  let bytes = 0;
  const jobs: Array<{ file: string; slug: string; widths: number[]; quality: number; rect?: Rect }> = [
    ...Object.entries(PHOTOS).map(([file, slug]) => ({ file, slug, widths: WIDTHS, quality: QUALITY })),
    ...CROPS,
  ];
  for (const job of jobs) {
    const results = await exportSet(page, job.file, job.widths, job.quality, job.rect);
    for (const { width, data } of results) {
      const buf = Buffer.from(data, "base64");
      writeFileSync(join(OUT_DIR, `${job.slug}-${width}.webp`), buf);
      written += 1;
      bytes += buf.length;
    }
    const last = results.at(-1)!;
    console.log(
      `${job.slug.padEnd(30)} ${results.map((r) => r.width).join("/")}  (full ${last.width}×${last.height})`,
    );
  }
  await browser.close();
  console.log(`\nWrote ${written} files, ${(bytes / 1e6).toFixed(1)} MB, to public/images/hotel/.`);
}

await main();
