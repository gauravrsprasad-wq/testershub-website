import { test, expect } from "./fixtures";

// These tests intercept the Web3Forms request, so no real emails are sent.
const WEB3FORMS = "https://api.web3forms.com/submit";

test.describe("Contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#contact");
  });

  test("free trial is the default request type", async ({ page }) => {
    await expect(page.getByLabel("What would you like?")).toHaveValue("Free trial (one per company)");
  });

  test("shows an error when required fields are empty", async ({ page }) => {
    let requestSent = false;
    await page.route(WEB3FORMS, (route) => {
      requestSent = true;
      return route.abort();
    });
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.locator("#form-status")).toContainText("Please fill in");
    expect(requestSent).toBe(false);
  });

  test("sends the enquiry and shows a success message", async ({ page }) => {
    let payload: Record<string, string> = {};
    await page.route(WEB3FORMS, async (route) => {
      const body = route.request().postData() || "";
      // FormData arrives as multipart; pull out the named fields.
      for (const m of body.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)) payload[m[1]] = m[2];
      await route.fulfill({ json: { success: true, message: "Email sent successfully!" } });
    });

    await page.getByLabel("Name").fill("Asha Test");
    await page.getByLabel("Work email").fill("asha@example.com");
    await page.getByLabel("Company", { exact: true }).fill("Example Ltd");
    await page.getByLabel("What would you like?").selectOption("Test pack ($10 for 20 test cases)");
    await page.getByLabel("What needs testing?").selectOption("API");
    await page.getByLabel("About your product").fill("Payments API, launching next month.");
    await page.getByRole("button", { name: "Send request" }).click();

    await expect(page.locator("#form-status")).toContainText("Request sent");
    expect(payload.access_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(payload.email).toBe("asha@example.com");
    expect(payload.service).toBe("API");
    expect(payload.request_type).toBe("Test pack ($10 for 20 test cases)");
    await expect(page.getByLabel("Name")).toHaveValue("");
  });

  test("shows a helpful message when the form service is down", async ({ page }) => {
    await page.route(WEB3FORMS, (route) => route.fulfill({ status: 500, json: { success: false } }));
    await page.getByLabel("Name").fill("Asha Test");
    await page.getByLabel("Work email").fill("asha@example.com");
    await page.getByLabel("About your product").fill("Web app");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.locator("#form-status")).toContainText("didn\x27t go through");
    await expect(page.getByRole("button", { name: "Send request" })).toBeEnabled();
  });
});
