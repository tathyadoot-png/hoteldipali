"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { CornerOrnament } from "@/components/brand/Ornaments";
import { useReveal } from "@/components/home/ScrollReveal";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { track } from "@/lib/analytics";
import { isFormEndpointConfigured, submitEnquiry, type EnquiryType } from "@/lib/submit-enquiry";
import { isValidEmail, isValidIndianMobile } from "@/lib/validation";

type FieldName = "name" | "phone" | "email";
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "sent" | "error";

// The checked fields in the order they appear, so a failed submission focuses
// the first one that needs attention.
const FIELD_ORDER: FieldName[] = ["name", "phone", "email"];

// How long the "Enquiry sent" confirmation shows before the thank-you page.
const SENT_HOLD_MS = 900;

const CORNERS = ["tl", "tr", "br", "bl"] as const;

/** The form's rules: returns what to fix in a field, or undefined if it is fine. */
function validate(field: FieldName, value: string): string | undefined {
  switch (field) {
    case "name":
      return value.trim().length < 2 ? "Please enter your name." : undefined;
    case "phone":
      return isValidIndianMobile(value)
        ? undefined
        : "Please enter a valid 10-digit Indian mobile number.";
    case "email":
      return value.trim().length > 0 && !isValidEmail(value)
        ? "Please enter a valid email address, or leave it blank."
        : undefined;
  }
}

/** A labelled field on a fine rule; a gold line draws along it on focus. */
function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`enquiry-field ${className ?? ""}`}>
      <label htmlFor={id} className="enquiry-label">
        {label}
      </label>
      <div className="enquiry-control">
        {children}
        <span aria-hidden="true" className="enquiry-rule" />
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error enquiry-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type EnquiryFormProps = {
  /** The page's context, sent with the enquiry (never asked): "wedding" on the
   * weddings page, "rooms" on a room's page; "general" by default. */
  enquiryType?: EnquiryType;
  /** Namespaces element ids. Only needed if a page ever renders the form more
   * than once (e.g. shown in both the Light and Peacock styleguide panes). */
  idPrefix?: string;
  className?: string;
};

/**
 * The one enquiry form, on every page that has one: four fields — name and
 * phone (all we need), email and a message (optional) — on an emerald stone
 * tablet in a fine gold frame that draws as it comes into view. Fields check
 * themselves when the visitor leaves them; a submission shows a sending line
 * and an "Enquiry sent" confirmation before the thank-you page. The page's
 * context and path travel with it as hidden fields. Everything posts through
 * submitEnquiry() (src/lib/submit-enquiry.ts).
 */
export function EnquiryForm({
  enquiryType = "general",
  idPrefix = "ef",
  className,
}: EnquiryFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const configured = isFormEndpointConfigured();

  const [fields, setFields] = useState<Record<FieldName, string>>({
    name: "",
    phone: "",
    email: "",
  });
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

  // The frame draws once the tablet comes into view.
  const tabletRef = useRef<HTMLDivElement>(null);
  useReveal(tabletRef);

  const holdTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  // A field left by pressing a pointer (e.g. on "Send enquiry") is checked
  // only once the pointer is released: a message appearing mid-press would
  // move the button out from under the click, and the click would be lost.
  const pointerDown = useRef(false);
  const pendingChecks = useRef(new Set<FieldName>());

  function update(field: FieldName, value: string) {
    setFields((previous) => ({ ...previous, [field]: value }));
    // A message already shown goes as soon as the value is right.
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: validate(field, value) }));
  }

  // On leaving a field, check what was typed; an untouched empty field waits
  // for the submit, so nobody is told off for tabbing through. Values are
  // read from the inputs, so a deferred check sees what is there now.
  function checkFields(queued: FieldName[]) {
    const refByField = { name: nameRef, phone: phoneRef, email: emailRef };
    const values = queued.map((field) => [field, refByField[field].current?.value ?? ""] as const);
    setErrors((previous) => {
      const next = { ...previous };
      for (const [field, value] of values) {
        if (value.trim().length === 0 && !previous[field]) continue;
        next[field] = validate(field, value);
      }
      return next;
    });
  }

  function check(field: FieldName) {
    if (pointerDown.current) pendingChecks.current.add(field);
    else checkFields([field]);
  }

  useEffect(() => {
    const press = () => {
      pointerDown.current = true;
    };
    // After the release, once the click it completes has been handled.
    const release = () => {
      if (!pointerDown.current) return;
      pointerDown.current = false;
      window.setTimeout(() => {
        const queued = [...pendingChecks.current];
        pendingChecks.current.clear();
        if (queued.length > 0) checkFields(queued);
      }, 0);
    };
    window.addEventListener("pointerdown", press, true);
    window.addEventListener("pointerup", release, true);
    window.addEventListener("pointercancel", release, true);
    return () => {
      window.removeEventListener("pointerdown", press, true);
      window.removeEventListener("pointerup", release, true);
      window.removeEventListener("pointercancel", release, true);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || status === "submitting" || status === "sent") return;

    // Honeypot: a real visitor never fills this (it's visually hidden and out
    // of the tab order). A bot that blindly fills every field does. Silently
    // drop the spam without a real network call, but don't tip it off.
    if (honeypot.trim().length > 0) {
      router.push("/thank-you/");
      return;
    }

    const nextErrors: Errors = {};
    for (const field of FIELD_ORDER) {
      const problem = validate(field, fields[field]);
      if (problem) nextErrors[field] = problem;
    }
    setErrors(nextErrors);

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      const refByField = { name: nameRef, phone: phoneRef, email: emailRef };
      refByField[firstInvalid].current?.focus();
      return;
    }

    setStatus("submitting");
    setSubmitMessage(null);

    const result = await submitEnquiry({
      name: fields.name.trim(),
      phone: fields.phone.trim(),
      email: fields.email.trim() || undefined,
      message: message.trim() || undefined,
      enquiryType,
      page: pathname ?? undefined,
    });

    if (result.ok) {
      track("enquiry_submit", { enquiryType, page: pathname ?? "" });
      setStatus("sent");
      holdTimer.current = window.setTimeout(() => router.push("/thank-you/"), SENT_HOLD_MS);
      return;
    }

    setStatus("error");
    setSubmitMessage(result.message);
  }

  const describedBy = (field: FieldName) =>
    errors[field] ? `${idPrefix}-${field}-error` : undefined;
  const busy = status === "submitting" || status === "sent";

  return (
    // text-ink re-declares `color` so it resolves against the emerald tokens.
    <div
      ref={tabletRef}
      data-theme="emerald"
      data-status={status}
      className={`enquiry text-ink ${className ?? ""}`}
    >
      <div aria-hidden="true" className="enquiry-frame">
        <span className="enquiry-edge enquiry-edge-top" />
        <span className="enquiry-edge enquiry-edge-right" />
        <span className="enquiry-edge enquiry-edge-bottom" />
        <span className="enquiry-edge enquiry-edge-left" />
        {CORNERS.map((corner) => (
          <span key={corner} className={`enquiry-corner enquiry-corner-${corner}`}>
            <CornerOrnament className="enquiry-ornament" />
          </span>
        ))}
      </div>

      {!configured ? (
        <div className="enquiry-offline">
          <p>
            Online enquiries aren&rsquo;t connected yet. Please call or WhatsApp us — we read every
            message.
          </p>
          <div className="enquiry-offline-actions">
            <CallLink className="link-royal" />
            <WhatsAppLink context="general" className="link-royal">
              WhatsApp us
            </WhatsAppLink>
          </div>
        </div>
      ) : null}

      <form
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        aria-busy={status === "submitting"}
        className="enquiry-form"
      >
        {configured ? (
          <p className="enquiry-intro">
            A name and a phone number are all we need to reply to you.
          </p>
        ) : null}

        <fieldset disabled={!configured || busy} className="contents">
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
          <input type="hidden" name="enquiry_type" value={enquiryType} />

          <div className="enquiry-fields">
            <Field id={`${idPrefix}-name`} label="Name" error={errors.name}>
              <input
                ref={nameRef}
                id={`${idPrefix}-name`}
                name="name"
                type="text"
                required
                autoComplete="name"
                className="enquiry-input"
                value={fields.name}
                onChange={(e) => update("name", e.target.value)}
                onBlur={() => check("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={describedBy("name")}
              />
            </Field>

            <Field id={`${idPrefix}-phone`} label="Phone" error={errors.phone}>
              <input
                ref={phoneRef}
                id={`${idPrefix}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                className="enquiry-input"
                placeholder="98765 43210"
                value={fields.phone}
                onChange={(e) => update("phone", e.target.value)}
                onBlur={() => check("phone")}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy("phone")}
              />
            </Field>

            <Field
              id={`${idPrefix}-email`}
              label={
                <>
                  Email <span className="enquiry-optional">(optional)</span>
                </>
              }
              error={errors.email}
              className="enquiry-field-wide"
            >
              <input
                ref={emailRef}
                id={`${idPrefix}-email`}
                name="email"
                type="email"
                autoComplete="email"
                className="enquiry-input"
                value={fields.email}
                onChange={(e) => update("email", e.target.value)}
                onBlur={() => check("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy("email")}
              />
            </Field>

            <Field
              id={`${idPrefix}-message`}
              label={
                <>
                  Message <span className="enquiry-optional">(optional)</span>
                </>
              }
              className="enquiry-field-wide"
            >
              <textarea
                id={`${idPrefix}-message`}
                name="message"
                rows={3}
                maxLength={1000}
                className="enquiry-input enquiry-textarea"
                placeholder="Your dates, the occasion, anything we should know"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
          </div>

          <div className="enquiry-submit">
            {status === "error" && submitMessage ? (
              <p role="alert" className="field-error enquiry-alert">
                {submitMessage}
              </p>
            ) : null}
            <button type="submit" className="btn-primary btn-cta enquiry-send">
              {status === "submitting"
                ? "Sending…"
                : status === "sent"
                  ? "Enquiry sent"
                  : "Send enquiry"}
            </button>
          </div>
        </fieldset>

        {/* Progress for screen readers; the sending line is its visual twin. */}
        <p role="status" className="visually-hidden">
          {status === "submitting"
            ? "Sending your enquiry…"
            : status === "sent"
              ? "Enquiry sent. Opening your confirmation."
              : ""}
        </p>
      </form>

      {configured ? (
        <p className="enquiry-alt">
          Prefer to talk? <CallLink className="link-royal" />
          <WhatsAppLink context="general" className="link-royal">
            WhatsApp us
          </WhatsAppLink>
        </p>
      ) : null}

      <span aria-hidden="true" className="enquiry-progress" />
    </div>
  );
}
