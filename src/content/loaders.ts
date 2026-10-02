// STATIC-ONLY: JSON import; replace with CMS/DB fetch in Phase 2
import type { z } from "zod";

import galleryData from "@content/gallery.json";
import leisureData from "@content/leisure.json";
import restaurantMenuData from "@content/menus/restaurant.json";
import offersData from "@content/offers.json";
import outletsData from "@content/outlets.json";
import faqsData from "@content/faqs.json";
import reviewsData from "@content/reviews.json";
import roomsData from "@content/rooms.json";
import siteData from "@content/site.json";
import venuesData from "@content/venues.json";

import {
  faqsSchema,
  gallerySchema,
  leisureSchema,
  menuSchema,
  offersSchema,
  outletsSchema,
  reviewsSchema,
  roomsSchema,
  siteSchema,
  venuesSchema,
  type Department,
  type Faq,
  type FaqGroup,
  type GalleryCategory,
  type GalleryItem,
  type Menu,
  type Offer,
  type OutletSlug,
  type Review,
  type Room,
  type Site,
  type Venue,
} from "./schemas";

/** Parse data once, throwing a readable error (file + path + issue) on failure. */
function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => {
      const at = issue.path.length ? ` at ${issue.path.join(".")}` : "";
      return `  - ${file}${at}: ${issue.message}`;
    });
    throw new Error(`Invalid content in ${file}:\n${lines.join("\n")}`);
  }
  return result.data;
}

// Module-level caches — each file is validated exactly once at import time.
const site: Site = parseOrThrow(siteSchema, siteData, "content/site.json");
const rooms: Room[] = parseOrThrow(roomsSchema, roomsData, "content/rooms.json").sort(
  (a, b) => a.order - b.order,
);
const venues: Venue[] = parseOrThrow(
  venuesSchema,
  venuesData,
  "content/venues.json",
).sort((a, b) => a.order - b.order);
const outlets = parseOrThrow(outletsSchema, outletsData, "content/outlets.json");
const leisure = parseOrThrow(leisureSchema, leisureData, "content/leisure.json");
const faqs: Faq[] = parseOrThrow(faqsSchema, faqsData, "content/faqs.json").sort(
  (a, b) => a.order - b.order,
);
const reviews = parseOrThrow(reviewsSchema, reviewsData, "content/reviews.json");
const gallery: GalleryItem[] = parseOrThrow(
  gallerySchema,
  galleryData,
  "content/gallery.json",
).sort((a, b) => a.order - b.order);
const offers = parseOrThrow(offersSchema, offersData, "content/offers.json");

const menus: Record<string, Menu> = {
  restaurant: parseOrThrow(
    menuSchema,
    restaurantMenuData,
    "content/menus/restaurant.json",
  ),
};

export async function getSite(): Promise<Site> {
  return site;
}

export async function getRooms(): Promise<Room[]> {
  return rooms;
}

export async function getRoom(slug: string): Promise<Room | null> {
  return rooms.find((r) => r.slug === slug) ?? null;
}

export async function getRoomSlugs(): Promise<string[]> {
  return rooms.map((r) => r.slug);
}

export async function getVenues(): Promise<Venue[]> {
  return venues;
}

export async function getVenue(slug: string): Promise<Venue | null> {
  return venues.find((v) => v.slug === slug) ?? null;
}

export async function getVenueSlugs(): Promise<string[]> {
  return venues.map((v) => v.slug);
}

export async function getOutlets() {
  return outlets;
}

export async function getOutlet(slug: string) {
  return outlets.find((o) => o.slug === slug) ?? null;
}

export async function getOutletSlugs(): Promise<string[]> {
  return outlets.map((o) => o.slug);
}

export async function getMenu(outletSlug: OutletSlug): Promise<Menu | null> {
  return menus[outletSlug] ?? null;
}

export async function getLeisure() {
  return leisure;
}

export async function getFaqs(group?: FaqGroup): Promise<Faq[]> {
  return group ? faqs.filter((f) => f.group === group) : faqs;
}

export async function getReviews(): Promise<Review[]> {
  return reviews;
}

export async function getGallery(category?: GalleryCategory): Promise<GalleryItem[]> {
  return category ? gallery.filter((g) => g.category === category) : gallery;
}

export async function getOffers({ activeOn }: { activeOn?: Date } = {}): Promise<
  Offer[]
> {
  if (!activeOn) return offers;
  const day = activeOn.toISOString().slice(0, 10);
  return offers.filter((o) => o.validFrom <= day && day <= o.validTo);
}

export async function getContact(department: Department) {
  return site.contacts.find((c) => c.department === department) ?? null;
}
