# 09 · Security & Privacy Operating Standard

**Protect public contact data and VMG reputation.** This checklist is not a substitute for legal review of Indian privacy obligations.

## High-priority confirmed code risks to investigate
1. `contact.html` logs the contact email and full form-value object to browser console in the submission handler. Remove PII debug logging in a separately reviewed change.
2. The form contains fallback `no-email@example.com` logic; verify error path never submits placeholder emails as leads.
3. Script-based `no-cors` submission may report success before server confirmation. Introduce verifiable submission acknowledgement and test actual destination.
4. App Script public endpoint and email-subscribe/feedback endpoints need abuse/rate-limiting, spam/CSRF review and storage-permission inspection.
5. Product/preview/test URLs should be governed; no public diagnostic pages with personal or sensitive data.

## P0 security requirements
- Strictly separate public site from Company Intelligence secrets, API routes and stored company reports.
- Inventory every third-party script and external form endpoint. Rotate compromised tokens; do not publish server-side secrets.
- Submit only necessary fields; consent/notice appropriate to handling; explicit retention/deletion authority.
- Verify HTTPS + security response headers + no mixed active content; use CSP in report-only mode before enforcement to avoid blocking current integrations.
- Field length limits, content escaping, backend validation, abuse throttling and monitoring.
- Protect Google Sheets owners and Apps Script deployments with least privilege.
- Never store customer-provided data in public git history, GA4, browser console or URLs.
- Treat privacy policy and disclaimer as legal documents requiring approved review.

## Response plan
Unexpected public data exposure: disable affected form route/integration if necessary, revoke access, preserve investigation facts without exposing PII, identify impacted records, get counsel guidance and communicate when legally required.

## Sign-off
Privacy/data-flow inventory approved? **PENDING**. Apps Script source and destination access reviewed? **PENDING**. Private intelligence isolation tested? **PENDING**. No public production rollout until high-risk confirmed data-handling regressions are understood.
