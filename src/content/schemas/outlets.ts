import { z } from "zod";

import {
  imageSchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  timingsSchema,
  tracked,
  trustShape,
} from "./common";

export const outletSlugSchema = z.enum([
  "restaurant",
  "poolside-restaurant",
  "infinity-bar",
  "bakery",
  "sweets",
]);
export type OutletSlug = z.infer<typeof outletSlugSchema>;

export const outletSchema = z
  .object({
    slug: outletSlugSchema,
    name: z.string().min(1),
    kind: z.enum(["restaurant", "bar", "bakery", "sweets", "cafe"]),
    summary: z.string().min(1),
    cuisine: z.array(z.string().min(1)),
    timings: tracked(timingsSchema),
    dietPolicy: tracked(z.enum(["veg-only", "veg-and-non-veg", "unknown"])),
    ageRestriction: tracked(z.string().min(1)).optional(),
    hasMenu: z.boolean(),
    orderChannels: z
      .array(z.enum(["dine-in", "takeaway", "delivery", "whatsapp-order"]))
      .min(1),
    images: z.array(imageSchema).min(2),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export type Outlet = z.infer<typeof outletSchema>;
export const outletsSchema = z.array(outletSchema);
