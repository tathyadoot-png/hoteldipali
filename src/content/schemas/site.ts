import { z } from "zod";

import {
  slugSchema,
  SOURCE_REQUIRED_MSG,
  sourceRequiredForPublic,
  timeSchema,
  tracked,
  trackedMobile,
  trustShape,
} from "./common";

// The home page's scroll-driven arrival film. Carries its own trust fields like
// an image entry, so a prototype clip is reported by check:content and blocks
// `pnpm release` until original footage replaces it.
const entranceVideoSchema = z
  .object({
    src: z.string().regex(/^\/video\/.+\.mp4$/, "src must be an .mp4 under /video/"),
    // First frame of the clip — shown before playback takes over, so no flash.
    poster: z.string().regex(/^\/video\/.+\.(webp|jpg|png)$/),
    // Static frame for mobile and reduced-motion visitors (no video download).
    still: z.string().regex(/^\/video\/.+\.(webp|jpg|png)$/),
    shot: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    ...trustShape,
  })
  .refine(sourceRequiredForPublic, SOURCE_REQUIRED_MSG);

export const departmentSchema = z.enum([
  "reservations",
  "weddings-events",
  "restaurant",
  "bakery-sweets",
  "bar",
  "pool-gym",
  "general",
]);
export type Department = z.infer<typeof departmentSchema>;

const navLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const siteSchema = z.object({
  name: z.literal("Hotel Dipali"),
  // SEO only; never rendered in the UI except "Also searched as Hotel Deepali".
  alternateNames: z.array(z.string().min(1)),

  tagline: tracked(z.string().min(1)),
  shortDescription: tracked(z.string().min(1)),
  entranceVideo: entranceVideoSchema,

  address: tracked(
    z.object({
      line1: z.string().min(1),
      line2: z.string().min(1).optional(),
      locality: z.string().min(1),
      city: z.literal("Sagar"),
      state: z.literal("Madhya Pradesh"),
      postalCode: z.string().regex(/^\d{6}$/, "postal code must be 6 digits"),
      country: z.literal("IN"),
    }),
  ),

  locationLine: tracked(z.string().min(1)),
  geo: tracked(z.object({ lat: z.number(), lng: z.number() })).nullable(),
  mapsUrl: tracked(z.string().url()),

  contacts: z.array(
    z.object({
      department: departmentSchema,
      label: z.string().min(1),
      phone: trackedMobile(),
      whatsapp: trackedMobile().optional(),
      email: tracked(z.string().email()).optional(),
    }),
  ),

  primaryPhone: departmentSchema,
  primaryWhatsapp: departmentSchema,

  socials: z.array(
    z.object({
      platform: z.enum(["facebook", "instagram", "youtube", "x", "linkedin"]),
      url: tracked(z.string().url()),
    }),
  ),

  bookingEngineUrl: tracked(z.string().url()).nullable(),

  checkInTime: tracked(timeSchema),
  checkOutTime: tracked(timeSchema),

  legal: z.object({
    legalName: tracked(z.string().min(1)),
    gstin: tracked(z.string().min(1)),
    entityType: tracked(z.string().min(1)),
  }),

  brandFamily: z.array(
    z.object({
      slug: slugSchema,
      name: z.string().min(1),
      kind: z.enum(["outlet", "sub-brand"]),
      confirmed: z.boolean(),
    }),
  ),

  navigation: z.object({
    main: z.array(navLinkSchema),
    footer: z.array(
      z.object({
        title: z.string().min(1),
        links: z.array(navLinkSchema),
      }),
    ),
  }),
});

export type Site = z.infer<typeof siteSchema>;
