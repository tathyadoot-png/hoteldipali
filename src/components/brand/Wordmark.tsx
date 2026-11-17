import type { CSSProperties } from "react";

type WordmarkProps = {
  /** The hotel's name, e.g. "Hotel Dipali": the first word small above, the rest large. */
  name: string;
  className?: string;
  /** Extra class on every letter (the opening's rise), with --n counting across both words. */
  letterClassName?: string;
};

/**
 * The name set as the identity's wordmark: HOTEL small and tracked above
 * DIPALI in Cormorant capitals. One composition at every size — the home
 * hero's giant name, the header's logotype, the opening's line — sized by
 * --wm in CSS (theme.css, .wordmark), so any copy maps onto any other with
 * one uniform scale. Every letter is its own box (for the hero's spread and
 * the opening's rise), the same in every copy so they match exactly.
 * Visual only (aria-hidden): give the link or heading around it its name.
 */
export function Wordmark({ name, className, letterClassName }: WordmarkProps) {
  const [first = "", ...rest] = name.split(" ");
  const second = rest.join(" ");
  const extra = letterClassName ? ` ${letterClassName}` : "";
  return (
    <span aria-hidden="true" className={className ? `wordmark ${className}` : "wordmark"}>
      <span className="wordmark-hotel">
        {Array.from(first).map((char, i) => (
          <span key={i} className={`wordmark-char${extra}`} style={{ "--n": i } as CSSProperties}>
            {char}
          </span>
        ))}
      </span>
      <span className="wordmark-dipali">
        {Array.from(second).map((char, i) => (
          <span
            key={i}
            className={`wordmark-letter${extra}`}
            style={{ "--i": i, "--n": first.length + i } as CSSProperties}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
