import { expect, test, type Page } from "@playwright/test";

// The home hero's depth layer (DepthPhoto: raw WebGL, lazy): only on desktop
// rich motion, after load, from the photograph's own depth map; the plain
// photograph whenever WebGL is missing. SwiftShader gives headless Chromium
// WebGL, so the layer is testable (launch options apply to the whole file).

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 780 };
const DEPTH_MAP = "/images/hotel/entrance-night-arch-depth.webp";

/** Requests for the depth map while `page` is open. */
function trackRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (path === DEPTH_MAP) requests.push(path);
  });
  return requests;
}

test.describe("Hero depth — desktop rich motion", () => {
  test.use({ viewport: DESKTOP });

  test("the photograph gains a WebGL depth layer after load, from its depth map", async ({ page }) => {
    const requests = trackRequests(page);
    await page.goto("/");
    const arch = page.locator(".home-hero-art .arch-window");
    await expect(arch).toHaveAttribute("data-depth", "on", { timeout: 8_000 });
    await expect(arch.locator("canvas.depth-canvas")).toHaveCount(1);
    await expect(arch.locator("canvas.depth-canvas")).toHaveCSS("opacity", "1");
    expect(requests).toContain(DEPTH_MAP);
    // The photograph stays underneath (the fallback, and the LCP element).
    await expect(arch.locator("img")).toBeVisible();
  });

  test("if WebGL is unavailable, the plain photograph stays", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    const arch = page.locator(".home-hero-art .arch-window");
    await expect(arch).toHaveAttribute("data-depth", "off", { timeout: 8_000 });
    await expect(arch.locator("canvas")).toHaveCount(0);
    await expect(arch.locator("img")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Hero depth — never off desktop rich motion", () => {
  for (const [label, options] of [
    ["phone", { viewport: PHONE, reducedMotion: "no-preference" as const }],
    ["reduced motion", { viewport: DESKTOP, reducedMotion: "reduce" as const }],
  ] as const) {
    test(`${label}: no depth map, no canvas`, async ({ page }) => {
      await page.setViewportSize(options.viewport);
      await page.emulateMedia({ reducedMotion: options.reducedMotion });
      const requests = trackRequests(page);
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(2_000);
      await expect(page.locator("canvas")).toHaveCount(0);
      expect(requests).not.toContain(DEPTH_MAP);
      await expect(page.locator(".home-hero-art .arch-window")).not.toHaveAttribute("data-depth", /.+/);
    });
  }
});
