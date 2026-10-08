# 07 · SEO & Organic Content Growth Standard

**Goal:** increase qualified, discoverable buyer/supplier enquiries from relevant metal categories and markets, without thin pages, spam or misleading claims.

## Baseline findings (repo `main`, 08 Oct 2026)
- Public source has valid page titles/descriptions for 11 major pages, but no hardcoded canonical, OG title or JSON-LD in those page heads.
- No root `robots.txt` / `sitemap.xml` in source baseline.
- `product.html` serves category views via query parameters; category-level SEO needs deliberate canonical and useful unique content, not copy/paste pages.
- Responsive layouts already exist. Accessibility and performance require real device/lab/field validation.
- Search Console live query data **not obtained**: the available GSC Wizard connection returned a subscription blocker. All baseline clicks/rankings therefore UNKNOWN.

## Proposed query clusters — validate with Search Console + buyer language
| Cluster | Example intent | Landing content |
|---|---|---|
| Aluminium scrap grades | 6063 extrusion, 6061, UBC, Tense, Talk/Tabor | Grade definitions/specification, inspection notes, enquiry |
| Copper/brass scrap | copper wire, copper-bearing, brass radiators | Material characteristics and quality checks |
| Ferrous / steel / auto scrap | ferrous, stainless, motors, compressors | Material scope, sourcing process and handling |
| Import/export logistics | scrap shipment documentation, CIF/FOB, inspections | Educational resource with dates and links |
| Counterparty trust | VMG company identity, registration, contact and processes | About/Resources/Contact, factual citations |

Use buyer intent and region-specific detail only where VMG has verifiable business relevance. Avoid unsupportable “top supplier in [country]” copy.

## Technical SEO
1. One preferred HTTPS domain and URL per public page. Set self-canonical only after confirming production redirect behavior.
2. Root robots + accurate sitemap of stable, public, indexable URLs. Exclude tests/demos/backup/private previews.
3. Descriptive unique page titles/metadata, one meaningful H1, useful ALT, clear hierarchy and internal links.
4. Add verified `Organization` JSON-LD once legal name, office, logo URL, social profiles and contact details are reconciled.
5. Use breadcrumbs on genuine nested pages. Do not abuse rich result schemas; FAQ rich results are limited to eligible site classes.
6. Product categories should have unique standalone text/FAQs if indexed. Do not emit hundreds of near-identical query-string URLs.
7. Avoid JavaScript-only essential content when crawlers need it. Render category copy in HTML or verified crawlable strategy.
8. Improve Core Web Vitals by optimizing hero image formats/dimensions, third-party loads, responsive sizing and stable layout.
9. Sitemaps are discovery hints, not ranking guarantees. Metadata changes alone do not promise a traffic uplift.

## Editorial rules
Each content piece must contain original domain expertise, material/grade scope, useful decision points, author/last-reviewed date, source links where factual, and relevant enquiry CTA. No copied LME prices, redistribution without rights, invented industrial scale, “certified”, paid testimonials or generic AI SEO mass pages. Use plain B2B trade terminology, not keyword stuffing.

## Ninety-day content experiment (subject to approval)
- Weeks 1–2: verified product taxonomy and Search Console baseline; fix crawl errors.
- Weeks 3–6: publish three thoroughly checked pillar pages (Aluminium, Copper/Brass, Ferrous/Auto) and 4–6 genuinely useful grade explainers.
- Weeks 7–10: ship import-documentation and inspection/quality FAQs, link to products.
- Weeks 11–13: analyze query impressions, engagement, qualified leads and indexed coverage; refresh winners.

## Measurements (not predictions)
Nonbranded organic clicks, impressions, target-query rankings, qualified organic enquiries, lead-to-reply rate, top landing pages, indexed URL coverage and return interactions. Record zeroes and UNKNOWN honestly; judge impact only after baseline and seasonality.
