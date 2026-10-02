import { expect, test } from "@playwright/test";

test("content inspector loads with one h1, noindex, no console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto("/dev/content/");
  expect(response?.status()).toBe(200);

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  expect(consoleErrors).toEqual([]);
});

test("content inspector shows the expected collection counts", async ({ page }) => {
  await page.goto("/dev/content/");

  await expect(page.locator('section[aria-labelledby="rooms"] tbody tr')).toHaveCount(4);
  await expect(page.locator('section[aria-labelledby="venues"] tbody tr')).toHaveCount(4);
  await expect(page.locator('section[aria-labelledby="outlets"] tbody tr')).toHaveCount(
    5,
  );
  await expect(page.locator('section[aria-labelledby="faqs"] tbody tr')).toHaveCount(15);
  await expect(page.getByTestId("gallery-count")).toHaveText("18");
});

test("at least one placeholder image renders", async ({ page }) => {
  await page.goto("/dev/content/");

  const firstImage = page.locator('section[aria-labelledby="images"] img').first();
  await firstImage.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => firstImage.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
});

test("no horizontal scroll at 360px on /dev/content/", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/dev/content/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBeFalsy();
});
