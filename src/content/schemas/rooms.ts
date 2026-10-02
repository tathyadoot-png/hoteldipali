import { z } from "zod";

import {
  imageSchema,
  moneySchema,
  slugSchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  trustShape,
} from "./common";

export const roomSchema = z
  .object({
    slug: slugSchema,
    name: z.string().min(1),
    order: z.number().int().nonnegative(),
    summary: z.string().min(1).max(160),
    description: z.string().min(1),
    sizeSqft: z.number().int().positive().optional(),
    bed: z.string().min(1),
    maxGuests: z.number().int().positive(),
    maxChildren: z.number().int().nonnegative().optional(),
    view: z.string().min(1).optional(),
    priceFrom: moneySchema.optional(),
    highlights: z.array(z.string().min(1)).min(3).max(5),
    roomAmenities: z.array(z.string().min(1)).min(1),
    bathroomAmenities: z.array(z.string().min(1)).min(1),
    images: z.array(imageSchema).min(3),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export type Room = z.infer<typeof roomSchema>;
export const roomsSchema = z.array(roomSchema);
