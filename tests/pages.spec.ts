import { test, expect } from "./fixtures";

// Razorpay reviews these pages before approving live payments.
const REQUIRED_PAGES = [
  { path: "/about.html", heading: "About TestersHub" },
  { path: "/contact.html", heading: "Contact us" },
  { path: "/pricing.html", heading: "Pricing" },
  { path: "/terms.html", heading: "Terms and conditions" },
  { path: "/privacy.html", heading: "Privacy policy" },
  { path: "/refund-policy.html", heading: "Cancellation and refund policy" },
  { path: "/pay.html", heading: "Pay an invoice" },
];

test.describe("Payment and policy pages", () => {
  for (const { path, heading } of REQUIRED_PAGES) {
    test(`${path} loads with the right heading`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page).toHaveTitle(/\| TestersHub$/);
    });
  }

  test("home page footer links to every required page", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    for (const { path } of REQUIRED_PAGES) {
      await expect(footer.locator(`a[href="${path.slice(1)}"]`)).toHaveCount(1);
    }
  });

  test("every footer link on the policy pages works", async ({ page, request }) => {
    await page.goto("/terms.html");
    const hrefs = await page.locator("footer a[href$='.html']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const href of hrefs) {
      expect((await request.get("/" + href)).status(), href).toBe(200);
    }
  });

  test("policy pages show when they were last updated", async ({ page }) => {
    for (const path of ["/terms.html", "/privacy.html", "/refund-policy.html"]) {
      await page.goto(path);
      await expect(page.getByText(/Last updated: \d{1,2} \w+ \d{4}/)).toBeVisible();
    }
  });
});

test.describe("Pay page", () => {
  test("without payment links, buttons ask for an invoice by email", async ({ page }) => {
    await page.goto("/pay.html");
    for (const id of ["#pay-razorpay", "#pay-paypal"]) {
      await expect(page.locator(id)).toHaveText("Request an invoice");
      await expect(page.locator(id)).toHaveAttribute("href", /^mailto:gauravprasad@testershub\.in/);
    }
    await expect(page.locator("#status-razorpay")).toContainText("being set up");
  });

  test("with payment links configured, buttons open the payment pages", async ({ page }) => {
    // Simulate the configured version by injecting links into the page.
    await page.route("**/pay.html", async (route) => {
      const response = await route.fetch();
      const body = (await response.text())
        .replace('razorpay: ""', 'razorpay: "https://pages.razorpay.com/example"')
        .replace('paypal: ""', 'paypal: "https://paypal.me/example"');
      await route.fulfill({ response, body });
    });
    await page.goto("/pay.html");
    const razorpay = page.locator("#pay-razorpay");
    await razorpay.scrollIntoViewIfNeeded();
    await expect(razorpay).toBeVisible();
    await expect(razorpay).toHaveText("Pay with Razorpay");
    await expect(razorpay).toHaveAttribute("href", "https://pages.razorpay.com/example");
    await expect(razorpay).toHaveAttribute("target", "_blank");
    await expect(razorpay).toHaveAttribute("rel", "noopener");
    await expect(page.locator("#pay-paypal")).toHaveAttribute("href", "https://paypal.me/example");
  });

  test("warns visitors never to share OTPs or PINs", async ({ page }) => {
    await page.goto("/pay.html");
    await expect(page.getByText("never ask for your card details, UPI PIN or OTP")).toBeVisible();
  });
});

test.describe("Pricing", () => {
  test("home page shows the free trial and the $10 test pack", async ({ page }) => {
    await page.goto("/#pricing");
    const pricing = page.locator("#pricing");
    await expect(pricing.getByRole("heading", { name: "Free trial" })).toBeVisible();
    await expect(pricing.getByText("One free trial per company", { exact: true })).toBeVisible();
    const pack = pricing.locator(".plan", { has: page.getByRole("heading", { name: "Test pack" }) });
    await expect(pack.locator(".price")).toHaveText(/\$10\s+for 20 test cases/);
    await expect(pack.getByText("20 test cases written and run")).toBeVisible();
  });

  test("test pack rules are explained and linked", async ({ page }) => {
    await page.goto("/#pricing");
    await page.getByRole("link", { name: "See how test packs work" }).click();
    await expect(page).toHaveURL(/pricing\.html#packs$/);
    const rules = page.locator("#packs + ul");
    await expect(rules).toContainText("20 test cases");
    await expect(rules).toContainText("25 test cases need 2 packs");
  });

  test("the worked example adds up", async ({ page }) => {
    await page.goto("/pricing.html");
    await expect(page.getByText("3 × $10 =")).toContainText("$30");
  });

  test("every page states the same price", async ({ page }) => {
    for (const path of ["/", "/pricing.html", "/pay.html", "/terms.html", "/refund-policy.html"]) {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      expect(text, `${path} mentions the price`).toMatch(/\$10 for 20 test cases/);
      expect(text, `${path} still mentions an old price`).not.toMatch(/\$10 one-time|\$\d+ per test case/);
      expect(text, `${path} still mentions unlimited testing`).not.toMatch(/unlimited/i);
    }
  });

  test("pricing page has no leftover contact-for-quote pricing", async ({ page }) => {
    await page.goto("/pricing.html");
    await expect(page.getByText("Contact for quote")).toHaveCount(0);
  });
});
