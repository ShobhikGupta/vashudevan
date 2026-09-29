# Security Verification

## Database proof
```sql
select public.vmg_system_security_health();
```
Expected: full table count, RLS true, browser roles denied, provider RPCs service-role-only, private bucket true.

Also run Supabase security advisors. Relevant unresolved warnings/errors prevent PASS.

## Browser/API
- unauthenticated private endpoint returns 401/403 and no company data
- session cookie is HttpOnly + Secure + SameSite=Strict
- no auth/provider/Supabase server secret in localStorage/sessionStorage/client JS/HTML
- provider mutation requires admin session

## Vault
- store/retrieve/disconnect may be tested with an isolated fake credential
- anon/authenticated/PUBLIC cannot execute provider-secret RPCs
- never expose decrypted secret in API response

## Storage
- `company-documents.public=false`
- browser roles cannot enumerate private objects
- signed upload authorization is short-lived and server chooses/validates path
- service credential never reaches browser

## Private documents
With workspace private AI OFF and file permission OFF:
- parse locally only,
- provider usage/logs show no external call for document content,
- research still treats the file as blocked from external context.

## Isolation
- Company Intelligence absent from public VMG navigation/sitemap/SEO
- noindex/nofollow/noarchive present
- public Netlify project untouched by private deployment work
