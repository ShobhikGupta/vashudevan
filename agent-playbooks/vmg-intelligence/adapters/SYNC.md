# Synchronization Model

## Automatic / live
- GitHub branch content is canonical after commit/push.
- Codex working inside the repository can automatically receive root `AGENTS.md`; supported repo-scoped skills live under `.codex/skills/`.
- ChatGPT with the authorized GitHub connection can retrieve current repository content on demand.

## Not automatic
- ChatGPT does not maintain a continuously synced GitHub index for this repository.
- Files manually attached to a ChatGPT Project/chat are snapshots and can become stale.
- A local clone remains stale until fetched/pulled.
- No custom GitHub-synced ChatGPT plugin/marketplace was created by this playbook.

## Update rule
Change canonical files first. Thin adapters should only contain routing/discovery instructions. If a manual snapshot exists, refresh it after canonical changes when it is next used.
