# VMG Company Intelligence — Operational Status

> Volatile. Verify real state before acting.

**Last verified:** 2026-09-28 (current agent session)  
**Working branch:** `company-intelligence-preview`  
**Last verified HEAD:** `9bc0739957285e8a0c4390f6589a992190df0e6b`  
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

**Important drift:** the live deploy contains a `provider-admin-security` function that is not present in current GitHub HEAD. Do not replace the private deploy until this is reconciled or proven obsolete.

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

## Current blocker

A Gemini authorization/auth credential must be entered by the user through the app’s secure provider-connect flow. Do not ask the user to paste it into chat or commit it.

## Known proof gaps

- Whole-app login/logout/session behavior has code/deploy evidence but still needs current browser re-test before PASS.
- Admin Settings Lock needs current browser re-test.
- Direct document upload/ingestion/privacy leak test needs live end-to-end exercise.
- Live entity resolution/research, persistence, exports, V2, isolation, browser/mobile QA are not complete until Gemini is connected.
- Private Netlify deploy must be reconciled to a known Git commit before the next deploy claim is marked PASS.

## Next recommended action

User connects Gemini in the private app. Then resume with `skills/continue-development/SKILL.md`; do not redo Supabase/RLS/Vault work unless verification fails.
