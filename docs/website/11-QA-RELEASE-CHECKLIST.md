# 11 · Quality Assurance & Release Checklist

## Exact source and environment
Document PR/base SHA, deploy ID, URL, timestamp, device/browser matrix and reviewer. Never infer success from a green CI badge alone.

## Functional
- [ ] Global navigation and mobile menu, submenus, footer; broken link crawl across public URLs.
- [ ] Search categories, empty results, invalid product slug, cards and all CTAs.
- [ ] Contact, popup, feedback and subscription: real end-to-end acknowledgement, invalid/slow/duplicate submit and spam behavior.
- [ ] Brochure preview/download; external social/WhatsApp/phone/mail links.
- [ ] Track Shipment: provider integration or honest unavailable/fallback.
- [ ] Market widget: licensing, data recency labels and failure state.

## Search discoverability
- [ ] Robots/sitemap reachable on **canonical production host**, consistent indexable URLs and lastmod policy.
- [ ] 200 status for indexable paths; redirects intentional; canonical points to preferred URL, not preview.
- [ ] No test/backup/private pages in sitemap; private intelligence separately protected.
- [ ] Unique titles/descriptions; heading hierarchy, meaningful internal links and images/ALT.
- [ ] Verify GSC property and sitemap acceptance; indexed results not guaranteed.

## Security and privacy
- [ ] HTTPS, headers, PII console logs removed, no secrets in source or public bundles.
- [ ] Endpoint rate limits/backend input validation, anti-spam, consent and data retention.
- [ ] No customer email/phone/message in analytics payloads; privacy statement current.

## Accessibility + performance
- [ ] Keyboard navigation, visible focus, labels and error announcements.
- [ ] Contrast/semantic headings, alt text, reduced-motion and no focus trap.
- [ ] Chrome/Safari/Firefox, viewport widths 320/375/768/1024/1440, slow 3G simulation where useful.
- [ ] LCP/INP/CLS recorded; no horizontal overflow/image layout shifts.

## Release discipline
- [ ] Public visual comparison against approved snapshot.
- [ ] Preview QA and clear business sign-off; no unrelated modifications.
- [ ] Correct Netlify project/project ID and preview vs production isolation.
- [ ] Rollback commit and smoke-test checklist ready.
- [ ] GA4 baseline and Search Console baseline captured; check after release.

**This branch is review-only. All checkboxes remain unverified until independently tested.**
