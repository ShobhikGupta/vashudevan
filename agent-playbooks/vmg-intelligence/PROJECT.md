# VMG Company Intelligence — Durable Project Knowledge

## Purpose

VMG Company Intelligence is private internal software for Vashudevan MetGlobal LLP. It supports counterparty and company intelligence for suppliers, buyers, competitors, steel/metal businesses, coal suppliers, counterparties, and potential customers.

## Product philosophy

NUMBER → CHANGE → GRAPH → SHORT EXPLANATION → DETAILED TABLE → SOURCE / EVIDENCE

Evidence classes:
- VERIFIED
- DERIVED
- ESTIMATED
- PREDICTED
- PARTIAL
- UNKNOWN

Never invent unavailable information. UNKNOWN is better than a fake number.

## Current architecture

- Frontend: `intelligence/`
- App-wide access gate: Netlify Edge Function plus server-validated signed session cookie
- Backend: Netlify Functions in `netlify/functions/`
- Background work: Netlify background functions for research and document parsing
- Database: dedicated Supabase project for VMG Company Intelligence
- Data access: browser → Netlify Functions → Supabase; browser must not receive a Supabase server credential
- Storage: private Supabase bucket `company-documents`
- Provider secrets: Supabase Vault
- Primary research provider: Gemini, model currently coded as `gemini-2.5-flash`
- Primary search: Gemini Google Search grounding
- Optional fallback: Tavily
- Optional paid provider: OpenAI
- Exports: native PDF, DOCX, XLSX generated server-side

## Authentication

Whole-app auth uses a long-lived signed HttpOnly/Secure/SameSite=Strict cookie. Settings/provider mutation has a separate admin lock/session. Secrets are server-side only.

## Research engine

The engine exposes 24 stages grouped into identity, business/operations, financial/debt/rating, legal/insolvency/negative, trade/buyers/suppliers, and competitors/procurement/opportunity.

Exact legal entity resolution comes first. Opportunity and credit/payment safety are separate conclusions.

## Documents

Files are authorized server-side, uploaded directly to private Supabase Storage using signed authorization, finalized server-side, parsed locally/server-side for PDF/DOCX/XLSX/CSV, then research may start. Images may remain stored-only.

A private document may reach an external AI provider only when both file-level permission and workspace privacy policy permit it.

## Versioning and comparison

Reports persist in Supabase, use per-company versions, support “What Changed,” and compare companies with period-aware metrics. Cross-company contamination is a critical defect.

## Scope discipline

Do not spend engineering time on visual polish while security, persistence, real research, deployment integrity, or proof tests remain incomplete.
