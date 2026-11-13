import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The shell (R1.1 "Midnight Bloom", 2026-11-04): a thin header with the
// hotel's name at its centre — transparent (deep) over the home hero, solid
// ivory elsewhere — that hides on the way down and returns on the way up; a
// full-screen plum menu below xl whose petals unfold as it opens; the plum
// phone bar; and the plum footer, whose gold vine grows along its top edge
// as it arrives.

const BRAND_PLUM = "rgb(72, 9, 80)"; // --color-brand (#480950)

/** Every href in `links`, followed: each page exists, and so does each anchor. */
async function expectLinksResolve(page: Page, hrefs: string[]) {
  for (const href of hrefs) {
    const [path, hash] = href.split("#");
    const response = await page.goto(path || "/");
    expect(response?.status(), href).toBe(200);
    if (hash) await expect(page.locator(`#${hash}`), href).toBeAttached();
  }
}

/** Scrolls by `dy` in steps, so the header sees a direction. */
async function scrollBy(page: Page, dy: number) {
  const steps = 6;
  for (let i = 0; i < steps; i += 1) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "instant" }), dy / steps);
    await page.waitForTimeout(40);
  }
}

test.describe("Header — desktop (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the nav shows; the Menu button and the phone bar do not", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeAttached();
    await expect(page.locator(".header-links-start")).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
    await expect(page.locator(".sticky-bar")).toBeHidden();
  });

  test("on the home page it is transparent over the hero (the night's colours) and solid ivory once past it", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toHaveAttribute("data-state", "overlay");
    await expect(header).toHaveAttribute("data-theme", "deep");
    await expect(header).toHaveClass(/text-ink/);
    expect(await header.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");

    // One-frame jump well past the hero (anchor link, End key, fling): solid,
    // light, with its gold hairline.
    await page.evaluate(() => {
      const next = document.querySelector<HTMLElement>("[data-header-solid-from]");
      if (!next) throw new Error("missing [data-header-solid-from]");
      window.scrollTo({ top: next.getBoundingClientRect().top + window.scrollY + 600, behavior: "instant" });
    });
    await expect(header).toHaveAttribute("data-state", "solid");
    await expect(header).not.toHaveAttribute("data-theme", /.+/);
    await expect
      .poll(() => header.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe("rgba(0, 0, 0, 0)");
    expect(await header.evaluate((el) => getComputedStyle(el).boxShadow)).toContain("inset");

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-state", "overlay");
  });

  test("solid from the start on a page without an overlay hero", async ({ page }) => {
    await page.goto("/rooms/");
    await expect(page.locator("header")).toHaveAttribute("data-state", "solid");
  });

  test("three links, the logotype at the exact centre, then four links and Book a Stay — each to a page that exists", async ({
    page,
  }) => {
    await page.goto("/rooms/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.locator(".header-links-start").getByRole("link")).toHaveText(["Stay", "Weddings", "Events"]);
    await expect(nav.locator(".header-links-end").getByRole("link")).toHaveText([
      "Dining",
      "Experiences",
      "Gallery",
      "Contact",
    ]);
    const header = await page.locator("header").boundingBox();
    const logotype = await page.locator(".header-logotype").boundingBox();
    const start = await nav.locator(".header-links-start").boundingBox();
    const end = await nav.locator(".header-links-end").boundingBox();
    const book = await page.locator(".header-book").boundingBox();
    // The page's own width (a stable scrollbar gutter is reserved beside it).
    const centre = await page.evaluate(() => document.body.getBoundingClientRect().width / 2);
    expect(Math.abs(logotype!.x + logotype!.width / 2 - centre)).toBeLessThanOrEqual(1);
    expect(start!.x + start!.width).toBeLessThan(logotype!.x);
    expect(end!.x).toBeGreaterThan(logotype!.x + logotype!.width);
    expect(end!.x + end!.width).toBeLessThanOrEqual(book!.x);
    // A thin bar: everything inside it.
    for (const box of [logotype, start, end, book]) {
      expect(box!.y).toBeGreaterThanOrEqual(header!.y);
      expect(box!.y + box!.height).toBeLessThanOrEqual(header!.y + header!.height + 0.5);
    }
    const hrefs = await nav
      .getByRole("link")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    expect(hrefs).toHaveLength(7);
    await expectLinksResolve(page, hrefs);
  });

  test("the current page carries the logo's diamond; hover draws a gold underline from the centre", async ({
    page,
  }) => {
    await page.goto("/rooms/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const stay = nav.getByRole("link", { name: "Stay" });
    const events = nav.getByRole("link", { name: "Events" });
    await expect(stay).toHaveAttribute("aria-current", "page");
    await expect(events).not.toHaveAttribute("aria-current");
    const mark = (link: typeof stay) =>
      link.evaluate((el) => {
        const style = getComputedStyle(el, "::before");
        return { content: style.content, mask: style.maskImage || style.webkitMaskImage };
      });
    const current = await mark(stay);
    expect(current.content).not.toBe("none");
    // The diamond: a cut gem drawn as an SVG mask (crown over pavilion).
    expect(decodeURIComponent(current.mask)).toContain("M2.2 0h7.6L12 3H0z");
    expect((await mark(events)).content).toBe("none");

    const underline = () =>
      events.evaluate((el) => {
        const style = getComputedStyle(el, "::after");
        return { transform: style.transform, origin: style.transformOrigin };
      });
    expect((await underline()).transform).toBe("matrix(0, 0, 0, 1, 0, 0)");
    await events.hover();
    await expect.poll(async () => (await underline()).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    const { origin } = await underline();
    const width = await events.evaluate((el) => parseFloat(getComputedStyle(el, "::after").width));
    expect(Math.abs(parseFloat(origin) - width / 2)).toBeLessThan(1);
  });

  test("the logotype is type — plum on ivory, gold over the night — never the gold logo on a light ground", async ({
    page,
  }) => {
    await page.goto("/rooms/");
    const logotype = page.locator(".header-logotype");
    await expect(logotype).toHaveAccessibleName("Hotel Dipali — home");
    await expect(logotype).toHaveAttribute("href", "/");
    await expect(logotype.locator("img, .logo-medallion")).toHaveCount(0);
    await expect(logotype.locator(".wordmark")).toHaveCSS("color", BRAND_PLUM);
    await expect(page.locator("header img")).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const letter = page.locator(".header-logotype .wordmark-letter").first();
    // Gold, lit like an engraving: the letters are filled with a gold gradient.
    expect(await letter.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("linear-gradient");
  });

  test("Book a Stay is the plum plaque, and asks for availability on WhatsApp", async ({ page }) => {
    await page.goto("/rooms/");
    const book = page.locator("header").getByRole("link", { name: /^Book a Stay/ });
    await expect(book).toHaveCSS("background-color", BRAND_PLUM);
    await expect(book).toHaveAttribute("href", /^https:\/\/wa\.me\/91\d{10}\?text=/);
    await expect(book).toHaveAccessibleName(/check availability on WhatsApp/);
  });

  test("it hides on the way down past the first screen and returns on the way up", async ({ page }) => {
    await page.goto("/rooms/");
    const header = page.locator("header");
    await scrollBy(page, 300);
    await expect(header).not.toHaveAttribute("data-hidden");
    await scrollBy(page, 1500);
    await expect(header).toHaveAttribute("data-hidden", "");
    await expect
      .poll(() => header.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42))
      .toBeLessThan(-40);
    await scrollBy(page, -120);
    await expect(header).not.toHaveAttribute("data-hidden");
    await expect.poll(() => header.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)).toBe(0);
  });

  test("it never hides while it holds keyboard focus", async ({ page }) => {
    await page.goto("/rooms/");
    const header = page.locator("header");
    await scrollBy(page, 1500);
    await expect(header).toHaveAttribute("data-hidden", "");
    // Focus arriving brings it back…
    await page.locator(".header-logotype").focus();
    await expect(header).not.toHaveAttribute("data-hidden");
    // …and it stays while focus is inside.
    await scrollBy(page, 900);
    await expect(header).not.toHaveAttribute("data-hidden");
  });
});

test.describe("Header and menu — phone (360px)", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("Menu · the logotype, exactly centred · Book — the logotype there from the start", async ({ page }) => {
    for (const route of ["/", "/rooms/"]) {
      await page.goto(route);
      const logotype = page.locator(".header-logotype");
      await expect(logotype).toHaveCSS("opacity", "1");
      const box = await logotype.boundingBox();
      const header = await page.locator("header").boundingBox();
      const centre = header!.x + header!.width / 2;
      expect(Math.abs(box!.x + box!.width / 2 - centre), route).toBeLessThanOrEqual(1);
      await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
      await expect(page.locator("header").getByRole("link", { name: /^Book/ })).toBeVisible();
    }
  });

  test("the phone bar: Call, WhatsApp and the page's action, in gold on plum", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator(".sticky-bar");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-theme", "deep");
    await expect(bar).toHaveClass(/text-ink/);
    await expect(bar.getByRole("link")).toHaveCount(3);
    await expect(bar.getByRole("link", { name: "Call" })).toHaveAttribute("href", /^tel:\+91/);
    await expect(bar.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\//);
    await expect(bar.getByRole("link", { name: "Enquire" })).toHaveAttribute("href", "#enquire");
    for (const box of await bar.getByRole("link").evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
    )) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const rect = await bar.boundingBox();
    expect(Math.round(rect!.y + rect!.height)).toBe(780);
  });

  test("the menu traps focus, and Escape returns focus to the Menu button", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menu" });
    await menuButton.click();
    const dialog = page.locator("#mobile-menu");
    await expect(dialog).toBeVisible();
    await expect(page.locator("#mobile-menu :focus")).toBeVisible();

    // Chromium's native modal <dialog> rests focus on <body> for one tick
    // between the last item and wrapping back to the first — an inert
    // resting point, not an escape.
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press("Tab");
      const trapped = await page.evaluate(() => {
        const active = document.activeElement;
        return document.getElementById("mobile-menu")?.contains(active) || active === document.body;
      });
      expect(trapped).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("the menu: a plum night, petals unfolding from the centre, numbered links, the ways to reach the hotel", async ({
    page,
  }) => {
    await page.goto("/rooms/");
    await page.getByRole("button", { name: "Menu" }).click();
    const dialog = page.locator("#mobile-menu");
    await expect(dialog).toHaveAttribute("data-theme", "deep");
    await expect(dialog).toHaveClass(/text-ink/);

    // The petals: decorative, behind the links, unfolded once it is open.
    const petals = dialog.locator(".menu-petals");
    await expect(petals).toHaveAttribute("aria-hidden", "true");
    await expect(petals.locator(".menu-petal")).toHaveCount(20);
    await expect
      .poll(() =>
        petals
          .locator(".menu-petal")
          .evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === "1" && getComputedStyle(el).transform === "none")),
      )
      .toBe(true);
    const z = await dialog.evaluate((el) => ({
      petals: Number(getComputedStyle(el.querySelector(".menu-petals")!).zIndex),
      body: Number(getComputedStyle(el.querySelector(".menu-body")!).zIndex),
    }));
    expect(z.body).toBeGreaterThan(z.petals);

    const nav = dialog.getByRole("navigation", { name: "Mobile" });
    await expect(nav.getByRole("link")).toHaveCount(7);
    await expect(nav.locator(".menu-num").first()).toHaveText("I");
    await expect(nav.locator(".menu-num").last()).toHaveText("VII");
    const stay = nav.getByRole("link", { name: "Stay", exact: true });
    await expect(stay).toHaveAttribute("aria-current", "page");
    expect(
      await stay.locator(".menu-label").evaluate((el) => getComputedStyle(el, "::after").maskImage),
    ).toContain("svg");

    await expect(dialog.getByRole("link", { name: /^Book a Stay/ })).toBeVisible();
    await expect(dialog.locator('a[href^="tel:"]')).toBeVisible();
    await expect(dialog.getByRole("link", { name: "WhatsApp us" })).toBeVisible();

    await nav.getByRole("link", { name: "Weddings" }).click();
    await expect(page).toHaveURL(/\/weddings\/$/);
    await expect(dialog).toBeHidden();
  });

  test("the header never hides while the menu is open", async ({ page }) => {
    await page.goto("/rooms/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: "instant" }));
    await page.waitForTimeout(200);
    await expect(page.locator("header")).not.toHaveAttribute("data-hidden");
  });
});

test.describe("Links", () => {
  test("Call link href starts with tel:+91", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    const href = await page.locator('a[href^="tel:"]').first().getAttribute("href");
    expect(href).toMatch(/^tel:\+91/);
  });

  test("WhatsApp link matches wa.me pattern", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    const href = await page.locator('a[href^="https://wa.me/"]').first().getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/91\d{10}\?text=/);
  });
});

/* ──── The footer ──── */

test.describe("Footer", () => {
  const scrollToEnd = (page: Page) =>
    page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  /** Each stem segment's dash offset (1 = not grown, 0 = grown). */
  const stems = (page: Page) =>
    page
      .getByRole("contentinfo")
      .locator(".vine-stem")
      .evaluateAll((els) => els.map((el) => Number.parseFloat(getComputedStyle(el).strokeDashoffset)));
  const leavesOpen = (page: Page) =>
    page
      .getByRole("contentinfo")
      .locator(".vine-leaf")
      .evaluateAll((els) => els.every((el) => getComputedStyle(el).transform === "none"));

  test("plum velvet: the logo on plum, the invitation and the two actions", async ({ page }) => {
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-theme", "deep");
    await expect(footer).toHaveClass(/text-ink/);
    await expect(footer.getByRole("link", { name: /home/ }).locator(".logo-medallion")).toHaveCSS(
      "background-color",
      BRAND_PLUM,
    );
    await expect(
      footer.getByRole("heading", { level: 2, name: "We look forward to welcoming you" }),
    ).toBeAttached();
    const book = footer.getByRole("link", { name: /^Book a Stay/ });
    await expect(book).toHaveAttribute("href", /^https:\/\/wa\.me\/91\d{10}\?text=/);
    await expect(footer.locator(".glow")).toHaveCount(1);
    await expect(footer.getByRole("link", { name: "Send an enquiry" })).toHaveAttribute(
      "href",
      "/contact/#enquire",
    );
    await expect(footer.getByText("Also searched as Hotel Deepali")).toBeAttached();
  });

  test("only real numbers to call, and no unverified or unbuilt destinations", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const tels = await footer
      .locator('a[href^="tel:"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
    expect(tels.length).toBeGreaterThanOrEqual(2);
    for (const tel of tels) expect(tel).toMatch(/^tel:\+91[6-9]\d{9}$/);
    await expect(footer).not.toContainText("00000");
    await expect(footer.getByRole("link", { name: "Facebook" })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: "Privacy Policy" })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: "Send an enquiry" })).toHaveAttribute("href", "#enquire");
  });

  test("every footer link leads to a page (and anchor) that exists", async ({ page }) => {
    await page.goto("/rooms/");
    const hrefs = await page
      .getByRole("contentinfo")
      .locator('a[href^="/"]')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href") ?? ""))]);
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    await expectLinksResolve(page, hrefs);
  });

  test("its vine waits until it arrives, then grows out from the flower, segment by segment", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    const vine = footer.locator(".footer-vine");
    await expect(vine).toHaveAttribute("aria-hidden", "true");
    await expect(footer).not.toHaveAttribute("data-revealed");
    expect((await stems(page)).every((o) => o === 1)).toBe(true);
    expect(await leavesOpen(page)).toBe(false);

    await scrollToEnd(page);
    await expect(footer).toHaveAttribute("data-revealed", "");
    await expect.poll(async () => (await stems(page)).every((o) => o === 0)).toBe(true);
    await expect.poll(() => leavesOpen(page)).toBe(true);
    // Every step is short, and the segments of each side follow one another.
    const timing = await footer.locator(".vine-stem").evaluateAll((els) =>
      els.map((el) => ({
        duration: Number.parseFloat(getComputedStyle(el).transitionDuration) * 1000,
        delay: Number.parseFloat(getComputedStyle(el).transitionDelay) * 1000,
      })),
    );
    expect(timing).toHaveLength(8);
    for (const { duration } of timing) expect(duration).toBeLessThan(400);
    for (const side of [timing.slice(0, 4), timing.slice(4)]) {
      for (let i = 1; i < side.length; i += 1) expect(side[i]!.delay).toBeGreaterThan(side[i - 1]!.delay);
    }
    expect(Math.max(...timing.map((t) => t.delay + t.duration))).toBeLessThanOrEqual(1500);
  });

  test("keyboard focus arriving first grows it at once", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: /^Book a Stay/ }).focus();
    await expect(footer).toHaveAttribute("data-revealed", "instant");
    await expect.poll(async () => (await stems(page)).every((o) => o === 0), { timeout: 600 }).toBe(true);
  });

  test("reduced motion: grown from the start", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/rooms/");
    await expect(page.getByRole("contentinfo")).toHaveAttribute("data-revealed", "instant");
    await expect.poll(async () => (await stems(page)).every((o) => o === 0)).toBe(true);
  });

  test("one flower: the dahlia's right half at the left edge, beside the invitation, never behind text", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/rooms/");
    await scrollToEnd(page);
    const footer = page.getByRole("contentinfo");
    const flower = footer.locator("img.decor");
    await expect(flower).toHaveCount(1);
    await expect(flower).toHaveAttribute("data-decor", "dahlia-right");
    await expect(flower).toHaveAttribute("alt", "");
    await expect(flower).toHaveAttribute("aria-hidden", "true");
    await expect(flower).toBeVisible();
    const box = await flower.boundingBox();
    const foot = await footer.boundingBox();
    expect(Math.round(box!.x)).toBe(Math.round(foot!.x));
    // No text box overlaps it.
    const overlaps = await footer.evaluate((el) => {
      const flowerBox = el.querySelector("img.decor")!.getBoundingClientRect();
      const texts = [...el.querySelectorAll("h2, h3, p, a, li")].map((t) => t.getBoundingClientRect());
      return texts.filter(
        (r) => r.width > 0 && r.left < flowerBox.right && flowerBox.left < r.right && r.top < flowerBox.bottom && flowerBox.top < r.bottom,
      ).length;
    });
    expect(overlaps).toBe(0);

    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/rooms/");
    await expect(page.getByRole("contentinfo").locator("img.decor")).toBeHidden();
  });

  test("nothing in it lengthens or widens the page", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 780 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/dining/");
      await scrollToEnd(page);
      await expect(page.getByRole("contentinfo")).toHaveAttribute("data-revealed", "");
      const metrics = await page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        below:
          Math.round(
            document.documentElement.scrollHeight -
              (document.querySelector("footer")!.getBoundingClientRect().bottom + window.scrollY),
          ) || 0,
      }));
      expect(metrics, `${viewport.width}px`).toEqual({ overflowX: false, below: 0 });
    }
  });

  test("phones: the vine's centre, lines to tap at full size, and the legal line clears the phone bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/contact/");
    await scrollToEnd(page);
    const footer = page.getByRole("contentinfo");
    await expect(footer.locator(".footer-vine svg")).toBeVisible();
    for (const row of await footer.locator(".footer-line").evaluateAll((links) =>
      links.map((a) => a.getBoundingClientRect().toJSON() as DOMRect),
    )) {
      expect(row.height).toBeGreaterThanOrEqual(44);
    }
    const legal = await footer.getByText("Also searched as Hotel Deepali").boundingBox();
    const bar = await page.locator(".sticky-bar").boundingBox();
    expect(legal!.y + legal!.height).toBeLessThanOrEqual(bar!.y);
  });
});

test.describe("Footer without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("its vine is simply there", async ({ page }) => {
    await page.goto("/rooms/");
    const offsets = await page
      .locator("footer .vine-stem")
      .evaluateAll((els) => els.map((el) => Number.parseFloat(getComputedStyle(el).strokeDashoffset)));
    expect(offsets.length).toBeGreaterThan(0);
    expect(offsets.every((o) => o === 0)).toBe(true);
  });
});

test.describe("Accessibility (axe-core)", () => {
  for (const viewport of [
    { width: 360, height: 780, label: "mobile" },
    { width: 1280, height: 800, label: "desktop" },
  ]) {
    for (const path of ["/", "/styleguide/", "/contact/"]) {
      test(`zero serious/critical violations on ${path} at ${viewport.label}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        const seriousOrCritical = results.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        );
        expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
      });
    }
  }
});

test.describe("No horizontal overflow, 360–1920", () => {
  for (const width of [360, 768, 1024, 1280, 1920]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/rooms/", "/weddings/", "/contact/", "/styleguide/"]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, path).toBeLessThanOrEqual(0);
      }
    });
  }
});

test("no console errors on the shell's pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));
  for (const path of ["/", "/rooms/", "/contact/", "/styleguide/"]) {
    await page.goto(path);
    await page.waitForLoadState("load");
  }
  expect(errors).toEqual([]);
});
