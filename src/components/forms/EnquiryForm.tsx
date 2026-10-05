"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { track } from "@/lib/analytics";
import {
  ENQUIRY_TYPE_OPTIONS,
  isFormEndpointConfigured,
  submitEnquiry,
  type EnquiryType,
} from "@/lib/submit-enquiry";
import { isValidEmail, isValidIndianMobile } from "@/lib/validation";

type FieldName = "name" | "phone" | "email" | "guests";
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "error";

type EnquiryFormProps = {
  /** Restrict the enquiry-type choices for a specific context (e.g. a room detail
   * page). Defaults to all categories. When exactly one is given, the select is
   * replaced with a plain label instead of duplicating the component per use case. */
  enquiryTypes?: readonly EnquiryType[];
  defaultEnquiryType?: EnquiryType;
  /** Namespaces element ids. Only needed if a page ever renders the form more
   * than once (e.g. shown in both the Light and Dusk styleguide panes). */
  idPrefix?: string;
  className?: string;
};

export function EnquiryForm({
  enquiryTypes = ENQUIRY_TYPE_OPTIONS.map((o) => o.value),
  defaultEnquiryType,
  idPrefix = "ef",
  className,
}: EnquiryFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const configured = isFormEndpointConfigured();

  const options = ENQUIRY_TYPE_OPTIONS.filter((o) => enquiryTypes.includes(o.value));
  const lockedType = options.length === 1 ? options[0]!.value : undefined;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [enquiryType, setEnquiryType] = useState<EnquiryType>(
    defaultEnquiryType ?? lockedType ?? options[0]?.value ?? "general",
  );
  const [preferredDate, setPreferredDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // must stay empty

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Each ref is passed directly to its <input ref={...}> below (not through a
  // wrapping object) — react-hooks/refs flags indirected ref access. The
  // lookup used for focus management is built locally inside the handler.
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const guestsRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || status === "submitting") return;

    // Honeypot: a real visitor never fills this (it's visually hidden and out
    // of the tab order). A bot that blindly fills every field does. Silently
    // drop the spam without a real network call, but don't tip it off.
    if (honeypot.trim().length > 0) {
      router.push("/thank-you/");
      return;
    }

    const nextErrors: Errors = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Please enter your name.";
    }
    if (!isValidIndianMobile(phone)) {
      nextErrors.phone = "Please enter a valid 10-digit Indian mobile number.";
    }
    if (email.trim().length > 0 && !isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address, or leave it blank.";
    }
    const guestsNum = guests.trim().length > 0 ? Number(guests) : undefined;
    if (guestsNum !== undefined && (!Number.isInteger(guestsNum) || guestsNum < 1)) {
      nextErrors.guests = "Please enter a whole number of guests, or leave it blank.";
    }

    setErrors(nextErrors);

    const firstInvalid = (Object.keys(nextErrors) as FieldName[])[0];
    if (firstInvalid) {
      const refByField = { name: nameRef, phone: phoneRef, email: emailRef, guests: guestsRef };
      refByField[firstInvalid].current?.focus();
      return;
    }

    setStatus("submitting");
    setSubmitMessage(null);

    const result = await submitEnquiry({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      enquiryType,
      preferredDate: preferredDate || undefined,
      guests: guestsNum,
      message: message.trim() || undefined,
    });

    if (result.ok) {
      track("enquiry_submit", { enquiryType, page: pathname ?? "" });
      router.push("/thank-you/");
      return;
    }

    setStatus("error");
    setSubmitMessage(result.message);
  }

  return (
    <div className={className}>
      {!configured ? (
        <div className="card mb-6 p-4">
          <p className="body">
            Online enquiries aren&rsquo;t connected yet. Please call or WhatsApp us
            directly below — we read every message.
          </p>
        </div>
      ) : null}

      {status === "error" && submitMessage ? (
        <p role="alert" className="field-error mb-6">
          {submitMessage}
        </p>
      ) : null}

      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
        <fieldset disabled={!configured || status === "submitting"} className="contents">
          {/* Honeypot — hidden from sighted/AT users, left for bots to fill. */}
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor={`${idPrefix}-company`}>Company</label>
            <input
              id={`${idPrefix}-company`}
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${idPrefix}-name`} className="label">
              Name
            </label>
            <input
              ref={nameRef}
              id={`${idPrefix}-name`}
              name="name"
              type="text"
              required
              autoComplete="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
            />
            {errors.name ? (
              <p id={`${idPrefix}-name-error`} className="field-error">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${idPrefix}-phone`} className="label">
              Phone
            </label>
            <input
              ref={phoneRef}
              id={`${idPrefix}-phone`}
              name="phone"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              className="input"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? `${idPrefix}-phone-error` : undefined}
            />
            {errors.phone ? (
              <p id={`${idPrefix}-phone-error`} className="field-error">
                {errors.phone}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${idPrefix}-email`} className="label">
              Email <span className="field-hint">(optional)</span>
            </label>
            <input
              ref={emailRef}
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${idPrefix}-email-error` : undefined}
            />
            {errors.email ? (
              <p id={`${idPrefix}-email-error`} className="field-error">
                {errors.email}
              </p>
            ) : null}
          </div>

          {lockedType ? (
            <input type="hidden" name="enquiry_type" value={lockedType} />
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor={`${idPrefix}-enquiry-type`} className="label">
                Enquiry type
              </label>
              <select
                id={`${idPrefix}-enquiry-type`}
                name="enquiry_type"
                required
                className="select"
                value={enquiryType}
                onChange={(e) => setEnquiryType(e.target.value as EnquiryType)}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${idPrefix}-date`} className="label">
                Preferred date <span className="field-hint">(optional)</span>
              </label>
              <input
                id={`${idPrefix}-date`}
                name="preferred_date"
                type="date"
                className="input"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`${idPrefix}-guests`} className="label">
                Number of guests <span className="field-hint">(optional)</span>
              </label>
              <input
                ref={guestsRef}
                id={`${idPrefix}-guests`}
                name="guests"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className="input"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                aria-invalid={Boolean(errors.guests)}
                aria-describedby={errors.guests ? `${idPrefix}-guests-error` : undefined}
              />
              {errors.guests ? (
                <p id={`${idPrefix}-guests-error`} className="field-error">
                  {errors.guests}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${idPrefix}-message`} className="label">
              Message <span className="field-hint">(optional)</span>
            </label>
            <textarea
              id={`${idPrefix}-message`}
              name="message"
              maxLength={1000}
              className="textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary self-start">
            {status === "submitting" ? "Sending…" : "Send enquiry"}
          </button>
        </fieldset>
      </form>

      <p className="body mt-6">
        Prefer to talk? <CallLink className="link" /> ·{" "}
        <WhatsAppLink context="general" className="link">
          WhatsApp us
        </WhatsAppLink>
      </p>
    </div>
  );
}
