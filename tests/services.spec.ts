import { test, expect } from "./fixtures";

test.describe("Service tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#services");
  });

  test("web tab is selected by default", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Web apps" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", { name: "Web apps" })).toBeVisible();
  });

  for (const [tab, heading] of [
    ["Mobile apps", "Mobile app testing"],
    ["APIs", "API testing"],
  ]) {
    test(`clicking "${tab}" shows ${heading}`, async ({ page }) => {
      await page.getByRole("tab", { name: tab }).click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
    });
  }

  test("arrow keys move between tabs", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is a desktop check");
    await page.getByRole("tab", { name: "Web apps" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Mobile apps" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Web apps" })).toBeFocused();
  });
});

test("FAQ answers expand and collapse", async ({ page }) => {
  await page.goto("/#faq");
  const question = page.getByText("Can you sign an NDA?");
  const answer = page.getByText("happy to sign your NDA");
  await expect(answer).toBeHidden();
  await question.click();
  await expect(answer).toBeVisible();
  await question.click();
  await expect(answer).toBeHidden();
});
