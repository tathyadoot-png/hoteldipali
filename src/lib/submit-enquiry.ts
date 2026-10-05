// STATIC-ONLY: posts directly from the browser to a third-party hosted form
// endpoint (Web3Forms/Formspree-style) because there is no server in Phase 2.
// This is the ONE function all form submissions go through (CLAUDE.md §C).

export type EnquiryType = "rooms" | "wedding" | "event" | "dining" | "pool-gym" | "general";

export const ENQUIRY_TYPE_OPTIONS: ReadonlyArray<{ value: EnquiryType; label: string }> = [
  { value: "rooms", label: "Rooms" },
  { value: "wedding", label: "Wedding" },
  { value: "event", label: "Event" },
  { value: "dining", label: "Dining" },
  { value: "pool-gym", label: "Pool & Gym" },
  { value: "general", label: "General" },
];

export type EnquiryFormInput = {
  name: string;
  phone: string;
  email?: string;
  enquiryType: EnquiryType;
  preferredDate?: string;
  guests?: number;
  message?: string;
};

export type SubmitEnquiryResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "network" | "rejected"; message: string };

/** Whether a hosted form endpoint has been configured via env vars. */
export function isFormEndpointConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FORM_ENDPOINT);
}

const NOT_CONFIGURED_MESSAGE =
  "Online enquiries aren't connected yet. Please call or WhatsApp us directly — we read every message.";
const REJECTED_MESSAGE =
  "We couldn't send that. Please try again, or call / WhatsApp us directly.";
const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again, or call / WhatsApp us directly.";

export async function submitEnquiry(input: EnquiryFormInput): Promise<SubmitEnquiryResult> {
  const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT;
  if (!endpoint) {
    return { ok: false, reason: "not-configured", message: NOT_CONFIGURED_MESSAGE };
  }

  const accessKey = process.env.NEXT_PUBLIC_FORM_ACCESS_KEY;
  const payload: Record<string, string> = {
    name: input.name,
    phone: input.phone,
    enquiry_type: input.enquiryType,
    subject: `Hotel Dipali website enquiry — ${input.enquiryType}`,
  };
  if (input.email) payload.email = input.email;
  if (input.preferredDate) payload.preferred_date = input.preferredDate;
  if (input.guests) payload.guests = String(input.guests);
  if (input.message) payload.message = input.message;
  if (accessKey) payload.access_key = accessKey;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, reason: "network", message: NETWORK_MESSAGE };
  }

  if (!response.ok) {
    return { ok: false, reason: "rejected", message: REJECTED_MESSAGE };
  }

  // Web3Forms/Formspree-style endpoints return JSON with a `success` field on
  // 2xx responses; treat a non-JSON 2xx as success too.
  try {
    const data: unknown = await response.clone().json();
    if (data && typeof data === "object" && "success" in data) {
      const success = Boolean((data as { success?: unknown }).success);
      if (!success) return { ok: false, reason: "rejected", message: REJECTED_MESSAGE };
    }
  } catch {
    // Non-JSON body on a 2xx response — fine, treat as success.
  }

  return { ok: true };
}
