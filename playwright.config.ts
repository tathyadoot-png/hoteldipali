import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 780 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Reserved test-only domain (RFC 2606) — never a real endpoint. Lets
      // tests/enquiry-form.spec.ts exercise the EnquiryForm's real submit
      // path (actual fetch, actual response handling) via page.route()
      // interception, without needing live form-provider credentials.
      NEXT_PUBLIC_FORM_ENDPOINT: "https://form-endpoint.test/submit",
      NEXT_PUBLIC_FORM_ACCESS_KEY: "test-only-access-key",
    },
  },
});
