import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "@playwright/test";

/**
 * Makes the depth map the home hero's depth effect (DepthPhoto, WebGL) reads:
 * a grey image the size of the hero photograph's crop, where nearer is
 * brighter. It is hand-authored, not estimated by a model: the planes of this
 * one photograph (entrance-night-arch, the lit entrance tower at night) drawn
 * as shapes over it, then blurred so their edges never tear the picture.
 *
 *   the sky strip and recessed windows   farthest
 *   the façade wall                      far
 *   the porch interior                   behind the porch
 *   canopy and pillars                   the focal plane (FOCUS: it stays still)
 *   cart, steps, lamp posts              a little nearer
 *   hedges and paving                    nearer
 *   the lawn                             nearer still, toward the viewer
 *   the cannas in front                  nearest
 *
 * Coordinates are in the 720 × 999 space of entrance-night-arch-720.webp; the
 * crop is the same at every width. If the photograph is replaced, redraw the
 * planes over the new one (open the SVG over it at 50% opacity to check).
 *
 * Uses the Chromium Playwright already installs (no image library).
 * Run: pnpm make:depth
 */

const OUT = join(process.cwd(), "public", "images", "hotel", "entrance-night-arch-depth.webp");
const WIDTH = 480;
const HEIGHT = Math.round((WIDTH * 999) / 720); // 666
const BLUR_PX = 5; // at WIDTH

// Grey levels (0 far – 255 near).
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 999" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lawn" x1="0" y1="745" x2="0" y2="999" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="rgb(140,140,140)"/><stop offset="1" stop-color="rgb(200,200,200)"/>
    </linearGradient>
    <linearGradient id="paving" x1="0" y1="690" x2="0" y2="748" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="rgb(118,118,118)"/><stop offset="1" stop-color="rgb(140,140,140)"/>
    </linearGradient>
    <linearGradient id="cannas" x1="0" y1="760" x2="0" y2="999" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="rgb(178,178,178)"/><stop offset="1" stop-color="rgb(255,255,255)"/>
    </linearGradient>
  </defs>
  <rect width="720" height="999" fill="rgb(52,52,52)"/>
  <rect width="720" height="22" fill="rgb(30,30,30)"/>
  <rect x="250" y="130" width="202" height="108" fill="rgb(40,40,40)"/>
  <rect x="245" y="275" width="220" height="160" fill="rgb(40,40,40)"/>
  <rect x="240" y="485" width="250" height="90" fill="rgb(70,70,70)"/>
  <rect x="130" y="440" width="480" height="47" fill="rgb(112,112,112)"/>
  <rect x="205" y="480" width="37" height="215" fill="rgb(112,112,112)"/>
  <rect x="490" y="480" width="38" height="215" fill="rgb(112,112,112)"/>
  <rect x="285" y="565" width="215" height="140" fill="rgb(118,118,118)"/>
  <rect x="0" y="690" width="720" height="58" fill="url(#paving)"/>
  <rect x="168" y="528" width="30" height="224" fill="rgb(128,128,128)"/>
  <rect x="541" y="528" width="34" height="224" fill="rgb(128,128,128)"/>
  <rect x="40" y="690" width="200" height="62" fill="rgb(140,140,140)"/>
  <rect x="500" y="688" width="220" height="72" fill="rgb(140,140,140)"/>
  <rect x="0" y="680" width="60" height="120" fill="rgb(160,160,160)"/>
  <rect x="0" y="745" width="720" height="254" fill="url(#lawn)"/>
  <path fill="url(#cannas)" d="M0 820 L60 762 L110 800 L170 772 L232 842 L300 882 L342 792 L400 760 L452 800 L502 832 L562 792 L632 760 L700 802 L720 784 L720 999 L0 999 Z"/>
</svg>`;

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const data = await page.evaluate(
    async ({ svg, width, height, blur }) => {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await img.decode();
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d")!;
      // Blur would pull the edges toward transparent: draw over a padded
      // copy of the same image first, so the border keeps its own value.
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(img, -blur * 2, -blur * 2, width + blur * 4, height + blur * 4);
      const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.8 });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) {
        bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      }
      return btoa(bin);
    },
    { svg: SVG, width: WIDTH, height: HEIGHT, blur: BLUR_PX },
  );
  await browser.close();
  const buf = Buffer.from(data, "base64");
  writeFileSync(OUT, buf);
  console.log(`images/hotel/entrance-night-arch-depth.webp  ${WIDTH}×${HEIGHT}  ${(buf.length / 1024).toFixed(1)} KB`);
}

await main();
