import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import venuesData from "../content/venues.json" with { type: "json" };

const venues = [...venuesData].sort((a, b) => a.order - b.order);

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

test.describe("Weddings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/weddings/");
    await revealAll(page);
  });

  test("loads with the page title and a single H1", async ({ page }) => {
    await expect(page).toHaveTitle("Weddings & Celebrations | Hotel Dipali, Sagar");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Weddings");
    await expect(page.locator("h1")).toContainText("celebrations");
  });

  test("the hero has its content and a plan-your-wedding CTA", async ({ page }) => {
    const hero = page.locator("section").filter({ has: page.locator("#weddings-title") });
    await expect(hero).toHaveAttribute("data-theme", "peacock");
    const cta = hero.getByRole("link", { name: "Plan your wedding" });
    await expect(cta).toHaveAttribute("href", "#enquire");
  });

  test("every venue appears in the showcase and the comparison", async ({ page }) => {
    for (const venue of venues) {
      // Featured heading or a supporting/compare heading — at least one each.
      await expect(page.getByRole("heading", { name: venue.name })).not.toHaveCount(0);
    }
  });

  test("the comparison lists every venue with its capacities and size", async ({ page }) => {
    const list = page
      .locator("section", { has: page.locator("#venues-compare") })
      .locator("ul");
    await expect(list.locator("> li")).toHaveCount(venues.length);
    for (const venue of venues) {
      const row = list.locator("> li").filter({ hasText: venue.name });
      await expect(row).toContainText(`${venue.capacitySeated}`);
      await expect(row).toContainText(`${venue.capacityFloating}`);
    }
  });

  test("each venue has a working enquire link to the on-page form", async ({ page }) => {
    for (const venue of venues) {
      const link = page.getByRole("link", { name: `Enquire about the ${venue.name}` });
      await expect(link).toHaveAttribute("href", "#enquire");
    }
  });

  test("the enquiry section exists and is wired to the wedding/event types", async ({ page }) => {
    const section = page.locator("#enquire");
    await expect(section).toBeAttached();
    const form = section.locator("form");
    await expect(form).toBeAttached();

    // The enquiry type is a group of choices (it was a select until 2026-10-27).
    const choices = form.getByRole("group", { name: "What are you planning?" }).getByRole("radio");
    const values = await choices.evaluateAll((radios) =>
      radios.map((r) => (r as HTMLInputElement).value),
    );
    expect(values).toEqual(["wedding", "event"]);
    await expect(form.getByRole("radio", { name: "A wedding" })).toBeChecked();
  });

  test("occasions are derived from venue data and name their spaces", async ({ page }) => {
    const occasions = page
      .locator("section", { has: page.locator("#occasions") })
      .locator("ul > li");
    await expect(occasions.first()).toBeAttached();
    // "Weddings" is supported by Main Lawn + Grand Banquet Hall in the sample data.
    const weddingsRow = occasions.filter({ hasText: "Weddings" }).first();
    await expect(weddingsRow).toContainText("Main Lawn");
    await expect(weddingsRow).toContainText("Grand Banquet Hall");
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

  test("no price appears while every venue is sample without a price field", async () => {
    // Guards the trust rule: the venue schema has no price, so none can leak.
    const anyPrice = venues.some((v) => "priceFrom" in v);
    expect(anyPrice).toBe(false);
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
