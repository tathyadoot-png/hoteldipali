export type AnalyticsEvent =
  | "call_click"
  | "whatsapp_click"
  | "enquiry_submit"
  | "booking_click"
  | "directions_click"
  | "menu_view"
  | "gallery_open"
  | "room_enquiry"
  | "wedding_enquiry"
  | "membership_enquiry";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Wired to GA4/Meta/Ads after consent in step 15.
export function track(
  event: AnalyticsEvent,
  params?: Record<string, string | number>,
): void {
  if (typeof window === "undefined") return;

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...params });
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, params ?? {});
  }
}
