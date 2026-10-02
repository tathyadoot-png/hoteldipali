import { z } from "zod";

/**
 * Shared primitives and trust helpers for all content schemas.
 * Trust rule (CLAUDE.md §F): every item/fact carries a status; a
 * "public-unverified" status must name its source.
 */

export const trustStatusSchema = z.enum(["sample", "public-unverified", "verified"]);
export type TrustStatus = z.infer<typeof trustStatusSchema>;

// Item-level trust fields, spread directly into collection item schemas.
export const trustShape = {
  status: trustStatusSchema,
  source: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
};

type TrustShapeData = {
  status: TrustStatus;
  source?: string | undefined;
  note?: string | undefined;
};

// A public-unverified fact must cite a source.
export function sourceRequiredForPublic(data: TrustShapeData): boolean {
  return data.status !== "public-unverified" || Boolean(data.source);
}

export const SOURCE_REQUIRED_MSG = {
  message: "source is required when status is 'public-unverified'",
  path: ["source"],
};

export type Trust = {
  status: TrustStatus;
  source?: string;
  note?: string;
};

export type Tracked<T> = Trust & { value: T };

/** Wrap a value schema with trust metadata (used for individual facts). */
export function tracked<T extends z.ZodType>(value: T) {
  return z
    .object({
      status: trustStatusSchema,
      source: z.string().min(1).optional(),
      note: z.string().min(1).optional(),
      value,
    })
    .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);
}

// Slugs: lowercase kebab-case.
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");

// Indian mobile: "+91 XXXXX XXXXX", first digit 6–9. Placeholder allowed only
// when the surrounding status is "sample" (enforced by trackedMobile below).
export const PLACEHOLDER_PHONE = "+91 00000 00000";
export const indianMobileSchema = z
  .string()
  .regex(
    /^\+91 (?:[6-9]\d{4} \d{5}|00000 00000)$/,
    'must be "+91 XXXXX XXXXX" with the first digit 6–9 (or the sample placeholder)',
  );

/** Tracked Indian mobile; the placeholder is only valid for sample data. */
export function trackedMobile() {
  return z
    .object({
      status: trustStatusSchema,
      source: z.string().min(1).optional(),
      note: z.string().min(1).optional(),
      value: indianMobileSchema,
    })
    .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG)
    .refine((d) => d.value !== PLACEHOLDER_PHONE || d.status === "sample", {
      message: "placeholder phone is allowed only when status is 'sample'",
      path: ["value"],
    });
}

export const aspectSchema = z.enum([
  "16:9",
  "4:3",
  "3:2",
  "1:1",
  "4:5",
  "3:4",
  "9:16",
]);
export type Aspect = z.infer<typeof aspectSchema>;

export const imageSchema = z
  .object({
    id: slugSchema,
    src: z
      .string()
      .regex(/^\/(sample|images)\/.+/, "src must live under /sample/ or /images/"),
    alt: z
      .string()
      .min(1)
      .refine(
        (v) => !/^image of/i.test(v.trim()),
        'alt should describe the photo, not start with "image of"',
      ),
    caption: z.string().min(1).optional(),
    shot: z.string().min(1, "describe the intended real photo"),
    aspect: aspectSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    credit: z
      .object({
        name: z.string().min(1),
        url: z.string().url(),
        license: z.string().min(1),
      })
      .optional(),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);
export type Image = z.infer<typeof imageSchema>;

export const moneyUnitSchema = z.enum([
  "per night",
  "per plate",
  "per month",
  "per person",
  "per quarter",
  "per year",
  "per item",
]);

export const moneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("INR"),
  unit: moneyUnitSchema.optional(),
  showOnSite: z.boolean(),
});
export type Money = z.infer<typeof moneySchema>;

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be "HH:MM" (24-hour)');

export const timingsSchema = z.array(
  z.object({
    days: z.string().min(1),
    open: timeSchema,
    close: timeSchema,
  }),
);
export type Timings = z.infer<typeof timingsSchema>;
