# VMG Company Intelligence — Operational Status

> Volatile. Verify real state before acting.

**Last verified:** 2026-09-29 18:05+05:30 Gemini sequence hardening complete; Netlify credit blocker
**Working branch:** `company-intelligence-preview`  
**Last verified code/CI HEAD before this status update:** `ee6475aa0865a3c44ee56f35cfa374129a735b14`
**PR #13:** OPEN, UNMERGED, mergeable  
**main:** `f580f702e8a116c82d2cf62d9e56c5ee5203d767`; unchanged  
**PR #12:** not touched

## Private deployment

Netlify project: `vashudevan-intelligence-preview`  
Site ID: `1e4f8e5b-a82d-4c71-8016-2d99a284704f`  
Current live deploy ID: `6abba2f09d22487705241c29`
State: READY; final timing-fix deployment published privately
Deployment source: Netlify CLI upload from checked-out code commit `ee6475a`; `commit_ref=null` for the manual upload. Deploy title includes the code SHA.

The private site has the incident diagnostics and bounded Gemini probe. Its app gate redirects unauthenticated page requests to login and returns 401 for protected APIs. The public Netlify production project was not deployed by this operation.

## Supabase

Dedicated project: `VMG Company Intelligence`  
Project ref: `xocwnbbltltmbxzdvdfy`  
Region: `ap-south-1`  
State: ACTIVE_HEALTHY

Latest verified security state:
- expected/present VMG tables: 34/34
- RLS enabled: true
- browser table grants: 0
- browser roles denied: true
- provider Vault RPCs service-role-only: true
- private `company-documents` bucket: true
- Supabase security advisor findings: none
- migration `008_provider_verification_state.sql`: APPLIED

Migration 008 changes provider credential storage semantics: storing a credential leaves the provider CONFIGURED. Only successful application-level stored-key verification may set CONNECTED.

## Providers

Latest live state:
- Gemini: `TRANSIENT_ERROR`; model `gemini-3.8-flash`; free mode; credential remains stored in Vault. `stored_verification_passed=false`; research blocked.
- 2026-09-29 09:41:12 UTC stored-key attempt 1 used `credential_source=vault` against `/v1beta/interactions` with `structured_json`; the complete response timed out after 15 seconds. `provider_usage` recorded HTTP 504, `REQUEST_TIMEOUT`, `TRANSIENT_ERROR`. Attempts 2 and 3 did not run. The earlier unbounded attempt returned an unclassified Netlify 504 after Vault retrieval and wrote no usage row.
- Earlier trail: one Interactions structured test returned 200, followed by 400/503/400 failures. The latest timeout does not establish bad credentials or a Google outage.
- Tavily: CONNECTED and working on free tier.
- No `GEMINI_API_KEY` Netlify environment override exists.
- Google Search grounding is optional; Tavily is the zero-billing live-search fallback.

Verified diagnostic facts:
- synthetic `vmg_store_provider_secret` → `vmg_get_provider_secret` round-trip preserved exact text and exact byte length,
- auth-key transport remains `x-goog-api-key`,
- old provider-test error handling incorrectly collapsed failures into AUTH_ERROR.

Fixed branch behavior:
- safe credential diagnostics: character length, byte length, SHA-256 fingerprint prefix, trim/control-whitespace flags,
- fresh-vs-Vault equivalence check,
- exact sanitized provider HTTP status/code/reason/message persistence,
- failure classes: AUTH_ERROR / INVALID_REQUEST / RATE_LIMIT / TRANSIENT_ERROR / PROVIDER_ERROR,
- Gemini Connect stores as CONFIGURED, reads the secret back from Vault, verifies equivalence, then requires three consecutive stored-key structured-synthesis probes,
- Gemini Test Stored Connection also requires three stored-key probes,
- server-side research strategy refuses Gemini unless the same stable proof exists,
- UI does not show CONNECTED unless that proof exists.

## Build proof

GitHub Actions workflow `VMG Intelligence CI` completed successfully for code HEAD `ee6475aa0865a3c44ee56f35cfa374129a735b14`:
- `npm ci --ignore-scripts`
- `npm run check`
- `npm run build`

The same code passed local check/build, and a synthetic abort test confirmed `TRANSIENT_ERROR / REQUEST_TIMEOUT`. The diagnostic request timeout now covers both response headers and body, bounded at 15 seconds for connection probes. Later commits only update this status documentation unless a newer code commit is present when rechecked.

## Current blocker

Gemini verification hardening is implemented and build-validated on the branch, and migration `009_provider_verification_sequence_lock.sql` is live in Supabase. The attempted private Netlify deployment of the hardened branch was rejected with:

`Skipped due to account credit usage exceeded`

Netlify team `shobhikg10’s team` is currently on the Free plan. The hardened code is **not** live yet; the private site remains on deploy `6abba2f09d22487705241c29`.

Do **not** ask for another Gemini credential. Do **not** use Reconnect. Do **not** run another stored-key sequence until the hardened deploy is published.

## Next recommended action

User-only action: restore Netlify deployment capacity for the `shobhikg10` team by waiting for the monthly credit reset or explicitly upgrading the Netlify plan. After credits are available, deploy the current `company-intelligence-preview` HEAD to the **private** `vashudevan-intelligence-preview` project only, then run exactly one controlled Gemini stored-key verification sequence.

Expected hardened sequence:
- one active sequence ID at a time,
- server-side atomic lock,
- attempt 1 → wait 20s → attempt 2 → wait 20s → attempt 3,
- 429 => minimum 60s cooldown, honoring longer Retry-After,
- 503/transient => minimum 45s cooldown,
- research blocked until persisted 3/3 PASS.
