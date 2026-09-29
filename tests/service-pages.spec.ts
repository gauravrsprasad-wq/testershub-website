import { test, expect } from "./fixtures";

const SERVICES = [
  { key: "web", name: "Web application testing", path: "/web-application-testing.html", nav: "Web testing", option: "Web application" },
  { key: "api", name: "API testing", path: "/api-testing.html", nav: "API testing", option: "API" },
  { key: "mobile", name: "Mobile app testing", path: "/mobile-app-testing.html", nav: "Mobile testing", option: "Mobile app (Android / iOS)" },
];

test.describe("Choosing a service on the home page", () => {
  for (const svc of SERVICES) {
    test(`clicking "${svc.name}" opens its framework page`, async ({ page }) => {
      await page.goto("/#choose");
      await page.locator("#choose").getByRole("link", { name: new RegExp(svc.name) }).click();
      await expect(page).toHaveURL(new RegExp(`${svc.path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(svc.name);
    });

    test(`the "${svc.nav}" menu link opens ${svc.path}`, async ({ page, isMobile }) => {
      await page.goto("/");
      if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator("#nav-links").getByRole("link", { name: svc.nav, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${svc.path}$`));
    });
  }

  test("each service tab links to its framework page", async ({ page }) => {
    await page.goto("/#services");
    for (const [tab, svc] of [["Web apps", SERVICES[0]], ["Mobile apps", SERVICES[2]], ["APIs", SERVICES[1]]] as const) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(page.getByRole("tabpanel").locator(".panel-link")).toHaveAttribute("href", svc.path.slice(1));
    }
  });
});

test.describe("Service framework pages", () => {
  for (const svc of SERVICES) {
    test(`${svc.name} page explains the framework with a code example`, async ({ page }) => {
      await page.goto(svc.path);
      await expect(page.getByRole("heading", { level: 2, name: /testing framework$/ })).toBeVisible();
      await expect(page.locator("#framework + p + .table-wrap tbody tr")).not.toHaveCount(0);
      await expect(page.locator("pre.code code").first()).toContainText(/@Test|test\(/);
      await expect(page.getByText("$10 for 20 test cases")).toBeVisible();
    });

    test(`"Start your free trial" on the ${svc.key} page pre-selects "${svc.option}"`, async ({ page }) => {
      await page.goto(svc.path);
      await page.locator(".lead-actions").getByRole("link", { name: "Start your free trial" }).click();
      await expect(page).toHaveURL(new RegExp(`index\\.html\\?service=${svc.key}#contact-form$`));
      await expect(page.getByLabel("What needs testing?")).toHaveValue(svc.option);
      await expect(page.locator("#contact-form")).toBeInViewport();
    });

    test(`the ${svc.key} page links to the other two services`, async ({ page }) => {
      await page.goto(svc.path);
      const links = page.locator(".svc-links a");
      await expect(links).toHaveCount(2);
      for (const other of SERVICES.filter((s) => s !== svc)) {
        await expect(links.filter({ hasText: other.name })).toHaveAttribute("href", other.path.slice(1));
      }
    });
  }

  test("an unknown ?service value leaves the form on its default", async ({ page }) => {
    await page.goto("/index.html?service=unknown#contact-form");
    await expect(page.getByLabel("What needs testing?")).toHaveValue("Web application");
  });
});
