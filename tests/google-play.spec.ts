import { test, expect } from "./fixtures";

const PAGE = "/google-play-closed-testing.html";

test.describe("Google Play closed testing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  test("explains the offer and links to Google's official rule", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Real testers for Google Play's 12-tester rule");
    await expect(page.getByRole("link", { name: /App testing requirements for new personal developer accounts/ }))
      .toHaveAttribute("href", "https://support.google.com/googleplay/android-developer/answer/14151465");
  });

  const cases = [
    { type: "Personal account", when: "On or after 13 November 2023", verdict: "The rule applies to you", cta: true },
    { type: "Personal account", when: "Before 13 November 2023", verdict: "You are exempt", cta: false },
    { type: "Personal account", when: "I'm not sure", verdict: "Check your Play Console", cta: true },
    { type: "Organization account", when: null, verdict: "You are exempt", cta: false },
  ];
  for (const c of cases) {
    test(`checker: ${c.type}${c.when ? `, ${c.when}` : ""} → ${c.verdict}`, async ({ page }) => {
      await page.getByLabel(c.type).check();
      if (c.when) await page.getByLabel(c.when).check();
      else await expect(page.getByRole("group", { name: "When did you create it?" })).toBeHidden();
      const result = page.locator("#gp-result");
      await expect(result.getByRole("heading")).toHaveText(c.verdict);
      await expect(result.getByRole("link", { name: "Start my closed test" })).toHaveCount(c.cta ? 1 : 0);
    });
  }

  test("the second question only appears for personal accounts", async ({ page }) => {
    await expect(page.getByRole("group", { name: "When did you create it?" })).toBeHidden();
    await page.getByLabel("Personal account").check();
    await expect(page.getByRole("group", { name: "When did you create it?" })).toBeVisible();
    await page.getByLabel("Organization account").check();
    await expect(page.getByRole("group", { name: "When did you create it?" })).toBeHidden();
  });

  test("shows both plans and the retest promise", async ({ page }) => {
    const plans = page.locator(".gp-plan");
    await expect(plans).toHaveCount(2);
    await expect(plans.nth(0).locator(".price")).toContainText("$19");
    await expect(plans.nth(1).locator(".price")).toContainText("$39");
    await expect(page.locator(".gp-promise")).toContainText("another 14-day closed test for free");
  });

  test("the timeline covers the full 14 days", async ({ page }) => {
    await expect(page.locator(".gp-timeline .when")).toHaveText(["Day 0", "Days 1 to 2", "Days 2 to 16", "Weekly", "Day 16", "After"]);
  });

  test("Start my closed test opens the form with closed testing selected", async ({ page }) => {
    await page.locator(".gp-hero").getByRole("link", { name: "Start my closed test" }).click();
    await expect(page).toHaveURL(/index\.html\?service=play#contact-form$/);
    await expect(page.getByLabel("What needs testing?")).toHaveValue("Google Play closed testing (12+ testers)");
    await expect(page.getByLabel("What would you like?")).toHaveValue("Google Play closed testing");
    await expect(page.locator("#contact-form")).toBeInViewport();
  });

  test("the get-started bar stays on screen while scrolling", async ({ page }) => {
    await page.locator("#gpfaq-h").scrollIntoViewIfNeeded();
    await expect(page.locator(".gp-bar").getByRole("link", { name: "Start my closed test" })).toBeInViewport();
  });

  test("never promises that Google will approve the app", async ({ page }) => {
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toMatch(/guaranteed approval|approval guaranteed|100% approval|guarantee approval/);
  });
});

test.describe("Linked from the rest of the site", () => {
  test("home page offers it as a fourth service", async ({ page }) => {
    await page.goto("/#choose");
    await expect(page.locator("#choose .choose-card")).toHaveCount(4);
    await page.locator("#choose").getByRole("link", { name: /Google Play closed testing/ }).click();
    await expect(page).toHaveURL(/google-play-closed-testing\.html$/);
  });

  test("menu link opens the page", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#nav-links").getByRole("link", { name: "Play Store testing" }).click();
    await expect(page).toHaveURL(/google-play-closed-testing\.html$/);
  });

  test("pricing and refund pages cover it", async ({ page }) => {
    await page.goto("/pricing.html");
    await expect(page.getByRole("row", { name: /Google Play closed testing/ })).toContainText("$19");
    await page.goto("/refund-policy.html");
    await expect(page.getByRole("heading", { name: "Google Play closed testing" })).toBeVisible();
  });
});
