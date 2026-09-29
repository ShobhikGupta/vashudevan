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

### Provider credential incident
When a provider connects once but later fails:
1. do not ask for a new credential until VMG-side storage/reuse is disproven,
2. compare fresh-input and Vault-retrieved credentials using only safe diagnostics (length, byte length, cryptographic fingerprint, trimming/control-whitespace flags),
3. make fresh and stored tests use the exact same endpoint, headers, model, request body/schema and billing mode,
4. persist the provider's sanitized HTTP status/code/reason/message,
5. classify failures semantically (AUTH_ERROR / INVALID_REQUEST / RATE_LIMIT / TRANSIENT_ERROR / PROVIDER_ERROR),
6. never let storing a secret itself set CONNECTED,
7. require repeated stored-key tests before CONNECTED,
8. make server-side research readiness enforce the same proof; do not rely only on UI badges.

### Debt/charge semantic regression
If an output treats a registered charge, sanctioned facility, or security filing as current outstanding debt:
1. classify the incident primarily as **PROCESS / TOOLBOX / PROOF** unless code evidence shows a storage/parser bug,
2. inspect the source wording, extracted evidence, synthesis prompt/rules, and persisted finding independently,
3. correct the smallest layer that allowed the semantic jump,
4. add/strengthen a proof check that can fail on charge-only evidence,
5. re-run the original company/output and verify it now distinguishes charge/security evidence from supported current debt.
