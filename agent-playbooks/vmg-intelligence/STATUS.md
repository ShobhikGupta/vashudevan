# VMG Company Intelligence — Operational Status

> Volatile. Verify real state before acting.

**Last verified:** 2026-09-28 16:42+05:30 continuation check
**Working branch:** `company-intelligence-preview`  
**Last verified implementation HEAD (before this STATUS-only write):** `168ef9fafb93cbe003f67e818a6bc791507be1ea`
**PR #13:** OPEN, UNMERGED, mergeable  
**main:** `f580f702e8a116c82d2cf62d9e56c5ee5203d767`; unchanged during verification  
**PR #12:** open draft; not touched

## Private deployment

Netlify project: `vashudevan-intelligence-preview`  
Site ID: `1e4f8e5b-a82d-4c71-8016-2d99a284704f`  
Current deploy ID: `6ab3c144ff3aa751cab18a62`  
State: READY  
Deployment source: uploaded/API deploy; `commit_ref=null`  
Observed package: 29 functions + 1 edge function; secret scan reported zero matches.

**Important drift:** the live deploy contains a `provider-admin-security` function that is not present in current GitHub HEAD. Git history search found no committed source for it, and the authorized machine does not currently have Netlify CLI/source-download tooling available. Do not replace the private deploy until the actual helper is recovered/reconciled or explicitly proven obsolete.

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

Latest verified `provider_connections`: empty.  
Gemini: NOT CONNECTED.  
Google Search grounding: NOT VERIFIED.  
Tavily/OpenAI: optional and not required for V1.

## Current working milestone

Connect/verify Gemini authorization credential → verify Google Search grounding → run real Koppal entity resolution/research → verify persistence/exports → isolation/V2/UNKNOWN/security/browser/mobile QA.

## Playbook state

Canonical delegation system added at `agent-playbooks/vmg-intelligence/` with root `AGENTS.md` and thin `.codex/skills/` adapters. Initial dry runs passed routing/safety/blocker detection; debt/charge regression proof was strengthened after the second dry run.

## Current blocker

A Gemini authorization/auth credential must be entered by the user through the app’s secure provider-connect flow. Do not ask the user to paste it into chat or commit it.

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
- Private Netlify deploy must be reconciled to a known Git commit before the next deploy claim is marked PASS.

## Next recommended action

User connects Gemini in the private app. Then resume with `skills/continue-development/SKILL.md`; do not redo Supabase/RLS/Vault work unless verification fails.
