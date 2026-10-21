import { defineConfig, devices } from "@playwright/test";

// Run against the local copy by default.
// Set BASE_URL=https://testershub.in to test the live site instead.
const BASE_URL = process.env.BASE_URL || "http://localhost:4173";
const isLocal = BASE_URL.includes("localhost");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-android", use: { ...devices["Pixel 7"] } },
    { name: "mobile-iphone", use: { ...devices["iPhone 14"] } },
  ],
  // Start a local web server automatically when testing locally.
  webServer: isLocal
    ? {
        command: "npm run serve",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});
