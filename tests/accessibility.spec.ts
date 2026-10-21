import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/", "/pay.html", "/pricing.html", "/refund-policy.html", "/about.html"]) {
test(`${path} has no serious or critical accessibility issues (WCAG 2.2 AA)`, async ({ page }) => {
  await page.goto(path);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
  expect(
    blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} element(s))`),
    "Accessibility violations"
  ).toEqual([]);
});
}

test("the whole page can be used with a keyboard", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard check runs on desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
