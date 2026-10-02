import { z } from "zod";

import {
  imageSchema,
  moneySchema,
  slugSchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  timingsSchema,
  trustShape,
} from "./common";

const poolSchema = z
  .object({
    summary: z.string().min(1),
    timings: timingsSchema,
    rules: z.array(z.string().min(1)).min(1),
    images: z.array(imageSchema).min(1),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

const gymSchema = z
  .object({
    summary: z.string().min(1),
    timings: timingsSchema,
    equipment: z.array(z.string().min(1)).min(1),
    images: z.array(imageSchema).min(1),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export const membershipSchema = z
  .object({
    slug: slugSchema,
    name: z.string().min(1),
    covers: z.enum(["pool", "gym", "both"]),
    duration: z.enum(["monthly", "quarterly", "half-yearly", "annual"]),
    price: moneySchema.optional(),
    perks: z.array(z.string().min(1)).min(1),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export const leisureSchema = z.object({
  pool: poolSchema,
  gym: gymSchema,
  memberships: z.array(membershipSchema).min(1),
});

export type Leisure = z.infer<typeof leisureSchema>;
export type Membership = z.infer<typeof membershipSchema>;
