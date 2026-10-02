/** Builds a wa.me deep link with a prefilled, URL-encoded message. */
export function buildWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type WhatsAppContext =
  | "general"
  | "stay"
  | "room"
  | "wedding"
  | "celebration"
  | "dining"
  | "membership"
  | "availability";

const BASE_MESSAGES: Record<Exclude<WhatsAppContext, "room">, string> = {
  general: "Hello Hotel Dipali, I'd like some information. Could you help?",
  stay: "Hello Hotel Dipali, I'd like to know about a stay. Check-in: __ Check-out: __ Guests: __",
  wedding: "Hello Hotel Dipali, I'd like to know about wedding venues. Date: __ Guests: __",
  celebration:
    "Hello Hotel Dipali, I'd like to know about hosting a celebration. Date: __ Guests: __",
  dining: "Hello Hotel Dipali, I'd like to know about dining and reservations.",
  membership: "Hello Hotel Dipali, I'd like to know about pool & gym memberships.",
  availability: "Hello Hotel Dipali, could you confirm availability for my dates? Check-in: __ Check-out: __ Guests: __",
};

/** Short, polite prefilled English messages by enquiry context. */
export const whatsappMessages: Record<WhatsAppContext, (roomName?: string) => string> = {
  general: () => BASE_MESSAGES.general,
  stay: () => BASE_MESSAGES.stay,
  room: (roomName?: string) =>
    roomName
      ? `Hello Hotel Dipali, I'd like to know more about the ${roomName}. Check-in: __ Check-out: __ Guests: __`
      : "Hello Hotel Dipali, I'd like to know more about a room. Check-in: __ Check-out: __ Guests: __",
  wedding: () => BASE_MESSAGES.wedding,
  celebration: () => BASE_MESSAGES.celebration,
  dining: () => BASE_MESSAGES.dining,
  membership: () => BASE_MESSAGES.membership,
  availability: () => BASE_MESSAGES.availability,
};
