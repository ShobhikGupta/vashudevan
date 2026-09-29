# Durable Lessons — newest first

## 2026-09-29 — Provider CONNECTED must be proven after Vault round-trip

**TASK:** diagnose intermittent Gemini 3.8 structured-synthesis failures after an apparently successful connection.  
**WHAT FAILED:** the old flow validated the freshly pasted credential, stored it, then treated the provider as CONNECTED. A later stored-key test failed, while `/api/provider-test` mislabeled essentially every thrown failure as AUTH_ERROR and discarded Google's useful error classification.  
**LAYER:** PROCESS / TOOLBOX / PROOF / CODE  
**ROOT CAUSE:** provider readiness was proven against fresh input rather than the credential actually used by research after secure storage; failure classification was too coarse.  
**DURABLE CHANGE:** provider Connect now stores as CONFIGURED, reads the credential back from Vault, compares non-secret length/byte-length/fingerprint/whitespace diagnostics, and requires repeated stored-key structured-synthesis probes before CONNECTED. Provider failures retain sanitized HTTP status/code/reason/message and are classified as AUTH_ERROR, INVALID_REQUEST, RATE_LIMIT, TRANSIENT_ERROR, or PROVIDER_ERROR. Research also checks stable provider proof server-side instead of trusting UI status.  
**PROOF THE FIX WORKED:** synthetic `vmg_store_provider_secret` → `vmg_get_provider_secret` exact text and byte-length round-trip passed; migration 008 is applied; GitHub Actions CI passed the fixed branch. Live stored-key provider proof remains pending deployment of this code.

## 2026-09-28 — Deployment provenance must be provable

**TASK:** reconcile the private VMG Intelligence environment.  
**WHAT FAILED:** the private Netlify deploy is healthy but was uploaded with `commit_ref=null`, and its function inventory contains `provider-admin-security`, which is absent from current GitHub HEAD.  
**LAYER:** PROCESS / PROOF  
**ROOT CAUSE:** deploy success alone was treated as insufficient provenance.  
**DURABLE CHANGE:** deployment proof must include the deployed source/commit or an explicit file/function reconciliation before replacing a working private deploy.  
**PROOF THE FIX WORKED:** this condition is now an explicit STATUS blocker and deployment checklist item.

## 2026-09-28 — Live infrastructure may contain legitimate newer security work

**TASK:** reconcile provider secret hardening.  
**WHAT FAILED:** live Supabase contained stronger provider credential rotation/rate-limit definitions than the branch originally represented.  
**LAYER:** PROCESS / TOOLBOX  
**ROOT CAUSE:** code and infrastructure evolved through different agent/tool paths.  
**DURABLE CHANGE:** continuation always compares current GitHub with live infrastructure before reset/redeploy; preserve legitimate newer work and backfill canonical migrations.  
**PROOF THE FIX WORKED:** provider-secret rotation security is represented by migration `007_provider_secret_rotation_security.sql`.
