---
name: security-review-vmg-intelligence
description: Review and prove VMG Company Intelligence authentication, API, Supabase, Vault, Storage, provider-secret, document-privacy, and public-site isolation controls. Trigger on security review, auth, RLS, Data API, Vault, storage, secret exposure, privacy, or “can this be hacked?”.
---

# Security Review

1. Read `../../SAFETY.md`.
2. Inspect current code and live infrastructure; do not assume the migration file equals runtime state.
3. Run applicable checks in `files/security-verification.md`.
4. Run Supabase security advisors after schema/security changes.
5. Confirm browser roles remain denied and server path remains functional.
6. Confirm secrets are not in Git/client/logs.
7. Prove private-document external-AI denial with an actual test when the document pipeline is in scope.
8. Verify public VMG remains isolated.
9. Report objective results; do not weaken protections to get a green status.

Use `../../templates/security-checklist.md` for a formal review.
