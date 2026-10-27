import type { Site } from "@/content";

export type Contact = Site["contacts"][number];

/**
 * The hotel's lines a visitor can actually use. A department whose number is
 * still a sample placeholder (+91 00000 00000) is left out rather than shown
 * as a number to call; it appears as soon as the hotel confirms its line
 * (docs/data-needed.md).
 */
export function reachableContacts(site: Site): Contact[] {
  return site.contacts.filter((contact) => contact.phone.status !== "sample");
}
