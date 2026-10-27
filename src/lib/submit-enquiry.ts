// STATIC-ONLY: posts directly from the browser to a third-party hosted form
// endpoint (Web3Forms/Formspree-style) because there is no server in Phase 2.
// This is the ONE function all form submissions go through (CLAUDE.md §C).
//
// Where enquiries are delivered is decided by the provider, not by this code:
// with Web3Forms the recipient is the address the access key was created for;
// with Formspree it is set in the form's dashboard; with FormSubmit it is part
// of the endpoint URL. The current setup routes to tathyadoot@gmail.com — see
// .env.example. Until NEXT_PUBLIC_FORM_ENDPOINT is set, nothing is sent and the
// form offers call / WhatsApp instead (never a pretend success).

/** The page context an enquiry comes from — no longer asked of the visitor;
 * the page supplies it ("wedding" on /weddings/, "general" elsewhere). */
export type EnquiryType = "rooms" | "wedding" | "event" | "dining" | "pool-gym" | "general";

export type EnquiryFormInput = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  enquiryType: EnquiryType;
  /** The page path it was sent from, so the hotel sees which room or page. */
  page?: string;
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
  // `email` doubles as the reply-to address with Web3Forms and Formspree.
  if (input.email) payload.email = input.email;
  if (input.message) payload.message = input.message;
  if (input.page) payload.page = input.page;
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
