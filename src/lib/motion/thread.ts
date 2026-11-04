/**
 * The gold thread's geometry: a line that runs down one gutter of the page,
 * crosses to the other gutter at each stop (a short S-curve centred on the
 * stop), and ends at the page's centre above the footer. Pure — measured
 * positions in, an SVG path out — so it can be tested without a browser.
 */

export type ThreadLayout = {
  /** Document y of each stop, top to bottom (at least one). */
  stops: number[];
  /** Document y where the thread ends (just above the footer). */
  end: number;
  /** x of the left and right gutters, and of the page's centre. */
  left: number;
  right: number;
  centre: number;
};

/** Height of each crossing (px), capped by the room between stops. */
const CROSS = 140;

export function threadPath({ stops, end, left, right, centre }: ThreadLayout): string {
  const ys = [...stops].sort((a, b) => a - b).filter((y) => y < end);
  if (ys.length === 0) return "";
  const xs = ys.map((_, i) => (i % 2 === 0 ? left : right));
  const r = (n: number) => Math.round(n * 10) / 10;

  let d = `M${r(xs[0]!)} ${r(ys[0]!)}`;
  for (let i = 1; i < ys.length; i += 1) {
    const y = ys[i]!;
    const room = Math.min(y - ys[i - 1]!, (ys[i + 1] ?? end) - y);
    const c = Math.max(12, Math.min(CROSS / 2, room / 3));
    const from = xs[i - 1]!;
    const to = xs[i]!;
    d += ` L${r(from)} ${r(y - c)} C${r(from)} ${r(y)} ${r(to)} ${r(y)} ${r(to)} ${r(y + c)}`;
  }
  const last = xs[xs.length - 1]!;
  const lastY = ys[ys.length - 1]!;
  const c = Math.max(12, Math.min(CROSS / 2, (end - lastY) / 3));
  d += ` L${r(last)} ${r(end - c)} C${r(last)} ${r(end)} ${r(centre)} ${r(end - c)} ${r(centre)} ${r(end)}`;
  return d;
}

/** The gutters for a viewport width: halfway into the container's gutter. */
export function threadGutters(viewportWidth: number, container = 1280): {
  left: number;
  right: number;
  centre: number;
} {
  const margin = Math.max(0, (viewportWidth - container) / 2);
  const gutter = Math.min(40, Math.max(16, viewportWidth * 0.04));
  const left = margin + gutter / 2;
  return { left, right: viewportWidth - left, centre: viewportWidth / 2 };
}

/**
 * Length along the path at which the drawn tip should be for a document y:
 * samples [y, length] pairs (y rising along the path) and interpolates, so
 * the tip keeps to the same line on the screen even through the crossings.
 */
export function lengthAtY(samples: ReadonlyArray<readonly [number, number]>, y: number): number {
  if (samples.length === 0) return 0;
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  if (y <= first[0]) return first[1];
  if (y >= last[0]) return last[1];
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid]![0] <= y) lo = mid;
    else hi = mid;
  }
  const [y0, l0] = samples[lo]!;
  const [y1, l1] = samples[hi]!;
  return y1 === y0 ? l1 : l0 + ((y - y0) / (y1 - y0)) * (l1 - l0);
}
