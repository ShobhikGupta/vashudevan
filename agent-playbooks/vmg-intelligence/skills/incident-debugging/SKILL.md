---
name: debug-vmg-intelligence
description: Diagnose and durably fix VMG Company Intelligence failures such as admin unlock, research failure, deployment failure, Supabase connection, Gemini/provider errors, wrong report data, persistence, export, or document issues. Trigger on “this isn't working”, “why is this broken”, “admin secret doesn't unlock”, “research failed”, “deploy failed”, “Supabase isn't connecting”, or “Gemini isn't working”.
---

# Incident Debugging

REPRODUCE → COLLECT EVIDENCE → IDENTIFY LAYER → ROOT CAUSE → SMALLEST DURABLE FIX → TEST → RE-TEST ORIGINAL FAILURE → LEARNING LOOP.

## Rules
- Do not repeatedly retry the same failing action without changing the hypothesis.
- Separate PROCESS / TOOLBOX / PROOF / EXTERNAL causes.
- Preserve safety boundaries while debugging.
- Prefer the smallest fix at the actual failing layer.
- Re-run the original failure after the fix, not only a nearby test.
- Update the canonical playbook only when the lesson is reusable.
- If the same failure occurs twice, add an explicit preventative check/rule.

Use `files/root-cause-template.md` and `../../templates/incident-note.md`.

For wrong research output, also load the company-research proof checks.
