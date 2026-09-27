import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

process.env.DEMO = "1";

// Records a watchable demo: Chromium only, one test at a time, slowed down, video of every test.
export default defineConfig({
  ...base,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "demo-results/results.json" }]],
  outputDir: "demo-results/videos",
  use: {
    ...base.use,
    video: { mode: "on", size: { width: 1280, height: 720 } },
    launchOptions: { slowMo: 350 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } } }],
});
