import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import siteData from "../content/site.json" with { type: "json" };

// The lines a visitor can use: sample placeholder numbers never show.
const publicLines = siteData.contacts.filter((contact) => contact.phone.status !== "sample");

test.describe("Contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact/");
  });

  test("has the page title, one H1 and a way back home", async ({ page }) => {
    await expect(page).toHaveTitle("Contact | Hotel Dipali, Sagar");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Contact Hotel Dipali");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("href", "/");
  });

  test("the front desk lists every line a visitor can use, and only those", async ({ page }) => {
    const desk = page.locator(".contact-desk");
    expect(publicLines.length).toBeGreaterThanOrEqual(2);
    for (const line of publicLines) {
      const call = desk.getByRole("link", { name: `Call ${line.label}, ${line.phone.value}` });
      await expect(call).toHaveAttribute("href", `tel:${line.phone.value.replace(/\s+/g, "")}`);
    }
    await expect(desk).not.toContainText("00000");
    await expect(desk.getByRole("link", { name: "WhatsApp us" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/91\d{10}\?text=/,
    );
    await expect(desk).toContainText(siteData.locationLine.value);
    await expect(desk.getByRole("link", { name: /Get directions/ })).toHaveAttribute(
      "href",
      siteData.mapsUrl.value,
    );
  });

  test("the enquiry form is on the page, with every choice", async ({ page }) => {
    const section = page.locator("#enquire");
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(
      "Tell us what you are planning",
    );
    const form = section.locator("form");
    await expect(form).toBeVisible();
    await expect(form.getByRole("radio")).toHaveCount(6);
    await expect(form.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
    // The tablet is an Emerald scope and re-declares its text colour.
    await expect(section.locator(".enquiry")).toHaveAttribute("data-theme", "emerald");
    await expect(section.locator(".enquiry")).toHaveClass(/text-ink/);
  });

  test("the Enquire actions here stay on this page", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.reload();
    const bar = page.locator("div.fixed.inset-x-0.bottom-0");
    await expect(bar.getByRole("link", { name: "Enquire" })).toHaveAttribute("href", "#enquire");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Send an enquiry" }),
    ).toHaveAttribute("href", "#enquire");
  });

  test("the rooms page's enquiry now lands on this form", async ({ page }) => {
    await page.goto("/rooms/");
    await page.getByRole("link", { name: "Make an enquiry" }).click();
    await expect(page).toHaveURL(/\/contact\/#enquire$/);
    await expect(page.locator("#enquire form")).toBeVisible();
  });

  test("no horizontal overflow at any breakpoint", async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px`).toBe(false);
    }
  });

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.reload();
    expect(errors).toEqual([]);
  });

  for (const viewport of [
    { width: 360, height: 780, label: "mobile" },
    { width: 1280, height: 800, label: "desktop" },
  ]) {
    test(`passes axe-core at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.reload();
      const results = await new AxeBuilder({ page })
        .exclude("[data-reveal]:not([data-revealed])") // pending reveal
        .analyze();
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
    });
  }
});
