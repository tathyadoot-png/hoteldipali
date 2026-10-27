import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.describe("Desktop (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("desktop nav is visible, Menu button and sticky bar are hidden", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
    // exact: the enquiry close's lines are named "Call Reservations, …".
    await expect(page.getByRole("link", { name: "Call", exact: true })).toBeHidden();
  });

  // The header is always Emerald; on the home page it stays transparent over
  // the hero and turns solid (emerald stone) when the ivory arch that follows
  // it reaches the top.
  test("home header is transparent over the hero and solid once past it", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.locator("header");

    await expect(header).toHaveAttribute("data-theme", "emerald");
    await expect(header).toHaveAttribute("data-state", "overlay");
    const transparentBg = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(transparentBg).toBe("rgba(0, 0, 0, 0)");

    // Still over the hero: still transparent.
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(header).toHaveAttribute("data-state", "overlay");

    // One-frame jump well past the arch (anchor link, End key, fling): solid.
    await page.evaluate(() => {
      const arch = document.querySelector<HTMLElement>("[data-header-solid-from]");
      if (!arch) throw new Error("missing [data-header-solid-from]");
      window.scrollTo({ top: arch.getBoundingClientRect().top + window.scrollY + 600, behavior: "instant" });
    });
    await expect(header).toHaveAttribute("data-state", "solid");
    await expect
      .poll(async () => header.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe("rgba(0, 0, 0, 0)");

    // One-frame jump back to the top: transparent again.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-state", "overlay");
    await expect(header).toHaveAttribute("data-theme", "emerald");
  });

  test("the logo keystone is centred between the two nav wings", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link")).toHaveCount(6);

    const keystone = await page.locator(".header-keystone").boundingBox();
    const wings = await page.locator(".header-wing").evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
    );
    expect(keystone).not.toBeNull();
    const centre = keystone!.x + keystone!.width / 2;
    expect(Math.abs(centre - 640)).toBeLessThanOrEqual(2);
    // Left wing ends before the keystone; right wing starts after it.
    expect(wings[0]!.right).toBeLessThanOrEqual(keystone!.x);
    expect(wings[1]!.left).toBeGreaterThanOrEqual(keystone!.x + keystone!.width);
    await expect(page.locator(".header-keystone").getByRole("link", { name: /home/ })).toBeVisible();
  });

  test("the logo niche sits inside the header bar, clear of page content", async ({ page }) => {
    for (const route of ["/", "/rooms/"]) {
      await page.goto(route);
      const header = await page.locator("header").boundingBox();
      const niche = await page.locator(".header-keystone").boundingBox();
      expect(header && niche).toBeTruthy();
      expect(niche!.y).toBeGreaterThanOrEqual(header!.y);
      expect(niche!.y + niche!.height).toBeLessThanOrEqual(header!.y + header!.height + 0.5);
    }
  });

  test("the glide marker rests on the current page and follows hover and focus", async ({
    page,
  }) => {
    await page.goto("/rooms/");
    const leftWing = page.locator(".header-wing-l");
    const rightWing = page.locator(".header-wing-r");
    const markerX = (wing: typeof leftWing) =>
      wing.locator(".header-glide").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    const linkX = async (name: string) => {
      const box = await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name }).boundingBox();
      return box!.x + box!.width / 2;
    };

    // /rooms/ is "Stay", in the left wing (Stay, Weddings, Events | Dining,
    // Experiences, Gallery).
    await expect(leftWing).toHaveAttribute("data-glide", "on");
    await expect(rightWing).toHaveAttribute("data-glide", "off");
    await expect.poll(async () => Math.abs((await markerX(leftWing)) - (await linkX("Stay")))).toBeLessThan(2);

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Events" }).hover();
    await expect.poll(async () => Math.abs((await markerX(leftWing)) - (await linkX("Events")))).toBeLessThan(2);

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Gallery" }).focus();
    await expect(rightWing).toHaveAttribute("data-glide", "on");
    await expect.poll(async () => Math.abs((await markerX(rightWing)) - (await linkX("Gallery")))).toBeLessThan(2);
  });

  test("header is solid on a page without an overlay hero", async ({ page }) => {
    await page.goto("/rooms/");
    await expect(page.locator("header")).toHaveAttribute("data-state", "solid");
  });

  test("the primary nav only links to routes and anchors that exist", async ({ page }) => {
    await page.goto("/rooms/");
    const hrefs = await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      const [path, hash] = href.split("#");
      const response = await page.goto(path || "/");
      expect(response?.status(), href).toBe(200);
      if (hash) await expect(page.locator(`#${hash}`), href).toBeAttached();
    }
  });
});

test.describe("Mobile (360px)", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("the logo niche stays inside the header on a phone", async ({ page }) => {
    await page.goto("/");
    const header = await page.locator("header").boundingBox();
    const niche = await page.locator(".header-keystone").boundingBox();
    expect(niche!.y + niche!.height).toBeLessThanOrEqual(header!.y + header!.height + 0.5);
  });

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

  test("the menu opens like gates onto an emerald hall", async ({ page }) => {
    await page.goto("/rooms/");
    await page.getByRole("button", { name: "Menu" }).click();
    const dialog = page.locator("#mobile-menu");
    await expect(dialog).toHaveAttribute("data-theme", "emerald");
    await expect(dialog).toHaveClass(/text-ink/);

    // Both leaves end fully outside the viewport, and never block taps.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const l = document.querySelector(".menu-gate-l")!.getBoundingClientRect();
          const r = document.querySelector(".menu-gate-r")!.getBoundingClientRect();
          return l.right <= 0 && r.left >= window.innerWidth;
        }),
      )
      .toBe(true);
    await expect(page.locator(".menu-gate-l")).toHaveCSS("pointer-events", "none");

    // exact: "Book a Stay" is in the menu too.
    const current = dialog.getByRole("link", { name: "Stay", exact: true });
    await expect(current).toHaveAttribute("aria-current", "page");
    await dialog.getByRole("link", { name: "Weddings" }).click();
    await expect(page).toHaveURL(/\/weddings\/$/);
    await expect(dialog).toBeHidden();
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

/* ──── The footer: the finale (2026-10-27) ──── */

test.describe("Footer — the finale", () => {
  const scrollToEnd = (page: Page) =>
    page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );

  test("an emerald gateway: the emblem, the invitation and the two actions", async ({ page }) => {
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-theme", "emerald");
    await expect(footer).toHaveClass(/text-ink/);
    const gate = footer.locator(".finale-gate");
    await expect(gate.getByRole("link", { name: /home/ })).toBeAttached();
    await expect(
      gate.getByRole("heading", { level: 2, name: "We look forward to welcoming you" }),
    ).toBeAttached();
    // No booking engine is configured: Book a Stay asks for availability on
    // WhatsApp (CLAUDE.md §D), and says so to screen readers.
    const book = gate.getByRole("link", { name: /^Book a Stay/ });
    await expect(book).toHaveAttribute("href", /^https:\/\/wa\.me\/91\d{10}\?text=/);
    await expect(book).toHaveAccessibleName(/check availability on WhatsApp/);
    // /rooms/ has no form of its own, so the enquiry goes to the contact page's.
    await expect(gate.getByRole("link", { name: "Send an enquiry" })).toHaveAttribute(
      "href",
      "/contact/#enquire",
    );
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
    // Social links show only once verified; policies only once their pages exist.
    await expect(footer.getByRole("link", { name: "Facebook" })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: "Privacy Policy" })).toHaveCount(0);
    // On the home page the enquiry is the page's own form.
    await expect(footer.getByRole("link", { name: "Send an enquiry" })).toHaveAttribute(
      "href",
      "#enquire",
    );
  });

  test("every footer link leads to a page (and anchor) that exists", async ({ page }) => {
    await page.goto("/rooms/");
    const hrefs = await page
      .getByRole("contentinfo")
      .locator('a[href^="/"]')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href") ?? ""))]);
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    for (const href of hrefs) {
      const [path, hash] = href.split("#");
      const response = await page.goto(path || "/");
      expect(response?.status(), href).toBe(200);
      if (hash) await expect(page.locator(`#${hash}`), href).toBeAttached();
    }
  });

  test("the sequence plays once it arrives: the gateway drawn, every lamp lit", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    const fire = footer.locator(".lamp-fire");

    // Before it arrives nothing is lit.
    await expect(footer).not.toHaveAttribute("data-revealed");
    expect(await fire.first().evaluate((el) => getComputedStyle(el).opacity)).toBe("0");

    await scrollToEnd(page);
    await expect(footer).toHaveAttribute("data-revealed", "");
    // Four lamps either side from 1024px, all lit; the gateway's line drawn.
    await expect
      .poll(() =>
        fire.evaluateAll((els) =>
          els.filter((el) => el.getClientRects().length > 0).map((el) => getComputedStyle(el).opacity),
        ),
      )
      .toEqual(Array(8).fill("1"));
    await expect
      .poll(() => footer.locator(".finale-gate").evaluate((el) => getComputedStyle(el, "::before").clipPath))
      .toBe("none");
    await expect(footer.locator(".finale-base")).toHaveCSS("opacity", "1");
  });

  test("keyboard focus arriving first shows the whole finale at once", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: /^Book a Stay/ }).focus();
    await expect(footer).toHaveAttribute("data-revealed", "instant");
    // Well inside the sequence's own timing (the actions wait ~1 s): the
    // focused link is never transparent.
    await expect(footer.locator(".finale-actions")).toHaveCSS("opacity", "1", { timeout: 250 });
    await expect(footer.locator(".finale-group").last()).toHaveCSS("opacity", "1", { timeout: 250 });
  });

  test("reduced motion: the finale is complete and still from the start", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/rooms/");
    const footer = page.getByRole("contentinfo");
    const state = await footer.evaluate((el) => {
      const style = (selector: string) => getComputedStyle(el.querySelector(selector)!);
      return {
        fire: style(".lamp-fire").opacity,
        actions: style(".finale-actions").opacity,
        line: style(".finale-line").clipPath,
        gate: style(".finale-gate").translate,
        base: style(".finale-base").opacity,
      };
    });
    expect(state).toEqual({ fire: "1", actions: "1", line: "none", gate: "none", base: "1" });
  });

  test("nothing in the finale lengthens or widens the page", async ({ page }) => {
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
        // `|| 0` turns a rounded -0 into 0.
        below:
          Math.round(
            document.documentElement.scrollHeight -
              (document.querySelector("footer")!.getBoundingClientRect().bottom + window.scrollY),
          ) || 0,
      }));
      expect(metrics, `${viewport.width}px`).toEqual({ overflowX: false, below: 0 });
    }
  });

  test("phones: the gateway fits, a lamp either side, full-width lines to tap", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/contact/");
    await scrollToEnd(page);
    const footer = page.getByRole("contentinfo");
    const gate = await footer.locator(".finale-gate").boundingBox();
    expect(gate!.x).toBeGreaterThanOrEqual(0);
    expect(gate!.x + gate!.width).toBeLessThanOrEqual(360);
    const lamps = await footer
      .locator(".finale-course .lamp")
      .evaluateAll((els) => els.filter((el) => el.getClientRects().length > 0).length);
    expect(lamps).toBe(2);
    const rows = await footer
      .locator(".finale-line-link")
      .evaluateAll((links) => links.map((a) => a.getBoundingClientRect().toJSON() as DOMRect));
    for (const row of rows) {
      expect(row.height).toBeGreaterThanOrEqual(44);
      expect(row.width).toBeGreaterThan(280);
    }
    // The legal line clears the phone sticky bar.
    const base = await footer.locator(".finale-base").boundingBox();
    const bar = await page.locator("div.fixed.inset-x-0.bottom-0").boundingBox();
    expect(base!.y + base!.height).toBeLessThanOrEqual(bar!.y);
  });
});

test.describe("Footer without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the finale is complete: drawn, lit and readable", async ({ page }) => {
    await page.goto("/rooms/");
    const footer = page.locator("footer");
    const state = await footer.evaluate((el) => {
      const style = (selector: string) => getComputedStyle(el.querySelector(selector)!);
      return {
        fire: style(".lamp-fire").opacity,
        lead: style(".finale-lead").opacity,
        line: style(".finale-line").clipPath,
        group: style(".finale-group").opacity,
        base: style(".finale-base").opacity,
      };
    });
    expect(state).toEqual({ fire: "1", lead: "1", line: "none", group: "1", base: "1" });
  });
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
