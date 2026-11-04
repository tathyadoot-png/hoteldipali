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

test("the Light / Dark / Deep toggle shows each variant's own background", async ({ page }) => {
  await page.goto("/styleguide/");

  const group = page.getByRole("group", { name: "Theme preview mode" });
  await expect(group.getByRole("button")).toHaveText(["Light", "Dark", "Deep", "Side-by-side"]);

  // Side-by-side is the default; switch to one variant to read a single pane's colour.
  const background = async (label: string, pane: string) => {
    await page.getByRole("button", { name: label, exact: true }).click();
    const panes = page.locator("[data-preview-pane]");
    await expect(panes).toHaveCount(1);
    return panes.and(page.locator(`[data-preview-pane="${pane}"]`)).evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
  };
  const lightBg = await background("Light", "light");
  const darkBg = await background("Dark", "dark");
  const deepBg = await background("Deep", "deep");

  expect(new Set([lightBg, darkBg, deepBg]).size).toBe(3);
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
