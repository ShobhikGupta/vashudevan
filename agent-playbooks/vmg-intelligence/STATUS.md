# VMG Company Intelligence — Operational Status

> Volatile. Verify real state before acting.

**Last verified:** 2026-09-29 13:35+05:30 Gemini stored-key incident hardening  
**Working branch:** `company-intelligence-preview`  
**Last verified code/CI HEAD before these playbook-only commits:** `67b69b5a1583bb22f05c67745d9109a19a04d941`  
**PR #13:** OPEN, UNMERGED, mergeable  
**main:** `f580f702e8a116c82d2cf62d9e56c5ee5203d767`; unchanged  
**PR #12:** not touched

## Private deployment

Netlify project: `vashudevan-intelligence-preview`  
Site ID: `1e4f8e5b-a82d-4c71-8016-2d99a284704f`  
Current live deploy ID: `6aba62570e042219fdff676f`  
State: READY  
Deployment source: uploaded/API deploy; `commit_ref=null`

The live private deploy is still the pre-incident-diagnostics version. The fixed branch has **not** yet been uploaded because the authorized Remote Desktop deployment bridge is currently offline.

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
- Gemini: `AUTH_ERROR`; model `gemini-3.8-flash`; free mode; credential remains stored in Vault.
- Gemini usage trail: one Interactions structured test returned 200, followed by 400/503/400 failures.
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

GitHub Actions workflow `VMG Intelligence CI` completed successfully for code HEAD `67b69b5a1583bb22f05c67745d9109a19a04d941`:
- `npm ci --ignore-scripts`
- `npm run check`
- `npm run build`

Later commits only update this canonical playbook/incident documentation unless a newer code commit is present when rechecked.

## Current blocker

The incident fix is not yet deployed to the private Netlify site because the authorized deployment Mac/Remote Desktop bridge is offline.

Do **not** ask the user for another Gemini credential. Do **not** start Koppal research.

## Next recommended action

1. Recheck current PR #13 HEAD.
2. When authorized deployment access is available, deploy the current branch to **private** `vashudevan-intelligence-preview` only.
3. Verify deploy READY, function inventory, secret scan, and public VMG isolation.
4. In the authenticated app run **Gemini → Test Stored Connection** once. That single action internally performs three identical stored-key structured-synthesis probes.
5. Inspect provider_usage/provider_connections:
   - if all three pass: mark Gemini stable CONNECTED and proceed to Koppal,
   - if any fails: use the newly persisted sanitized provider status/code/reason/message to diagnose the actual provider-side cause.
