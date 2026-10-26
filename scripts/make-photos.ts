import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

import { chromium, type Page } from "@playwright/test";

/**
 * Makes web-ready derivatives of the hotel's original images.
 *
 * Sources are read only — never renamed, moved or overwritten:
 * - camera originals in public/hotel/ (8–26 MB each, up to 8256 px) and the
 *   night exteriors the owner added to public/images/hotel/;
 * - the brand logo (public/brand/logo-primary.png, 506 KB);
 * - the owner's palette textures in public/palettes/ (736 px Pinterest-size).
 *
 * Each job writes WebP files at several widths to public/images/<dir>/
 * <slug>-<width>.webp; content entries reference the widest file as `src` and
 * list `widths` (see Picture.tsx). Textures can be colour-graded toward the
 * brand palette with a canvas filter; transparent PNGs keep their alpha.
 *
 * Uses the Chromium that Playwright already installs (no image library):
 * createImageBitmap applies EXIF orientation and resamples with
 * resizeQuality "high"; OffscreenCanvas encodes WebP.
 *
 * Run: pnpm make:photos            (everything, ~1 min)
 *      pnpm make:photos -- stone   (only jobs whose slug contains "stone")
 */

const PUBLIC = join(process.cwd(), "public");
const WIDTHS = [480, 960, 1440, 1920, 2560];
const QUALITY = 0.8;

type Rect = { x: number; y: number; w: number; h: number };

type Job = {
  /** Source path, relative to public/. */
  src: string;
  /** Output directory, relative to public/. */
  out: string;
  slug: string;
  widths: number[];
  quality: number;
  /** Region of the source, as fractions of its width/height. */
  rect?: Rect;
  /** CSS filter applied while drawing (colour grading). */
  filter?: string;
};

/** Camera originals placed on the site: file in public/hotel/ → slug. */
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

const JOBS: Job[] = [
  ...Object.entries(PHOTOS).map(([file, slug]) => ({
    src: `hotel/${file}`,
    out: "images/hotel",
    slug,
    widths: WIDTHS,
    quality: QUALITY,
  })),
  // Phone crop of the aerial, centred on the pool.
  {
    src: "hotel/DJI_20260831173307_0351_D.JPG",
    out: "images/hotel",
    slug: "aerial-pool-grounds-portrait",
    rect: { x: 0.4, y: 0, w: 0.42, h: 1 },
    widths: [480, 720, 1080],
    quality: 0.66,
  },
  // Home hero: the lit entrance tower at night, cropped to the arched window
  // (aspect 0.72). The crop sits below the rooftop sign and inside the
  // neighbouring buildings' lights — nothing is retouched.
  {
    src: "images/hotel/DJI_20260909011702_0042_D.JPG",
    out: "images/hotel",
    slug: "entrance-night-arch",
    rect: { x: 0.335, y: 0.25, w: 0.37, h: 0.685 },
    widths: [480, 720, 960, 1200, 1515],
    quality: 0.8,
  },
  // The real logo, trimmed to its artwork (alpha kept) for the loader and
  // the navigation medallion — instead of the 506 KB 1080 px PNG.
  {
    src: "brand/logo-primary.png",
    out: "images/brand",
    slug: "logo-emblem",
    rect: { x: 196 / 1080, y: 93 / 1080, w: 688 / 1080, h: 827 / 1080 },
    widths: [120, 240, 360, 480],
    quality: 0.86,
  },
  // Palette textures, graded toward Deep Emerald (#073B30) / Botanical Green.
  // Emerald watercolour stone (palette 3, inside its baked-in gold frame).
  {
    src: "palettes/3.jfif",
    out: "images/textures",
    slug: "emerald-stone",
    rect: { x: 0.075, y: 0.085, w: 0.85, h: 0.86 },
    widths: [480],
    quality: 0.82,
    filter: "hue-rotate(-8deg) saturate(0.86) brightness(0.74) contrast(1.1)",
  },
  // Gold foliage around an open centre (palette 9) — the loader's panel.
  {
    src: "palettes/9.jfif",
    out: "images/textures",
    slug: "botanical-panel",
    widths: [480, 736],
    quality: 0.82,
    filter: "sepia(0.18) saturate(0.95) hue-rotate(-6deg) brightness(0.66) contrast(1.08)",
  },
];

type Exported = { width: number; height: number; data: string };

/** Decodes one source in the page and returns a base64 WebP per width. */
async function exportSet(page: Page, job: Job): Promise<Exported[]> {
  statSync(join(PUBLIC, job.src)); // fail loudly if a source is missing
  return page.evaluate(
    async ({ url, widths, quality, rect, filter }) => {
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
        const ctx = canvas.getContext("2d")!;
        if (filter) ctx.filter = filter;
        ctx.drawImage(scaled, 0, 0);
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
    {
      url: `http://photos.local/${job.src.split("/").map(encodeURIComponent).join("/")}`,
      widths: job.widths,
      quality: job.quality,
      rect: job.rect,
      filter: job.filter,
    },
  );
}

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".png": "image/png",
};

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => a !== "--");
  const jobs = only.length ? JOBS.filter((j) => only.some((o) => j.slug.includes(o))) : JOBS;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Serve the sources to the page from disk through a fake origin.
  await page.route("http://photos.local/**", (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
    if (!path) return route.fulfill({ body: "<!doctype html>", contentType: "text/html" });
    return route.fulfill({
      body: readFileSync(join(PUBLIC, path)),
      contentType: TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
    });
  });
  await page.goto("http://photos.local/");

  let written = 0;
  let bytes = 0;
  for (const job of jobs) {
    mkdirSync(join(PUBLIC, job.out), { recursive: true });
    const results = await exportSet(page, job);
    for (const { width, data } of results) {
      const buf = Buffer.from(data, "base64");
      writeFileSync(join(PUBLIC, job.out, `${job.slug}-${width}.webp`), buf);
      written += 1;
      bytes += buf.length;
    }
    const last = results.at(-1)!;
    console.log(
      `${`${job.out}/${job.slug}`.padEnd(44)} ${results.map((r) => r.width).join("/")}  (full ${last.width}×${last.height})`,
    );
  }
  await browser.close();
  console.log(`\nWrote ${written} files, ${(bytes / 1e6).toFixed(1)} MB.`);
}

await main();
