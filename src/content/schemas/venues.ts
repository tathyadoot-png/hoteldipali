import { z } from "zod";

import {
  imageSchema,
  slugSchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  trustShape,
} from "./common";

export const venueSchema = z
  .object({
    slug: slugSchema,
    name: z.string().min(1),
    order: z.number().int().nonnegative(),
    kind: z.enum(["lawn", "hall", "poolside", "terrace"]),
    indoor: z.boolean(),
    capacitySeated: z.number().int().positive(),
    capacityFloating: z.number().int().positive(),
    areaSqft: z.number().int().positive().optional(),
    suitableFor: z.array(slugSchema).min(1),
    highlights: z.array(z.string().min(1)).min(1),
    images: z.array(imageSchema).min(2),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export type Venue = z.infer<typeof venueSchema>;
export const venuesSchema = z.array(venueSchema);
