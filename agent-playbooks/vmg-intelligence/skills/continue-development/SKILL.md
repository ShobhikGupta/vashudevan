---
name: continue-vmg-intelligence
description: Continue, fix, maintain, test, deploy, or implement the next task in the existing VMG Company Intelligence project. Trigger on “Continue VMG Intelligence”, “Continue my VMG Company Intelligence project”, “Continue where we stopped”, “Work on VMG Intelligence”, “Finish VMG Intelligence”, “Continue V1”, “Continue the intelligence app”, “Fix VMG Intelligence”, or “Implement the next VMG Intelligence task”.
---

# Continue the existing project

Interpret the request as: **continue from the current real state**. Never create a new project, restart architecture design, or trust a stored SHA as permanently current.

## Process

1. **Orient**
   - Read `../../SAFETY.md` and `../../STATUS.md`.
   - Read `../../PROJECT.md` only as needed for durable architecture/product rules.
   - Read relevant references, not the entire folder by default.

2. **Verify reality**
   - Check repository, branch, remote HEAD, PR #13, recent commits, and working tree when available.
   - Check private/public Netlify targets if deployment/runtime is relevant.
   - Check dedicated Supabase project/security/provider state if data/research is relevant.
   - Compare real state with `STATUS.md`; real state wins.

3. **Identify delta**
   - Separate implemented, actually working, untested, broken, UI-only, and blocked.
   - Preserve legitimate newer work.
   - Update `STATUS.md` if volatile state has materially changed.

4. **Choose the next blocker**
   Prioritize security → data integrity → real functionality → persistence → infrastructure → testing before visual polish.

5. **Implement**
   - Make the smallest coherent safe change.
   - Do not rewrite stable components without evidence.
   - Reversible work on the safe intelligence branch is pre-authorized by the project owner.

6. **Test**
   - Run only applicable objective proof checks.
   - Use `files/state-verification.md` and the relevant specialist skill.

7. **Fix and re-test**
   - Do not declare completion with known failed checks.

8. **Learning loop**
   - Update a skill/reference/toolbox file only when a reusable rule/process/check changed.
   - Add to `../../notes.md` only for durable lessons, not routine success.

9. **Report**
   - What changed, proof passed/failed/blocked/not tested, remaining blocker, and exact user action if required.
   - Use `../../templates/final-status.md` for milestone reports.

## Stop conditions

Follow `../../SAFETY.md`. If the only blocker is a user-owned credential, paid commitment, merge, public production action, or irreversible change, finish every other safe task first and ask for one precise action.
