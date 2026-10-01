# TestersHub website

The website for [testershub.in](https://testershub.in), with a full quality pipeline: every change is tested before it goes live.

| Tool | What it checks |
|---|---|
| **Playwright** | Navigation, service tabs, FAQ, mobile menu and the contact form, on desktop Chrome, an Android phone (Pixel 7) and an iPhone 14 |
| **axe-core** | Accessibility against WCAG 2.2 AA |
| **Lighthouse CI** | Performance, accessibility, best practices and SEO scores |
| **Postman + Newman** | The live site's HTTP behaviour: HTTPS and www redirects, security headers, robots.txt, sitemap, 404 handling and response time |
| **GitHub Actions** | Runs everything on each push, deploys to Netlify only if all checks pass, then checks the live site with Postman. Repeats the live checks every morning |

## Project structure

```
site/                    The website (this is what gets deployed)
  index.html             Home page: Google Play closed testing (12 testers ₹800, 15 testers ₹1,200)
  _redirects             Sends old page addresses to the home page
  pay.html               Pay an invoice (Razorpay and PayPal)
  pricing.html, about.html, contact.html,
  terms.html, privacy.html, refund-policy.html
                         Pages payment gateways require before approval
  assets/pages.css       Styles for the inner pages
  _headers               Security headers Netlify adds to every page
tests/                   Playwright tests
  home.spec.ts           Home page (Google Play closed testing): headline, links, layout, no phone number
  google-play.spec.ts    Eligibility checker, ₹800 / ₹1,200 plans, timeline, bottom bar, no approval promises
  contact.spec.ts        Request form: plan pre-selection, validation, sending, service-down message
  pages.spec.ts          Payment and policy pages, pricing page, footer links, consistent prices
  accessibility.spec.ts  axe WCAG 2.2 AA scans and keyboard access
  seo.spec.ts            Meta tags, structured data, robots.txt, sitemap
playwright.config.ts     Browsers, devices and local web server
lighthouserc.json        Lighthouse score thresholds
netlify.toml             Netlify settings
.github/workflows/       CI/CD pipeline
```

The contact form tests intercept the Web3Forms request, so running them never sends you real emails.

## Run the tests on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npx playwright install      # downloads the browsers (first time only)

npm test                    # run all tests against a local copy of the site
npm run test:ui             # open Playwright's visual test runner
npm run report              # open the HTML report from the last run
npm run test:prod           # run the tests against the live testershub.in
npm run lighthouse          # run the Lighthouse audit
npm run test:api            # run the Postman checks against the live site
                            # (HTML report is saved to newman/report.html)
```

To preview the site locally, run `npm run serve` and open http://localhost:4173.

## Payments

`site/pay.html` works right away: until payment links are added, its buttons ask visitors to email for an invoice.

To switch on online payments, open `site/pay.html`, find `PAYMENT_LINKS` near the bottom, and paste your links:

```js
const PAYMENT_LINKS = {
  razorpay: "https://pages.razorpay.com/your-page",
  paypal: "https://paypal.me/your-name"
};
```

Then run `npm test` and push. The buttons change to "Pay with Razorpay" and "Pay with PayPal" automatically.

## Postman live site checks

The collection in `postman/` makes 13 requests with 57 checks:

| Request | Checks |
|---|---|
| Home page | Status 200, HTML, response time under 1.5 s, title, canonical URL, contact form connected, no phone number, 3 security headers |
| HTTP to HTTPS redirect | `http://testershub.in` permanently redirects to `https://testershub.in` |
| www redirect | `www.testershub.in` permanently redirects to `testershub.in` |
| robots.txt | Status 200, plain text, allows search engines, points to the sitemap |
| sitemap.xml | Status 200, XML, lists the home page |
| Missing page | Unknown URLs return 404, not 200 |
| Payment gateway pages (7) | About, Contact, Pricing, Terms, Privacy, Refunds and Pay pages load quickly, with the right heading and contact email |

**Using it in the Postman app:** click **Import**, select both files in `postman/` (`testershub-live.postman_collection.json` and `production.postman_environment.json`), choose the **TestersHub production** environment at the top right, then open the collection and click **Run**.

`local.postman_environment.json` points at `http://localhost:4173` for checking the collection while you edit it. Locally, the redirect and security header checks will fail, because only Netlify adds those.

The response-time limit is the `maxResponseMs` collection variable (1500 ms). Change it there if needed.

## Set up automatic testing and deployment

### 1. Push this project to GitHub

Create a new repository called `testershub-website`, then from this folder:

```bash
git init
git add .
git commit -m "TestersHub website with Playwright quality pipeline"
git branch -M main
git remote add origin https://github.com/<your-username>/testershub-website.git
git push -u origin main
```

### 2. Give GitHub permission to deploy to Netlify

1. **Netlify token:** In Netlify, click your avatar, then **User settings → Applications → Personal access tokens → New access token**. Name it `github-actions` and copy it.
2. **Site ID:** In your Netlify project, go to **Project configuration → Project information** and copy the **Project ID**.
3. In your GitHub repository, go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `NETLIFY_AUTH_TOKEN`: the token from step 1
   - `NETLIFY_SITE_ID`: the Project ID from step 2

### 3. That's it

From now on:

- **Every push to `main`** runs all tests and the Lighthouse audit. If they all pass, the site deploys to testershub.in automatically. If anything fails, nothing is deployed, and your live site stays safe.
- **Pull requests** run the tests without deploying, so you can check changes first.
- **After every deploy**, Postman checks the live site to confirm the release worked.
- **Every day at 9:00 AM IST** the Playwright and Postman tests run against the live site, and GitHub emails you if something breaks.
- Reports are saved under each run's **Summary → Artifacts**: `playwright-report` and `postman-report`.

Keep deploying through GitHub only. Don't also drag files into Netlify, or the two copies will get out of sync.

## Making changes

1. Edit `site/index.html`.
2. Run `npm test` to check nothing broke.
3. Commit and push. GitHub tests and deploys it for you.
