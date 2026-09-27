import { test, expect } from "./fixtures";

test.describe("How we work", () => {
  test("shows the six steps in order", async ({ page }) => {
    await page.goto("/#process");
    await expect(page.locator("#process .steps > li h3")).toHaveText([
      "Share", "Plan", "Test", "Report", "Retest", /^Automate/,
    ]);
    await expect(page.locator("#process .opt")).toHaveText("optional");
  });
});

test.describe("Test depth plans", () => {
  test("offers smoke, feature, regression and full regression", async ({ page }) => {
    await page.goto("/#depth");
    await expect(page.locator("#depth .depth-card h3")).toHaveText([
      "Smoke", "Feature", "Regression", "Full regression",
    ]);
  });

  test("each plan's price matches $10 per pack of 20 test cases", async ({ page }) => {
    await page.goto("/#depth");
    for (const card of await page.locator("#depth .depth-card").all()) {
      const size = await card.locator("dt:text-is('Typical size') + dd").innerText();
      const price = await card.locator("dt:text-is('Price') + dd").innerText();
      const cases = size.match(/\d+/g)!.map(Number);
      const dollars = price.match(/\$(\d+)/g)!.map((d) => Number(d.slice(1)));
      // The smallest price must cover the smallest size, in whole packs of 20.
      const packsForMin = Math.max(1, Math.ceil(cases[0] / 20));
      expect(dollars[0], `${size} → ${price}`).toBe(packsForMin * 10);
      // If a range is given, the largest price must cover the largest size.
      if (cases.length > 1 && dollars.length > 1) {
        expect(dollars[1], `${size} → ${price}`).toBe(Math.ceil(cases[1] / 20) * 10);
      }
    }
  });
});

test.describe("Release readiness report", () => {
  test("the numbers add up", async ({ page }) => {
    await page.goto("/#readiness");
    const stat = async (name: string) =>
      Number(await page.locator(`#readiness .ready-stats dt:text-is('${name}') + dd`).innerText());
    const total = await stat("Test cases");
    const passed = await stat("Passed");
    const failed = await stat("Failed");
    const blocked = await stat("Blocked");
    expect(passed + failed + blocked).toBe(total);

    const bugs = (await page.locator("#readiness .bug-counts li").allInnerTexts())
      .map((t) => Number(t.match(/\d+/)![0]))
      .reduce((a, b) => a + b, 0);
    expect(bugs, "each failed test case should have one open bug").toBe(failed);
  });

  test("gives a clear recommendation", async ({ page }) => {
    await page.goto("/#readiness");
    await expect(page.locator("#readiness .verdict")).toHaveText(/^(Go|Hold)$/);
    await expect(page.locator("#readiness .ready-rec")).toContainText("Recommendation:");
  });
});

test("tools are grouped by category", async ({ page }) => {
  await page.goto("/#tools");
  const groups = await page.locator("#tools .tools-grid h3").allInnerTexts();
  expect(groups).toEqual(expect.arrayContaining([
    "Test automation", "CI/CD pipelines", "Bug tracking and projects", "Team chat and reports",
  ]));
});
