# Database and Security Reference

The dedicated Supabase schema contains the VMG workspace plus 34 primary application tables spanning companies/identifiers, research jobs/stages/reports/versions, sources/evidence, financials, directors/ownership/facilities/products, debt/charges/ratings/legal/trade, counterparties/competitors/procurement/risk/opportunity, documents/extractions/exports, provider usage/connections/settings/activity.

Migrations are under `supabase/migrations/`. Current canonical series includes:
001 core schema → 002 provider/settings/Vault → 003 security/doc lifecycle → 004 explicit browser deny → 005 production hardening/security health → 006 index cleanup → 007 provider credential rotation/rate-limit hardening.

## Invariants
- RLS enabled on all VMG business tables.
- `anon` and `authenticated` have no VMG business-data DML grants.
- server/service role has required Data API access.
- provider-secret Vault RPCs are service-role-only.
- `company-documents` is private.
- security-health RPC provides a machine-verifiable summary.

RLS and Data API privileges are separate proof dimensions. Validate both.

Do not reuse old inactive Supabase projects unless explicitly re-architected.
