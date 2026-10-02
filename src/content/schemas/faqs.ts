import { z } from "zod";

import { SOURCE_REQUIRED_MSG, sourceRequiredForPublic, trustShape } from "./common";

export const faqGroupSchema = z.enum([
  "stay",
  "weddings-events",
  "dining",
  "pool-gym",
  "policies",
]);
export type FaqGroup = z.infer<typeof faqGroupSchema>;

export const faqSchema = z
  .object({
    group: faqGroupSchema,
    question: z.string().min(1),
    answer: z.string().min(1).max(600),
    order: z.number().int().nonnegative(),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export type Faq = z.infer<typeof faqSchema>;
export const faqsSchema = z.array(faqSchema);
