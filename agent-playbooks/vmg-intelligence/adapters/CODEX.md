# Codex Adapter

GitHub is canonical. Do not maintain a separate Codex-only project memory.

Current supported repository mechanisms used here:
- root `AGENTS.md` routes Codex to the canonical VMG playbook,
- repo-scoped `.codex/skills/*/SKILL.md` files provide skill discovery,
- those Codex skill files are thin adapters that point to the canonical `agent-playbooks/vmg-intelligence/skills/` files.

When a canonical process changes, edit the canonical file first. Edit an adapter only if trigger/routing behavior changes.

Codex should verify volatile state with live tools before trusting `STATUS.md`.
