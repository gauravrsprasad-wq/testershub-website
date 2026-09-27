import { test, expect } from "./fixtures";

test.describe("Selectable tools", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#tools");
  });

  test("nothing is selected at first, and the buttons are disabled", async ({ page }) => {
    await expect(page.locator("#tool-summary")).toHaveText("No tools selected yet.");
    await expect(page.getByRole("button", { name: "Request testing with these tools" })).toBeDisabled();
    await expect(page.locator("#tools .chip-btn[aria-pressed='true']")).toHaveCount(0);
  });

  test("selecting tools highlights them and lists them", async ({ page }) => {
    await page.getByRole("button", { name: "Playwright", exact: true }).click();
    await page.getByRole("button", { name: "Jira", exact: true }).click();

    await expect(page.getByRole("button", { name: "Playwright", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#tool-summary")).toHaveText("Selected (2): Playwright, Jira");
    await expect(page.getByRole("button", { name: "Request testing with these tools" })).toBeEnabled();
  });

  test("clicking a selected tool again removes it", async ({ page }) => {
    const postman = page.getByRole("button", { name: "Postman", exact: true });
    await postman.click();
    await postman.click();
    await expect(postman).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#tool-summary")).toHaveText("No tools selected yet.");
  });

  test("Clear removes every selection", async ({ page }) => {
    await page.getByRole("button", { name: "Selenium", exact: true }).click();
    await page.getByRole("button", { name: "Slack", exact: true }).click();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.locator("#tools .chip-btn[aria-pressed='true']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  test("tools can be selected with the keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard check runs on desktop");
    await page.getByRole("button", { name: "Cypress", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Cypress", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("requesting testing fills the contact form and sends the tools", async ({ page }) => {
    let payload: Record<string, string> = {};
    await page.route("https://api.web3forms.com/submit", async (route) => {
      const body = route.request().postData() || "";
      for (const m of body.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)) payload[m[1]] = m[2];
      await route.fulfill({ json: { success: true } });
    });

    for (const tool of ["Playwright", "Postman", "GitHub Actions"]) {
      await page.getByRole("button", { name: tool, exact: true }).click();
    }
    await page.getByRole("button", { name: "Request testing with these tools" }).click();

    await expect(page.locator("#contact-form")).toBeInViewport();
    await expect(page.getByLabel("Tools you use")).toHaveValue("Playwright, Postman, GitHub Actions");
    await expect(page.getByLabel("Name")).toBeFocused();

    await page.getByLabel("Name").fill("Asha Test");
    await page.getByLabel("Work email").fill("asha@example.com");
    await page.getByLabel("About your product").fill("Web app");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.locator("#form-status")).toContainText("Request sent");
    expect(payload.tools).toBe("Playwright, Postman, GitHub Actions");
  });
});
