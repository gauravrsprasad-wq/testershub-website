import { test, expect } from "./fixtures";

test.describe("SEO basics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has a description, canonical URL and social tags", async ({ page }) => {
    await expect(page.locator("meta[name=description]")).toHaveAttribute("content", /.{70,}/);
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "https://testershub.in/");
    await expect(page.locator("meta[property=\"og:title\"]")).toHaveAttribute("content", /TestersHub/);
  });

  test("structured data is valid JSON", async ({ page }) => {
    const blocks = await page.locator("script[type=\"application/ld+json\"]").allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    const types = blocks.map((b) => JSON.parse(b)["@type"]);
    expect(types).toEqual(expect.arrayContaining(["ProfessionalService", "FAQPage"]));
  });

  test("there is exactly one h1", async ({ page }) => {
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("robots.txt and sitemap.xml are published", async ({ request }) => {
    expect((await request.get("/robots.txt")).ok()).toBeTruthy();
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("https://testershub.in/");
    expect(await sitemap.text()).toContain("https://testershub.in/refund-policy.html");
  });
});
