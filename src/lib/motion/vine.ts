/**
 * The footer's gold vine, as geometry (server-side, deterministic): a small
 * flower at the centre of the footer's top edge and a stem growing out of it
 * to each side — two different stems, never one mirrored — with leaves and a
 * few tendrils. Drawn in a 1280 × 56 box; the footer shows its centre on
 * narrower screens (preserveAspectRatio "xMidYMid slice").
 *
 * Each stem is cut into segments that draw one after another (`delay`, ms),
 * each in < 400 ms (theme.css, .vine-stem), so the growth reads as one
 * movement while every step stays short; leaves and tendrils open as the
 * stem passes them.
 */

export const VINE_BOX = { width: 1280, height: 56 } as const;

const CENTRE = VINE_BOX.width / 2;
const BASE = 30;
const STEP = 16;
const LENGTH = 640;
const SEGMENTS = 4;
const FIRST = 200; // ms: the stems start once the flower has opened
const SEGMENT_GAP = 270; // ms between segments (each draws in 360 ms)
const SEGMENT_MS = 360;

export type VinePath = { d: string; delay: number };
export type VineLeaf = { x: number; y: number; angle: number; delay: number };
export type Vine = { stems: VinePath[]; tendrils: VinePath[]; leaves: VineLeaf[]; bloom: { x: number; y: number } };

type Side = { dir: 1 | -1; freq: number; phase: number; amp: number };

const SIDES: Side[] = [
  { dir: 1, freq: 1 / 62, phase: 0.4, amp: 8.5 },
  { dir: -1, freq: 1 / 55, phase: 1.3, amp: 7.5 },
];

// Whole units: the box is drawn at 1:1 pixels, so finer coordinates only add bytes.
const round = (n: number) => Math.round(n);

/** The stem's y at a distance from the centre: a gentle wave that swells, then tapers. */
function waveY(side: Side, dist: number): number {
  const swell = Math.min(1, dist / 90) * (1 - 0.45 * (dist / LENGTH));
  return BASE + side.amp * swell * Math.sin(side.phase + dist * side.freq);
}

/** Catmull-Rom through the points, as one cubic Bézier path. */
function smoothPath(points: Array<readonly [number, number]>): string {
  const [first] = points;
  if (!first) return "";
  let d = `M${round(first[0])} ${round(first[1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round(c1[0]!)} ${round(c1[1]!)} ${round(c2[0]!)} ${round(c2[1]!)} ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}

export function footerVine(): Vine {
  const stems: VinePath[] = [];
  const tendrils: VinePath[] = [];
  const leaves: VineLeaf[] = [];
  const perSegment = LENGTH / SEGMENTS;
  // When the stem's tip passes a distance from the centre.
  const timeAt = (dist: number) => {
    const segment = Math.min(SEGMENTS - 1, Math.floor(dist / perSegment));
    return FIRST + segment * SEGMENT_GAP + ((dist - segment * perSegment) / perSegment) * SEGMENT_MS;
  };

  for (const side of SIDES) {
    const at = (dist: number) => [CENTRE + side.dir * dist, waveY(side, dist)] as const;
    for (let s = 0; s < SEGMENTS; s += 1) {
      const points: Array<readonly [number, number]> = [];
      for (let dist = s * perSegment; dist <= (s + 1) * perSegment + 0.01; dist += STEP) points.push(at(dist));
      stems.push({ d: smoothPath(points), delay: FIRST + s * SEGMENT_GAP });
    }

    // Leaves, alternating above and below, angled out along the stem.
    let up = side.dir === 1;
    for (let dist = 34; dist < LENGTH - 16; dist += 44 + ((dist * 7) % 9)) {
      const [x, y] = at(dist);
      const [x2, y2] = at(dist + 2);
      const tangent = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      leaves.push({ x: round(x), y: round(y), angle: round(tangent + (up ? -52 : 52)), delay: Math.round(timeAt(dist)) });
      up = !up;
    }

    // A few tendrils curling off the stem.
    for (const dist of [150, 330, 520]) {
      const [x, y] = at(dist);
      // h: the curl leans outward (or back, mid-way); v: 1 curls up, -1 down.
      const h = side.dir * (dist === 330 ? -1 : 1);
      const v = dist === 330 ? -1 : 1;
      const d = `M${round(x)} ${round(y)}c${5 * h} ${-3 * v} ${9 * h} ${-9 * v} ${5 * h} ${-13 * v}c${-3 * h} ${-3 * v} ${-7 * h} 0 ${-5 * h} ${3 * v}`;
      tendrils.push({ d, delay: Math.round(timeAt(dist)) });
    }
  }

  return { stems, tendrils, leaves, bloom: { x: CENTRE, y: BASE } };
}

/** One almond leaf, its base at the origin, pointing along +x. */
export const VINE_LEAF = "M0 0C3 -3.2 7.5 -3.4 11 0C7.5 3.4 3 3.2 0 0Z";
