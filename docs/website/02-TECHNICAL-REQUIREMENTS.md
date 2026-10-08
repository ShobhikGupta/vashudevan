# 02 · Technical Requirements

**System:** public VMG website · **Baseline:** source audit of public `main` · **Status:** Recorded; integrations need live verification.

## Architecture at baseline

```text
Visitor / search crawler
   |
HTTPS vashudevan.com (DNS/CDN details: TO VERIFY)
   |
Public VMG hosting project (Netlify project exquisite-hotteok-531d58)
   |
Static HTML / CSS / vanilla JavaScript + local JSON assets
   |---- brochure PDFs and images
   |---- Google Analytics 4: G-6CJ7X607D5
   |---- enquiry / popup / feedback -> configured Google Apps Script endpoint
   |---- external market-reference widgets/scripts (inspect licenses/fallbacks)
```

There is no general public website application database schema in `main`. Uploaded enquiry data may live in Google Sheets/Apps Script or other external storage: **destination, permissions and retention MUST be confirmed, not assumed**.

## Canonical source paths

- Pages: `index.html`, `who-we-are.html`, `our-impact.html`, `products.html`, `product.html`, `resources.html`, `contact.html`, `faq.html`, `privacy-policy.html`, `disclaimer.html`, `market-prices/index.html`.
- Shared branding: `assets/css/styles.css`, scoped CSS files such as `assets/css/vmg-responsive-polish.css`.
- Product taxonomy: `assets/data/products.json`; runtime products logic in `assets/js/main.js`.
- Integration config and analytics: `assets/js/config.js`, `assets/js/analytics.js`.
- Headers: `_headers`; deploy-preview/production project association must remain separate.
- Historic briefs: three root-level website PDFs; do not replace or claim they are current technical specs.

## Technical non-negotiables

1. Public site may remain static; do **not** add Supabase or a paid CMS solely to satisfy a checklist.
2. Keep `company-intelligence-preview` and private Netlify project isolated. No private APIs, auth cookies or credentials in public site.
3. Use HTTPS everywhere; no secrets in repo/HTML, client config or query strings.
4. Move sensitive form submission logic to appropriately protected endpoints where required. Document what Google Apps Script receives, has access to and stores.
5. Production deploys only from approved public-site branches; every release must have its own preview, review and rollback commit.
6. Standardized 404/failure states, analytics error handling, graceful third-party outages and no false form-success UI.
7. Enforce meaningful performance budgets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at p75 field data, when available; otherwise document lab baseline.
8. Accessibility: keyboard focus, semantic headings, labels, readable contrast, alt text, reduced-motion handling and responsive touch controls.
9. SEO: stable canonical URLs, clean crawlability, intentional sitemap, index/noindex policy, unique titles/descriptions; avoid duplicate category aliases.
10. Third-party scripts and fonts are inventoried, versioned when possible, and reviewed for licensing/privacy impact.

## Open integration questions (owner confirmation required)

- Who owns/has editor access to destination Google Sheets and Apps Script? Which columns/retention/access grants?
- What does the current `fetch(..., {mode:"no-cors"})` submission actually confirm? A request being sent **is not** proof a lead was saved.
- Is the domain currently proxied via Cloudflare or Netlify DNS, and what is the active redirect/canonical policy?
- Which market-data widgets are active, with attribution/licensing and fallback behavior?
- Is GA4 `G-6CJ7X607D5` the final production property, and is Search Console verified?

## Release and ownership

Engineering approves technical architecture, deploy/project routing, browser/QA tests and error handling. Business approves content, claims, data retention and provider costs. Never make billable provider changes silently.
