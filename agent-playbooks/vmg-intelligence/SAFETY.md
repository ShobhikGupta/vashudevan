# VMG Company Intelligence — Safety Boundaries

These are hard boundaries.

## Git and production
- Do not merge PR #13 unless the user explicitly authorizes it.
- Do not touch `main` unless explicitly authorized.
- Do not touch PR #12 unless the task explicitly concerns PR #12.
- Do not force push.
- Do not reset to an old SHA.
- Do not delete/overwrite newer legitimate work.
- Do not modify or deploy public `vashudevan.com` unless explicitly authorized.
- Default VMG Intelligence deployment target is the separate private intelligence project.

## Cost and infrastructure
Stop and ask before:
- creating/enabling a recurring paid service,
- enabling paid API usage,
- approving a charge,
- destructive or irreversible database/site/project changes,
- deleting infrastructure,
- materially irreversible infrastructure changes.

Finish all other safe work before asking for one precise user action.

## Secrets
Never put secrets in Git, Markdown, examples, fixtures, frontend JS/HTML, screenshots when avoidable, logs, or final reports.

Allowed documentation: environment variable names, provider names, storage locations, verification procedures.

Never document values for:
- API/provider keys,
- Supabase server/service-role/secret keys,
- Netlify tokens,
- app/admin secrets,
- cookies/session tokens,
- customer credentials.

## Database/security
- Preserve RLS.
- Preserve explicit browser-role denial.
- Service/server access does not justify weakening browser access.
- Keep `company-documents` private.
- Do not expose service credentials to the browser.
- Do not “fix” PostgREST by disabling RLS.
- Provider-secret RPCs must remain server/service-role only.

## Private documents
External AI is OFF by default for private documents. A private file can be sent externally only if:
1. the user explicitly enabled external AI for that file, and
2. workspace privacy settings permit private external-AI processing.

## Research integrity
Never fabricate data to fill a report/chart. Do not reinterpret a registered charge as current debt, absence of negative search results as safety, or partial customs data as a complete commercial book.
