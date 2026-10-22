import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  getGallery,
  getLeisure,
  getOutlets,
  getRooms,
  getSite,
  getVenues,
  type Image,
} from "@/content";

/**
 * Generates a placeholder SVG for every Image entry in the content, plus
 * public/sample/credits.json. Idempotent — safe to re-run. Hex colours are
 * allowed in these generated files (they are assets, not components).
 *
 * These are deliberately NOT mock photographs: each is an abstract tonal panel
 * in the Ivory & Gold family, so a page composed of them reads as "photography
 * pending" rather than "broken". The shot description is carried in the SVG's
 * aria-label (and in content/*.json, /dev/content/ and docs/data-needed.md) —
 * never burned into the artwork, which visitors would read as site copy.
 */

const OUT_DIR = join(process.cwd(), "public", "sample");

/** Tonal families, keyed by image-id prefix. Base + shade + hairline. */
type Tone = { base: string; shade: string; line: string };

/*
 * Bases sit a clear step darker than the page surfaces (sandstone #efe6d6,
 * surface-alt #e4d6bf) so an image slot reads as a distinct plane rather than
 * a faint rectangle on the background.
 */
const TONES: Record<string, Tone> = {
  // Exterior / property — warm stone.
  property: { base: "#D2C4A9", shade: "#C2B294", line: "#A2906F" },
  // Guest rooms — soft ivory linen.
  stay: { base: "#DCCFB8", shade: "#CBBB9F", line: "#AE9C7C" },
  // Dining, bakery, sweets — warm clay.
  dining: { base: "#D8C6AB", shade: "#C6B191", line: "#A8906C" },
  // Infinity Bar — peacock night.
  bar: { base: "#0B2F2E", shade: "#0E3B3A", line: "#6B5A3E" },
  // Lawns and halls — garden green-gold.
  venue: { base: "#CFC6A8", shade: "#BDB290", line: "#9C8F6D" },
  // Pool and gym — cool sage.
  leisure: { base: "#C6CEC4", shade: "#B2BCB0", line: "#93A08F" },
};

/** Map an image id onto a tonal family. */
function toneFor(id: string): Tone {
  if (id.startsWith("outlet-infinity-bar") || id.includes("infinity-bar")) return TONES.bar!;
  if (id.startsWith("venue-") || id.includes("weddings") || id.includes("events"))
    return TONES.venue!;
  if (id.startsWith("leisure-") || id.includes("pool-gym")) return TONES.leisure!;
  if (id.startsWith("outlet-") || id.includes("dining")) return TONES.dining!;
  if (id.startsWith("room-") || id.includes("stay")) return TONES.stay!;
  return TONES.property!;
}

/** Stable 32-bit hash so each id always gets the same composition. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * One of four quiet compositions. Each is mostly flat tone with a single
 * large soft shape, so it crops gracefully under object-cover at any ratio.
 */
function composition(variant: number, w: number, h: number, t: Tone): string {
  const stroke = Math.max(1, Math.round(Math.min(w, h) / 420));
  const parts: string[] = [];

  if (variant === 0) {
    // Low horizon with a rising arc — exterior / open-air feel.
    const horizon = Math.round(h * 0.68);
    const r = Math.round(Math.min(w, h) * 0.3);
    parts.push(`<rect x="0" y="${horizon}" width="${w}" height="${h - horizon}" fill="${t.shade}"/>`);
    parts.push(
      `<circle cx="${Math.round(w * 0.74)}" cy="${Math.round(horizon - r * 0.55)}" r="${r}" fill="none" stroke="${t.line}" stroke-width="${stroke}" opacity="0.5"/>`,
    );
  } else if (variant === 1) {
    // Tall arch — doorway / interior volume.
    const aw = Math.round(w * 0.3);
    const ax = Math.round(w * 0.16);
    const ay = Math.round(h * 0.22);
    const ah = h - ay;
    parts.push(
      `<path d="M${ax} ${ay + ah} V${ay + aw / 2} a${aw / 2} ${aw / 2} 0 0 1 ${aw} 0 V${ay + ah} Z" fill="${t.shade}"/>`,
    );
    parts.push(
      `<path d="M${Math.round(w * 0.62)} ${h} V${Math.round(h * 0.42)}" stroke="${t.line}" stroke-width="${stroke}" opacity="0.45"/>`,
    );
  } else if (variant === 2) {
    // Soft diagonal band — table / counter / surface.
    parts.push(
      `<path d="M0 ${Math.round(h * 0.78)} L${w} ${Math.round(h * 0.56)} L${w} ${h} L0 ${h} Z" fill="${t.shade}"/>`,
    );
    const cy = Math.round(h * 0.34);
    parts.push(
      `<path d="M${Math.round(w * 0.2)} ${cy} q${Math.round(w * 0.14)} ${-Math.round(h * 0.12)} ${Math.round(w * 0.28)} 0" fill="none" stroke="${t.line}" stroke-width="${stroke}" opacity="0.45"/>`,
    );
  } else {
    // Vertical rhythm — colonnade / drapes / shelving.
    const cols = 5;
    const gap = w / (cols + 1);
    for (let i = 1; i <= cols; i++) {
      const x = Math.round(gap * i);
      parts.push(
        `<path d="M${x} ${Math.round(h * 0.18)} V${h}" stroke="${t.line}" stroke-width="${stroke}" opacity="${i % 2 === 0 ? 0.3 : 0.45}"/>`,
      );
    }
    parts.push(
      `<rect x="0" y="${Math.round(h * 0.86)}" width="${w}" height="${Math.round(h * 0.14)}" fill="${t.shade}"/>`,
    );
  }

  return parts.join("\n  ");
}

function svgFor(image: Image): string {
  const { width, height, shot, id } = image;
  const t = toneFor(id);
  const h = hash(id);
  const variant = h % 4;
  const inset = Math.max(8, Math.round(Math.min(width, height) / 90));
  const frameStroke = Math.max(1, Math.round(Math.min(width, height) / 500));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(shot)} (sample placeholder)">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${t.base}"/>
  ${composition(variant, width, height, t)}
  <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" fill="none" stroke="${t.line}" stroke-width="${frameStroke}" opacity="0.35"/>
</svg>
`;
}

async function collectImages(): Promise<Image[]> {
  const images: Image[] = [];
  const [site, rooms, venues, outlets, leisure, gallery] = await Promise.all([
    getSite(),
    getRooms(),
    getVenues(),
    getOutlets(),
    getLeisure(),
    getGallery(),
  ]);

  images.push(site.homeHero);
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
