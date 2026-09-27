import { test, expect } from "./fixtures";

test.describe("Our work section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#work");
  });

  test("shows the public projects", async ({ page }) => {
    const cards = page.locator("#work .work-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.getByRole("heading")).toHaveText([
      "Playwright UI framework",
      "This website's quality pipeline",
    ]);
  });

  test("each project links to its GitHub repository in a new tab", async ({ page }) => {
    const links = page.locator("#work").getByRole("link", { name: "View code on GitHub" });
    await expect(links).toHaveCount(2);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("href", /^https:\/\/github\.com\/gauravrsprasad-wq\/[\w.-]+$/);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener");
    }
  });

  test("the nav links to the section", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop navigation");
    await page.goto("/");
    await page.locator("#nav-links").getByRole("link", { name: "Our work" }).click();
    await expect(page.locator("#work")).toBeInViewport();
  });
});

// Needs internet access, so it runs in CI (or locally with CHECK_EXTERNAL_LINKS=1).
// It stops a deploy if the site links to a GitHub repository that doesn't exist yet.
test("every GitHub repository we link to is public", async ({ page, request, browserName, isMobile }) => {
  test.skip(!process.env.CI && !process.env.CHECK_EXTERNAL_LINKS, "External link check runs in CI");
  test.skip(browserName !== "chromium" || isMobile, "Checked once, on desktop Chrome");
  await page.goto("/");
  const hrefs = await page
    .locator("a[href^='https://github.com/']")
    .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const response = await request.get(href, { maxRedirects: 3 });
    expect(response.status(), `${href} should be a public repository`).toBe(200);
  }
});
