import { test, expect } from "./fixtures";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the correct title and main heading", async ({ page }) => {
    await expect(page).toHaveTitle(/TestersHub/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Find the bugs before your users do."
    );
  });

  test("every in-page link points to a section that exists", async ({ page }) => {
    const hrefs = await page
      .locator("a[href^=\"#\"]")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
    for (const href of new Set(hrefs)) {
      await expect(page.locator(href), `missing target for ${href}`).toHaveCount(1);
    }
  });

  test("page never scrolls sideways", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("hero call-to-action scrolls to the contact form", async ({ page, isMobile }) => {
    await page.locator(".hero").getByRole("link", { name: "Start your free trial" }).click();
    await expect(page.locator("#contact-form")).toBeInViewport();
  });

  test("does not expose a phone number", async ({ page }) => {
    const html = await page.content();
    expect(html).not.toMatch(/wa\.me|tel:|\+91[\s-]?\d{5}/);
  });
});

test.describe("Mobile menu", () => {
  test("opens, navigates and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only menu");
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Open menu" });
    await menuButton.click();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await page.locator("#nav-links").getByRole("link", { name: "Pricing" }).click();
    await expect(page.locator("#pricing")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
