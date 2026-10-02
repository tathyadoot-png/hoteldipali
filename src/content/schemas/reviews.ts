import { z } from "zod";

import { SOURCE_REQUIRED_MSG, sourceRequiredForPublic, trustShape } from "./common";

export const reviewSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1).max(280),
    authorLabel: z.string().min(1),
    context: z.string().min(1),
    platform: z.enum(["google", "tripadvisor", "direct"]).optional(),
    permissionToPublish: z.boolean(),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG)
  .refine((d) => d.status !== "verified" || d.permissionToPublish, {
    message: "a verified review must have permissionToPublish = true",
    path: ["permissionToPublish"],
  });

export type Review = z.infer<typeof reviewSchema>;
export const reviewsSchema = z.array(reviewSchema);
