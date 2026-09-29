# VMG Company Intelligence — Agent Operating Playbook

This folder is the **canonical GitHub source of truth** for continuing and operating the existing VMG Company Intelligence application. It is not a replacement application and must not be used to restart architecture design.

## Operating model

**PROCESS** — the skill defines what the agent does and in what order.  
**TOOLBOX** — reusable checks, queries, templates, and reference files support the process.  
**PROOF** — objective checks decide PASS/FAIL/BLOCKED/NOT TESTED.  
**LEARNING LOOP** — durable failures improve the process/toolbox/proof layer instead of being forgotten after one chat.

## Core rule

Before every continuation, verify reality. Real GitHub, Netlify, Supabase, provider, and browser results override stale documentation. Never reset legitimate newer work because a stored SHA is older.

## Skills

| Repeated job | Canonical skill |
|---|---|
| Continue/fix/implement the app | `skills/continue-development/SKILL.md` |
| Company due diligence/research | `skills/company-research/SKILL.md` |
| Safe deployment | `skills/deployment/SKILL.md` |
| Release/readiness QA | `skills/release-qa/SKILL.md` |
| Security review | `skills/security-review/SKILL.md` |
| Incident/debugging | `skills/incident-debugging/SKILL.md` |

## Start here

For a normal “Continue VMG Intelligence” request:
1. Read `SAFETY.md`.
2. Read `STATUS.md`.
3. Load `skills/continue-development/SKILL.md`.
4. Verify current reality before changing anything.
5. Use only the references needed for the current blocker.

Durable project knowledge belongs in `PROJECT.md`; volatile operational state belongs in `STATUS.md`; durable lessons belong in `notes.md`.

## Canonical vs adapters

GitHub files in this directory are authoritative. `AGENTS.md`, `.codex/skills/`, and `adapters/` only route agents back here. See `adapters/SYNC.md`.
