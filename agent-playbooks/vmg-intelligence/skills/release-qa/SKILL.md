---
name: release-qa-vmg-intelligence
description: Independently prove VMG Company Intelligence readiness before claiming FUNCTIONAL, READY, PASS, or production readiness. Trigger on QA, release check, readiness, end-to-end test, “is V1 working?”, or final validation.
---

# Release QA

Do not implement a feature and grade it by appearance. Exercise applicable workflows and record PASS/FAIL/BLOCKED/NOT APPLICABLE/NOT TESTED.

1. Load `../../STATUS.md` and `../../SAFETY.md`.
2. Decide which checks are applicable to the requested milestone.
3. Run `files/qa-checklist.md` with real data where the feature requires real data.
4. Independently verify persistence/security/export claims.
5. Never convert NOT TESTED into PASS.
6. If a check fails, route to incident-debugging; re-run the original failing check after the fix.
7. Use `../../templates/final-status.md` for milestone status.

Browser/CDP is preferred where available; Playwright is a secondary path. Use a separate browser profile unless explicitly told otherwise.
