import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  getGallery,
  getLeisure,
  getOutlets,
  getRooms,
  getVenues,
  type Image,
} from "@/content";

/**
 * Generates a labelled placeholder SVG for every Image entry in the content,
 * plus public/sample/credits.json. Idempotent — safe to re-run. Hex colours
 * are allowed in these generated files (they are assets, not components).
 */

const OUT_DIR = join(process.cwd(), "public", "sample");

// Warm-grey placeholder palette (asset only).
const FILL = "#E7E0D2";
const BORDER = "#B9AE99";
const TEXT = "#6B6150";
const SUBTEXT = "#8A7F6B";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wrap text into lines of at most `max` characters, up to `maxLines`. */
function wrap(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1];
    if (last !== undefined) kept[maxLines - 1] = last.replace(/.{1}$/, "…");
    return kept;
  }
  return lines;
}

function svgFor(image: Image): string {
  const { width, height, shot, aspect } = image;
  const cx = width / 2;
  const fontMain = Math.round(Math.min(width, height) / 22);
  const fontSmall = Math.round(fontMain * 0.8);
  const shotLines = wrap(shot, Math.round(width / (fontMain * 0.6)), 3);
  const lineHeight = fontMain * 1.3;
  const blockHeight = shotLines.length * lineHeight + fontSmall * 3;
  let y = height / 2 - blockHeight / 2 + fontMain;

  const shotTspans = shotLines
    .map((line) => {
      const t = `<text x="${cx}" y="${Math.round(y)}" font-size="${fontMain}" fill="${TEXT}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="600">${escapeXml(line)}</text>`;
      y += lineHeight;
      return t;
    })
    .join("");

  const aspectY = Math.round(y + fontSmall * 0.6);
  const labelY = Math.round(aspectY + fontSmall * 1.8);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(shot)} (sample placeholder)">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${FILL}"/>
  <rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="none" stroke="${BORDER}" stroke-width="3"/>
  ${shotTspans}
  <text x="${cx}" y="${aspectY}" font-size="${fontSmall}" fill="${SUBTEXT}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">Aspect ${escapeXml(aspect)} · ${width}×${height}</text>
  <text x="${cx}" y="${labelY}" font-size="${fontSmall}" fill="${SUBTEXT}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="600">SAMPLE — replace with original photo</text>
</svg>
`;
}

async function collectImages(): Promise<Image[]> {
  const images: Image[] = [];
  const [rooms, venues, outlets, leisure, gallery] = await Promise.all([
    getRooms(),
    getVenues(),
    getOutlets(),
    getLeisure(),
    getGallery(),
  ]);

  for (const room of rooms) images.push(...room.images);
  for (const venue of venues) images.push(...venue.images);
  for (const outlet of outlets) images.push(...outlet.images);
  images.push(...leisure.pool.images, ...leisure.gym.images);
  for (const item of gallery) images.push(item.image);

  return images;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const images = await collectImages();

  const seen = new Set<string>();
  const credits: Array<{ id: string; file: string; note: string }> = [];

  for (const image of images) {
    if (seen.has(image.id)) continue;
    seen.add(image.id);
    const file = `${image.id}.svg`;
    writeFileSync(join(OUT_DIR, file), svgFor(image), "utf8");
    credits.push({
      id: image.id,
      file: `/sample/${file}`,
      note: "generated placeholder, no licence needed",
    });
  }

  writeFileSync(
    join(OUT_DIR, "credits.json"),
    JSON.stringify({ generated: credits }, null, 2) + "\n",
    "utf8",
  );

  console.log(`Generated ${credits.length} placeholder SVG(s) in public/sample/.`);
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
