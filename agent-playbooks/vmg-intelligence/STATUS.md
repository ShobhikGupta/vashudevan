# VMG Company Intelligence — Operational Status

> Volatile. Verify real state before acting.

**Last verified:** 2026-09-28 17:30+05:30 Gemini 3.8 / free-search deployment check
**Working branch:** `company-intelligence-preview`  
**Last verified implementation HEAD (before this STATUS-only write):** `11e61b934c764f51fd03587973c2abf11495c290`
**PR #13:**** OPEN, UNMERGED, mergeable  
**main:** `f580f702e8a116c82d2cf62d9e56c5ee5203d767`; unchanged during verification  
**PR #12:** open draft; not touched

## Private deployment

Netlify project: `vashudevan-intelligence-preview`  
Site ID: `1e4f8e5b-a82d-4c71-8016-2d99a284704f`  
Current deploy ID: `6aba5663e4368c82cd1d0615`  
State: READY  
Deployment source: uploaded/API deploy; `commit_ref=null`  
Observed package: 29 functions + 1 edge function; Netlify secret scan reported zero matches.

**Deployment provenance:** upload/API deploy has `commit_ref=null`, but this deploy was built from a clean clone of verified branch HEAD `11e61b934c764f51fd03587973c2abf11495c290`; the previously undeclared `provider-admin-security` behavior is now canonical in GitHub and deployed.

## Supabase

Dedicated project: `VMG Company Intelligence`  
Project ref: `xocwnbbltltmbxzdvdfy`  
Region: `ap-south-1`  
State: ACTIVE_HEALTHY

Latest verified security-health result:
- expected/present VMG tables: 34/34
- RLS enabled: true
- browser table grants: 0
- browser roles denied: true
- provider Vault RPCs service-role-only: true
- private `company-documents` bucket: true
- Supabase security advisor findings: none

Migrations through provider-secret rotation hardening are applied. Migration history includes reconciliation runs; inspect before adding new migrations.

## Providers

Latest verified `provider_connections`: empty before user retry.  
Gemini: NOT CONNECTED yet; app now uses `gemini-3.8-flash` and validates the model independently from Search grounding.  
Google Search grounding: optional when the connected Gemini API tier supports it; standard free Gemini 3.x may not provide it.  
Tavily: preferred zero-billing live-search fallback; Researcher free tier can be connected if Google grounding is unavailable.  
OpenAI: optional paid provider; paid usage remains OFF by default.

## Current working milestone

Connect/verify Gemini 3.8 Flash → verify live search (Google grounding if available, otherwise Tavily free) → run real Koppal entity resolution/research → verify persistence/exports → isolation/V2/UNKNOWN/security/browser/mobile QA.

## Playbook state

Canonical delegation system added at `agent-playbooks/vmg-intelligence/` with root `AGENTS.md` and thin `.codex/skills/` adapters. Initial dry runs passed routing/safety/blocker detection; debt/charge regression proof was strengthened after the second dry run.

## Current blocker

User must retry the existing Gemini credential through the secure provider-connect flow after the Gemini 3.8 deployment. If Gemini connects but Google Search grounding shows unavailable, the next user-only action is connecting a Tavily Researcher free credential. Never request provider credentials in chat.

## Newly verified in this continuation

- Unauthenticated root request redirects to `/login.html?next=%2F`.
- Unauthenticated `/api/companies` returns 401 `APP_AUTH_REQUIRED`.
- Unauthenticated `/api/system-health` returns 401 `APP_AUTH_REQUIRED`.
- Wrong app access secret returns 401 and does not set a cookie.
- Live responses include `X-Robots-Tag: noindex, nofollow, noarchive`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`.
- Supabase security health remains healthy and provider_connections remains empty.

## Known proof gaps

- Successful login, logout, authenticated session persistence/expiry still need an authenticated browser/session test before full APP AUTH PASS.
- Admin Settings Lock needs current browser re-test.
- Direct document upload/ingestion/privacy leak test needs live end-to-end exercise.
- Live entity resolution/research, persistence, exports, V2, isolation, browser/mobile QA are not complete until Gemini is connected.
- Deployment uses Netlify upload/API and therefore reports `commit_ref=null`; source provenance is recorded manually from the clean-clone QA HEAD.

## Next recommended action

User refreshes the private app and retries Gemini Connect using the same credential with “Free / free allowance”. If successful but Search grounding is unavailable, connect Tavily free next. Then resume real Koppal research; do not redo Supabase/RLS/Vault work unless verification fails.
