import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import roomsData from "../content/rooms.json" with { type: "json" };

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  /* ──── Structure & content ──── */

  test("has exactly one H1 with the hotel name", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Hotel");
    await expect(h1).toContainText("Dipali");
  });

  test("renders all seven sections", async ({ page }) => {
    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.locator("#home-intro")).toBeVisible();
    await expect(page.locator("#home-rooms")).toBeVisible();
    await expect(page.locator("#home-weddings")).toBeVisible();
    await expect(page.locator("#home-dining")).toBeVisible();
    await expect(page.locator("#home-leisure")).toBeVisible();
    await expect(page.locator("#home-enquire")).toBeVisible();
  });

  test("hero section has peacock theme", async ({ page }) => {
    const hero = page.locator("section").filter({ has: page.locator("#home-hero") });
    await expect(hero).toHaveAttribute("data-theme", "peacock");
  });

  test("enquiry section has peacock theme and anchor id", async ({ page }) => {
    const enquiry = page.locator("#enquire");
    await expect(enquiry).toHaveAttribute("data-theme", "peacock");
  });

  /* ──── Navigation & links ──── */

  test("'Enquire now' hero button links to #enquire", async ({ page }) => {
    const btn = page.locator("section").filter({ has: page.locator("#home-hero") }).getByText("Enquire now");
    await expect(btn).toHaveAttribute("href", "#enquire");
  });

  test("has at least one link to /rooms/", async ({ page }) => {
    const roomLinks = page.locator('a[href="/rooms/"]');
    await expect(roomLinks.first()).toBeAttached();
  });

  test("has at least one link to /weddings/", async ({ page }) => {
    const link = page.locator('a[href="/weddings/"]');
    await expect(link.first()).toBeAttached();
  });

  test("has at least one link to /dining/", async ({ page }) => {
    const link = page.locator('a[href="/dining/"]');
    await expect(link.first()).toBeAttached();
  });

  /* ──── Enquiry form ──── */

  test("enquiry form is present in the #enquire section", async ({ page }) => {
    const form = page.locator("#enquire form");
    await expect(form).toBeVisible();
  });

  /* ──── Rooms ──── */

  // The rooms section is an index rather than a card grid; what matters is
  // that every room is reachable from it.
  test("lists every room, each linking to its detail page", async ({ page }) => {
    const section = page.locator("#stay");
    for (const room of roomsData) {
      await expect(section.locator(`a[href="/rooms/${room.slug}/"]`)).toContainText(room.name);
    }
  });

  /* ──── Pillar index ──── */

  test("the welcome index links to sections that exist on the page", async ({ page }) => {
    const index = page.getByRole("navigation", { name: "Explore the hotel" });
    const hrefs = await index.locator("a").evaluateAll((els) =>
      els.map((e) => e.getAttribute("href") ?? ""),
    );
    expect(hrefs).toEqual(["#stay", "#celebrate", "#unwind", "#dine"]);
    for (const href of hrefs) await expect(page.locator(href)).toBeAttached();
  });

  /* ──── Peacock sections carry text-ink ──── */

  test("all peacock-themed sections carry text-ink class", async ({ page }) => {
    const peacockSections = page.locator('section[data-theme="peacock"]');
    const count = await peacockSections.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      const classes = await peacockSections.nth(i).getAttribute("class");
      expect(classes).toContain("text-ink");
    }
  });

  /* ──── Scroll reveal ──── */

  test("scroll-reveal elements exist with data-reveal attribute", async ({ page }) => {
    const reveals = page.locator("[data-reveal]");
    const count = await reveals.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  /* ──── Accessibility ──── */

  test("passes axe-core accessibility checks", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .exclude("[data-reveal]:not([data-revealed])") // hidden elements pending reveal
      .exclude(".fixed.bottom-0.z-30") // StickyCtaBar — layout-level, outside landmarks
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("every section has an aria-labelledby pointing to a visible heading", async ({ page }) => {
    const sections = page.locator("section[aria-labelledby]");
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < count; i++) {
      const labelledBy = await sections.nth(i).getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      const heading = page.locator(`#${labelledBy}`);
      await expect(heading).toBeAttached();
    }
  });

  /* ──── No console errors ──── */

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors).toEqual([]);
  });

  /* ──── Meta ──── */

  test("page title contains Hotel Dipali and Sagar", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Hotel Dipali");
    expect(title).toContain("Sagar");
  });
});
