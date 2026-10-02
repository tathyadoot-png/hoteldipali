import { getSite } from "@/content";

export type BookingParams = {
  roomSlug?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

/**
 * Returns the hotel's booking-engine URL, or null when none is configured
 * (current state — site.bookingEngineUrl is null). Callers fall back to a
 * prefilled WhatsApp "Check availability" link when this returns null.
 */
export async function getBookingUrl(params: BookingParams = {}): Promise<string | null> {
  const site = await getSite();
  if (!site.bookingEngineUrl) return null;
  // TODO: map params (roomSlug/checkIn/checkOut/guests) into the engine's query
  // format once the booking engine (name/URL format) is confirmed — see CLAUDE.md §M.
  void params;
  return site.bookingEngineUrl.value;
}
