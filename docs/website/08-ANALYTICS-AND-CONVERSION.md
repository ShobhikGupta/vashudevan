# 08 · Analytics, Conversion & Lead Attribution

**Existing source:** `assets/js/config.js` initializes GA4 measurement ID `G-6CJ7X607D5` on public pages and `assets/js/analytics.js` adds events. Live Google account access and conversion configuration: **TO VERIFY**.

## Business measurement
North-star: **qualified, real buyer/supplier/partner enquiries from organic search**. Secondary: product and brochure engagement.

## Suggested events (only after audit; avoid duplicates)
| Event | Trigger | Attributes that are safe |
|---|---|---|
| `view_product_category` | Real category view | `category_slug` from allowlist |
| `select_contact_cta` | Intentional button click | `source_page`, `cta_type` |
| `generate_lead` | Backend confirmed saved enquiry | `lead_type`, `source_page` only |
| `form_error` | Submission rejected | `form_type`, coarse `error_category` |
| `brochure_open` | Actual brochure preview click | `source_page` |
| `brochure_download` | Actual brochure download action | `source_page` |
| `select_whatsapp` | External WhatsApp click | `source_page` |
| `newsletter_signup` | Backend confirmed opt-in | `source_page` |

**Prohibit:** names, phone numbers, email addresses, message bodies, exact shipment identifiers, secret tokens or Google Sheets row IDs in GA4.

## Funnel
Organic landing → product/resource engagement → buyer/supplier CTA → submission start → **verified saved lead** → qualification → VMG follow-up. Reporting by referrer/device/country only when suitable consent/privacy guardrails are applied.

## Dashboard
- GSC: 28-day clicks/impressions/CTR/position, branded versus nonbranded (if connected).
- GA4: engaged sessions, top traffic source/page, confirmed `generate_lead`, conversion rate.
- Operations: real destination lead counts and reply time. Reconcile source vs destination weekly.
- Each metric reports its source and date. Never substitute platform estimates for source-of-truth lead counts.

## QA
Validate page-view deduplication on Home and all public paths, DebugView events on real clicks, form error not counted as conversion, no personal data in payload, and absence of tracking on private Company Intelligence. Benchmark before optimization.
