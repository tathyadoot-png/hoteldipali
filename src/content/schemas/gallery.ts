import { z } from "zod";

import { imageSchema } from "./common";

export const galleryCategorySchema = z.enum([
  "stay",
  "dining",
  "weddings",
  "events",
  "pool-gym",
  "property",
]);
export type GalleryCategory = z.infer<typeof galleryCategorySchema>;

export const galleryItemSchema = z.object({
  image: imageSchema,
  category: galleryCategorySchema,
  featured: z.boolean(),
  order: z.number().int().nonnegative(),
});

export type GalleryItem = z.infer<typeof galleryItemSchema>;
export const gallerySchema = z.array(galleryItemSchema);
