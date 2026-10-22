import type { CSSProperties } from "react";

import type { Aspect, Image } from "@/content";

// STATIC-ONLY: renders plain <img>/<picture> because static export disables
// next/image optimisation (CLAUDE.md §B). Photos are pre-optimised by
// `pnpm make:photos` into width sets; an entry with `widths` gets a srcset, and
// one with `small` gets an art-directed crop for phones. When a dynamic image
// pipeline arrives, extend this component — pages need not change.

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

/** Viewports that get the `small` crop. */
const SMALL_MEDIA = "(max-width: 767px)";

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
  /**
   * Fill a positioned parent edge to edge (object-cover) instead of setting its
   * own size — for frames whose height is fixed by layout. Ignores `ratio`.
   */
  fill?: boolean;
  /** Classes for the wrapper (cropped mode) or the <img> (natural / fill mode). */
  className?: string;
};

/** "…/name-2560.webp" + [480, 960] → "…/name-480.webp 480w, …/name-960.webp 960w". */
export function srcSetFor(src: string, widths: number[] | undefined): string | undefined {
  if (!widths?.length || !/-\d+\.webp$/.test(src)) return undefined;
  return widths.map((w) => `${src.replace(/-\d+\.webp$/, `-${w}.webp`)} ${w}w`).join(", ");
}

export function Picture({
  image,
  ratio,
  sizes,
  priority = false,
  decorative = false,
  fill = false,
  className,
}: PictureProps) {
  const alt = decorative ? "" : image.alt;
  const ariaHidden = decorative ? true : undefined;
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : undefined;
  const srcSet = srcSetFor(image.src, image.widths);
  const style: CSSProperties | undefined = image.focus ? { objectPosition: image.focus } : undefined;
  const common = {
    src: image.src,
    srcSet,
    sizes,
    "aria-hidden": ariaHidden,
    width: image.width,
    height: image.height,
    loading,
    fetchPriority,
    decoding: "async",
    style,
  } as const;

  if (fill) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation
      <img
        {...common}
        alt={alt}
        className={`absolute inset-0 h-full w-full bg-surface-alt object-cover ${className ?? ""}`}
      />
    );
    if (!image.small) return img;
    return (
      <picture>
        <source
          media={SMALL_MEDIA}
          srcSet={srcSetFor(image.small.src, image.small.widths)}
          sizes="100vw"
          width={image.small.width}
          height={image.small.height}
        />
        {img}
      </picture>
    );
  }

  if (ratio) {
    return (
      <div
        className={`relative overflow-hidden bg-surface-alt ${ASPECT_CLASS[ratio]} ${className ?? ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation */}
        <img {...common} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; no next/image optimisation
    <img {...common} alt={alt} className={`h-auto w-full bg-surface-alt ${className ?? ""}`} />
  );
}
