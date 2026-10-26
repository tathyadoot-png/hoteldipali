import type { CSSProperties } from "react";

import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Picture } from "@/components/media/Picture";
import { ScrollScene } from "@/components/motion/ScrollScene";
import type { Image } from "@/content";

/**
 * In pictures: photographs that assemble into a scene. The hotel's interiors
 * form one editorial mosaic — a large view and smaller ones around it. Under
 * rich motion (the mosaic's own --p, ScrollScene) each arrives from its own
 * edge, toward the place it takes — the large view from the left, the others
 * from the right and from below — overlapping for a moment as they converge
 * and settling into the composition as it reaches the middle of the screen.
 * Elsewhere they open once, in a short stagger. Captions describe each
 * photograph; the images themselves are decorative.
 */
export function PicturesAssemble({ images }: { images: Image[] }) {
  return (
    <ScrollScene className="pictures-scene">
      <ul className="pictures-grid">
        {images.map((image, i) => (
          <li key={image.id} className="pictures-item" style={{ "--i": i } as CSSProperties}>
            <ScrollReveal variant="image" delay={(i % 3) * 70} className="h-full">
              <figure className="pictures-figure img-hover">
                <Picture
                  image={image}
                  fill
                  decorative
                  sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                />
                <figcaption className="pictures-caption">{image.alt}</figcaption>
              </figure>
            </ScrollReveal>
          </li>
        ))}
      </ul>
    </ScrollScene>
  );
}
