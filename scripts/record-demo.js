const { chromium } = require("@playwright/test");

const BASE = "http://localhost:4173";
const pause = (p, ms = 1200) => p.waitForTimeout(ms);

async function smoothScrollTo(page, selector, offset = -80) {
  await page.evaluate(
    ({ selector, offset }) => {
      const el = document.querySelector(selector);
      const target = el.getBoundingClientRect().top + window.scrollY + offset;
      return new Promise((resolve) => {
        const start = window.scrollY, dist = target - start, steps = 40;
        let i = 0;
        const tick = () => {
          i++;
          window.scrollTo(0, start + (dist * (1 - Math.cos((i / steps) * Math.PI))) / 2);
          i < steps ? requestAnimationFrame(tick) : resolve();
        };
        tick();
      });
    },
    { selector, offset }
  );
}

// Highlight what we're about to click, so viewers can follow along.
async function spotlight(page, locator) {
  await locator.evaluate((el) => {
    el.style.transition = "box-shadow .2s";
    el.style.boxShadow = "0 0 0 4px #FFD84D";
  });
  await pause(page, 600);
  await locator.evaluate((el) => (el.style.boxShadow = ""));
}

async function desktop(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: "/tmp/video-desktop", size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  // Don't send real emails during the demo.
  await page.route("https://api.web3forms.com/submit", (r) => r.fulfill({ json: { success: true } }));

  await page.goto(BASE);
  await pause(page, 2500);

  // Packages and sample report
  await smoothScrollTo(page, "#offers"); await pause(page, 2200);
  await smoothScrollTo(page, "#report"); await pause(page, 2800);

  // Service tabs
  await smoothScrollTo(page, "#services"); await pause(page, 1200);
  for (const name of ["Mobile apps", "APIs", "Web apps"]) {
    const tab = page.getByRole("tab", { name });
    await spotlight(page, tab); await tab.click(); await pause(page, 1600);
  }

  // Process and pricing
  await smoothScrollTo(page, "#process"); await pause(page, 1800);
  await smoothScrollTo(page, "#pricing"); await pause(page, 3000);

  // FAQ
  await smoothScrollTo(page, "#faq"); await pause(page, 800);
  const q = page.getByText("How much does testing cost?");
  await spotlight(page, q); await q.click(); await pause(page, 2400);

  // Contact form: fill and send (the request is intercepted)
  await smoothScrollTo(page, "#contact", -20); await pause(page, 1000);
  await page.getByLabel("Name").pressSequentially("Asha Mehta", { delay: 60 });
  await page.getByLabel("Work email").pressSequentially("asha@example.com", { delay: 45 });
  await page.getByLabel("What would you like?").selectOption("Unlimited testing ($10 one-time)");
  await page.getByLabel("Company", { exact: true }).pressSequentially("Example Pay", { delay: 50 });
  await page.getByLabel("What needs testing?").selectOption("Mobile app (Android / iOS)");
  await page.getByLabel("About your product").pressSequentially("UPI payments app, launching next month.", { delay: 30 });
  await pause(page, 600);
  const send = page.getByRole("button", { name: "Send request" });
  await spotlight(page, send); await send.click(); await pause(page, 2600);

  // Footer and the pay page
  await smoothScrollTo(page, "footer"); await pause(page, 1500);
  const payLink = page.locator("footer").getByRole("link", { name: "Pay an invoice" });
  await spotlight(page, payLink); await payLink.click();
  await pause(page, 3000);
  await page.mouse.wheel(0, 600); await pause(page, 2500);

  // Pricing page with fair use
  await page.goto(BASE + "/pricing.html#fair-use"); await pause(page, 3500);

  await ctx.close();
  return page.video().path();
}

async function mobile(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    recordVideo: { dir: "/tmp/video-mobile", size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  await page.goto(BASE); await pause(page, 2000);
  await page.mouse.wheel(0, 700); await pause(page, 1500);
  await page.evaluate(() => window.scrollTo({ top: 0 })); await pause(page, 800);
  const menu = page.getByRole("button", { name: "Open menu" });
  await spotlight(page, menu); await menu.click(); await pause(page, 1800);
  await page.locator("#nav-links").getByRole("link", { name: "Pricing" }).click(); await pause(page, 3000);
  await page.mouse.wheel(0, 900); await pause(page, 2000);
  await smoothScrollTo(page, "#services"); await pause(page, 800);
  await page.getByRole("tab", { name: "APIs" }).click(); await pause(page, 2000);
  await smoothScrollTo(page, "#contact", -20); await pause(page, 2500);
  await ctx.close();
  return page.video().path();
}

(async () => {
  const browser = await chromium.launch();
  console.log("desktop", await desktop(browser));
  console.log("mobile", await mobile(browser));
  await browser.close();
})();
