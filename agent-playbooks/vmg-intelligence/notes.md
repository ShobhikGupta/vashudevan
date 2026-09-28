# Durable Lessons — newest first

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
