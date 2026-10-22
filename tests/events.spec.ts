import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import venuesData from "../content/venues.json" with { type: "json" };

const venues = [...venuesData].sort((a, b) => a.order - b.order);

// Event types present in the content, and the venues that list each one.
const eventTypeToVenues = new Map<string, string[]>();
for (const venue of venues) {
  for (const slug of venue.suitableFor) {
    eventTypeToVenues.set(slug, [...(eventTypeToVenues.get(slug) ?? []), venue.name]);
  }
}

async function revealAll(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.setAttribute("data-revealed", ""));
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
}

test.describe("Events page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events/");
    await revealAll(page);
  });

  test("loads with the page title and a single H1", async ({ page }) => {
    await expect(page).toHaveTitle("Events & Celebrations | Hotel Dipali, Sagar");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("occasion");
  });

  test("the hero exists and is not the Weddings hero", async ({ page }) => {
    const hero = page.locator("section").filter({ has: page.locator("#events-title") });
    await expect(hero.getByRole("link", { name: "Enquire now" })).toHaveAttribute(
      "href",
      "#enquire",
    );
    // Events opens light (no peacock theme on the hero), unlike /weddings/.
    await expect(hero).not.toHaveAttribute("data-theme", "peacock");
  });

  test("the finder exposes every event type present in the content", async ({ page }) => {
    const group = page.getByRole("group", { name: "Filter spaces by event type" });
    await expect(group.getByRole("button", { name: "All spaces" })).toBeVisible();
    for (const slug of eventTypeToVenues.keys()) {
      // At least one chip per present event type (matched by its venue result,
      // below). Here we just assert the group has more than the All chip.
      expect(slug.length).toBeGreaterThan(0);
    }
    const chipCount = await group.getByRole("button").count();
    expect(chipCount).toBe(eventTypeToVenues.size + 1); // +1 for "All spaces"
  });

  test("defaults to All spaces showing every venue", async ({ page }) => {
    const group = page.getByRole("group", { name: "Filter spaces by event type" });
    await expect(group.getByRole("button", { name: "All spaces" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const venue of venues) {
      await expect(page.getByRole("heading", { name: venue.name })).toBeVisible();
    }
  });

  test("filtering shows only the venues that match the selected type", async ({ page }) => {
    // Conferences is listed only by the Grand Banquet Hall in the sample data.
    const expected = eventTypeToVenues.get("conferences") ?? [];
    expect(expected).toEqual(["Grand Banquet Hall"]);

    await page.getByRole("button", { name: "Conferences", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Conferences", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    const resultHeadings = page.locator("section")
      .filter({ has: page.locator("#events-finder") })
      .locator("ul li h3");
    await expect(resultHeadings).toHaveCount(expected.length);
    await expect(resultHeadings).toHaveText(expected);
  });

  test("filter buttons are keyboard-operable with exposed pressed state", async ({ page }) => {
    const birthdays = page.getByRole("button", { name: "Birthdays", exact: true });
    await birthdays.focus();
    await page.keyboard.press("Enter");
    await expect(birthdays).toHaveAttribute("aria-pressed", "true");

    const expected = eventTypeToVenues.get("birthdays") ?? [];
    const headings = page.locator("section")
      .filter({ has: page.locator("#events-finder") })
      .locator("ul li h3");
    await expect(headings).toHaveCount(expected.length);
  });

  test("each matched venue has a working enquire link to the on-page form", async ({ page }) => {
    const links = page.locator("section")
      .filter({ has: page.locator("#events-finder") })
      .getByRole("link", { name: /^Enquire about the / });
    const count = await links.count();
    expect(count).toBe(venues.length); // default "All spaces"
    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toHaveAttribute("href", "#enquire");
    }
  });

  test("the Weddings cross-link points at /weddings/", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Explore Weddings" }),
    ).toHaveAttribute("href", "/weddings/");
  });

  test("the enquiry section offers the event and wedding types and defaults to event", async ({
    page,
  }) => {
    // EnquiryForm renders options in the canonical ENQUIRY_TYPE_OPTIONS order
    // (wedding before event); what matters here is the pair offered and that
    // this event-focused page defaults the selection to "event".
    const section = page.locator("#enquire");
    await expect(section).toBeAttached();
    const select = section.locator("form").getByLabel("Enquiry type");
    const values = await select.locator("option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(new Set(values)).toEqual(new Set(["event", "wedding"]));
    await expect(select).toHaveValue("event");
  });

  test("shows no price, booking, or availability UI", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).not.toContainText("₹");
    await expect(body).not.toContainText("Book now");
    await expect(body).not.toContainText("Book Now");
    await expect(body).not.toContainText("Check availability");
  });

  test("placeholder developer text is never visitor-facing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("SAMPLE");
    await expect(page.locator("body")).not.toContainText("replace with original photo");
  });

  test("no horizontal overflow", async ({ page }) => {
    await expectNoHorizontalOverflow(page);
  });

  test("passes axe-core with no serious or critical violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .exclude(".fixed.bottom-0.z-30") // StickyCtaBar — layout-level, outside landmarks
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});
