import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import roomsData from "../content/rooms.json" with { type: "json" };

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  /* ──── Structure & content ──── */

  test("has exactly one H1 with the hotel name", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Hotel");
    await expect(h1).toContainText("Dipali");
  });

  test("renders all seven sections", async ({ page }) => {
    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.locator("#home-intro")).toBeVisible();
    await expect(page.locator("#home-rooms")).toBeVisible();
    await expect(page.locator("#home-weddings")).toBeVisible();
    await expect(page.locator("#home-dining")).toBeVisible();
    await expect(page.locator("#home-leisure")).toBeVisible();
    await expect(page.locator("#home-enquire")).toBeVisible();
  });

  test("hero section has the emerald theme", async ({ page }) => {
    const hero = page.locator("section").filter({ has: page.locator("#home-hero") });
    await expect(hero).toHaveAttribute("data-theme", "emerald");
  });

  test("enquiry section has peacock theme and anchor id", async ({ page }) => {
    const enquiry = page.locator("#enquire");
    await expect(enquiry).toHaveAttribute("data-theme", "peacock");
  });

  /* ──── Navigation & links ──── */

  test("the hero's two calls to action lead to sections on this page", async ({ page }) => {
    const hero = page.locator("section").filter({ has: page.locator("#home-hero") });
    const primary = hero.getByRole("link", { name: "Explore the Experience" });
    const secondary = hero.getByRole("link", { name: "Discover Hotel Dipali" });
    await expect(primary).toHaveAttribute("href", "#explore");
    await expect(secondary).toHaveAttribute("href", "#welcome");
    await expect(page.locator("#explore")).toBeAttached();
    await expect(page.locator("#welcome")).toBeAttached();
  });

  test("has at least one link to /rooms/", async ({ page }) => {
    const roomLinks = page.locator('a[href="/rooms/"]');
    await expect(roomLinks.first()).toBeAttached();
  });

  test("has at least one link to /weddings/", async ({ page }) => {
    const link = page.locator('a[href="/weddings/"]');
    await expect(link.first()).toBeAttached();
  });

  test("has at least one link to /dining/", async ({ page }) => {
    const link = page.locator('a[href="/dining/"]');
    await expect(link.first()).toBeAttached();
  });

  /* ──── Enquiry form ──── */

  test("enquiry form is present in the #enquire section", async ({ page }) => {
    const form = page.locator("#enquire form");
    await expect(form).toBeVisible();
  });

  /* ──── Rooms ──── */

  // The rooms section is an index rather than a card grid; what matters is
  // that every room is reachable from it.
  test("lists every room, each linking to its detail page", async ({ page }) => {
    const section = page.locator("#stay");
    for (const room of roomsData) {
      await expect(section.locator(`a[href="/rooms/${room.slug}/"]`)).toContainText(room.name);
    }
  });

  /* ──── The Dipali Experience (below the hero) ──── */

  test("the section below the hero pairs the statement with a real photograph", async ({
    page,
  }) => {
    const section = page.locator("#welcome");
    await expect(
      section.getByRole("heading", { level: 2, name: "More Than a Stay. A Feeling to Remember." }),
    ).toBeAttached();

    const image = await section.locator(".experience-photo img").evaluate((img: HTMLImageElement) => ({
      src: img.currentSrc || img.src,
      srcset: img.srcset,
      alt: img.alt,
      width: img.getAttribute("width"),
      height: img.getAttribute("height"),
    }));
    // The optimised portrait crop, never a placeholder or a camera original;
    // explicit dimensions so it cannot shift the layout.
    expect(image.src).toMatch(/\/images\/hotel\/reception-atrium-portrait-\d+\.webp$/);
    expect(image.srcset).toContain("reception-atrium-portrait-480.webp 480w");
    expect(image.alt.length).toBeGreaterThan(0);
    expect([image.width, image.height]).toEqual(["1200", "1500"]);

    // The call to action leads somewhere real on this page.
    const cta = section.getByRole("link", { name: "Discover Our Story" });
    await expect(cta).toHaveAttribute("href", "#explore");
    await expect(page.locator("#explore")).toBeAttached();
  });

  /* ──── A World Within Dipali ──── */

  test("A World Within Dipali: four experiences, each a real photograph and a real destination", async ({
    page,
  }) => {
    const section = page.locator("#explore");
    await expect(section).toHaveAttribute("data-theme", "emerald");
    await expect(section.getByRole("heading", { level: 2, name: "A World Within Dipali" })).toBeAttached();

    const items = section.locator(".world-item");
    await expect(items).toHaveCount(4);
    // Celebrate leads; the order follows the layout's reading order.
    await expect(section.locator(".world-label")).toHaveText(["Celebrate", "Stay", "Unwind", "Dine"]);

    const hrefs = await section
      .locator(".world-link, .world-aside")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.sort()).toEqual(["#unwind", "/dining/", "/events/", "/rooms/", "/weddings/"]);
    await expect(page.locator("#unwind")).toBeAttached();

    // Optimised hotel photographs with explicit dimensions (no placeholders).
    const images = await section.locator(".world-frame img").evaluateAll((imgs) =>
      (imgs as HTMLImageElement[]).map((img) => ({
        src: img.getAttribute("src") ?? "",
        srcset: img.srcset,
        sized: Boolean(img.getAttribute("width") && img.getAttribute("height")),
      })),
    );
    expect(images).toHaveLength(4);
    for (const image of images) {
      expect(image.src).toMatch(/^\/images\/hotel\/.+\.webp$/);
      expect(image.srcset.length).toBeGreaterThan(0);
      expect(image.sized).toBe(true);
    }
  });

  test("each experience panel is one link, reachable by keyboard", async ({ page }) => {
    const link = page.locator("#explore .world-link").first();
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute("href", "/weddings/");
  });

  /* ──── Themed scopes carry text-ink ──── */

  test("all peacock-themed sections carry text-ink class", async ({ page }) => {
    const peacockSections = page.locator('section[data-theme="peacock"]');
    const count = await peacockSections.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      const classes = await peacockSections.nth(i).getAttribute("class");
      expect(classes).toContain("text-ink");
    }
  });

  // Header, opening loader, hero and menu: every Emerald scope re-declares its
  // colour (inherited `color` would not re-resolve --color-ink).
  test("every emerald-themed element carries text-ink class", async ({ page }) => {
    const scopes = page.locator('[data-theme="emerald"]');
    const count = await scopes.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const classes = await scopes.nth(i).getAttribute("class");
      expect(classes).toContain("text-ink");
    }
  });

  /* ──── Scroll reveal ──── */

  test("scroll-reveal elements exist with data-reveal attribute", async ({ page }) => {
    const reveals = page.locator("[data-reveal]");
    const count = await reveals.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  /* ──── Accessibility ──── */

  test("passes axe-core accessibility checks", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .exclude("[data-reveal]:not([data-revealed])") // hidden elements pending reveal
      .exclude(".fixed.bottom-0.z-30") // StickyCtaBar — layout-level, outside landmarks
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("every section has an aria-labelledby pointing to a visible heading", async ({ page }) => {
    const sections = page.locator("section[aria-labelledby]");
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < count; i++) {
      const labelledBy = await sections.nth(i).getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      const heading = page.locator(`#${labelledBy}`);
      await expect(heading).toBeAttached();
    }
  });

  /* ──── No console errors ──── */

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors).toEqual([]);
  });

  /* ──── Meta ──── */

  test("page title contains Hotel Dipali and Sagar", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Hotel Dipali");
    expect(title).toContain("Sagar");
  });
});
