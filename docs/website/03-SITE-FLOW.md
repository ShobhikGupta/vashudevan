# 03 · Site, Navigation & Interaction Flow

**Purpose:** specify the visitor's journey and the expected result of every meaningful click. **Status:** observed links + required QA; not a claim that all integrations pass live.

## Main visitor journeys

```text
HOME
├── About Us ── Who We Are / Our Impact
├── Products ── Search/filter ── product?slug={category}
│                               └── supported grade/subproduct ── enquiry CTA
├── Market ── indicative market references ── caution / Contact
├── Resources ── Buyer / Supplier / Partner paths
│               ├── process + documentation
│               ├── FAQ
│               └── Contact VMG Desk
├── Contact Us ── form validation ── submit ── success OR error
├── Brochure ── preview / download PDF
└── Footer ── Privacy / Disclaimer / FAQ / subscribe / socials
```

## Acceptance table (include negative paths)

| Action | Success state | Failure state |
|---|---|---|
| Navbar / burger / submenu | Correct page opens; active link clear | Invalid links fall back to working Home/404; menu stays usable |
| Product search | Relevant categories visible, reset works | No-results message; input recoverable |
| Product card | Category matches slug and specific grades | Unknown slug presents safe alternative; no wrong-category content |
| Buyer/supplier CTA | Appropriate form/enquiry path | Missing destination never silently drops enquiry |
| Contact submission | Verified response/receipt and clear reset | Visible error + retry, no false "sent" |
| Popup enquiry | Valid required fields + verified submission | Retain input and error; no premature "completed" flag |
| Website feedback | Valid rating/comments forwarded | Visible failure and retry |
| Newsletter subscription | Consent-aware acceptance and confirmable response | No silent subscription or fake confirmation |
| Track shipment | Only works if a verified tracking provider exists | Otherwise clear unavailable state, not invented results |
| Market widget | Dated/licensed indicative reference | Clear unavailable/fallback state |
| PDFs / external links | Correct content, secure target behavior | Broken link identified in QA; helpful fallback |

## State rules

- Form state: `EMPTY -> EDITING -> VALIDATING -> SUBMITTING -> CONFIRMED | FAILED`; success only after confirmed save/acknowledgement.
- Third-party outage: show a plain, non-misleading status; offer direct desk contact as fallback.
- Popup completion: only after acknowledged result, not merely clicking Submit.
- A privacy/consent checkbox does not itself prove lawful processing; follow approved notices.
- Mobile, desktop, keyboard and screen reader users must reach identical business outcomes.

## Page inventory

`/`, `/who-we-are`, `/our-impact`, `/products`, `/product?slug=...`, `/resources`, `/market-prices/`, `/faq`, `/contact`, `/privacy-policy`, `/disclaimer`. Hosting may also serve `.html` variants. Route policy is in the SEO document.

## Review procedure

For each route: open → navigate → submit (sandbox/test identity) → validate successful destination → exercise invalid input → test mobile/slow network → check console/network → verify accessible error messaging. Record pass/fail/evidence and screenshot in the PR.
