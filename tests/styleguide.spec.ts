import { expect, test } from "@playwright/test";

test("styleguide loads with one h1, noindex, no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto("/styleguide/");
  expect(response?.status()).toBe(200);

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  expect(consoleErrors).toEqual([]);
});

test("dusk toggle changes the preview wrapper background colour", async ({ page }) => {
  await page.goto("/styleguide/");

  // Side-by-side is the default; switch to Light to read a single pane's colour.
  await page.getByRole("button", { name: "Light", exact: true }).click();
  const lightBg = await page
    .locator('[data-preview-pane="light"]')
    .evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.getByRole("button", { name: "Dusk", exact: true }).click();
  const duskBg = await page
    .locator('[data-preview-pane="dusk"]')
    .evaluate((el) => getComputedStyle(el).backgroundColor);

  expect(duskBg).not.toBe(lightBg);
});

test("home skip link is hidden by default and visible after first Tab", async ({
  page,
}) => {
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  // Off-screen (translated above the viewport) before focus.
  await expect(skipLink).not.toBeInViewport();

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  // After the focus transition it slides into view.
  await expect(skipLink).toBeInViewport();
});

test("no horizontal scroll at 360px on / and /styleguide/", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });

  for (const path of ["/", "/styleguide/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal scroll on ${path}`).toBeFalsy();
  }
});
