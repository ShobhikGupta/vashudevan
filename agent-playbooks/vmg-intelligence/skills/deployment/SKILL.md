---
name: deploy-vmg-intelligence
description: Deploy or verify deployment of VMG Company Intelligence to its safe private/preview environment while protecting public vashudevan.com. Trigger on deployment, redeploy, Netlify, preview, private intelligence deployment, or intelligence.vashudevan.com requests.
---

# Safe Deployment

1. Read `../../SAFETY.md` and current `../../STATUS.md`.
2. Inspect the target before acting.
3. Distinguish development/deploy-preview/private-intelligence/public-production.
4. For VMG Intelligence, default to the separate private intelligence project. Public production requires explicit authorization.
5. Verify current branch/head and deployment provenance before replacing a working deploy.
6. Build/check the exact source intended for deployment.
7. Deploy only to the intended private target.
8. Verify deploy state, URL, source commit/provenance, health endpoint, auth behavior, and one critical workflow.
9. Update STATUS with the new deploy ID/commit only after proof.

If deploy provenance cannot be tied to a Git commit, record that as a proof gap rather than PASS.

Use `files/deployment-verification.md` and `../../templates/deployment-checklist.md`.
