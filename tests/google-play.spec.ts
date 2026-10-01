import { test, expect } from "./fixtures";

test.describe("Closed testing content on the home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("links to Google's official rule", async ({ page }) => {
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

  test("the checker's button goes to the request form", async ({ page }) => {
    await page.getByLabel("Personal account").check();
    await page.getByLabel("On or after 13 November 2023").check();
    await page.locator("#gp-result").getByRole("link", { name: "Start my closed test" }).click();
    await expect(page.locator("#contact-form")).toBeInViewport();
  });

  test("offers 12 testers for ₹800 and 15 testers for ₹1,200", async ({ page }) => {
    const plans = page.locator(".gp-plan");
    await expect(plans).toHaveCount(2);
    await expect(plans.nth(0).getByRole("heading")).toHaveText("12 testers");
    await expect(plans.nth(0).locator(".price")).toContainText("₹800");
    await expect(plans.nth(1).getByRole("heading")).toHaveText("15 testers");
    await expect(plans.nth(1).locator(".price")).toContainText("₹1,200");
    await expect(plans.nth(1)).toContainText("Recommended");
    await expect(plans.nth(0).locator(".plan-note")).toContainText("at no extra cost");
    await expect(page.locator(".gp-promise")).toContainText("another 14-day closed test for free");
  });

  test("the timeline covers the full 14 days", async ({ page }) => {
    await expect(page.locator(".gp-timeline .when")).toHaveText(["Day 0", "Days 1 to 2", "Days 2 to 16", "Weekly", "Day 16", "After"]);
  });

  test("the get-started bar stays on screen while scrolling", async ({ page }) => {
    await page.locator("#gpfaq-h").scrollIntoViewIfNeeded();
    await expect(page.locator(".gp-bar").getByRole("link", { name: "Start my closed test" })).toBeInViewport();
  });

  test("the get-started bar hides while the request form is on screen", async ({ page }) => {
    await page.locator("#contact-form").scrollIntoViewIfNeeded();
    await expect(page.locator(".gp-bar")).toBeHidden();
    await page.locator("#how-h").scrollIntoViewIfNeeded();
    await expect(page.locator(".gp-bar")).toBeVisible();
  });

  test("never promises that Google will approve the app", async ({ page }) => {
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toMatch(/guaranteed approval|approval guaranteed|100% approval|guarantee approval/);
  });

  test("pricing and refund pages cover closed testing", async ({ page }) => {
    await page.goto("/pricing.html");
    await expect(page.getByRole("row", { name: /^12 testers/ })).toContainText("₹800");
    await expect(page.getByRole("row", { name: /^15 testers/ })).toContainText("₹1,200");
    await page.goto("/refund-policy.html");
    await expect(page.getByRole("heading", { name: "Google Play closed testing" })).toBeVisible();
  });
});
