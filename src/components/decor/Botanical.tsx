export type BotanicalVariant = "sprig" | "flower" | "vine";

type BotanicalProps = {
  variant?: BotanicalVariant;
  /** Sizing/colour via utilities (stroke follows currentColor). */
  className?: string;
};

// Hand-drawn-feel line strokes. Decorative only — never conveys information.
// Uses currentColor so it reads on Ivory and Peacock; colour it with text-* utilities
// (e.g. text-highlight for a gold accent, text-ink-muted for a quiet divider).
const PATHS: Record<BotanicalVariant, { viewBox: string; body: React.ReactNode }> = {
  sprig: {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M24 62V10" />
        <path d="M24 44c-7 0-13-4-16-11 7-1 13 2 16 8" />
        <path d="M24 36c7 0 13-4 16-11-7-1-13 2-16 8" />
        <path d="M24 26c-6 0-11-3-14-9 6-1 11 2 14 7" />
        <path d="M24 18c3-4 8-6 13-6-1 5-5 9-10 9" />
      </>
    ),
  },
  flower: {
    viewBox: "0 0 64 64",
    body: (
      <>
        <circle cx="32" cy="32" r="6" />
        <path d="M32 26c-3-7-2-13 0-18 2 5 3 11 0 18" />
        <path d="M32 38c3 7 2 13 0 18-2-5-3-11 0-18" />
        <path d="M26 32c-7-3-13-2-18 0 5 2 11 3 18 0" />
        <path d="M38 32c7 3 13 2 18 0-5-2-11-3-18 0" />
        <path d="M28 28c-6-5-11-7-16-8 2 5 6 10 12 11" />
        <path d="M36 36c6 5 11 7 16 8-2-5-6-10-12-11" />
      </>
    ),
  },
  vine: {
    viewBox: "0 0 160 32",
    body: (
      <>
        <path d="M2 16c20-14 40 14 60 0s40-14 60 0 30 10 36 0" />
        <path d="M34 11c-2-6 0-9 4-11 1 5 0 9-4 11" />
        <path d="M80 21c2 6 0 9-4 11-1-5 0-9 4-11" />
        <path d="M122 11c-2-6 0-9 4-11 1 5 0 9-4 11" />
      </>
    ),
  },
};

export function Botanical({ variant = "sprig", className }: BotanicalProps) {
  const { viewBox, body } = PATHS[variant];
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      role="presentation"
      className={className}
    >
      {body}
    </svg>
  );
}
