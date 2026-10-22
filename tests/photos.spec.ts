import { expect, test } from "@playwright/test";

// The hotel's photographs are served as optimised WebP sets from
// /images/hotel/ (made by `pnpm make:photos`); the camera originals in
// /hotel/ (8–26 MB each) must never be requested by a page.

const ROUTES = ["/", "/rooms/", "/rooms/garden-deluxe-room/", "/weddings/", "/events/", "/dining/"];

for (const route of ROUTES) {
  test(`${route} uses optimised photographs, never the camera originals`, async ({ page }) => {
    const originals: string[] = [];
    page.on("request", (req) => {
      if (new URL(req.url()).pathname.startsWith("/hotel/")) originals.push(req.url());
    });
    await page.goto(route);
    await page.waitForLoadState("load");
    // Bring every lazy image into play.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    await page.waitForTimeout(300);
    expect(originals).toEqual([]);

    const photos = await page
      .locator('img[src*="/images/hotel/"]')
      .evaluateAll((imgs) => (imgs as HTMLImageElement[]).map((img) => img.srcset.length > 0));
    expect(photos.length).toBeGreaterThan(0);
    // Every photograph offers a responsive width set.
    expect(photos.every(Boolean)).toBe(true);
  });
}
