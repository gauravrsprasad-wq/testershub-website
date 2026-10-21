import { test, expect } from "./fixtures";

test.describe("Home page: Google Play closed testing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("is all about Google Play closed testing", async ({ page }) => {
    await expect(page).toHaveTitle("Google Play Closed Testing: 12 Testers for 14 Days | TestersHub");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Real testers for Google Play's 12-tester rule");
    await expect(page.locator("body")).not.toContainText("$10 for 20 test cases");
  });

  test("every in-page link points to a section that exists", async ({ page }) => {
    const hrefs = await page.locator("a[href^='#']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const href of new Set(hrefs)) {
      await expect(page.locator(href), `missing target for ${href}`).toHaveCount(1);
    }
  });

  test("page never scrolls sideways", async ({ page }) => {
    // Compare with the device's real screen width. Mobile Chrome zooms out to hide
    // overflowing content (making innerWidth grow), so innerWidth alone isn't enough.
    const screenWidth = page.viewportSize()!.width;
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageWidth, "page is wider than the screen").toBeLessThanOrEqual(screenWidth);
  });

  test("the main button scrolls to the request form", async ({ page }) => {
    await page.locator(".gp-hero").getByRole("link", { name: "Start my closed test" }).click();
    await expect(page.locator("#contact-form")).toBeInViewport();
  });

  test("header links jump to their sections", async ({ page, isMobile }) => {
    test.skip(isMobile, "Section links are shown on wider screens");
    for (const [name, id] of [["How it works", "#how-h"], ["Pricing", "#gp-pricing"], ["FAQ", "#gpfaq-h"]]) {
      await page.locator("header").getByRole("link", { name, exact: true }).click();
      await expect(page.locator(id)).toBeInViewport();
    }
  });

  test("does not expose a phone number", async ({ page }) => {
    expect(await page.content()).not.toMatch(/wa\.me|tel:|\+91[\s-]?\d{5}/);
  });

  test("offers only Google Play closed testing", async ({ page }) => {
    await expect(page.getByLabel("Plan").locator("option")).toHaveText([
      "15 testers for 14 days: ₹1,200",
      "12 testers for 14 days: ₹800",
    ]);
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/test pack|free trial|API testing|web application testing/i);
  });
});
