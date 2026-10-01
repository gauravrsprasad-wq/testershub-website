import { test, expect } from "./fixtures";

// These tests intercept the Web3Forms request, so no real emails are sent.
const WEB3FORMS = "https://api.web3forms.com/submit";

function capture(page: import("@playwright/test").Page) {
  const payload: Record<string, string> = {};
  return {
    payload,
    ready: page.route(WEB3FORMS, async (route) => {
      const body = route.request().postData() || "";
      for (const m of body.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)) payload[m[1]] = m[2];
      await route.fulfill({ json: { success: true } });
    }),
  };
}

test.describe("Closed testing request form", () => {
  test("defaults to the recommended 15-tester plan", async ({ page }) => {
    await page.goto("/#contact-form");
    await expect(page.getByLabel("Plan")).toHaveValue("15 testers for 14 days: ₹1,200");
  });

  test("the 12-tester plan button pre-selects that plan", async ({ page }) => {
    await page.goto("/#gp-pricing");
    await page.getByRole("link", { name: "Choose 12 testers" }).click();
    await expect(page).toHaveURL(/\?plan=12#contact-form$/);
    await expect(page.getByLabel("Plan")).toHaveValue("12 testers for 14 days: ₹800");
    await expect(page.locator("#contact-form")).toBeInViewport();
  });

  test("the 15-tester plan button pre-selects that plan", async ({ page }) => {
    await page.goto("/#gp-pricing");
    await page.getByRole("link", { name: "Choose 15 testers" }).click();
    await expect(page.getByLabel("Plan")).toHaveValue("15 testers for 14 days: ₹1,200");
  });

  test("shows an error when required fields are empty", async ({ page }) => {
    let sent = false;
    await page.route(WEB3FORMS, (r) => { sent = true; return r.abort(); });
    await page.goto("/#contact-form");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.locator("#form-status")).toContainText("Please fill in");
    expect(sent).toBe(false);
  });

  test("sends the request with the app details", async ({ page }) => {
    const c = capture(page);
    await c.ready;
    await page.goto("/?plan=12#contact-form");
    await page.getByLabel("Name", { exact: true }).fill("Asha Test");
    await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
    await page.getByLabel("App name").fill("Budget Buddy");
    await page.getByLabel("Preferred start date").fill("2026-11-02");
    await page.getByLabel("Play Store or app link").fill("https://play.google.com/store/apps/details?id=com.example.budget");
    await page.getByRole("button", { name: "Send request" }).click();

    await expect(page.locator("#form-status")).toContainText("Request sent");
    expect(c.payload.access_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.payload.email).toBe("asha@example.com");
    expect(c.payload.request_type).toBe("12 testers for 14 days: ₹800");
    expect(c.payload.app_name).toBe("Budget Buddy");
    expect(c.payload.start_date).toBe("2026-11-02");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
  });

  test("tells the visitor what to do when the form service is down", async ({ page }) => {
    await page.route(WEB3FORMS, (r) => r.fulfill({ status: 500, json: { success: false } }));
    await page.goto("/#contact-form");
    await page.getByLabel("Name", { exact: true }).fill("Asha Test");
    await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
    await page.getByLabel("App name").fill("Budget Buddy");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.locator("#form-status")).toContainText("didn't go through");
    await expect(page.getByRole("button", { name: "Send request" })).toBeEnabled();
  });
});
