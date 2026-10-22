import { expect, test, type Page } from "@playwright/test";

// The Step 4b content components are showcased in Section 08 of /styleguide/
// (the project's noindex design-system surface). Switching the preview to
// "Ivory" (the light variant) leaves a single pane so selectors resolve uniquely.
async function openComponents(page: Page) {
  await page.goto("/styleguide/");
  await page.getByRole("button", { name: "Ivory", exact: true }).click();
  return page.locator('section[aria-labelledby="light-components"]');
}

test("Picture renders a real image (naturalWidth > 0)", async ({ page }) => {
  const section = await openComponents(page);
  const img = section.locator("img").first();
  await img.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
});

test("Breadcrumbs expose semantic structure and current page", async ({ page }) => {
  const section = await openComponents(page);
  const nav = section.getByRole("navigation", { name: "Breadcrumb" });
  await expect(nav).toBeVisible();

  // Ordered list with the trail.
  await expect(nav.locator("ol > li")).toHaveCount(3);

  // Previous levels are links; the current page is not a link and is marked.
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(nav.getByRole("link", { name: "Rooms" })).toHaveAttribute(
    "href",
    "/rooms/",
  );
  const current = nav.locator('[aria-current="page"]');
  await expect(current).toHaveText("Garden Deluxe Room");
});

test("cards render from sample data and use the route helpers", async ({ page }) => {
  const section = await openComponents(page);

  // RoomCard
  await expect(section.getByRole("heading", { name: "Garden Deluxe Room" })).toBeVisible();
  await expect(
    section.getByRole("link", { name: "View Garden Deluxe Room" }),
  ).toHaveAttribute("href", "/rooms/garden-deluxe-room/");

  // VenueCard
  await expect(section.getByRole("heading", { name: "Main Lawn" })).toBeVisible();
  await expect(section.getByRole("link", { name: "View Main Lawn" })).toHaveAttribute(
    "href",
    "/events/venues/main-lawn/",
  );

  // OutletCard
  await expect(
    section.getByRole("heading", { name: "Dipali Restaurant" }),
  ).toBeVisible();
  await expect(
    section.getByRole("link", { name: "Explore Dipali Restaurant" }),
  ).toHaveAttribute("href", "/dining/#restaurant");

  // OfferCard
  await expect(section.getByRole("heading", { name: "Garden staycation" })).toBeVisible();
});

test("RoomCard hides price when the fact is not cleared for the site", async ({
  page,
}) => {
  const section = await openComponents(page);
  // Sample Garden Deluxe Room has priceFrom.showOnSite === false, so no price.
  const roomCard = section.locator("article", {
    has: page.getByRole("heading", { name: "Garden Deluxe Room" }),
  });
  await expect(roomCard).not.toContainText("From ₹");
  await expect(roomCard).not.toContainText("per night");
});

test("component showcase has no horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await openComponents(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBeFalsy();
});
