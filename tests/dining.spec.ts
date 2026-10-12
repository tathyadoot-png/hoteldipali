import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import outletsData from "../content/outlets.json" with { type: "json" };
import restaurantMenu from "../content/menus/restaurant.json" with { type: "json" };

const outlets = outletsData;

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

test.describe("Dining hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dining/");
    await revealAll(page);
  });

  test("loads with the page title and a single H1", async ({ page }) => {
    await expect(page).toHaveTitle("Dining | Hotel Dipali, Sagar");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Dipali");
    await expect(page.locator("h1")).toContainText("table");
  });

  test("every outlet appears and the menu-of-places index links to its section", async ({
    page,
  }) => {
    const index = page.locator("section").filter({ has: page.locator("#dining-index") });
    for (const outlet of outlets) {
      // Index anchor to the on-page section.
      await expect(index.locator(`a[href="#${outlet.slug}"]`)).toContainText(outlet.name);
      // The section itself exists with a matching id.
      await expect(page.locator(`#${outlet.slug}`)).toBeAttached();
    }
  });

  test("outlet anchors clear the sticky header (scroll-margin set)", async ({ page }) => {
    const hasScrollMargin = await page.evaluate(() => {
      const el = document.querySelector("#infinity-bar");
      if (!el) return false;
      return parseInt(getComputedStyle(el).scrollMarginTop, 10) > 0;
    });
    expect(hasScrollMargin).toBe(true);
  });

  test("the Infinity Bar section uses the dusk evening treatment", async ({ page }) => {
    const bar = page.locator("#infinity-bar");
    await expect(bar).toHaveAttribute("data-theme", "dusk");
    await expect(bar).toContainText("Infinity Bar");
  });

  test("Dipali Restaurant is the primary experience with a content-driven menu preview", async ({
    page,
  }) => {
    const section = page.locator("#restaurant");
    await expect(section.getByRole("heading", { name: "Dipali Restaurant" })).toBeVisible();
    // Menu section names come from the content menu, shown without prices.
    for (const sectionName of restaurantMenu.sections.map((s) => s.name)) {
      await expect(section).toContainText(sectionName);
    }
    // At least one signature item is surfaced.
    const firstSignature = restaurantMenu.sections
      .flatMap((s) => s.items)
      .find((i) => (i as { signature?: boolean }).signature);
    expect(firstSignature).toBeTruthy();
    await expect(section).toContainText(firstSignature!.name);
  });

  test("the enquiry section is present and set to the dining type", async ({ page }) => {
    const section = page.locator("#enquire");
    await expect(section).toBeAttached();
    await expect(section.locator("form")).toBeAttached();
    // A single enquiry type locks the select into a plain label — only "Dining"
    // should be offered on this page, never the other categories.
    await expect(section).not.toContainText("Weddings");
    await expect(section).not.toContainText("Pool & Gym");
  });

  test("shows no price, booking, ordering, or reservation UI", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).not.toContainText("₹");
    await expect(body).not.toContainText("Book now");
    await expect(body).not.toContainText("Book Now");
    await expect(body).not.toContainText("Book a table");
    await expect(body).not.toContainText("Reserve");
    await expect(body).not.toContainText("Order online");
  });

  test("no menu prices leak although the sample menu carries them", async () => {
    // Guards the trust rule: every sample price is flagged showOnSite:false.
    const anyShown = restaurantMenu.sections
      .flatMap((s) => s.items)
      .some((i) => i.price?.showOnSite === true);
    expect(anyShown).toBe(false);
  });

  test("placeholder developer text is never visitor-facing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("SAMPLE");
    await expect(page.locator("body")).not.toContainText("replace with original photo");
  });

  test("does not render unverified timings or diet claims", async ({ page }) => {
    const body = page.locator("body");
    // Sample opening hours must not surface.
    await expect(body).not.toContainText("07:00");
    await expect(body).not.toContainText("23:30");
    // "Pure veg" / "vegetarian only" claims are unverified (CLAUDE.md §G).
    await expect(body).not.toContainText("Pure veg");
    await expect(body).not.toContainText("vegetarian only");
  });

  test("no outlet links point at a 404 detail route", async ({ page }) => {
    // Outlets are anchor sections on this hub, not standalone pages yet.
    // /dining/ and /dining/#slug are valid; a sub-path like /dining/restaurant/
    // would be a 404 and must not exist.
    const hrefs = await page.locator("a[href]").evaluateAll((els) =>
      els.map((e) => e.getAttribute("href") ?? ""),
    );
    const detailRoutes = hrefs.filter((h) => /^\/dining\/[^#]/.test(h));
    expect(detailRoutes).toEqual([]);
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
