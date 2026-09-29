# Known Edge Cases

- **Charge vs debt:** filing/sanction/security amount is not current outstanding debt.
- **No negative result:** cannot prove safe/timely payment.
- **Partial trade data:** cannot represent full customer/supplier book or total shipment volume.
- **Period mismatch:** compare must not silently treat FY2024 and FY2026 as same-period values.
- **Entity contamination:** historical Aswani/Koppal test logic must never leak into unrelated companies.
- **Missing chart points:** omit; do not interpolate merely for appearance.
- **Background retries:** job claim/idempotency must prevent duplicate report versions/evidence.
- **Provider 401/403/429:** fail/partial honestly; do not loop or silently paid-fallback.
- **Document race:** research waits for required upload/parse readiness.
- **Large documents:** use direct signed Storage upload/resumable path rather than buffered Function body.
- **Private document:** two-gate external AI permission.
- **Deploy drift:** a ready Netlify upload with no Git commit ref is not proof that deployment equals branch HEAD.
- **Live-vs-Git drift:** legitimate infrastructure changes must be preserved/backfilled to canonical Git before redeploy.
