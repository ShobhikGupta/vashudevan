# 01 · Product Requirements Document (PRD)

**System:** VMG public marketing/trade-enquiry website · **Owner:** VMG business owner · **Status:** Baseline documented / roadmap proposed.

## 1. Product outcome

Help credible international counterparties understand VMG's supported recyclable-metal categories, review the process and company credentials, then submit a qualified buying requirement, material offer or partnership enquiry. The site is a **business-development interface**, not a live commodity exchange or a promise of stock, price or shipment.

### Primary audiences and jobs

| Audience | Job to be done | Required outcome |
|---|---|---|
| Buyer / consumer of scrap | Find applicable material grade and communicate quantity/destination | Qualified enquiry delivered, acknowledged and categorized |
| Supplier / scrap yard | Offer grade/quantity/origin/availability | Structured offer reaches VMG desk |
| Logistics / inspection / partner | Understand cooperation scope | Partnership enquiry with clear route |
| Researching counterparty | Verify who VMG is, material scope, contact, processes and registrations | Trustworthiness without inflated claims |

## 2. Current product inventory from `main`

| Feature | Implementation reference | Acceptance / observation |
|---|---|---|
| Homepage, three hero slides and call-to-actions | `index.html` | CTA has a real destination, mobile remains legible |
| About / Who We Are / Our Impact | `who-we-are.html`, `our-impact.html` | Factual business claims are approved and sourced |
| Products and searchable product families | `products.html`, `product.html`, `assets/data/products.json` | Each valid category route resolves; invalid slug has a helpful fallback |
| Buyer, supplier and partner resources | `resources.html` | Forms and CTA paths lead to the intended enquiry flow |
| Market references | `market-prices/index.html` | Data is labelled indicative; avoid implied live licensed prices |
| Contact form, opening popup, feedback | `contact.html`, `assets/js/main.js`, `assets/js/vmg-feedback.js` | Validation, success and failure are genuine; personal data not leaked |
| FAQ and legal content | `faq.html`, `privacy-policy.html`, `disclaimer.html` | Available from navigation/footer and current |
| Company profile brochure | root PDF link | Open + download work without broken target |
| GA4 events and analytics initialization | `assets/js/config.js`, `assets/js/analytics.js` | Exactly one page view per visit; business conversions auditable |

These are source-code observations, not a claim that every production journey currently passes QA.

## 3. Acceptance criteria (P0)

- Desktop/tablet/mobile navigations have no dead ends, clipping or horizontal overflow.
- Public URLs, canonical pages and metadata are coherent; no private preview indexed.
- A user can reach the right contact path from every core business page.
- A successful enquiry is accepted by a verifiable backend endpoint; failures do not show false success.
- Email/phone/consent validation is server-validated where feasible; submissions are rate limited and protected against abuse.
- Enquiries and feedback follow a documented privacy/data-retention policy.
- No credentials, trade intelligence, customer records or private storage appear in public HTML/JS.
- All descriptions, registrations, memberships, addresses and figures receive business-owner approval.

## 4. Proposed growth features (not yet approved)

1. Permanent, indexable material category landing pages with useful grade/specification context and request CTAs; avoid doorway pages and invented stock.
2. More purposeful Buyer/Supplier landing content with specific enquiry questions and clear status expectations.
3. A focused, source-backed **Trade Knowledge Centre** covering grade identification, inspection, shipping documents, UBC/6063 differences and buyer/supplier checklists. No copied price/news feeds.
4. Trackable, consent-aware enquiry outcomes: buyer/supplier/partner segmentation and spam-filtered leads.
5. Search-friendly FAQ supporting genuine questions; link to relevant product/resource page.
6. Carefully vetted organisation details, consistent NAP/contact information, and genuine memberships only.

## 5. Explicitly out of scope

- Public client logins, market-order placement, live inventory/price promises, payment handling and shipment tracking unless a verified provider integration exists.
- VMG Company Intelligence, Supabase service credentials or business data in the public website.
- Fabricated testimonials, traffic figures, certifications or environmental claims.

## 6. Business approval gates

Approve (a) audiences and feature boundaries; (b) forms and required data; (c) content claims and product taxonomy; (d) success metrics; (e) which backlog features to release. Record date/reviewer in the PR.
