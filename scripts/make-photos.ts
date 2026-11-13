import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

import { chromium, type Page } from "@playwright/test";

/**
 * Makes web-ready derivatives of the hotel's original images.
 *
 * Sources are read only — never renamed, moved or overwritten. Originals live
 * outside public/ (media-source/), so they are never deployed:
 * - camera originals in media-source/hotel/ (8–26 MB each, up to 8256 px) and
 *   the night exteriors in media-source/images/hotel/;
 * - the brand logo (public/brand/logo-primary.png, 506 KB).
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

const ROOT = process.cwd();
const PUBLIC = join(ROOT, "public");
const WIDTHS = [480, 960, 1440, 1920, 2560];
const QUALITY = 0.8;

type Rect = { x: number; y: number; w: number; h: number };

type Job = {
  /** Source path, relative to the project root. */
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
  /** Per-pixel grade (decoration only, see DECOR below). */
  grade?: Grade;
  /**
   * Make a repeating tile seamless: the last `seamless` source pixels of each
   * edge are cross-faded over the first ones, so the tile (that much smaller)
   * wraps without a visible seam.
   */
  seamless?: number;
};

/**
 * Grades a decorative image into the palette, pixel by pixel:
 * - `palette`: hues are pulled into plum and gold — greens and olives (stems,
 *   leaves) become antique gold, blues and indigos (a navy night) become
 *   plum, violets and magentas are held in the plum family, yellows settle
 *   on antique gold. Lightness is kept, so the image keeps its modelling.
 * - `whiten`: each channel is divided by this ground colour, so a near-white
 *   studio ground becomes pure white — which `mix-blend-mode: multiply` then
 *   turns into exactly the ivory surface beneath it.
 */
type Grade = { palette?: boolean; whiten?: [number, number, number] };

/** Camera originals placed on the site: file in media-source/hotel/ → slug. */
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
    src: `media-source/hotel/${file}`,
    out: "images/hotel",
    slug,
    widths: WIDTHS,
    quality: QUALITY,
  })),
  // Phone crop of the aerial, centred on the pool.
  {
    src: "media-source/hotel/DJI_20260831173307_0351_D.JPG",
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
    src: "media-source/images/hotel/DJI_20260909011702_0042_D.JPG",
    out: "images/hotel",
    slug: "entrance-night-arch",
    rect: { x: 0.335, y: 0.25, w: 0.37, h: 0.685 },
    widths: [480, 720, 960, 1200, 1515],
    quality: 0.8,
  },
  // "The Dipali Experience" (home): the reception atrium as a 4:5 portrait,
  // centred on the front desk between the carved screens, below the ceiling.
  {
    src: "media-source/hotel/DSC_1632.JPG",
    out: "images/hotel",
    slug: "reception-atrium-portrait",
    rect: { x: 0.26, y: 0.1, w: 0.4801, h: 0.9 },
    widths: [480, 720, 960, 1200],
    quality: QUALITY,
  },
  // The Grand Reveal (home): the night panorama of the whole lit façade,
  // cropped below the rooftop "DIPALI RESIDENCY" sign (CLAUDE.md §G) and above
  // most of the wet car park; and a 4:5 phone crop centred on the entrance,
  // clear of the sign (which stands further right).
  {
    src: "media-source/images/hotel/DJI_20260909011556_0038_D.JPG",
    out: "images/hotel",
    slug: "reveal-night-panorama",
    rect: { x: 0, y: 0.385, w: 1, h: 0.535 },
    widths: [960, 1440, 1920, 2560],
    quality: QUALITY,
  },
  {
    src: "media-source/images/hotel/DJI_20260909011556_0038_D.JPG",
    out: "images/hotel",
    slug: "reveal-night-portrait",
    rect: { x: 0.4, y: 0.385, w: 0.35, h: 0.5833 },
    widths: [480, 720, 1080, 1434],
    quality: QUALITY,
  },
  // The real logo, trimmed to its artwork (alpha kept) for the loader and
  // the navigation medallion — instead of the 506 KB 1080 px PNG.
  {
    src: "public/brand/logo-primary.png",
    out: "images/brand",
    slug: "logo-emblem",
    rect: { x: 196 / 1080, y: 93 / 1080, w: 688 / 1080, h: 827 / 1080 },
    widths: [120, 240, 360, 480],
    quality: 0.86,
  },
  // The site's textures are generated in CSS (theme.css: --texture-velvet,
  // --texture-paper); the palette images in media-source/palettes/ are
  // references only and no longer ship.
  ...DECOR(),
];

/**
 * Decoration (content/decor.json): the owner-supplied flower downloads in
 * media-source/decor/flowers/, graded to plum and gold. Widths never exceed
 * the source (no upscaling), so the 736 px downloads stop at their own width.
 * - The dahlia (a transparent cut-out) as its left and right halves, split at
 *   the flower's heart — two halves of one flower, never one half mirrored.
 * - The orchid pattern, dark and light (the "-Photoroom" cut-out), as
 *   seamless tiles at 1× and 2× (≤ 120 KB each).
 * - Three chrysanthemum studies: two on plum, one on ivory (whitened for
 *   multiply).
 */
function DECOR(): Job[] {
  const dir = "media-source/decor/flowers";
  const palette: Grade = { palette: true };
  // The dahlia's artwork inside 1.png and its heart (measured from the alpha).
  const dahlia = { x0: 0, x1: 1, y0: 0.2, y1: 0.8, heart: 0.488 };
  const half = (side: "left" | "right"): Job => ({
    src: `${dir}/1.png`,
    out: "images/decor",
    slug: `dahlia-${side}`,
    rect:
      side === "left"
        ? { x: dahlia.x0, y: dahlia.y0, w: dahlia.heart - dahlia.x0, h: dahlia.y1 - dahlia.y0 }
        : { x: dahlia.heart, y: dahlia.y0, w: dahlia.x1 - dahlia.heart, h: dahlia.y1 - dahlia.y0 },
    widths: [480, 960, 1440],
    quality: 0.82,
    grade: palette,
  });
  const study = (file: string, slug: string, grade: Grade): Job => ({
    src: `${dir}/${file}`,
    out: "images/decor",
    slug,
    widths: [480, 960, 1440],
    quality: 0.78,
    grade,
  });
  // The light tile's alpha plane is stored losslessly, so it ships a little
  // smaller to stay under 120 KB.
  const tile = (file: string, slug: string, quality: number, widths = [352, 704]): Job => ({
    src: `${dir}/${file}`,
    out: "images/decor",
    slug,
    widths,
    quality,
    grade: palette,
    seamless: 32,
  });
  return [
    half("left"),
    half("right"),
    tile("Midnight Orchid & Gold Veins – Seamless Pattern.jfif", "orchid-veins-dark", 0.7),
    tile("Midnight Orchid & Gold Veins – Seamless Pattern (1)-Photoroom.png", "orchid-veins-light", 0.6, [288, 576]),
    study("Dewy Purple Chrysanthemum Macro.png", "chrysanthemum-dewy", palette),
    study("Velvety Purple Chrysanthemum Bud.png", "chrysanthemum-bud", palette),
    study("Purple Chrysanthemum Bud on Ivory.png", "chrysanthemum-bud-ivory", {
      palette: true,
      whiten: [248, 239, 238],
    }),
  ];
}

type Exported = { width: number; height: number; data: string; brightest?: string };

/** Decodes one source in the page and returns a base64 WebP per width. */
async function exportSet(page: Page, job: Job): Promise<Exported[]> {
  statSync(join(ROOT, job.src)); // fail loudly if a source is missing
  return page.evaluate(
    async ({ url, widths, quality, rect, filter, grade, seamless }) => {
      // HSL ↔ RGB for the palette grade (h in degrees, s/l 0–1).
      const toHsl = (r: number, g: number, b: number): [number, number, number] => {
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        const l = (max + min) / 2;
        if (max === min) return [0, 0, l];
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        const [R, G, B] = [r / 255, g / 255, b / 255];
        const h =
          max === R ? ((G - B) / d + (G < B ? 6 : 0)) * 60 : max === G ? ((B - R) / d + 2) * 60 : ((R - G) / d + 4) * 60;
        return [h, s, l];
      };
      const toRgb = (h: number, s: number, l: number): [number, number, number] => {
        const k = (n: number) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [f(0) * 255, f(8) * 255, f(4) * 255];
      };
      const applyGrade = (ctx: OffscreenCanvasRenderingContext2D, w: number, h: number) => {
        const image = ctx.getImageData(0, 0, w, h);
        const px = image.data;
        let best = -1;
        let brightest = "";
        for (let i = 0; i < px.length; i += 4) {
          let r = px[i]!;
          let g = px[i + 1]!;
          let b = px[i + 2]!;
          if (grade?.whiten) {
            r = Math.min(255, (r * 255) / grade.whiten[0]);
            g = Math.min(255, (g * 255) / grade.whiten[1]);
            b = Math.min(255, (b * 255) / grade.whiten[2]);
          }
          if (grade?.palette) {
            const hsl = toHsl(r, g, b);
            let [hue, sat] = hsl;
            const lig = hsl[2];
            if (sat > 0.06) {
              if (hue >= 62 && hue < 180) {
                hue = 40;
                sat = Math.min(sat, 0.55) * 0.9;
              } else if (hue >= 180 && hue < 268) {
                hue = 290 + (hue - 268) * 0.15;
              } else if (hue >= 268 && hue < 340) {
                hue = 293 + (hue - 300) * 0.4;
              } else if (hue >= 40 && hue < 62) {
                hue = 40 + (hue - 40) * 0.3;
              }
              [r, g, b] = toRgb(hue, sat, lig);
            }
          }
          px[i] = r;
          px[i + 1] = g;
          px[i + 2] = b;
          // The brightest opaque pixel (for a veil's contrast check).
          if (px[i + 3]! > 200) {
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (lum > best) {
              best = lum;
              brightest = `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
            }
          }
        }
        ctx.putImageData(image, 0, 0);
        return brightest;
      };
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
      // Seamless tile: cross-fade the far band of each edge over the near one.
      const wrap = async (bitmap: ImageBitmap, band: number): Promise<ImageBitmap> => {
        const { width: W, height: H } = bitmap;
        const src = new OffscreenCanvas(W, H).getContext("2d")!;
        src.drawImage(bitmap, 0, 0);
        const a = src.getImageData(0, 0, W, H).data;
        const w = W - band;
        const h = H - band;
        const outData = new ImageData(w, h);
        const o = outData.data;
        const at = (x: number, y: number) => (y * W + x) * 4;
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            // Horizontal: columns 0…band-1 blend in the columns past the end.
            const tx = x < band ? x / band : 1;
            const ty = y < band ? y / band : 1;
            const p00 = at(x, y);
            const p10 = at(x + w, y); // the far band (x < band only)
            const p01 = at(x, y + h); // the far band (y < band only)
            const p11 = at(x + w, y + h);
            for (let c = 0; c < 4; c += 1) {
              const near = a[p00 + c]!;
              const farX = x < band ? a[p10 + c]! : near;
              const farY = y < band ? a[p01 + c]! : near;
              const farXY = x < band && y < band ? a[p11 + c]! : x < band ? farX : farY;
              const row0 = farX * (1 - tx) + near * tx;
              const row1 = farXY * (1 - tx) + farY * tx;
              o[(y * w + x) * 4 + c] = row1 * (1 - ty) + row0 * ty;
            }
          }
        }
        return createImageBitmap(outData);
      };
      const tileable = seamless ? await wrap(full, seamless) : full;
      const out: Exported[] = [];
      for (const target of widths) {
        const width = Math.min(target, tileable.width);
        const height = Math.round((tileable.height * width) / tileable.width);
        const scaled = await createImageBitmap(tileable, {
          resizeWidth: width,
          resizeHeight: height,
          resizeQuality: "high",
        });
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d")!;
        if (filter) ctx.filter = filter;
        ctx.drawImage(scaled, 0, 0);
        scaled.close();
        const brightest = grade ? applyGrade(ctx, width, height) : undefined;
        const webp = await canvas.convertToBlob({ type: "image/webp", quality });
        const buf = new Uint8Array(await webp.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) {
          bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        }
        out.push({ width, height, data: btoa(bin), brightest });
        if (width === tileable.width) break;
      }
      if (tileable !== full) tileable.close();
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
      grade: job.grade,
      seamless: job.seamless,
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
      body: readFileSync(join(ROOT, path)),
      contentType: TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
    });
  });
  // tsx keeps function names with an `__name` helper; the code evaluated in
  // the page needs it too.
  await page.addInitScript("window.__name = (f) => f;");
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
    const sizes = results.map((r) => `${r.width}:${Math.round((r.data.length * 3) / 4 / 1024)}KB`).join(" ");
    console.log(
      `${`${job.out}/${job.slug}`.padEnd(44)} ${sizes}  (full ${last.width}×${last.height})${
        last.brightest ? `  brightest ${last.brightest}` : ""
      }`,
    );
  }
  await browser.close();
  console.log(`\nWrote ${written} files, ${(bytes / 1e6).toFixed(1)} MB.`);
}

await main();
