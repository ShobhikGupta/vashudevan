# VMG Website — Product, Engineering & Growth Standards

> **Vashudevan MetGlobal LLP · Internal working documentation · v1.0 · 08 Oct 2026**
> **Status:** Proposed for business approval. This repository documentation is **not a public website page**.
> **Source baseline:** `main` commit `f580f702e8a116c82d2cf62d9e56c5ee5203d767`. Revalidate against `main` before any later implementation.

## Purpose

One authoritative, reviewed home for the public website's purpose, architecture, user journeys, design rules, data handling, delivery plan and measurable organic growth. This is **not** the private Company Intelligence application and must never merge or deploy its private systems into the public site.

**North star:** turn qualified interest in ferrous and non-ferrous recyclable metals into trustworthy, trackable buyer/supplier/partner enquiries. More impressions alone are not success.

## The six core documents

| Document | Decision owned by | Where |
|---|---|---|
| 01. Product requirements | Business owner | [01-PRD.md](01-PRD.md) |
| 02. Technical requirements | Engineering owner | [02-TECHNICAL-REQUIREMENTS.md](02-TECHNICAL-REQUIREMENTS.md) |
| 03. Site and interaction flow | Product + QA | [03-SITE-FLOW.md](03-SITE-FLOW.md) |
| 04. Design system | Business + design | [04-DESIGN-SYSTEM.md](04-DESIGN-SYSTEM.md) |
| 05. Data flow and privacy | Business + privacy reviewer | [05-DATA-FLOW-AND-PRIVACY.md](05-DATA-FLOW-AND-PRIVACY.md) |
| 06. Implementation plan | Engineering + business | [06-IMPLEMENTATION-PLAN.md](06-IMPLEMENTATION-PLAN.md) |

## Operating and growth standards

- [07-SEO-AND-CONTENT-GROWTH.md](07-SEO-AND-CONTENT-GROWTH.md) — search visibility, editorial trust, traffic and lead measurement.
- [08-ANALYTICS-AND-CONVERSION.md](08-ANALYTICS-AND-CONVERSION.md) — GA4, GSC, funnel events and success metrics.
- [09-SECURITY-AND-PRIVACY-CHECKLIST.md](09-SECURITY-AND-PRIVACY-CHECKLIST.md) — PII, privacy, forms, operational safeguards.
- [10-CONTENT-SOURCE-OF-TRUTH.md](10-CONTENT-SOURCE-OF-TRUTH.md) — what may be claimed or shown publicly.
- [11-QA-RELEASE-CHECKLIST.md](11-QA-RELEASE-CHECKLIST.md) — release gates, browser testing and rollback.
- [12-GROWTH-BACKLOG.md](12-GROWTH-BACKLOG.md) — prioritized proposals, not pre-approved marketing claims.
- [CHANGELOG.md](CHANGELOG.md) — documentation and proposal history.

## What has actually been verified

The public `main` tree contains a static HTML/CSS/JS site, `assets/data/products.json`, enquiry/feedback forms, Google Apps Script wiring, GA4 `G-6CJ7X607D5`, a live brochure link and a Netlify-hosted public site. It has the three historic PDF briefs, but not these six canonical Markdown documents. The site has route variants including `/products`, `/resources`, `/contact` and `/product?slug=...`.

**Verified in code does not mean verified working end-to-end.** Forms, external scripts, analytics goals, legal claims, DNS routing, Google Search Console ownership, rankings and indexed URL counts require production-side verification.

## Change-control contract

1. Review each document and business claim; mark unanswered items **TO CONFIRM**, never guess.
2. Preview every visible change; preserve approved text, imagery, section order and interactions unless its change is separately authorized.
3. Keep public VMG `main`, production deployment, PR #12 and Company Intelligence PR #13 untouched during this review.
4. Preview-only merges require owner sign-off and QA; never put private intelligence credentials/data into a public bundle.
5. Avoid claims such as "best supplier", "guaranteed availability", "certified", "plant/facility", fabricated production capacity or unverified membership.
6. Measure 28-day baseline and 90-day outcomes using Search Console and GA4, not invented visits or SEO guarantees.

**Approval record:** owner approval pending; reviewers to confirm technical and business acceptance in the draft pull request.
