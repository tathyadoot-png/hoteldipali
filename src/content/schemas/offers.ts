import { z } from "zod";

import {
  imageSchema,
  slugSchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  trustShape,
} from "./common";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be ISO format YYYY-MM-DD");

export const offerSchema = z
  .object({
    slug: slugSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    validFrom: isoDateSchema,
    validTo: isoDateSchema,
    terms: z.array(z.string().min(1)).min(1),
    cta: z.object({
      label: z.string().min(1),
      href: z.string().min(1),
    }),
    image: imageSchema,
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG)
  .refine((d) => d.validTo >= d.validFrom, {
    message: "validTo must be on or after validFrom",
    path: ["validTo"],
  });

export type Offer = z.infer<typeof offerSchema>;
export const offersSchema = z.array(offerSchema);
