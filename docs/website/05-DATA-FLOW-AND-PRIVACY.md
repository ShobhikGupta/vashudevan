# 05 · Website Data Flow, Information Inventory & Privacy

**Classification: internal operating document**. Public VMG website is mostly static; this is the correct equivalent of a database schema for its forms and external processors. **Unknown integrations remain TO VERIFY**, never assumed secure.

## Observed flow
```text
Browser
 ├─ Contact form (contact.html) ----------------> Google Apps Script URL in assets/js/config.js
 ├─ Opening enquiry popup (assets/js/main.js) -> Google Apps Script URL
 ├─ Feedback (assets/js/vmg-feedback.js) ------> configured feedback endpoint
 ├─ Subscription (footer) ---------------------> submission mechanism: TO VERIFY
 └─ GA4 (G-6CJ7X607D5) ----------------------> Google Analytics
Local browser storage: popup completion flag and navigation/highlight transient state.
```
This is code inspection, not evidence of successful records, permission controls or retention. The Google Apps Script URL is a public endpoint, not a private credential; nevertheless validate abuse prevention.

## Data inventory & access matrix
| Surface | Observed/potential data | Why needed | Destination / owner | Access / retention |
|---|---|---|---|---|
| Contact | Name, phone, email, organisation, country, enquiry type, message, consent | Reply to trade enquiry | Apps Script destination / **TO VERIFY sheet** | **TO VERIFY** |
| Popup | Country, phone, email and timestamp | Initial trade contact | Apps Script / **TO VERIFY** | **TO VERIFY** |
| Feedback | Rating, optional email, comments, timestamp | Website improvement | Configured endpoint / **TO VERIFY** | **TO VERIFY** |
| Subscription | Email | Opt-in trade updates | **TO VERIFY actual handler and platform** | **TO VERIFY** |
| Analytics | Device/page/event identifiers | Site and campaign measurement | GA4 | Review GA4 retention/consent settings |
| Local storage | Popup completion flag, product highlight state | UI convenience | Visitor browser | Clear/reset on appropriate user action |

## Required controls before calling the flows verified
1. Inspect Google Apps Script source and actual destination spreadsheet; confirm owner/editor/read permissions; record data residency and retention/deletion owner.
2. Avoid logging personal data in the browser. **Current code issue:** `contact.html` logs email/form values and `assets/js/main.js` contains debug output; review and remove in a separate approved code change.
3. Server-side validation, payload limits, origin/CSRF posture appropriate to endpoint, anti-spam measures and abuse monitoring. Client-only validation is insufficient.
4. Show success only upon reliable acknowledgment. Current `no-cors`/fallback patterns must be tested for false positives; do not treat an opaque response as proof of persistence.
5. Define requests to access/delete data, consent, retention policy, privacy notice and vendor access; obtain appropriate legal review.
6. Do not send personal enquiries to AI tools unless documented and permitted. Do not publish any dataset.
7. Keep private Company Intelligence environment/database/Vault entirely separate from the public website.

## Future data schema (only if a real lead service is added)
Logical record: `lead_id`, `created_at`, `source_page`, `lead_type`, `company_name`, `contact_name`, `contact_email`, `contact_phone`, `material_category`, `message`, `consent_at`, `processing_status`, `assigned_to`, `retention_until`. Store in a managed backend with permission separation; do **not** add a database just for form handling if Apps Script securely meets needs.

## Security acceptance
Authorized business staff see only necessary records; raw submissions cannot be enumerated publicly; no personal data in analytics event parameters or console logs; deletion/retention process is documented and demonstrable.
