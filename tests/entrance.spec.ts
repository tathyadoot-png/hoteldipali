import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The home page's scroll-driven experience. "Rich motion" = >=1024px, fine
// pointer, no reduced-motion request — the same query the boot script uses.

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 780 };

/** Scroll instantly (progress is 1:1 with scroll), then let a frame land. */
async function scrollAndSettle(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(400);
}

/** Index of the cached film frame currently drawn on the canvas. */
async function filmFrame(page: Page) {
  return page.evaluate(() =>
    Number(document.querySelector<HTMLCanvasElement>(".entrance-film")?.dataset.frame ?? -1),
  );
}

async function entranceVar(page: Page, name: string) {
  return page.evaluate(
    (n) => Number(document.querySelector<HTMLElement>(".entrance")!.style.getPropertyValue(n) || 0),
    name,
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

  test("scrubs the film from a frame cache, forward and back, without seeking a video", async ({
    page,
  }) => {
    await page.goto("/");
    const film = page.locator(".entrance-film");
    await expect(film).toHaveAttribute("data-ready", "", { timeout: 15_000 });
    await expect(film).toHaveAttribute("data-captured", "complete", { timeout: 30_000 });
    // The capture pass removes its offscreen <video>; nothing is ever seeked.
    await expect(page.locator("video")).toHaveCount(0);

    await scrollAndSettle(page, 900);
    await expect.poll(() => filmFrame(page)).toBeGreaterThan(150);
    const deep = await filmFrame(page);

    await scrollAndSettle(page, 300);
    await expect.poll(() => filmFrame(page)).toBeLessThan(deep - 60);

    await scrollAndSettle(page, 0);
    await expect.poll(() => filmFrame(page)).toBeLessThanOrEqual(3);
  });

  test("the aperture opens with the gates and closes again in reverse", async ({ page }) => {
    await page.goto("/");
    const clip = () =>
      page.evaluate(() => getComputedStyle(document.querySelector(".entrance-aperture")!).clipPath);

    // Closed: an arched doorway (a rounded inset), the name on both pillars.
    expect(await clip()).toContain("round");
    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.locator(".entrance-inscription-l")).toHaveCSS("opacity", "1");

    await scrollAndSettle(page, 600);
    await expect.poll(() => entranceVar(page, "--o")).toBe(1);
    await expect(page.locator(".entrance-inscription-l")).toHaveCSS("opacity", "0");

    await scrollAndSettle(page, 0);
    await expect.poll(() => entranceVar(page, "--o")).toBe(0);
  });

  test("the arrival rail jumps to the lobby, where the directory appears", async ({ page }) => {
    await page.goto("/");
    const section = page.locator(".entrance");
    const directory = page.getByRole("navigation", { name: "Inside the hotel" });
    const rail = page.getByRole("navigation", { name: "Arrival" });

    await expect(section).toHaveAttribute("data-stage", "gate");
    await expect(directory).toBeHidden();
    await expect(rail.getByRole("button")).toHaveCount(3);

    await rail.getByRole("button", { name: "Jump to the Lobby" }).click();
    await expect(section).toHaveAttribute("data-stage", "lobby", { timeout: 5_000 });
    await expect(directory).toBeVisible();
    const hrefs = await directory
      .getByRole("link")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(hrefs).toEqual(["#stay", "#celebrate", "#unwind", "#dine"]);

    // Keyboard: the rail is reachable and works with Enter.
    await rail.getByRole("button", { name: "Jump to the Gate" }).focus();
    await page.keyboard.press("Enter");
    await expect(section).toHaveAttribute("data-stage", "gate", { timeout: 5_000 });
    await expect(directory).toBeHidden();
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
    await expect(page.getByRole("navigation", { name: "Arrival" })).toBeHidden();
  });

  test("keeps the composition when the film fails to load", async ({ page }) => {
    await page.route("**/video/entry.mp4", (route) => route.abort());
    await page.goto("/");
    await page.waitForTimeout(1500);

    await expect(page.locator(".entrance-film")).not.toHaveAttribute("data-ready", "");
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
    await expect(page.locator(".entrance-film")).toHaveCount(0);
    expect(videoRequests).toEqual([]);
    // No rail or directory without the scrubbed journey.
    await expect(page.getByRole("navigation", { name: "Arrival" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Inside the hotel" })).toBeHidden();

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
    await expect(page.locator(".entrance-film")).toHaveCount(0);

    // The whole name and tagline are readable without scrolling, and the
    // still is shown full-frame (no closed aperture).
    for (const selector of [".entrance-inscription-l", ".entrance-inscription-r", ".entrance-tagline"]) {
      await expect(page.locator(selector)).toBeVisible();
      await expect(page.locator(selector)).toHaveCSS("opacity", "1");
    }
    const aperture = await page.evaluate(
      () => getComputedStyle(document.querySelector(".entrance-aperture")!).clipPath,
    );
    expect(aperture).toBe("none");
    await expect(page.getByRole("navigation", { name: "Arrival" })).toBeHidden();

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
