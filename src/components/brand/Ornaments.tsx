// Fine gold line ornaments for the royal identity, drawn as SVG so they stay
// crisp at any size and can draw themselves on (`pathLength={1}` lets CSS
// animate stroke-dashoffset from 1 to 0 without measuring). Colours come from
// CSS (theme.css) — nothing here is coloured inline.

/**
 * The arch: a semicircular-headed window frame — a double line, a keystone,
 * impost marks where the arch springs and a plinth. The box it frames is
 * 360 × 500 (aspect 0.72, the hero's arched window); the SVG overhangs it by
 * 30 units so the outer line, ticks and keystone fit. Each line is drawn as
 * two halves from the keystone down, so it draws symmetrically.
 */
export function ArchFrame({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="-30 -30 420 530" fill="none">
      <path className="arch-line arch-line-outer" pathLength={1} d="M180 -14A194 194 0 0 0 -14 180V500" />
      <path className="arch-line arch-line-outer" pathLength={1} d="M180 -14A194 194 0 0 1 374 180V500" />
      <path className="arch-line arch-line-inner" pathLength={1} d="M180 0A180 180 0 0 0 0 180V500" />
      <path className="arch-line arch-line-inner" pathLength={1} d="M180 0A180 180 0 0 1 360 180V500" />
      <path className="arch-line arch-impost" pathLength={1} d="M-27 180H-6M366 180H387" />
      <path className="arch-line arch-plinth" pathLength={1} d="M-30 500H390" />
      <path className="arch-key" d="M180 -25L188 -14L180 -3L172 -14Z" />
    </svg>
  );
}

/** The medallion's double ring with four cardinal beads (palette 6 reference). */
export function MedallionRing({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <circle className="ring-line ring-outer" pathLength={1} cx="50" cy="50" r="48.5" />
      <circle className="ring-line ring-inner" pathLength={1} cx="50" cy="50" r="44" />
      <path className="ring-bead" d="M50 -1.5L52.5 1.5L50 4.5L47.5 1.5ZM50 95.5L52.5 98.5L50 101.5L47.5 98.5Z" />
    </svg>
  );
}

/**
 * A botanical sprig — a curved stem with alternating almond leaves, smaller
 * toward the tip (inspired by the owner's palette references 7 and 9). One
 * path, so it draws on from the base: stem first, then the leaves upward.
 */
export function Sprig({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 140 320"
      fill="none"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        className="sprig-line"
        pathLength={1}
        d="M96 318C84 230 30 170 26 14M90 287.3Q107 277.6 102.5 255.7Q84.2 268.6 90 287.3M90 287.3L100 262M83 262.7Q78.3 244.8 57.3 243.5Q64.5 263.3 83 262.7M83 262.7L62.5 247.3M74.6 238.1Q88.7 228 82.8 209.2Q67.9 222.1 74.6 238.1M74.6 238.1L81.2 215M65.5 212.8Q60.8 197.3 42.4 196.8Q49.4 213.9 65.5 212.8M65.5 212.8L47.1 200M56.1 186Q68.5 177.6 63.8 161.1Q50.6 172.1 56.1 186M56.1 186L62.3 166.1M47.2 157.1Q44.1 143.6 28.4 142.1Q33.3 157.1 47.2 157.1M47.2 157.1L32.2 145.1M39.1 125.2Q50.3 119.2 47.7 104.9Q35.7 113 39.1 125.2M39.1 125.2L46 109M32.5 89.6Q31.4 78.2 18.6 75.3Q21 88.2 32.5 89.6M32.5 89.6L21.3 78.2M27.9 49.7Q37.6 46 37.1 34.2Q26.5 39.4 27.9 49.7M27.9 49.7L35.3 37.3M26 14q-5-9 0-14q5 5 0 14"
      />
    </svg>
  );
}
