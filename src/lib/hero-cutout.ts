/**
 * The home hero's cut-out: the lit entrance tower, its porch and the garden
 * in front, lifted out of the night photograph (DJI_20260909011702_0042_D.JPG,
 * 4096×3072) so the giant wordmark can stand behind it. Made offline by
 * `pnpm make:mask` (scripts/make-mask.ts); shared with the tests, which check
 * that no signage is ever in frame (CLAUDE.md §G). All values are fractions
 * of the source photograph's width / height.
 */

type Rect = { x: number; y: number; w: number; h: number };

/** The region of the photograph that is exported (its aspect ≈ 1.31). */
export const CUTOUT_CROP: Rect = { x: 0.15, y: 0.256, w: 0.73, h: 0.744 };

/**
 * The tower's silhouette: two blocks either side of a lower central bay, the
 * lit parapet line included. Hard-edged against the sky.
 */
export const CUTOUT_TOWER: ReadonlyArray<readonly [number, number]> = [
  [0.3262, 0.2593],
  [0.4612, 0.2593],
  [0.4642, 0.2803],
  [0.5688, 0.2803],
  [0.5742, 0.2608],
  [0.7064, 0.2608],
  [0.7064, 0.62],
  [0.3262, 0.62],
];

/**
 * Below the tower the porch, hedges and garden fade out sideways into the
 * night (fully opaque between `inner`, gone at `outer`), starting from `top`
 * (fully in by `full`); the whole cut-out fades out at its foot.
 */
export const CUTOUT_GARDEN = {
  top: 0.555,
  full: 0.64,
  outer: [0.17, 0.86] as const,
  inner: [0.3, 0.73] as const,
};
export const CUTOUT_FOOT_FADE = { from: 0.86, to: 1 };

/** Signage in the photograph that must never be in frame. */
export const SIGNAGE: ReadonlyArray<{ name: string } & Rect> = [
  { name: 'rooftop "DIPALI RESIDENCY"', x: 0.62, y: 0.17, w: 0.16, h: 0.085 },
  { name: 'neighbour\'s "GAME ZONE"', x: 0.82, y: 0.505, w: 0.04, h: 0.022 },
  { name: "neighbour's lit sign, far right", x: 0.95, y: 0.585, w: 0.05, h: 0.04 },
];
