import { test as base, expect } from "@playwright/test";

/**
 * Shared test fixture. When DEMO=1 (set by playwright.demo.config.ts), each test pauses
 * for a moment at the end so the video recording captures the final result.
 * Normal runs are unaffected.
 */
export const test = base.extend<{ demoHold: void }>({
  demoHold: [
    async ({ page }, use) => {
      await use();
      if (process.env.DEMO) await page.waitForTimeout(1500);
    },
    { auto: true },
  ],
});

export { expect };
