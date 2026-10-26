import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The home page's opening, hero and scroll-driven scenes. The hero (Emerald,
// 2026-10-24) frames the hotel's lit entrance in a gold arch — a photograph,
// and from tablet width up the same view in motion (2026-10-26); a short
// opening loader plays on a full page load only. Scenes run under "rich
// motion" (>=1024px, fine pointer, no reduced-motion request — the same query
// the boot script uses).

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 780 };
const EXIT_AT = 1450; // IntroLoader: ms after navigation start
const CLIP = "/video/entrance-night-arch-532.mp4";

/** Every request for a file under /video/ while `page` is open. */
function trackVideo(page: Page) {
  const requests: string[] = [];
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (path.startsWith("/video/")) requests.push(path);
  });
  return requests;
}

/** The hero: headline, photograph and calls to action in one viewport. */
async function expectHero(page: Page) {
  const videoRequests = trackVideo(page);
  await page.goto("/");
  await page.waitForLoadState("load");

  const hero = page.locator(".entrance");
  await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Explore the Experience" })).toHaveAttribute(
    "href",
    "#explore",
  );
  await expect(hero.getByRole("link", { name: "Discover Hotel Dipali" })).toHaveAttribute(
    "href",
    "#welcome",
  );

  const image = await hero.locator("img").evaluate((img: HTMLImageElement) => ({
    src: img.currentSrc,
    srcset: img.srcset,
    loaded: img.complete && img.naturalWidth > 0,
  }));
  // A real, responsive photograph — not a placeholder, not the camera original.
  expect(image.src).toMatch(/\/images\/hotel\/entrance-night-arch-\d+\.webp$/);
  expect(image.srcset).toContain("entrance-night-arch-960.webp 960w");
  expect(image.loaded).toBe(true);

  // No runway: the hero is one viewport tall.
  const ratio = await page.evaluate(
    () => document.querySelector<HTMLElement>(".entrance")!.offsetHeight / window.innerHeight,
  );
  expect(ratio).toBeLessThan(1.15);

  // No canvas / WebGL layer, and never the 13 MB source video.
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(videoRequests.filter((path) => path !== CLIP)).toEqual([]);
  return { image, videoRequests };
}

test.describe("Home hero", () => {
  test("desktop: the lit entrance in its arch, headline and calls to action", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await expectHero(page);
  });

  test("phone: the same photograph, at a phone-sized width, and no video", async ({ page }) => {
    await page.setViewportSize(PHONE);
    const { image, videoRequests } = await expectHero(page);
    expect(Number(/-(\d+)\.webp$/.exec(image.src)?.[1])).toBeLessThanOrEqual(720);
    // CLAUDE.md §K: no autoplay video on phones — not even a download.
    await page.waitForTimeout(4_500);
    await expect(page.locator(".entrance-video")).toHaveCount(0);
    expect(videoRequests).toEqual([]);
  });
});

test.describe("Hero video", () => {
  test.use({ viewport: DESKTOP });

  test("plays muted and inline inside the arch, after the page has loaded", async ({ page }) => {
    const requests = trackVideo(page);
    let loadedAt = 0;
    page.on("load", () => (loadedAt = Date.now()));
    await page.goto("/");
    const video = page.locator(".entrance-arch-window video");
    await expect(video).toHaveAttribute("data-playback", "playing", { timeout: 10_000 });
    expect(requests).toEqual([CLIP]);
    expect(loadedAt).toBeGreaterThan(0);
    const state = await video.evaluate((v: HTMLVideoElement) => ({
      muted: v.muted,
      inline: v.playsInline,
      loop: v.loop,
      paused: v.paused,
      hidden: v.getAttribute("aria-hidden"),
    }));
    expect(state).toEqual({ muted: true, inline: true, loop: true, paused: false, hidden: "true" });
    // The photograph — its poster — is still there underneath.
    await expect(page.locator(".entrance-arch-window img")).toBeVisible();
  });

  test("the pause control stops and restarts it (WCAG 2.2.2)", async ({ page }) => {
    await page.goto("/");
    const video = page.locator(".entrance-arch-window video");
    await expect(video).toHaveAttribute("data-playback", "playing", { timeout: 10_000 });
    const pause = page.getByRole("button", { name: "Pause the hotel video" });
    await pause.click();
    await expect(page.getByRole("button", { name: "Play the hotel video" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await page.getByRole("button", { name: "Play the hotel video" }).click();
    await expect(video).toHaveAttribute("data-playback", "playing");
  });

  test("if autoplay is refused, the photograph stays and nothing breaks", async ({ page }) => {
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await page.waitForTimeout(5_000);
    await expect(page.locator(".entrance-video")).toHaveCount(0);
    await expect(page.locator(".entrance-arch-window img")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("if the video cannot load, the photograph stays", async ({ page }) => {
    await page.route("**/video/**", (route) => route.abort());
    await page.goto("/");
    await page.waitForTimeout(5_000);
    await expect(page.locator(".entrance-video")).toHaveCount(0);
    await expect(page.locator(".entrance-arch-window img")).toBeVisible();
  });
});

test.describe("Hero video — reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("never plays (or downloads) the video", async ({ page }) => {
    const requests = trackVideo(page);
    await page.goto("/");
    await page.waitForTimeout(4_500);
    await expect(page.locator(".entrance-video")).toHaveCount(0);
    expect(requests).toEqual([]);
  });
});

test.describe("Layered sections — rich motion (desktop)", () => {
  test.use({ viewport: DESKTOP });

  test("the hero holds while The Dipali Experience rises over it, then scrolls away", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "rich");
    const hero = page.locator(".entrance");
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

  test("A World Within Dipali rises over The Dipali Experience", async ({ page }) => {
    await page.goto("/");
    const top = await page.evaluate(
      () => document.querySelector("#explore")!.getBoundingClientRect().top + window.scrollY,
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
    await page.locator(".entrance-actions").getByRole("link", { name: "Explore the Experience" }).focus();
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
    await expect(page.locator(".entrance")).not.toHaveCSS("position", "sticky");
    await page.evaluate(() => window.scrollTo({ top: innerHeight / 2, behavior: "instant" }));
    await page.waitForTimeout(300);
    expect(await page.locator(".entrance").evaluate((el) => el.style.getPropertyValue("--cover"))).toBe("");
    expect(
      await page.locator(".entrance").evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    ).toBeLessThan(0);
  });
});

test.describe("Opening loader", () => {
  test.use({ viewport: DESKTOP });

  test("plays on a full page load without blocking the pointer, then leaves", async ({
    page,
  }) => {
    await page.goto("/");
    const intro = page.locator(".intro");
    await expect(intro).toHaveCount(1);
    await expect(intro).toHaveCSS("pointer-events", "none");
    await expect(intro).toHaveAttribute("data-state", "done", { timeout: 4_000 });
    await expect(intro).toBeHidden();
    // The hero beneath is complete.
    await expect(page.locator(".entrance-actions .btn-secondary")).toHaveCSS("opacity", "1");
  });

  test("a key press during the opening ends it early", async ({ page }) => {
    await page.goto("/");
    // Input skips only once the page has hydrated (the loader is "ready").
    await page.waitForFunction(
      () => document.querySelector<HTMLElement>(".intro")?.dataset.state === "ready",
      null,
      { polling: "raf" },
    );
    // Any later and it would be leaving on its own anyway.
    const now = await page.evaluate(() => performance.now());
    test.skip(now > EXIT_AT - 250, "hydrated too close to the natural exit to observe a skip");

    await page.keyboard.press("Shift");
    await expect(page.locator(".intro")).toHaveAttribute("data-state", /leave|done/, {
      timeout: 200,
    });
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

  test("client-side navigation back home does not replay it", async ({ page }) => {
    await page.goto("/rooms/");
    await page.locator(".header-keystone").getByRole("link", { name: /home/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.locator(".intro")).toHaveCount(0);
    // …and the hero's entrance does not wait for it.
    expect(
      await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--intro").trim()),
    ).toBe("0s");
  });
});

test.describe("Opening loader — no JavaScript", () => {
  test.use({ viewport: DESKTOP, javaScriptEnabled: false });

  test("the CSS-only opening still leaves and the hero is complete", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".intro")).toBeHidden({ timeout: 4_000 });
    await expect(page.locator(".entrance-actions .btn-secondary")).toHaveCSS("opacity", "1", {
      timeout: 4_000,
    });
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

    // No opening loader; the headline, subline and calls to action are all
    // there at once.
    await expect(page.locator(".intro")).toBeHidden();
    for (const selector of ["#home-hero", ".entrance-line", ".entrance-subline", ".entrance-actions"]) {
      await expect(page.locator(selector).first()).toBeVisible();
      await expect(page.locator(selector).first()).toHaveCSS("opacity", "1");
    }

    // The Dipali Experience: copy, photograph and its gold frame are all
    // there at once, with nothing left clipped.
    await page.locator("#welcome").scrollIntoViewIfNeeded();
    await expect(page.locator(".experience-text")).toHaveCSS("opacity", "1");
    await expect(page.locator(".experience-frame")).toHaveCSS("clip-path", "none");
    await expect(page.locator(".experience-photo img")).toHaveCSS("transform", "none");

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
