# ChatGPT Adapter

GitHub remains canonical.

When ChatGPT has access to the GitHub connection for `ShobhikGupta/vashudevan`:
1. retrieve the canonical files under `agent-playbooks/vmg-intelligence/` on demand,
2. read `SAFETY.md`, current `STATUS.md`, and the relevant `SKILL.md`,
3. verify volatile state with GitHub/Netlify/Supabase tools before acting.

Current ChatGPT GitHub access is live/on-demand rather than a continuously synced repository index. Therefore this playbook does **not** claim automatic ChatGPT synchronization.

If live GitHub access is unavailable, attach/copy only the minimum needed canonical files (README, PROJECT, SAFETY, STATUS, relevant skill/references). Treat those as a temporary snapshot and refresh them from GitHub before consequential work.

Do not create a second competing ChatGPT memory document containing project facts.
