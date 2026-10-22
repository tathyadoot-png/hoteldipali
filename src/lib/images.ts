import type { Image } from "@/content";

/** A real photograph — not one of the labelled /sample/ placeholders. */
export function isPhoto(image: Image | undefined): image is Image {
  return Boolean(image && !image.src.startsWith("/sample/"));
}

/**
 * The image to feature in a prominent slot: the preferred one if it is a real
 * photograph, else the first real photograph among `pool`, else the preferred
 * one as it is (a placeholder). Lets scenes avoid placeholders — and avoid
 * reusing the same photo — while content is still being supplied.
 */
export function featureImage(preferred: Image | undefined, pool: Image[]): Image | undefined {
  if (isPhoto(preferred)) return preferred;
  return pool.find(isPhoto) ?? preferred;
}
