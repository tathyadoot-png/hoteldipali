import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const FORM_ENDPOINT = "https://form-endpoint.test/submit";

// The reusable EnquiryForm is showcased in /styleguide/ Section 09 (same
// precedent as the Step 4b content components) — switching to "Light" mode
// renders a single, unambiguous instance (idPrefix="light-ef").
async function openForm(page: Page) {
  await page.goto("/styleguide/");
  await page.getByRole("button", { name: "Ivory", exact: true }).click();
  return page.locator('section[aria-labelledby="light-form"]');
}

async function fillValidFields(form: Locator) {
  await form.getByLabel("Name").fill("Asha Verma");
  await form.getByLabel("Phone").fill("98765 43210");
}

test("renders with proper labels and all enquiry-type categories", async ({ page }) => {
  const form = await openForm(page);

  await expect(form.getByLabel("Name")).toBeVisible();
  await expect(form.getByLabel("Phone")).toBeVisible();
  await expect(form.getByLabel("Email (optional)")).toBeVisible();
  await expect(form.getByLabel("Preferred date (optional)")).toBeVisible();
  await expect(form.getByLabel("Number of guests (optional)")).toBeVisible();
  await expect(form.getByLabel("Message (optional)")).toBeVisible();

  // The enquiry type (2026-10-27): a group of choices instead of a select —
  // the same field, values and default, one tap each.
  const group = form.getByRole("group", { name: "What are you planning?" });
  await expect(group).toBeVisible();
  const values = await group
    .getByRole("radio")
    .evaluateAll((radios) => radios.map((r) => (r as HTMLInputElement).value));
  expect(values).toEqual(["rooms", "wedding", "event", "dining", "pool-gym", "general"]);
  await expect(group.getByRole("radio", { name: "A stay" })).toBeChecked();
});

test("the enquiry type is chosen from the keyboard, and the choice is what gets sent", async ({
  page,
}) => {
  let requestBody: Record<string, string> | undefined;
  await page.route(FORM_ENDPOINT, async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  const form = await openForm(page);
  await form.getByRole("radio", { name: "A stay" }).focus();
  await page.keyboard.press("ArrowRight");
  const wedding = form.getByRole("radio", { name: "A wedding" });
  await expect(wedding).toBeChecked();
  await expect(wedding).toBeFocused();

  await fillValidFields(form);
  await form.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page).toHaveURL(/\/thank-you\/?$/);
  expect(requestBody?.enquiry_type).toBe("wedding");
});

test("a field checks itself when the visitor leaves it, and the message goes once it is right", async ({
  page,
}) => {
  const form = await openForm(page);

  // Tabbing through an empty field says nothing yet.
  await form.getByLabel("Name").focus();
  await page.keyboard.press("Tab");
  await expect(form.getByText("Please enter your name.")).toHaveCount(0);

  // A wrong number is flagged on leaving the field, tied to it for screen readers…
  const phone = form.getByLabel("Phone");
  await phone.fill("12345");
  await phone.blur();
  await expect(form.getByText("Please enter a valid 10-digit Indian mobile number.")).toBeVisible();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAttribute("aria-describedby", "light-ef-phone-error");

  // …and the message goes as soon as the number is right.
  await phone.fill("98765 43210");
  await expect(form.getByText("Please enter a valid 10-digit Indian mobile number.")).toHaveCount(0);
  await expect(phone).toHaveAttribute("aria-invalid", "false");
});

test("while sending, the form says so and holds; once sent, it confirms before the thank-you page", async ({
  page,
}) => {
  let release: () => void = () => {};
  const confirmed = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(FORM_ENDPOINT, async (route) => {
    await confirmed;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  const form = await openForm(page);
  await fillValidFields(form);
  await form.getByRole("button", { name: "Send enquiry" }).click();

  // Sending: the button says so, nothing can be changed or sent twice, and
  // screen readers hear it.
  const button = form.locator(".enquiry-send");
  await expect(button).toHaveText("Sending…");
  await expect(button).toBeDisabled();
  await expect(form.getByLabel("Name")).toBeDisabled();
  await expect(form.getByRole("status")).toHaveText("Sending your enquiry…");
  await expect(page).toHaveURL(/\/styleguide\/?$/);

  // The endpoint confirms: "Enquiry sent", then the thank-you page.
  release();
  await expect(button).toHaveText("Enquiry sent");
  await expect(form.getByRole("status")).toHaveText("Enquiry sent. Opening your confirmation.");
  await expect(page).toHaveURL(/\/thank-you\/?$/);
});

test("required validation blocks submission and focuses the first invalid field", async ({
  page,
}) => {
  const form = await openForm(page);

  await form.getByRole("button", { name: "Send enquiry" }).click();

  await expect(form.getByText("Please enter your name.")).toBeVisible();
  await expect(form.getByText("Please enter a valid 10-digit Indian mobile number.")).toBeVisible();
  await expect(form.getByLabel("Name")).toBeFocused();

  // Fields stay editable — no fake "submitting" state was entered.
  await expect(form.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
});

test("rejects an invalid phone number with a clear message", async ({ page }) => {
  const form = await openForm(page);

  await form.getByLabel("Name").fill("Asha Verma");
  await form.getByLabel("Phone").fill("12345");
  await form.getByRole("button", { name: "Send enquiry" }).click();

  await expect(form.getByText("Please enter a valid 10-digit Indian mobile number.")).toBeVisible();
  await expect(form.getByLabel("Phone")).toBeFocused();
});

test("rejects a malformed optional email without blocking on empty fields", async ({
  page,
}) => {
  const form = await openForm(page);

  await fillValidFields(form);
  await form.getByLabel("Email (optional)").fill("not-an-email");
  await form.getByRole("button", { name: "Send enquiry" }).click();

  await expect(
    form.getByText("Please enter a valid email address, or leave it blank."),
  ).toBeVisible();
});

test("successful submission navigates to /thank-you/ only after the endpoint confirms", async ({
  page,
}) => {
  let requestBody: Record<string, string> | undefined;
  await page.route(FORM_ENDPOINT, async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  const form = await openForm(page);
  await fillValidFields(form);
  await form.getByLabel("Message (optional)").fill("Asking about a weekend stay.");

  await form.getByRole("button", { name: "Send enquiry" }).click();

  await expect(page).toHaveURL(/\/thank-you\/?$/);
  await expect(page.getByRole("heading", { name: "Thank you for writing to us" })).toBeVisible();

  expect(requestBody?.name).toBe("Asha Verma");
  expect(requestBody?.phone).toBe("98765 43210");
  expect(requestBody?.access_key).toBe("test-only-access-key");
});

test("failed submission shows an inline error, stays on the page, and allows retry", async ({
  page,
}) => {
  let shouldFail = true;
  await page.route(FORM_ENDPOINT, async (route) => {
    if (shouldFail) {
      await route.fulfill({ status: 500 });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }
  });

  const form = await openForm(page);
  await fillValidFields(form);

  await form.getByRole("button", { name: "Send enquiry" }).click();

  // Scoped to the form: Next.js's App Router also renders its own global
  // role="alert" route-announcer, which would otherwise make this ambiguous.
  await expect(form.getByRole("alert")).toContainText("couldn't send that");
  await expect(page).toHaveURL(/\/styleguide\/?$/);
  await expect(form.getByRole("button", { name: "Send enquiry" })).toBeEnabled();

  // Data the user already typed is preserved for retry — no need to retype.
  await expect(form.getByLabel("Name")).toHaveValue("Asha Verma");

  shouldFail = false;
  await form.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page).toHaveURL(/\/thank-you\/?$/);
});

test("honeypot silently drops spam without a real network call", async ({ page }) => {
  let hits = 0;
  await page.route(FORM_ENDPOINT, async (route) => {
    hits += 1;
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  });

  const form = await openForm(page);
  await fillValidFields(form);

  // The honeypot is intentionally invisible/out of the tab order (a real
  // visitor never reaches it); set it the way an indiscriminate bot would —
  // by writing the DOM value directly, bypassing Playwright's visibility checks.
  await form.locator('input[name="company"]').evaluate((el) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "spambot content");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await form.getByRole("button", { name: "Send enquiry" }).click();

  await expect(page).toHaveURL(/\/thank-you\/?$/);
  expect(hits).toBe(0);
});

test("Call/WhatsApp fallback links use the existing shell utilities", async ({ page }) => {
  const form = await openForm(page);

  const callLink = form.getByRole("link", { name: /^\+91/ });
  await expect(callLink).toHaveAttribute("href", /^tel:\+91/);

  const waLink = form.getByRole("link", { name: "WhatsApp us" });
  await expect(waLink).toHaveAttribute("href", /^https:\/\/wa\.me\/91\d{10}\?text=/);
});

test("thank-you page: heading, no console errors, working Call/WhatsApp and home link", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto("/thank-you/");
  expect(response?.status()).toBe(200);

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Thank you for writing to us" })).toBeVisible();

  await expect(page.getByRole("link", { name: /Call us/ })).toHaveAttribute("href", /^tel:\+91/);
  await expect(page.getByRole("link", { name: /WhatsApp us/ })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/91\d{10}\?text=/,
  );
  await expect(page.getByRole("link", { name: "Back to Hotel Dipali" })).toHaveAttribute(
    "href",
    "/",
  );

  expect(consoleErrors).toEqual([]);
});

test("thank-you page has no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/thank-you/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBeFalsy();
});

test.describe("Accessibility (axe-core)", () => {
  for (const viewport of [
    { width: 360, height: 780, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1024, height: 800, label: "small-desktop" },
    { width: 1280, height: 800, label: "desktop" },
  ]) {
    test(`zero serious/critical violations on /thank-you/ at ${viewport.label}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/thank-you/");
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
    });

    test(`EnquiryForm: zero serious/critical violations at ${viewport.label}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openForm(page);
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
    });
  }
});
