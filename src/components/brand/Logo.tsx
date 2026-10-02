import Link from "next/link";

export type LogoVariant = "default" | "reverse";

// Which logo image file exists for each variant today. Update this map when
// logo-reverse.png (or any new variant) is added to public/brand/.
const LOGO_FILES: Record<LogoVariant, { src: string; width: number; height: number } | null> = {
  default: { src: "/brand/logo-primary.png", width: 1080, height: 1080 },
  reverse: null,
};

function Wordmark({ variant }: { variant: LogoVariant }) {
  // Dusk flips ink <-> brand-ink automatically via theme tokens; "reverse" here
  // only needs to read correctly over a photo/dark background in Light mode too.
  const textClass = variant === "reverse" ? "text-brand-ink" : "text-ink";
  return (
    <span className={`flex flex-col leading-none ${textClass}`}>
      <span className="font-display text-xl">Hotel Dipali</span>
      {/* .eyebrow's built-in ink-muted assumes a light/dusk surface; override it
          here so "reverse" also reads correctly on the solid brand band. */}
      <span className={`eyebrow mt-1 ${textClass}`}>Sagar</span>
    </span>
  );
}

export function Logo({ variant = "default" }: { variant?: LogoVariant }) {
  const file = LOGO_FILES[variant];

  return (
    <Link href="/" aria-label="Hotel Dipali — home" className="inline-flex items-center">
      {file ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation in Phase 1
        <img
          src={file.src}
          alt="Hotel Dipali"
          width={file.width}
          height={file.height}
          className="h-14 w-14 object-contain md:h-16 md:w-16"
        />
      ) : (
        <Wordmark variant={variant} />
      )}
    </Link>
  );
}
