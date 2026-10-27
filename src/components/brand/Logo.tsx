import Link from "next/link";

export type LogoVariant = "default" | "reverse";

type LogoFile = { src: string; srcSet?: string; width: number; height: number };

// Which logo image file exists for each variant today. The supplied artwork is
// gold on a transparent ground, so the one asset serves both variants: it reads
// on the ivory surface and on the dark grounds "reverse" is used for (the
// header and the brand band footer). Served as the optimised emblem — the
// artwork trimmed of its padding, WebP with alpha, 7–54 KB (pnpm make:photos)
// — instead of the 506 KB 1080 px PNG. Point "reverse" at a dedicated
// logo-reverse file here if one is supplied later.
const EMBLEM: LogoFile = {
  src: "/images/brand/logo-emblem-240.webp",
  srcSet:
    "/images/brand/logo-emblem-120.webp 120w, /images/brand/logo-emblem-240.webp 240w, /images/brand/logo-emblem-360.webp 360w, /images/brand/logo-emblem-480.webp 480w",
  width: 480,
  height: 577,
};
const LOGO_FILES: Record<LogoVariant, LogoFile | null> = {
  default: EMBLEM,
  reverse: EMBLEM,
};

function Wordmark({ variant }: { variant: LogoVariant }) {
  // Peacock flips ink <-> brand-ink automatically via theme tokens; "reverse" here
  // only needs to read correctly over a photo/dark background in Light mode too.
  const textClass = variant === "reverse" ? "text-brand-ink" : "text-ink";
  return (
    <span className={`flex flex-col leading-none ${textClass}`}>
      <span className="font-display text-xl">Hotel Dipali</span>
      {/* .eyebrow's built-in ink-muted assumes a light/peacock surface; override it
          here so "reverse" also reads correctly on the solid brand band. */}
      <span className={`eyebrow mt-1 ${textClass}`}>Sagar</span>
    </span>
  );
}

type LogoProps = {
  variant?: LogoVariant;
  /** Image size classes; the header medallion sets its own. */
  imgClassName?: string;
  /** Rendered width hint for the srcset (CSS px). */
  sizes?: string;
  /** Below the fold (the footer): fetched as it nears the viewport, and not
   * preloaded with the page's first content. */
  lazy?: boolean;
};

type EmblemProps = {
  className?: string;
  /** Rendered width hint for the srcset (CSS px). */
  sizes: string;
  /** Above the fold: fetch early instead of lazily. */
  priority?: boolean;
};

/** The emblem alone, as ornament (alt=""): medallions, the opening loader. */
export function Emblem({ className, sizes, priority = false }: EmblemProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation in Phase 1
    <img
      src={EMBLEM.src}
      srcSet={EMBLEM.srcSet}
      sizes={sizes}
      alt=""
      width={EMBLEM.width}
      height={EMBLEM.height}
      decoding="async"
      loading={priority ? undefined : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
    />
  );
}

// The default height matches the old padded PNG's visible artwork (≈43/55 px).
export function Logo({
  variant = "default",
  imgClassName = "h-11 md:h-14",
  sizes = "4rem",
  lazy = false,
}: LogoProps) {
  const file = LOGO_FILES[variant];

  return (
    <Link href="/" aria-label="Hotel Dipali — home" className="inline-flex items-center">
      {file ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation in Phase 1
        <img
          src={file.src}
          srcSet={file.srcSet}
          sizes={file.srcSet ? sizes : undefined}
          alt="Hotel Dipali"
          width={file.width}
          height={file.height}
          loading={lazy ? "lazy" : undefined}
          decoding={lazy ? "async" : undefined}
          className={`w-auto object-contain ${imgClassName}`}
        />
      ) : (
        <Wordmark variant={variant} />
      )}
    </Link>
  );
}
