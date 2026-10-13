import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The home page's scroll-driven experience. "Rich motion" = >=1024px, fine
// pointer, no reduced-motion request — the same query the boot script uses.

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 780 };

/** Scroll instantly, then let the eased progress settle. */
async function scrollAndSettle(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(900);
}

async function filmTime(page: Page) {
  return page.evaluate(
    () => document.querySelector<HTMLVideoElement>(".entrance-video")?.currentTime ?? -1,
  );
}

test.describe("Entrance — rich motion (desktop)", () => {
  test.use({ viewport: DESKTOP });

  test("lays out a pinned runway before first paint", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
    const ratio = await page.evaluate(
      () => document.querySelector<HTMLElement>(".entrance")!.offsetHeight / window.innerHeight,
    );
    expect(ratio).toBeGreaterThan(3);
  });

  test("scrubs the film forward with scroll and back again in reverse", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".entrance-video")).toHaveAttribute("data-ready", "", {
      timeout: 15_000,
    });

    await scrollAndSettle(page, 900);
    await expect.poll(() => filmTime(page)).toBeGreaterThan(8);
    const deep = await filmTime(page);

    await scrollAndSettle(page, 300);
    await expect.poll(() => filmTime(page)).toBeLessThan(deep - 4);

    await scrollAndSettle(page, 0);
    await expect.poll(() => filmTime(page)).toBeLessThan(0.1);
  });

  test("hands over to the arch: actions leave the tab order at the threshold", async ({
    page,
  }) => {
    await page.goto("/");
    const actions = page.locator(".entrance-actions");
    await expect(actions).toBeVisible();

    const runway = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>(".entrance")!;
      return s.offsetHeight - window.innerHeight;
    });
    await scrollAndSettle(page, runway - 20);
    await expect(page.locator(".entrance")).toHaveAttribute("data-stage", "threshold");
    await expect(actions).toBeHidden();
  });

  test("keeps the composition when the film fails to load", async ({ page }) => {
    await page.route("**/video/entry.mp4", (route) => route.abort());
    await page.goto("/");
    await page.waitForTimeout(1500);

    await expect(page.locator(".entrance-video")).not.toHaveAttribute("data-ready", "");
    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.locator(".entrance-actions").getByText("Enquire now")).toBeVisible();
    const poster = await page.evaluate(
      () => document.querySelector<HTMLImageElement>(".entrance-media")!.currentSrc,
    );
    expect(poster).toContain("/video/entry-poster.webp");
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

test.describe("Entrance — phone", () => {
  test.use({ viewport: PHONE });

  test("is a single still frame with no film download", async ({ page }) => {
    const videoRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/video/entry.mp4")) videoRequests.push(req.url());
    });
    await page.goto("/");
    await page.waitForTimeout(1500);

    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");
    await expect(page.locator(".entrance-video")).toHaveCount(0);
    expect(videoRequests).toEqual([]);

    const still = await page.evaluate(
      () => document.querySelector<HTMLImageElement>(".entrance-media")!.currentSrc,
    );
    expect(still).toContain("/video/entry-still.webp");
    const ratio = await page.evaluate(
      () => document.querySelector<HTMLElement>(".entrance")!.offsetHeight / window.innerHeight,
    );
    expect(ratio).toBeLessThan(1.05);
  });

  test("the dining walk stacks vertically", async ({ page }) => {
    await page.goto("/");
    const direction = await page.evaluate(
      () => getComputedStyle(document.querySelector(".journey-track")!).flexDirection,
    );
    expect(direction).toBe("column");
  });
});

test.describe("Entrance — reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("gets the full static composition and no film", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");
    await expect(page.locator(".entrance-video")).toHaveCount(0);

    // Every word of the tagline is readable without scrolling.
    const opacities = await page
      .locator(".entrance-word")
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(new Set(opacities)).toEqual(new Set(["1"]));

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
