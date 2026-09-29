# Repository agent instructions

For work on **VMG Company Intelligence**, the canonical operating playbook is:

`agent-playbooks/vmg-intelligence/`

Use it when the request means continue, maintain, debug, test, deploy, secure, research with, or extend VMG Company Intelligence. Do not recreate the project.

## Routing
- Continue/fix/implement VMG Intelligence → `skills/continue-development/SKILL.md`
- Research/due diligence on a company → `skills/company-research/SKILL.md`
- Deploy VMG Intelligence → `skills/deployment/SKILL.md`
- Readiness/release proof → `skills/release-qa/SKILL.md`
- Security review → `skills/security-review/SKILL.md`
- Broken/failing behavior → `skills/incident-debugging/SKILL.md`

Read only the references needed for the task. `STATUS.md` is volatile and must be checked against real GitHub/Netlify/Supabase state before acting.

## Hard boundaries
Follow `agent-playbooks/vmg-intelligence/SAFETY.md`. In particular: do not merge PR #13, touch `main`, touch PR #12, or deploy/modify public `vashudevan.com` without explicit user authorization. Never commit secrets.

Repo-scoped Codex skill entries under `.codex/skills/` are thin adapters. The files under `agent-playbooks/vmg-intelligence/` are authoritative.
