import type { CSSProperties } from "react";

// The bloom behind the menu's links: an outer ring of long petals and an
// inner ring of shorter ones between them, all pointing out from the centre.
const PETAL_LONG = "M0 -4C9 -14 11 -34 0 -49C-11 -34 -9 -14 0 -4Z";
const PETAL_SHORT = "M0 -3C7 -10 8 -22 0 -32C-8 -22 -7 -10 0 -3Z";
const PETALS = [
  ...Array.from({ length: 12 }, (_, i) => ({ d: PETAL_LONG, angle: i * 30, tone: i % 2 ? "b" : "a" })),
  ...Array.from({ length: 8 }, (_, i) => ({ d: PETAL_SHORT, angle: 22.5 + i * 45, tone: "b" })),
];

/**
 * Plum petals around a centre, filling their box (theme.css, .menu-petals).
 * In the open menu they unfold from the centre as it opens (@starting-style:
 * transform and opacity, staggered); anywhere else they simply rest open.
 * Decorative.
 */
export function MenuPetals({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className ? `menu-petals ${className}` : "menu-petals"}>
      <svg viewBox="-50 -50 100 100" focusable="false">
        {/* The shared shapes carry vector-effect themselves: a <use> copies
            presentation attributes, but styles do not reach inside it. */}
        <defs>
          <path id="menu-petal-long" d={PETAL_LONG} vectorEffect="non-scaling-stroke" />
          <path id="menu-petal-short" d={PETAL_SHORT} vectorEffect="non-scaling-stroke" />
        </defs>
        {PETALS.map((petal, i) => (
          <g key={i} transform={`rotate(${petal.angle})`}>
            <use
              className={`menu-petal menu-petal-${petal.tone}`}
              style={{ "--i": i } as CSSProperties}
              href={petal.d === PETAL_LONG ? "#menu-petal-long" : "#menu-petal-short"}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
