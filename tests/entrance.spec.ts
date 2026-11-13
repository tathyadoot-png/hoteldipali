import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { CUTOUT_CROP, CUTOUT_GARDEN, CUTOUT_TOWER, SIGNAGE } from "../src/lib/hero-cutout";

// The home page's opening, hero and scroll-driven scenes. The hero (R1.1,
// "Midnight Bloom", 2026-11-04) is the night: DIPALI across the screen in
// engraved gold, HOTEL above it, and the hotel's lit entrance — a cut-out of
// the night photograph — standing in front of the letters. Under desktop rich
// motion the first viewport of scroll spreads and sinks the letters behind
// the building, then the name travels into the header and becomes its
// logotype. The opening ("Midnight Bloom") plays once per session. Scenes run
// under "rich motion" (>=1024px, fine pointer, no reduced-motion request — the
// same query the boot script uses).

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 780 };
const EXIT_AT = 1600; // IntroLoader: ms after navigation start
const CUTOUT = /\/images\/hotel\/entrance-night-cutout-(\d+)\.webp$/;
const INTRO_SEEN_KEY = "dipali:intro-seen";

/** Requests for video files while `page` is open. */
function trackVideo(page: Page) {
  const requests: string[] = [];
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (path.startsWith("/video/")) requests.push(path);
  });
  return requests;
}

const rectOf = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const r = document.querySelector(s)!.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }, selector);

/** The hero: the night, the name, the line, the two actions and the cut-out. */
async function expectHero(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("load");
  const hero = page.locator(".home-hero");
  await expect(hero).toHaveAttribute("data-theme", "deep");
  await expect(hero).toHaveClass(/text-ink/);

  await expect(hero.getByRole("heading", { level: 1 })).toHaveAccessibleName(/^Hotel Dipali, Sagar$/);
  await expect(hero.locator(".home-hero-name .wordmark-hotel")).toHaveText("Hotel");
  await expect(hero.locator(".home-hero-name .wordmark-dipali")).toHaveText("Dipali");
  await expect(hero.locator(".home-hero-line")).toHaveText(
    "Gardens, gatherings and warm hospitality in the heart of Sagar",
  );

  const book = hero.getByRole("link", { name: /^Book a Stay/ });
  await expect(book).toHaveClass(/btn-primary/);
  await expect(book).toHaveAttribute("href", /^https:\/\/wa\.me\/91\d{10}\?text=/);
  const wedding = hero.getByRole("link", { name: "Plan a Wedding" });
  await expect(wedding).toHaveClass(/btn-secondary/);
  await expect(wedding).toHaveAttribute("href", "/weddings/");

  const image = await hero.locator(".home-hero-building img").evaluate((img: HTMLImageElement) => ({
    src: img.currentSrc,
    alt: img.alt,
    loaded: img.complete && img.naturalWidth > 0,
    aspect: img.naturalWidth / img.naturalHeight,
    background: getComputedStyle(img).backgroundColor,
  }));
  expect(image.src).toMatch(CUTOUT);
  expect(image.loaded).toBe(true);
  expect(image.alt).toMatch(/entrance/i);
  // A cut-out: nothing painted behind it.
  expect(image.background).toBe("rgba(0, 0, 0, 0)");
  await expect(page.locator("video")).toHaveCount(0);
  return { hero, image };
}

test.describe("Home hero", () => {
  for (const viewport of [DESKTOP, { width: 1920, height: 1080 }]) {
    test(`${viewport.width}px: DIPALI spans the screen, and the building stands in front of it`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      const video = trackVideo(page);
      await expectHero(page);
      // The page's own width (a stable scrollbar gutter is reserved beside it).
      const width = await page.evaluate(() => document.body.getBoundingClientRect().width);
      const dipali = await rectOf(page, ".home-hero-name .wordmark-dipali");
      expect(dipali.width / width).toBeGreaterThan(0.9);
      expect(Math.abs(dipali.left + dipali.width / 2 - width / 2)).toBeLessThanOrEqual(2);

      // Stacking: the building is painted over the letters (same stacking
      // context, a higher z-index), and its parapet crosses the capitals.
      const z = await page.evaluate(() => ({
        name: Number(getComputedStyle(document.querySelector(".home-hero-name")!).zIndex),
        building: Number(getComputedStyle(document.querySelector(".home-hero-building")!).zIndex),
      }));
      expect(z.building).toBeGreaterThan(z.name);
      const building = await rectOf(page, ".home-hero-building");
      expect(building.top).toBeGreaterThan(dipali.top + dipali.height * 0.3);
      expect(building.top).toBeLessThan(dipali.bottom);
      expect(building.left).toBeLessThan(width / 2);
      expect(building.right).toBeGreaterThan(width / 2);

      // From xl the line and the actions flank the garden on the plain night.
      const line = await rectOf(page, ".home-hero-line");
      const actions = await rectOf(page, ".home-hero-actions");
      expect(line.right).toBeLessThanOrEqual(building.left + building.width * 0.05);
      expect(actions.left).toBeGreaterThanOrEqual(building.right - building.width * 0.05);
      // Clear of the next section's arched edge.
      const next = await rectOf(page, "#welcome");
      expect(actions.bottom).toBeLessThan(next.top);
      expect(video).toEqual([]);
    });
  }

  test("phone: the same layering, still, with a phone-sized cut-out and the header's logotype", async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    const { image } = await expectHero(page);
    expect(Number(CUTOUT.exec(image.src)?.[1])).toBeLessThanOrEqual(720);
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");
    const dipali = await rectOf(page, ".home-hero-name .wordmark-dipali");
    const building = await rectOf(page, ".home-hero-building");
    expect(dipali.width / 360).toBeGreaterThan(0.88);
    expect(building.top).toBeGreaterThan(dipali.top);
    expect(building.top).toBeLessThan(dipali.bottom);
    // No scroll morph: nothing written, the letters untransformed; the header
    // shows its own logotype from the start.
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 0.6, behavior: "instant" }));
    await page.waitForTimeout(300);
    expect(await page.locator(".home-hero").evaluate((el) => el.style.getPropertyValue("--h"))).toBe("");
    expect(
      await page.locator(".home-hero-name .wordmark").evaluate((el) => getComputedStyle(el).transform),
    ).toBe("none");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.locator(".header-logotype")).toHaveCSS("opacity", "1");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("the cut-out never frames the signage, and is fetched with the document", async ({ page }) => {
    // The crop and the mask's opaque regions (src/lib/hero-cutout.ts).
    const crop = { ...CUTOUT_CROP, right: CUTOUT_CROP.x + CUTOUT_CROP.w, bottom: CUTOUT_CROP.y + CUTOUT_CROP.h };
    const xs = CUTOUT_TOWER.map(([x]) => x);
    const ys = CUTOUT_TOWER.map(([, y]) => y);
    const opaque = [
      { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) },
      { left: CUTOUT_GARDEN.outer[0], right: CUTOUT_GARDEN.outer[1], top: CUTOUT_GARDEN.top, bottom: 1 },
    ];
    const overlaps = (a: { left: number; right: number; top: number; bottom: number }, b: typeof a) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    for (const sign of SIGNAGE) {
      const box = { left: sign.x, right: sign.x + sign.w, top: sign.y, bottom: sign.y + sign.h };
      const inCrop = overlaps(box, { left: crop.x, right: crop.right, top: crop.y, bottom: crop.bottom });
      if (!inCrop) continue;
      for (const region of opaque) expect(overlaps(box, region), sign.name).toBe(false);
    }
    // The rooftop sign is not even in the file.
    expect(SIGNAGE[0]!.y + SIGNAGE[0]!.h).toBeLessThanOrEqual(CUTOUT_CROP.y);

    await page.setViewportSize(DESKTOP);
    const { image } = await expectHero(page);
    // The shipped file is this crop (4096 × 3072 source).
    expect(image.aspect).toBeCloseTo((CUTOUT_CROP.w * 4096) / (CUTOUT_CROP.h * 3072), 2);
    const preload = page.locator('link[rel="preload"][as="image"][imagesrcset*="entrance-night-cutout"]');
    await expect(preload).toHaveAttribute("imagesrcset", /entrance-night-cutout-720\.webp 720w/);
    await expect(preload).toHaveAttribute("fetchpriority", "high");
  });
});

test.describe("Hero → header morph — rich motion", () => {
  test.use({ viewport: DESKTOP });

  test("the name travels into the header's centre and becomes its logotype, and back", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".intro")).toHaveAttribute("data-state", "done", { timeout: 5_000 });
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
    const header = page.locator(".header-shell");
    const logotype = page.locator(".header-logotype");
    const name = page.locator(".home-hero-name");
    // At the top: the slot waits; the hero's name is the logo.
    await expect(logotype).toHaveCSS("opacity", "0");
    await expect(name).toHaveCSS("opacity", "1");
    await expect(header).not.toHaveAttribute("data-landed");

    // Nearly there: the travelling name sits on the logotype's place.
    await page.evaluate(() => window.scrollTo({ top: Math.round(innerHeight * 0.715), behavior: "instant" }));
    await expect
      .poll(async () => {
        const flying = await rectOf(page, ".home-hero-name .wordmark-dipali");
        const slot = await rectOf(page, ".header-logotype .wordmark-dipali");
        return Math.max(
          Math.abs(flying.left - slot.left),
          Math.abs(flying.top - slot.top),
          Math.abs(flying.width - slot.width),
        );
      })
      .toBeLessThan(3);
    const headerBox = await header.boundingBox();
    const flying = await rectOf(page, ".home-hero-name .wordmark-dipali");
    expect(flying.top).toBeGreaterThanOrEqual(headerBox!.y);
    expect(flying.bottom).toBeLessThanOrEqual(headerBox!.y + headerBox!.height);

    // Landed: the header's logotype takes over (still over the hero, in gold).
    await page.evaluate(() => window.scrollTo({ top: Math.round(innerHeight * 0.76), behavior: "instant" }));
    await expect(header).toHaveAttribute("data-landed", "");
    await expect(logotype).toHaveCSS("opacity", "1");
    await expect(name).toHaveCSS("opacity", "0");

    // And back.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(header).not.toHaveAttribute("data-landed");
    await expect(logotype).toHaveCSS("opacity", "0");
    await expect(name).toHaveCSS("opacity", "1");
  });

  test("the letters spread and sink while the building rises (two planes)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".intro")).toHaveAttribute("data-state", "done", { timeout: 5_000 });
    const letterY = () =>
      page.locator(".home-hero-name .wordmark-letter").first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
    const buildingY = () =>
      page.locator(".home-hero-building").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
    expect(await letterY()).toBe(0);
    await page.evaluate(() => window.scrollTo({ top: Math.round(innerHeight * 0.3), behavior: "instant" }));
    await expect.poll(letterY).toBeGreaterThan(0);
    await expect.poll(buildingY).toBeLessThan(0);
  });

  test("reduced motion: no morph — the header shows its logotype and the hero its name", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");
    await expect(page.locator(".header-logotype")).toHaveCSS("opacity", "1");
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1");
  });
});

test.describe("Gold thread", () => {
  test("desktop rich motion: one gold line, drawn further as the page scrolls, ending in a flower", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const thread = page.locator("svg.thread");
    await expect(thread).toHaveAttribute("data-ready", "");
    await expect(thread).toBeVisible();
    await expect(thread).toHaveAttribute("aria-hidden", "true");
    const progress = () => thread.evaluate((el) => Number((el as SVGElement).style.getPropertyValue("--p") || 0));
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.3, behavior: "instant" }));
    await expect.poll(progress).toBeGreaterThan(0);
    const early = await progress();
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect.poll(progress).toBeGreaterThan(early);
    await expect.poll(progress).toBeGreaterThan(0.95);
    // The small gold flower at its end opens.
    const flower = thread.locator(".thread-flower");
    await expect(flower.locator("ellipse")).toHaveCount(5);
    await expect
      .poll(() => flower.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a))
      .toBeGreaterThan(0.5);
  });

  test("phones: no thread, short static gold rules between sections instead", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/");
    await expect(page.locator("svg.thread")).toHaveCount(0);
    const stops = page.locator(".thread-stop");
    expect(await stops.count()).toBeGreaterThanOrEqual(3);
    const box = await stops.first().boundingBox();
    expect(box!.height).toBeGreaterThan(20);
    await expect(stops.first()).toBeVisible();
  });
});

test.describe("Layered sections — rich motion (desktop)", () => {
  test.use({ viewport: DESKTOP });

  test("the hero holds while The Dipali Experience rises over it, then scrolls away", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
    const hero = page.locator(".home-hero");
    await expect(hero).toHaveCSS("position", "sticky");
    // Half a viewport in: the hero has not moved, and it is half covered.
    await page.evaluate(() => window.scrollTo({ top: innerHeight / 2, behavior: "instant" }));
    await expect.poll(() => hero.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
    await expect
      .poll(() => hero.evaluate((el) => Number(el.style.getPropertyValue("--cover"))))
      .toBeGreaterThan(0.3);
    // Well past it: covered, and gone with its wrapper.
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 2.5, behavior: "instant" }));
    await expect
      .poll(() => hero.evaluate((el) => Number(el.style.getPropertyValue("--cover"))))
      .toBe(1);
    expect(await hero.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  });

  test("The Grand Reveal rises over The Dipali Experience", async ({ page }) => {
    await page.goto("/");
    const top = await page.evaluate(
      () => document.querySelector("#reveal")!.getBoundingClientRect().top + window.scrollY,
    );
    await page.evaluate((y) => window.scrollTo({ top: y - innerHeight / 2, behavior: "instant" }), top);
    await expect
      .poll(() => page.evaluate(() => Number(document.querySelector<HTMLElement>("#welcome")!.style.getPropertyValue("--cover"))))
      .toBeGreaterThan(0.3);
  });

  test("keyboard focus never lands on a covered hero link", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 0.8, behavior: "instant" }));
    await page.waitForTimeout(300);
    await page.locator(".home-hero-actions").getByRole("link", { name: "Plan a Wedding" }).focus();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const link = document.activeElement!.getBoundingClientRect();
          const cover = document.querySelector("#welcome")!.getBoundingClientRect();
          return link.bottom <= cover.top;
        }),
      )
      .toBe(true);
  });
});

test.describe("Layered sections — reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("sections simply stack: nothing holds and nothing recedes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".home-hero")).not.toHaveCSS("position", "sticky");
    await page.evaluate(() => window.scrollTo({ top: innerHeight / 2, behavior: "instant" }));
    await page.waitForTimeout(300);
    expect(await page.locator(".home-hero").evaluate((el) => el.style.getPropertyValue("--cover"))).toBe("");
    expect(
      await page.locator(".home-hero").evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    ).toBeLessThan(0);
  });
});

test.describe("Opening — Midnight Bloom", () => {
  test.use({ viewport: DESKTOP });

  test("veins, a blooming dahlia and the logo, the name in a line — then it lands and leaves", async ({
    page,
  }) => {
    await page.goto("/");
    const intro = page.locator(".intro");
    await expect(intro).toHaveCount(1);
    await expect(intro).toHaveCSS("pointer-events", "none");
    await expect(intro).toHaveAttribute("data-theme", "deep");
    // Veins from the corners (in the frame that fits the screen).
    const veins = intro.locator(".intro-veins-landscape .intro-vein");
    expect(await veins.count()).toBeGreaterThanOrEqual(8);
    await expect(intro.locator(".intro-veins-landscape")).toBeVisible();
    await expect(intro.locator(".intro-veins-portrait")).toBeHidden();
    // The dahlia: three rings of petals around the logo on its medallion.
    await expect(intro.locator(".intro-ring")).toHaveCount(3);
    expect(await intro.locator(".intro-petal").count()).toBe(36);
    await expect(intro.locator(".intro-medallion img")).toHaveAttribute("alt", "");
    // The name's letters, rising into one line.
    await expect(intro.locator(".intro-letter")).toHaveCount(11);

    await expect(intro).toHaveAttribute("data-state", "done", { timeout: 5_000 });
    await expect(intro).toBeHidden();
    // The name has landed in the hero, and the hero beneath is complete.
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1");
    await expect(page.locator(".home-hero-actions .btn-secondary")).toHaveCSS("opacity", "1");
  });

  test("it finishes within 2.2 s of the page starting", async ({ page }) => {
    await page.goto("/");
    const doneAt = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const intro = document.querySelector<HTMLElement>(".intro")!;
          const check = () => (intro.dataset.state === "done" ? resolve(performance.now()) : requestAnimationFrame(check));
          check();
        }),
    );
    // Generous for parallel test load; the timeline itself ends at ~2.1 s.
    expect(doneAt).toBeLessThan(3_000);
    expect(doneAt).toBeGreaterThan(EXIT_AT - 1);
  });

  test("a key press during the opening skips to the end", async ({ page }) => {
    await page.goto("/");
    // Input skips only once the page has hydrated (the opening is "ready").
    // Under heavy parallel load hydration can come after the natural exit, and
    // then there is nothing left to skip — but it must still leave.
    const ready = await page
      .waitForFunction(() => document.querySelector<HTMLElement>(".intro")?.dataset.state === "ready", null, {
        polling: "raf",
        timeout: 5_000,
      })
      .then(
        () => true,
        () => false,
      );
    if (!ready) {
      await expect(page.locator(".intro")).toHaveAttribute("data-state", /leave|done/);
      test.skip(true, "hydrated after the natural exit: nothing left to skip");
    }
    const now = await page.evaluate(() => performance.now());
    test.skip(now > EXIT_AT - 250, "hydrated too close to the natural exit to observe a skip");

    await page.keyboard.press("Shift");
    await expect(page.locator(".intro")).toHaveAttribute("data-state", /leave|done/, {
      timeout: 200,
    });
    await expect(page.locator(".intro")).toHaveAttribute("data-state", "done", { timeout: 1_000 });
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1");
  });

  test("once per session: a second full load of the page skips it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".intro")).toHaveAttribute("data-state", /ready|leave|done/);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), INTRO_SEEN_KEY)).toBe("1");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-intro", "off");
    await expect(page.locator(".intro")).toBeHidden();
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1");
  });

  test("with storage unavailable it still plays, and nothing breaks", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
    await page.goto("/");
    await expect(page.locator(".intro")).toHaveAttribute("data-state", "done", { timeout: 5_000 });
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1");
    expect(errors).toEqual([]);
  });

  test("a slow connection skips it, so it never adds to a slow load", async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    // ~3G: Chrome reports effectiveType "3g".
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
    });
    await page.goto("/", { timeout: 60_000 });
    await expect(page.locator("html")).toHaveAttribute("data-intro", "off");
    await expect(page.locator(".intro")).toBeHidden();
    expect(
      await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--intro").trim()),
    ).toBe("0s");
  });

  test("reduced motion: never shown", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".intro")).toBeHidden();
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1");
  });

  test("client-side navigation back home does not replay it", async ({ page }) => {
    await page.goto("/rooms/");
    await page.locator("header").getByRole("link", { name: /home/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".home-hero-name")).toBeVisible();
    await expect(page.locator(".intro")).toHaveCount(0);
    // …and the hero's entrance does not wait for it.
    expect(
      await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--intro").trim()),
    ).toBe("0s");
  });
});

test.describe("Opening — no JavaScript", () => {
  test.use({ viewport: DESKTOP, javaScriptEnabled: false });

  test("the CSS-only opening still leaves and the hero is complete", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".intro")).toBeHidden({ timeout: 4_000 });
    await expect(page.locator(".home-hero-name")).toHaveCSS("opacity", "1", { timeout: 4_000 });
    await expect(page.locator(".home-hero-actions .btn-secondary")).toHaveCSS("opacity", "1", {
      timeout: 4_000,
    });
  });

  test("the chapters are complete, and the transparent header stays at the top of the page", async ({
    page,
  }) => {
    await page.goto("/");
    for (const selector of [
      ".grand-reveal-window",
      ".celebrate-photo",
      ".dine-evening .dine-photo",
      ".unwind-plaque",
      ".pictures-item [data-reveal]",
    ]) {
      await expect(page.locator(selector).first()).toHaveCSS("opacity", "1");
    }
    // It would never turn solid without JS, so it must not float over the
    // content below the hero.
    const header = page.locator(".header-shell");
    await expect(header).toHaveAttribute("data-state", "overlay");
    await expect(header).toHaveCSS("position", "relative");
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

  // Nothing is pinned: the frame stays beside the menu (sticky in its column)
  // while the chapter scrolls at its natural height.
  test("dining: dusk is drawn down the frame, from the restaurant to the bar, as the menu is read", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
    const shows = (fy: number) => photoAt(page, ".dine-stage", ".dine-photo", 0.5, fy);
    const markers = () =>
      page.locator(".dine-marker").evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));

    // Before dusk: the restaurant by day fills the frame.
    await scrollToProgress(page, ".dine", 0.2);
    await expect.poll(() => shows(0.5)).toBe("dine-day");

    // Half way: the evening above a gold horizon, the day still below it; the
    // markers have lit as far as the evening has reached.
    // (Polled: the day photograph's own one-time reveal may still be wiping
    // down when a test scrolls this fast.)
    await scrollToProgress(page, ".dine", 0.5);
    await expect.poll(() => shows(0.25)).toBe("dine-evening");
    await expect.poll(() => shows(0.75)).toBe("dine-day");
    const half = await markers();
    expect(half[0]).toBe(1);
    expect(half.at(-1)).toBeCloseTo(0.25, 2);

    // After dark: the Infinity Bar, every place lit.
    await scrollToProgress(page, ".dine", 0.8);
    await expect.poll(() => shows(0.75)).toBe("dine-evening");
    expect((await markers()).every((opacity) => opacity === 1)).toBe(true);
    await expect(page.locator(".dine-stage")).toHaveCSS("position", "sticky");
  });
});

test.describe("Home scenes — phone", () => {
  test.use({ viewport: PHONE });

  test("no rich motion on a phone", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");
  });

  test("dining: the evening photograph sits over the day's corner, its tag hanging below", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".dine-stage").scrollIntoViewIfNeeded();
    const box = await page.evaluate(() => {
      const rect = (s: string) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
      };
      return {
        stage: rect(".dine-stage"),
        evening: rect(".dine-evening"),
        dayTag: rect(".dine-day .dine-label"),
        eveningTag: rect(".dine-evening .dine-label"),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(box.evening.width).toBeLessThan(box.stage.width * 0.6);
    expect(box.evening.bottom).toBeGreaterThan(box.stage.bottom);
    // The two labels never collide: the day's at the top of its photograph,
    // the evening's below its own.
    expect(box.eveningTag.top).toBeGreaterThanOrEqual(box.evening.bottom - 1);
    expect(box.dayTag.bottom).toBeLessThan(box.evening.top);
    expect(box.overflow).toBeLessThanOrEqual(0);
    expect(await page.locator(".dine").evaluate((el) => el.style.getPropertyValue("--p"))).toBe("");
  });
});

test.describe("Home scenes — reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("gets the full static composition", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "rich");

    // No opening loader; the headline, subline and calls to action are all
    // there at once.
    await expect(page.locator(".intro")).toBeHidden();
    for (const selector of [".home-hero-name", ".home-hero-line", ".home-hero-actions", ".home-hero-building"]) {
      await expect(page.locator(selector).first()).toBeVisible();
      await expect(page.locator(selector).first()).toHaveCSS("opacity", "1");
    }

    // The Dipali Experience: copy, photograph and its gold frame are all
    // there at once, with nothing left clipped.
    await page.locator("#welcome").scrollIntoViewIfNeeded();
    await expect(page.locator(".experience-text")).toHaveCSS("opacity", "1");
    await expect(page.locator(".experience-frame")).toHaveCSS("clip-path", "none");
    await expect(page.locator(".experience-photo img")).toHaveCSS("transform", "none");

    // The Celebrate photograph is already fully open.
    const clip = await page.evaluate(
      () => getComputedStyle(document.querySelector(".celebrate-photo")!).clipPath,
    );
    expect(["inset(0%)", "inset(0px)", "none"]).toContain(clip);
  });

  test("passes axe-core with no serious or critical violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .exclude(".sticky-bar") // the phone bar — layout-level, outside landmarks
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});

// The Grand Reveal (the façade at night) and the chapters of The Living
// Experiences (2026-10-26/27): scroll-linked under rich motion, from each
// scene's own --p (ScrollScene); a one-time reveal elsewhere; still under
// reduced motion.

/** Scroll so the scene `selector` has the "through" progress `p` (ScrollScene:
 * 0 as its top enters at the bottom, 1 as its bottom leaves at the top). */
async function scrollToProgress(page: Page, selector: string, p: number) {
  await page.evaluate(
    ([s, progress]) => {
      const r = document.querySelector(s)!.getBoundingClientRect();
      const top = r.top + window.scrollY;
      window.scrollTo({ top: top - innerHeight + progress * (innerHeight + r.height), behavior: "instant" });
    },
    [selector, p] as const,
  );
  await expect
    .poll(() => page.locator(selector).evaluate((el) => Number((el as HTMLElement).style.getPropertyValue("--p"))))
    .toBeCloseTo(p, 1);
}

/** Whether the façade photograph shows at a point of its stage (fractions). */
function photoShowsAt(page: Page, x: number, y: number) {
  return page.evaluate(
    ([fx, fy]) => {
      const stage = document.querySelector(".grand-reveal-stage")!.getBoundingClientRect();
      const hit = document.elementFromPoint(stage.left + fx * stage.width, stage.top + fy * stage.height);
      return Boolean(hit?.closest(".grand-reveal-window"));
    },
    [x, y] as const,
  );
}

/** Whether `layer` shows at a point of `stage` (fractions of its box) — an
 * area its clip-path cuts away is not hit. */
function showsAt(page: Page, stage: string, layer: string, x: number, y: number) {
  return page.evaluate(
    ([s, l, fx, fy]) => {
      const r = document.querySelector(s)!.getBoundingClientRect();
      return document
        .elementsFromPoint(r.left + fx * r.width, r.top + fy * r.height)
        .some((el) => el.matches(l));
    },
    [stage, layer, x, y] as const,
  );
}

/** The figure whose `layer` is uppermost at a point of `stage` (its first
 * class, e.g. "dine-evening"), or "" where none shows. */
function photoAt(page: Page, stage: string, layer: string, x: number, y: number) {
  return page.evaluate(
    ([s, l, fx, fy]) => {
      const r = document.querySelector(s)!.getBoundingClientRect();
      const hit = document
        .elementsFromPoint(r.left + fx * r.width, r.top + fy * r.height)
        .find((el) => el.matches(l));
      return hit?.closest("figure")?.classList[0] ?? "";
    },
    [stage, layer, x, y] as const,
  );
}

test.describe("The Grand Reveal and The Living Experiences — rich motion (desktop)", () => {
  test.use({ viewport: DESKTOP });

  test("the visitor passes through an arched doorway to the façade, then its gold frame completes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
    const corner = page.locator(".grand-reveal-corner").first();
    const arch = page.locator(".portal-arch");

    // On its way up: the photograph shows only through the doorway over the
    // porch, inside the portal's stone (already beginning to pass the
    // viewer); the ornaments are not set.
    await scrollToProgress(page, ".grand-reveal-stage", 0.3);
    await expect.poll(() => photoShowsAt(page, 0.63, 0.6)).toBe(true);
    expect(await photoShowsAt(page, 0.08, 0.6)).toBe(false);
    expect(Number(await arch.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.5);
    expect(Number(await corner.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.5);

    // Through it: the doorway has grown past the viewer and gone; the façade
    // is fully open, and framed.
    await scrollToProgress(page, ".grand-reveal-stage", 0.65);
    await expect.poll(() => photoShowsAt(page, 0.08, 0.6)).toBe(true);
    await expect(arch).toHaveCSS("opacity", "0");
    await expect(corner).toHaveCSS("opacity", "1");
    await expect
      .poll(() => page.locator(".grand-reveal-edge-top").evaluate((el) => getComputedStyle(el).scale))
      .toMatch(/^1( 1)?$/);
  });

  test("Weddings & Events: the hall shows through the word, around a band that opens into the room", async ({
    page,
  }) => {
    await page.goto("/");
    const photo = (fy: number) => showsAt(page, ".celebrate-stage", ".celebrate-photo", 0.5, fy);

    // Entering: a band through the middle, the room above it still closed;
    // the letters are windows onto the hall itself (TypeFill).
    await scrollToProgress(page, ".celebrate-stage", 0.25);
    await expect.poll(() => photo(0.4)).toBe(true);
    expect(await photo(0.1)).toBe(false);
    await expect
      .poll(() => page.locator(".celebrate-word").evaluate((el) => getComputedStyle(el).backgroundImage))
      .toMatch(/^url\(".*\/images\/hotel\/.+\.webp"\)$/);

    // Open: the whole room.
    await scrollToProgress(page, ".celebrate-stage", 0.55);
    await expect.poll(() => photo(0.15)).toBe(true);
  });

  test("Pool & Gym: the water opens in a widening circle as rings spread across it", async ({
    page,
  }) => {
    await page.goto("/");
    const photo = (fx: number, fy: number) => showsAt(page, ".unwind-stage", ".unwind-photo", fx, fy);
    const ringScale = () =>
      page.locator(".unwind-ring").last().evaluate((el) => Number.parseFloat(getComputedStyle(el).scale));

    // Opening round the plunge pools; the far corner still closed.
    await scrollToProgress(page, ".unwind-stage", 0.3);
    await expect.poll(() => photo(0.4, 0.5)).toBe(true);
    expect(await photo(0.98, 0.3)).toBe(false);
    const opening = await ringScale();

    // Open: the whole view, the rings spread wider.
    await scrollToProgress(page, ".unwind-stage", 0.6);
    await expect.poll(() => photo(0.98, 0.3)).toBe(true);
    expect(await ringScale()).toBeGreaterThan(opening);
  });

  test("In pictures: the photographs converge from their own edges and settle into the mosaic", async ({
    page,
  }) => {
    await page.goto("/");
    const offsets = () =>
      page.locator(".pictures-item").evaluateAll((els) =>
        els.map((el) => {
          const [x = "0", y = "0"] = getComputedStyle(el).translate.split(" ");
          return Math.hypot(Number.parseFloat(x) || 0, Number.parseFloat(y) || 0);
        }),
      );

    await scrollToProgress(page, ".pictures-scene", 0.15);
    await expect.poll(async () => Math.min(...(await offsets()))).toBeGreaterThan(20);

    await scrollToProgress(page, ".pictures-scene", 0.55);
    await expect.poll(async () => Math.max(...(await offsets()))).toBeLessThan(1);
  });
});

test.describe("The Grand Reveal and The Living Experiences — reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("are complete and still: no doorway, no band, no circle, no drift", async ({ page }) => {
    await page.goto("/");
    // Nothing clipped ("inset(0)" once revealed is the same as none).
    const unclipped = /^(none|inset\(0(px|%)?\))$/;
    await page.locator("#reveal").scrollIntoViewIfNeeded();
    await expect(page.locator(".grand-reveal-window")).toHaveCSS("clip-path", unclipped);
    await expect(page.locator(".grand-reveal-portal")).toBeHidden();
    for (const corner of await page.locator(".grand-reveal-corner").all()) {
      await expect(corner).toHaveCSS("opacity", "1");
    }
    await expect(page.locator(".grand-reveal-edge-top")).not.toHaveCSS("scale", "0 1");
    expect(await page.locator(".grand-reveal-stage").evaluate((el) => el.style.getPropertyValue("--p"))).toBe("");

    // The chapters: no scroll-linked progress, every photograph whole.
    for (const scene of [".celebrate-stage", ".dine", ".unwind-stage", ".pictures-scene"]) {
      await page.locator(scene).scrollIntoViewIfNeeded();
      expect(await page.locator(scene).evaluate((el) => (el as HTMLElement).style.getPropertyValue("--p"))).toBe("");
    }
    for (const layer of [".celebrate-photo", ".dine-day .dine-photo", ".dine-evening .dine-photo", ".unwind-photo"]) {
      await expect(page.locator(layer)).toHaveCSS("clip-path", unclipped);
    }
    for (const item of await page.locator(".pictures-item").all()) {
      await expect(item).toHaveCSS("translate", "none");
    }
  });
});

test.describe("The Grand Reveal — phone", () => {
  test.use({ viewport: PHONE });

  test("shows the portrait crop and opens once, with no scroll-linked progress", async ({ page }) => {
    await page.goto("/");
    const frame = page.locator(".grand-reveal-window");
    await frame.scrollIntoViewIfNeeded();
    await expect
      .poll(() => frame.locator("img").evaluate((img: HTMLImageElement) => img.currentSrc))
      .toMatch(/\/images\/hotel\/reveal-night-portrait-\d+\.webp$/);
    await expect.poll(() => frame.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^inset\(0(px)?\)$/);
    expect(await page.locator(".grand-reveal-stage").evaluate((el) => el.style.getPropertyValue("--p"))).toBe("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
