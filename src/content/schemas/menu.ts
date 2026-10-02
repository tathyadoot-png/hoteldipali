import { z } from "zod";

import {
  moneySchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  trustShape,
} from "./common";
import { outletSlugSchema } from "./outlets";

export const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: moneySchema.optional(),
  diet: z.enum(["veg", "egg", "non-veg"]),
  spice: z.number().int().min(0).max(3).optional(),
  signature: z.boolean().optional(),
});

export const menuSchema = z
  .object({
    outletSlug: outletSlugSchema,
    sections: z
      .array(
        z.object({
          name: z.string().min(1),
          note: z.string().min(1).optional(),
          items: z.array(menuItemSchema).min(1),
        }),
      )
      .min(1),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export type Menu = z.infer<typeof menuSchema>;
