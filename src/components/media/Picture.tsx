import type { Aspect, Image } from "@/content";

// STATIC-ONLY: renders a plain <img> because static export disables next/image
// optimisation (CLAUDE.md §B). Images are expected to be pre-optimised; when a
// real multi-width/srcset pipeline is added, extend this component — pages that
// use <Picture> will not need to change.

// Full class strings (no dynamic concatenation) so Tailwind detects them.
const ASPECT_CLASS: Record<Aspect, string> = {
  "16:9": "aspect-[16/9]",
  "4:3": "aspect-[4/3]",
  "3:2": "aspect-[3/2]",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "3:4": "aspect-[3/4]",
  "9:16": "aspect-[9/16]",
};

type PictureProps = {
  image: Image;
  /** Crop to this display ratio with object-cover. Omit to keep the image's own ratio. */
  ratio?: Aspect;
  /** Responsive `sizes` hint for the browser. */
  sizes?: string;
  /** Eager-load + high priority (use for an above-the-fold/LCP image only). */
  priority?: boolean;
  /** Treat as decorative: empty alt + aria-hidden, regardless of the image's alt. */
  decorative?: boolean;
  /** Classes for the wrapper (cropped mode) or the <img> (natural mode). */
  className?: string;
};

export function Picture({
  image,
  ratio,
  sizes,
  priority = false,
  decorative = false,
  className,
}: PictureProps) {
  const alt = decorative ? "" : image.alt;
  const ariaHidden = decorative ? true : undefined;
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : undefined;

  if (ratio) {
    return (
      <div
        className={`relative overflow-hidden bg-surface-alt ${ASPECT_CLASS[ratio]} ${className ?? ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation */}
        <img
          src={image.src}
          alt={alt}
          aria-hidden={ariaHidden}
          width={image.width}
          height={image.height}
          sizes={sizes}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation
    <img
      src={image.src}
      alt={alt}
      aria-hidden={ariaHidden}
      width={image.width}
      height={image.height}
      sizes={sizes}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={`h-auto w-full bg-surface-alt ${className ?? ""}`}
    />
  );
}
