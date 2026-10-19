import { expect, test, type Page } from "@playwright/test";

// Smooth wheel scrolling (Lenis, src/lib/smooth-scroll.ts): on for a mouse /
// trackpad without reduced motion; native everywhere else.

const DESKTOP = { width: 1280, height: 800 };

/** Records scrollY on every animation frame while `act` runs, plus `settle` ms. */
async function traceScroll(page: Page, act: () => Promise<void>, settle = 1200) {
  await page.evaluate(() => {
    const w = window as Window & { __trace?: Array<[number, number]>; __tracing?: boolean };
    w.__trace = [];
    w.__tracing = true;
    const loop = (t: number) => {
      w.__trace!.push([t, window.scrollY]);
      if (w.__tracing) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  await act();
  await page.waitForTimeout(settle);
  return page.evaluate(() => {
    const w = window as Window & { __trace?: Array<[number, number]>; __tracing?: boolean };
    w.__tracing = false;
    return w.__trace!;
  });
}

function movingSteps(trace: Array<[number, number]>) {
  const steps: number[] = [];
  for (let i = 1; i < trace.length; i++) {
    const step = trace[i]![1] - trace[i - 1]![1];
    if (step !== 0) steps.push(step);
  }
  return steps;
}

async function jumpTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  await page.waitForTimeout(300);
}

test.describe("Smooth scrolling — mouse / trackpad", () => {
  test.use({ viewport: DESKTOP });

  test("a wheel notch glides to the same distance native scrolling would", async ({ page }) => {
    await page.goto("/rooms/");
    await expect(page.locator("html")).toHaveClass(/\blenis\b/);
    await page.mouse.move(640, 400);
    await jumpTo(page, 600);

    const trace = await traceScroll(page, () => page.mouse.wheel(0, 100));
    const steps = movingSteps(trace);
    // Natively: one 100px jump in one frame. Smoothed: many decelerating steps.
    expect(steps.length).toBeGreaterThan(8);
    expect(Math.max(...steps.map(Math.abs))).toBeLessThan(40);
    expect(Math.abs(steps.at(-1)!)).toBeLessThanOrEqual(2);
    // Not slowed down: the notch still travels its full distance.
    expect(trace.at(-1)![1]).toBe(700);
  });

  test("reversing mid-glide moves the page back at once", async ({ page }) => {
    await page.goto("/rooms/");
    await page.mouse.move(640, 400);
    await jumpTo(page, 600);
    await page.evaluate(() => {
      const w = window as Window & { __wheels?: number[] };
      w.__wheels = [];
      addEventListener("wheel", (e) => w.__wheels!.push(e.timeStamp), { capture: true, passive: true });
    });

    const trace = await traceScroll(page, async () => {
      for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 100);
      await page.waitForTimeout(80);
      await page.mouse.wheel(0, -100);
    });
    const reverseAt = await page.evaluate(
      () => (window as Window & { __wheels?: number[] }).__wheels!.at(-1)!,
    );
    const firstUp = trace.findIndex(
      ([t, y], i) => i > 0 && t >= reverseAt && y < trace[i - 1]![1],
    );
    expect(firstUp).toBeGreaterThan(0);
    expect(trace[firstUp]![0] - reverseAt).toBeLessThan(120);
  });

  test("the hero film stays in step with a glide, forward and back", async ({ page }) => {
    await page.goto("/");
    await page.mouse.move(640, 400);
    const film = page.locator(".entrance-film");
    await expect(film).toHaveAttribute("data-captured", "complete", { timeout: 30_000 });

    const geo = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>(".entrance")!;
      const travel = s.offsetHeight - window.innerHeight;
      return { travel, filmEnd: (travel - window.innerHeight) / travel };
    });
    await page.evaluate((g) => {
      const w = window as Window & { __lag?: number[]; __on?: boolean };
      const canvas = document.querySelector<HTMLCanvasElement>(".entrance-film")!;
      w.__lag = [];
      w.__on = true;
      const loop = () => {
        const v = Math.min(1, window.scrollY / g.travel / g.filmEnd);
        w.__lag!.push(Math.abs(Math.round(v * 239) - Number(canvas.dataset.frame)));
        if (w.__on) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }, geo);
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 100);
    await page.waitForTimeout(900);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -100);
    await page.waitForTimeout(900);

    const lag = await page.evaluate(() => {
      const w = window as Window & { __lag?: number[]; __on?: boolean };
      w.__on = false;
      return w.__lag!;
    });
    const inStep = lag.filter((d) => d <= 3).length / lag.length;
    expect(inStep).toBeGreaterThanOrEqual(0.95);
    expect(lag.at(-1)).toBeLessThanOrEqual(1);
  });

  test("the arrival rail lands exactly on its waypoint", async ({ page }) => {
    await page.goto("/");
    const expected = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>(".entrance")!;
      const travel = s.offsetHeight - window.innerHeight;
      return 0.92 * ((travel - window.innerHeight) / travel) * travel;
    });
    await page.getByRole("button", { name: "Jump to the Lobby" }).click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 4_000 })
      .toBeGreaterThan(expected - 2);
    await page.waitForTimeout(300);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - expected)).toBeLessThanOrEqual(2);
    await expect(page.locator(".entrance")).toHaveAttribute("data-stage", "lobby");
  });

  test("hash links glide, honour scroll-margin, and keep the URL and history", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".entrance-actions").getByRole("link", { name: "Enquire now" }).click();
    await expect(page).toHaveURL(/#enquire$/);
    await expect
      .poll(
        () =>
          page.evaluate(() => Math.round(document.getElementById("enquire")!.getBoundingClientRect().top)),
        { timeout: 4_000 },
      )
      .toBe(96); // scroll-mt-24
    await page.goBack();
    await expect(page).not.toHaveURL(/#enquire$/);
  });

  test("the keyboard takes over a glide in progress", async ({ page }) => {
    await page.goto("/rooms/");
    await page.mouse.move(640, 400);
    for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 100);
    await page.keyboard.press("End");
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight - window.scrollY,
        ),
      )
      .toBeLessThanOrEqual(1);
  });

  test("the open menu freezes page scrolling and releases it on close", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/rooms/");
    await page.mouse.move(550, 400);
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.keyboard.press("Escape");
    await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300);
  });
});

test.describe("Smooth scrolling — native fallbacks", () => {
  test("reduced motion keeps native wheel scrolling", async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/rooms/");
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
    await page.mouse.move(640, 400);
    const trace = await traceScroll(page, () => page.mouse.wheel(0, 100), 600);
    expect(movingSteps(trace)).toEqual([100]);
    await context.close();
  });

  test("touch devices keep native touch scrolling", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);

    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 200, y: 700 }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 200, y: 700 - i * 40 }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    // A 480px drag moves the page by the drag, less the touch slop. (Headless
    // Chromium adds no fling; headed Chrome flings this gesture to ~780px.)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(440);
    await context.close();
  });
});
