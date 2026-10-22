import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The home page's hero and scroll-driven scenes. The hero is temporarily a
// static full-bleed image (the scroll-scrubbed film was removed on 2026-10-21);
// the other scenes still run under "rich motion" (>=1024px, fine pointer, no
// reduced-motion request — the same query the boot script uses).

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 780 };

/** The static hero: name, image and calls to action in one viewport, no film. */
async function expectStaticHero(page: Page) {
  const videoRequests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/video/")) videoRequests.push(req.url());
  });
  await page.goto("/");
  await page.waitForLoadState("load");

  const hero = page.locator(".entrance");
  await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Enquire now" })).toHaveAttribute("href", "#enquire");
  await expect(hero.locator('a[href^="tel:"]')).toBeVisible();

  const image = await hero.locator("img").evaluate((img: HTMLImageElement) => ({
    src: img.currentSrc,
    loaded: img.complete && img.naturalWidth > 0,
  }));
  expect(image.src).toContain("/sample/property-home-hero.svg");
  expect(image.loaded).toBe(true);

  // No runway: the hero is one viewport tall.
  const ratio = await page.evaluate(
    () => document.querySelector<HTMLElement>(".entrance")!.offsetHeight / window.innerHeight,
  );
  expect(ratio).toBeLessThan(1.15);

  await expect(page.locator("video, canvas")).toHaveCount(0);
  expect(videoRequests).toEqual([]);
}

test.describe("Home hero — static", () => {
  test("desktop: name, image and calls to action, with no film", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await expectStaticHero(page);
  });

  test("phone: the same static hero, with no film", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await expectStaticHero(page);
  });
});

test.describe("Home scenes — rich motion (desktop)", () => {
  test.use({ viewport: DESKTOP });

  test("rich motion is still laid out before first paint for the other scenes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
  });

  test("room discovery follows hover and keyboard focus", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("#stay ol a");
    const stage = page.locator(".room-stage-item");

    await links.nth(2).hover();
    await expect(stage.nth(2)).toHaveAttribute("data-active", "");
    await expect(stage.nth(0)).not.toHaveAttribute("data-active", "");

    await links.nth(1).focus();
    await expect(stage.nth(1)).toHaveAttribute("data-active", "");
  });

  test("the dining walk is pinned 1:1 and keyboard focus brings a panel into view", async ({
    page,
  }) => {
    await page.goto("/");
    // Measured after hydration, so wait for it rather than racing the load event.
    const readTravel = () =>
      page.evaluate(
        () =>
          Number.parseFloat(
            document.querySelector<HTMLElement>("#dine")!.style.getPropertyValue("--journey-travel"),
          ) || 0,
      );
    await expect.poll(readTravel).toBeGreaterThan(0);
    const travel = await readTravel();
    const height = await page.evaluate(() => document.querySelector<HTMLElement>("#dine")!.offsetHeight);
    expect(Math.abs(height - (DESKTOP.height + travel))).toBeLessThanOrEqual(2);

    // The last panel starts off-screen to the right; focus its link.
    const last = page.getByRole("link", { name: "Explore Infinity Bar" });
    await last.focus();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const panel = [...document.querySelectorAll<HTMLElement>("[data-panel]")].at(-1)!;
          const r = panel.getBoundingClientRect();
          return r.left >= 0 && r.right <= window.innerWidth + 1;
        }),
      )
      .toBe(true);
    const scrollLeft = await page.evaluate(
      () => document.querySelector<HTMLElement>(".journey-frame")!.scrollLeft,
    );
    expect(scrollLeft).toBe(0);
  });
});

test.describe("Home scenes — phone", () => {
  test.use({ viewport: PHONE });

  test("no rich motion on a phone", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");
  });

  test("the dining walk stacks vertically", async ({ page }) => {
    await page.goto("/");
    const direction = await page.evaluate(
      () => getComputedStyle(document.querySelector(".journey-track")!).flexDirection,
    );
    expect(direction).toBe("column");
  });
});

test.describe("Home scenes — reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("gets the full static composition", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");

    // The name and tagline are readable without scrolling.
    for (const selector of ["#home-hero", ".entrance-tagline"]) {
      await expect(page.locator(selector)).toBeVisible();
      await expect(page.locator(selector)).toHaveCSS("opacity", "1");
    }

    // The Celebrate window is already fully open.
    const clip = await page.evaluate(
      () => getComputedStyle(document.querySelector(".celebrate-window")!).clipPath,
    );
    expect(["inset(0%)", "inset(0px)", "none"]).toContain(clip);
  });

  test("passes axe-core with no serious or critical violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .exclude(".fixed.bottom-0.z-30") // StickyCtaBar — layout-level, outside landmarks
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});
