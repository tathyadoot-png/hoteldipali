import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import leisureData from "../content/leisure.json" with { type: "json" };
import outletsData from "../content/outlets.json" with { type: "json" };
import roomsData from "../content/rooms.json" with { type: "json" };
import venuesData from "../content/venues.json" with { type: "json" };

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

  /* ──── The Grand Reveal ──── */

  test("The Grand Reveal: the façade at night, a real photograph in a gold frame", async ({ page }) => {
    const section = page.locator("#reveal");
    await expect(section).toHaveAttribute("data-theme", "emerald");
    await expect(
      section.getByRole("heading", { level: 2, name: "As evening falls, the whole house comes alight" }),
    ).toBeVisible();

    const image = await section.locator(".grand-reveal-window img").evaluate((img: HTMLImageElement) => ({
      src: img.getAttribute("src") ?? "",
      srcset: img.srcset,
      alt: img.alt,
      width: img.getAttribute("width"),
      height: img.getAttribute("height"),
    }));
    // The optimised night panorama — never a placeholder or the camera
    // original — with explicit dimensions, and a portrait crop for phones.
    expect(image.src).toMatch(/^\/images\/hotel\/reveal-night-panorama-\d+\.webp$/);
    expect(image.srcset).toContain("reveal-night-panorama-960.webp 960w");
    expect(image.alt.length).toBeGreaterThan(0);
    expect([image.width, image.height]).toEqual(["2560", "1028"]);
    await expect(section.locator('.grand-reveal-window source[media="(max-width: 767px)"]')).toHaveAttribute(
      "srcset",
      /reveal-night-portrait-480\.webp 480w/,
    );

    // The frame: four edges, four corner ornaments and a keystone.
    await expect(section.locator(".grand-reveal-edge")).toHaveCount(4);
    await expect(section.locator(".grand-reveal-corner svg")).toHaveCount(4);
    await expect(section.locator(".grand-reveal-key")).toHaveCount(1);

    // The portal the visitor passes through (rich motion): decorative, its
    // archivolt carved with the hotel's name.
    await expect(section.locator(".grand-reveal-portal")).toHaveAttribute("aria-hidden", "true");
    await expect(section.locator(".portal-name textPath")).toHaveText("HOTEL DIPALI · SAGAR");

    await expect(section.getByRole("link", { name: "Plan your visit" })).toHaveAttribute("href", "#enquire");
  });

  /* ──── The Living Experiences ──── */

  // The four experiences are told once, here — A World Within Dipali and the
  // separate Stay / Celebrate / Dine / Unwind sections were folded into these
  // chapters (2026-10-27), each keeping everything only it said.
  test("The Living Experiences: an index of four chapters, each a section on this page", async ({
    page,
  }) => {
    const section = page.locator("#explore");
    await expect(section.getByRole("heading", { level: 2, name: "The Living Experiences" })).toBeAttached();

    const index = section.getByRole("navigation", { name: "The four experiences" });
    const links = index.getByRole("link");
    await expect(links).toHaveText([/Stay$/, /Weddings & Events$/, /Dining$/, /Pool & Gym$/]);
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs).toEqual(["#stay", "#celebrate", "#dine", "#unwind"]);

    // Each chapter is its own labelled section inside The Living Experiences.
    for (const href of hrefs) {
      const chapter = section.locator(`section${href}`);
      await expect(chapter).toHaveCount(1);
      const labelledBy = await chapter.getAttribute("aria-labelledby");
      await expect(chapter.locator(`h3#${labelledBy}`)).toHaveCount(1);
    }
  });

  test("Weddings & Events: every venue on the programme card, and the ways in", async ({ page }) => {
    const chapter = page.locator("#celebrate");
    await expect(chapter).toHaveAttribute("data-theme", "peacock");
    await expect(chapter.locator(".celebrate-venue-name")).toHaveText(venuesData.map((venue) => venue.name));
    await expect(chapter.getByRole("link", { name: "Plan your wedding" })).toHaveAttribute("href", "/weddings/");
    await expect(chapter.getByRole("link", { name: "Events & gatherings" })).toHaveAttribute("href", "/events/");
    // The giant word is part of the picture; the heading carries the meaning.
    await expect(chapter.locator(".celebrate-word")).toHaveAttribute("aria-hidden", "true");
  });

  test("Dining: the five places in the order of a day, each linking to its menu", async ({ page }) => {
    const chapter = page.locator("#dine");
    const order = ["restaurant", "bakery", "sweets", "poolside-restaurant", "infinity-bar"];
    const outlets = order.map((slug) => outletsData.find((outlet) => outlet.slug === slug)!);
    const names = chapter.locator(".dine-name");
    await expect(names).toHaveText(outlets.map((outlet) => outlet.name));
    expect(await names.evaluateAll((els) => els.map((e) => e.getAttribute("href")))).toEqual(
      order.map((slug) => `/dining/#${slug}`),
    );
    await expect(chapter.getByRole("link", { name: "Explore dining" })).toHaveAttribute("href", "/dining/");
  });

  test("Pool & Gym: both summaries and the membership enquiry", async ({ page }) => {
    const chapter = page.locator("#unwind");
    await expect(chapter).toContainText(leisureData.pool.summary);
    await expect(chapter).toContainText(leisureData.gym.summary);
    await expect(chapter.getByRole("link", { name: "Ask about memberships" })).toHaveAttribute(
      "href",
      "#enquire",
    );
  });

  test("the chapters' photographs are the hotel's own, optimised and sized", async ({ page }) => {
    const images = await page
      .locator(".celebrate-photo img, .dine-photo img, .unwind-photo img, .pictures-figure img")
      .evaluateAll((imgs) =>
        (imgs as HTMLImageElement[]).map((img) => ({
          src: img.getAttribute("src") ?? "",
          srcset: img.srcset,
          sized: Boolean(img.getAttribute("width") && img.getAttribute("height")),
        })),
      );
    // Celebrate, Dining by day and after dark, Unwind, and at least three in pictures.
    expect(images.length).toBeGreaterThanOrEqual(7);
    for (const image of images) {
      expect(image.src).toMatch(/^\/images\/hotel\/.+\.webp$/);
      expect(image.srcset.length).toBeGreaterThan(0);
      expect(image.sized).toBe(true);
    }
    // In pictures: the photographs are decorative, their captions describe them.
    const captions = await page.locator(".pictures-caption").allTextContents();
    expect(captions.every((caption) => caption.trim().length > 0)).toBe(true);
  });

  // The Stay chapter carries each room's photograph twice by design — inline
  // for phones, on the stage for wide screens — and shows one or the other.
  test("no photograph appears twice on the page", async ({ page }) => {
    const shown = await page.locator("main img").evaluateAll((imgs) =>
      imgs
        .filter((img) => img.getClientRects().length > 0)
        .map((img) => img.getAttribute("src") ?? "")
        .filter((src) => src.startsWith("/images/hotel/") || src.startsWith("/sample/"))
        // One photograph, whatever width or crop of it is served.
        .map((src) => src.replace(/-(portrait-)?\d+\.webp$/, "")),
    );
    expect(shown.length).toBeGreaterThanOrEqual(10);
    expect(shown.filter((src, i) => shown.indexOf(src) !== i)).toEqual([]);
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
