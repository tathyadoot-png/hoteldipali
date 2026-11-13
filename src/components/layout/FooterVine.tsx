import type { CSSProperties } from "react";

import { footerVine, VINE_BOX, VINE_LEAF } from "@/lib/motion/vine";

const VINE = footerVine();
const BLOOM_PETALS = [0, 60, 120, 180, 240, 300];

/**
 * The gold vine along the footer's top edge (geometry: src/lib/motion/vine.ts):
 * a small flower at the centre and a stem growing out of it to each side. It
 * grows once an ancestor is marked `data-revealed` (FooterStage in the footer,
 * ScrollReveal in the styleguide) — at once with `data-revealed="instant"`,
 * and simply there without JS (theme.css, .vine-*). Decorative.
 */
export function FooterVine({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className ? `footer-vine ${className}` : "footer-vine"}>
      <svg
        viewBox={`0 0 ${VINE_BOX.width} ${VINE_BOX.height}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <path id="vine-leaf" d={VINE_LEAF} />
        </defs>
        {VINE.stems.map((stem, i) => (
          <path
            key={`s${i}`}
            className="vine-stem"
            pathLength={1}
            d={stem.d}
            style={{ "--d": `${stem.delay}ms` } as CSSProperties}
          />
        ))}
        {VINE.tendrils.map((tendril, i) => (
          <path
            key={`t${i}`}
            className="vine-tendril"
            pathLength={1}
            d={tendril.d}
            style={{ "--d": `${tendril.delay}ms` } as CSSProperties}
          />
        ))}
        {VINE.leaves.map((leaf, i) => (
          <g key={`l${i}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
            <use className="vine-leaf" href="#vine-leaf" style={{ "--d": `${leaf.delay}ms` } as CSSProperties} />
          </g>
        ))}
        <g transform={`translate(${VINE.bloom.x} ${VINE.bloom.y})`}>
          <g className="vine-bloom">
            {BLOOM_PETALS.map((angle) => (
              <ellipse key={angle} cx={0} cy={-5.5} rx={2.6} ry={5} transform={`rotate(${angle})`} />
            ))}
          </g>
          <circle className="vine-heart" r={2.2} />
        </g>
      </svg>
    </div>
  );
}
