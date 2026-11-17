import { expect, test } from "@playwright/test";

import { BUILT_PAGES } from "../src/lib/routes";

test("home page loads with no errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toHaveCount(1);

  expect(consoleErrors).toEqual([]);
});

test("built routes return 200 with one heading; an unknown route is 404", async ({ page }) => {
  for (const route of BUILT_PAGES) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1"), route).toHaveCount(1);
  }

  const missing = await page.goto("/404-test-route/");
  expect(missing?.status()).toBe(404);
});
