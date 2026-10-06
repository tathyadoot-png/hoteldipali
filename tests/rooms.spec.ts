import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import roomsData from "../content/rooms.json" with { type: "json" };

const rooms = [...roomsData].sort((a, b) => a.order - b.order);
const firstRoom = rooms[0]!;

/** Reveal scroll-animated blocks so assertions don't race the observer. */
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

test.describe("Rooms hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rooms/");
    await revealAll(page);
  });

  test("loads with a single H1 and the page title", async ({ page }) => {
    await expect(page).toHaveTitle("Rooms | Hotel Dipali, Sagar");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Rooms & suites");
  });

  test("every room appears and links to its own route", async ({ page }) => {
    for (const room of rooms) {
      const link = page.locator(`a[href="/rooms/${room.slug}/"]`).first();
      await expect(link).toBeAttached();
    }
  });

  test("the featured room is the first room and is visually dominant", async ({ page }) => {
    const featured = page.locator("#rooms-featured");
    await expect(featured).toHaveText(firstRoom.name);
    // The featured block carries the only primary CTA in the listing area.
    await expect(
      page.getByRole("link", { name: `View ${firstRoom.name}` }),
    ).toBeAttached();
  });

  test("the comparison rail lists the non-featured rooms with their facts", async ({ page }) => {
    const rail = page.locator("#rooms-all").locator("..").locator("..").locator("ul li");
    await expect(rail).toHaveCount(rooms.length - 1);

    for (const room of rooms.slice(1)) {
      const row = page.locator(`a[href="/rooms/${room.slug}/"]`).first();
      await expect(row).toContainText(room.name);
      await expect(row).toContainText(`${room.maxGuests} guests`);
      await expect(row).toContainText(room.bed);
    }
  });

  test("no price is shown while every room has showOnSite false", async ({ page }) => {
    // Guards the trust rule, not the layout: if a price ever surfaces without
    // the content flag being flipped, this fails.
    const anyShown = rooms.some((r) => r.priceFrom?.showOnSite === true);
    expect(anyShown).toBe(false);
    await expect(page.locator("body")).not.toContainText("₹");
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

for (const room of rooms) {
  test.describe(`Room detail — ${room.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/rooms/${room.slug}/`);
      await revealAll(page);
    });

    test("loads with the room name as the only H1", async ({ page }) => {
      await expect(page).toHaveTitle(`${room.name} | Hotel Dipali, Sagar`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(room.name);
    });

    test("shows the schema-backed room facts", async ({ page }) => {
      const facts = page.locator("dl").first();
      await expect(facts).toContainText(`${room.maxGuests} guests`);
      await expect(facts).toContainText(room.bed);
      if (room.sizeSqft) await expect(facts).toContainText(`${room.sizeSqft} sq ft`);
      if (room.view) await expect(facts).toContainText(room.view);
    });

    test("lists the room and bathroom amenities from content", async ({ page }) => {
      const section = page.locator("#room-amenities").locator("..").locator("..");
      for (const item of room.roomAmenities) await expect(section).toContainText(item);
      for (const item of room.bathroomAmenities) await expect(section).toContainText(item);
    });

    test("has an enquiry CTA that targets the on-page form", async ({ page }) => {
      const cta = page.getByRole("link", { name: "Enquire about this room" });
      await expect(cta).toHaveAttribute("href", "#enquire");

      const section = page.locator("#enquire");
      await expect(section).toBeAttached();
      await expect(section.locator("form")).toBeAttached();
    });

    test("offers no booking or availability functionality", async ({ page }) => {
      const body = page.locator("body");
      await expect(body).not.toContainText("Book now");
      await expect(body).not.toContainText("Check availability");
      await expect(body).not.toContainText("₹");
    });

    test("breadcrumbs lead back to Home and Rooms", async ({ page }) => {
      const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(crumbs.locator('a[href="/"]')).toBeAttached();
      await expect(crumbs.locator('a[href="/rooms/"]')).toBeAttached();
      await expect(crumbs).toContainText(room.name);
    });

    test("related rooms exclude the current room and link to the others", async ({ page }) => {
      const related = page.locator("#room-related").locator("..").locator("..");
      await expect(related.locator(`a[href="/rooms/${room.slug}/"]`)).toHaveCount(0);

      for (const other of rooms.filter((r) => r.slug !== room.slug)) {
        await expect(related.locator(`a[href="/rooms/${other.slug}/"]`).first()).toBeAttached();
      }
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
        .exclude(".fixed.bottom-0.z-30")
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });
  });
}
