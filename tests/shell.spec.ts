import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Desktop (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("desktop nav is visible, Menu button and sticky bar are hidden", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Call" })).toBeHidden();
  });

  // On the home page the header stays transparent for the whole entrance film
  // and turns solid when the ivory arch that follows it reaches the top.
  test("home header is transparent over the entrance and solid once past it", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.locator("header");

    await expect(header).toHaveAttribute("data-theme", "dusk");
    const transparentBg = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(transparentBg).toBe("rgba(0, 0, 0, 0)");

    // Still inside the pinned film: still transparent.
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(header).toHaveAttribute("data-theme", "dusk");

    // One-frame jump well past the arch (anchor link, End key, fling): solid.
    await page.evaluate(() => {
      const arch = document.querySelector<HTMLElement>("[data-header-solid-from]");
      if (!arch) throw new Error("missing [data-header-solid-from]");
      window.scrollTo({ top: arch.getBoundingClientRect().top + window.scrollY + 600, behavior: "instant" });
    });
    await expect(header).not.toHaveAttribute("data-theme", "dusk");
    await expect
      .poll(async () => header.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe("rgba(0, 0, 0, 0)");

    // One-frame jump back to the top: transparent again.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-theme", "dusk");
  });

  test("header is solid on a page without an overlay hero", async ({ page }) => {
    await page.goto("/rooms/");
    await expect(page.locator("header")).not.toHaveAttribute("data-theme", "dusk");
  });
});

test.describe("Mobile (360px)", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("Menu button visible; sticky bar visible with 3 buttons", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();

    const stickyBar = page.locator("div.fixed.inset-x-0.bottom-0");
    await expect(stickyBar).toBeVisible();
    await expect(stickyBar.getByRole("link")).toHaveCount(3);
  });

  test("opening the menu traps focus and Escape returns focus to Menu button", async ({
    page,
  }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Menu" });
    await menuButton.click();

    const dialog = page.locator("#mobile-menu");
    await expect(dialog).toBeVisible();
    // showModal() focuses the first focusable element inside the dialog.
    await expect(
      page.locator("#mobile-menu :focus"),
    ).toBeVisible();

    // Tab all the way around (11 focusable items) and confirm focus never lands
    // on real content outside the dialog. Chromium's native modal <dialog> rests
    // focus on the (non-interactive) <body> for one tick between the last item
    // and wrapping back to the first — that's an inert resting point, not an
    // escape, so it's allowed; anything else outside the dialog is not.
    for (let i = 0; i < 13; i++) {
      await page.keyboard.press("Tab");
      const trapped = await page.evaluate(() => {
        const dialogEl = document.getElementById("mobile-menu");
        const active = document.activeElement;
        return dialogEl?.contains(active) || active === document.body;
      });
      expect(trapped).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});

test.describe("Links", () => {
  test("Call link href starts with tel:+91", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    const href = await page
      .locator('a[href^="tel:"]')
      .first()
      .getAttribute("href");
    expect(href).toMatch(/^tel:\+91/);
  });

  test("WhatsApp link matches wa.me pattern", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    const href = await page
      .locator('a[href^="https://wa.me/"]')
      .first()
      .getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/91\d{10}\?text=/);
  });
});

test("footer contains 'Also searched as Hotel Deepali'", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Also searched as Hotel Deepali")).toBeVisible();
});

test.describe("Accessibility (axe-core)", () => {
  for (const viewport of [
    { width: 360, height: 780, label: "mobile" },
    { width: 1280, height: 800, label: "desktop" },
  ]) {
    for (const path of ["/", "/styleguide/"]) {
      test(`zero serious/critical violations on ${path} at ${viewport.label}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);

        const results = await new AxeBuilder({ page }).analyze();
        const seriousOrCritical = results.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        );
        expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual(
          [],
        );
      });
    }
  }
});

test("no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBeFalsy();
});
