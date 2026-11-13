import { z } from "zod";

import { slugSchema, SOURCE_REQUIRED_MSG, sourceRequiredForPublic, trustShape } from "./common";

/**
 * Decoration: flowers and patterns that are never the subject of a page —
 * graded to the palette by `pnpm make:photos` from media-source/decor/. Shown
 * as ornament only (alt="", aria-hidden). The owner-supplied downloads are
 * `sample` until their usage rights are confirmed, so the strict content gate
 * blocks a release until then (or until they are replaced).
 */
export const decorSchema = z.array(
  z
    .object({
      id: slugSchema,
      kind: z.enum(["flower", "pattern"]),
      /** The grounds it may sit on (a transparent cut-out sits on any). */
      ground: z.enum(["light", "dark", "any"]),
      src: z.string().regex(/^\/images\/decor\/.+-\d+\.webp$/, "src must be a /images/decor/ width file"),
      widths: z.array(z.number().int().positive()).min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      /** Which half of the flower this is: a left half docks at the right edge. */
      half: z.enum(["left", "right"]).optional(),
      /** A white studio ground that disappears into a light surface. */
      blend: z.literal("multiply").optional(),
      /** Patterns: the tile's CSS size in px (the file is its 2× width). */
      tile: z.number().int().positive().optional(),
      /** Patterns: the brightest pixel, for the veil's contrast check. */
      brightest: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .optional(),
      shot: z.string().min(1),
      ...trustShape,
    })
    .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG),
);
export type Decor = z.infer<typeof decorSchema>[number];
