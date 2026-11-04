// Fine gold line ornaments for the royal identity, drawn as SVG so they stay
// crisp at any size and can draw themselves on (`pathLength={1}` lets CSS
// animate stroke-dashoffset from 1 to 0 without measuring). Colours come from
// CSS (theme.css) — nothing here is coloured inline.

/**
 * A frame corner: a straight bracket along the two edges, a soft inner curve
 * (the arch's line, quarter-turned) and a small diamond on the corner point.
 * Drawn for the top-left corner, with the corner point at (0, 0); CSS turns it
 * for the other three.
 */
export function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="-6 -6 46 46" fill="none">
      <path className="corner-line" d="M0 34V0H34" />
      <path className="corner-line corner-line-inner" d="M5 18C5 11 11 5 18 5" />
      <path className="corner-key" d="M0 -4.5L4.5 0L0 4.5L-4.5 0Z" />
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

