# 06 · Implementation Roadmap & Sign-Off Gates

**Planning document, not an approval to deploy.** Public VMG production remains frozen until specific approval.

| Stage | Outcome / deliverable | Proof required | Gate |
|---|---|---|---|
| 0: Baseline | Repository + production route inventory, analytics baseline, full backup | Frozen screenshots, source SHA, current URLs and GSC/GA4 snapshots | Business + engineering |
| 1: Foundations | Six core docs and four operating standards, review branch and PR | Diff contains only approved internal documentation and low-risk SEO drafts | Business |
| 2: Crawl essentials | Intentional robots, sitemap, canonical/metadata, duplicate-route decision | Automated URL audit, HTTP/canonical/robots/sitemap tests | Engineering + business |
| 3: Enquiry reliability | Form submission receipts, validation, anti-spam, real failure state | End-to-end synthetic submissions checked in destination and privacy review | Business + privacy |
| 4: Trust + content | Verified material-grade content, business facts, buyer/supplier FAQ | Independent fact checks, unique content, no fabricated stock/certification | Business |
| 5: Measurement | GA4 events, conversion definitions, Search Console verification | Event DebugView/Realtime, deduplication, 28-day search baseline | Business + analytics |
| 6: Performance and accessibility | LCP/INP/CLS and WCAG issue repair | Lighthouse + field data when available, device/keyboard tests | Engineering |
| 7: Rollout | Preview → approval → staged production deployment | Rollback, monitoring, no regressions | Owner explicit sign-off |

## Release principles
- Small atomic PRs, not a “big-bang” website rewrite.
- No edit to protected `main`, PR #12, PR #13 or private intelligence project from this documentation/growth branch.
- Maintain public visual content freeze until explicit content/design approval.
- Publish accurate noindex on **preview** sites, not the canonical public site.
- Schedule measurable follow-up checkpoints at ~7/28/90 days **after** approved changes are live. No assumed traffic growth.

## Sign-off record
| Stage | Reviewer | Evidence link | Date | Approved? |
|---|---|---|---|---|
| 0–1 | TO CONFIRM | Review PR | — | Pending |
| 2–7 | TO CONFIRM | Per-stage PR | — | Not authorized |

## First implementation priority
Crawl basics and canonical routes are inexpensive but *not sufficient*: enquiry-confirmation and trust-content quality remain essential for conversion outcomes.
