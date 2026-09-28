# State Verification

Use only checks relevant to the task, but never trust stale status for volatile facts.

## Git
- Verify remote HEAD of `company-intelligence-preview`.
- Verify PR #13 is open/unmerged unless explicitly authorized otherwise.
- Verify `main` and PR #12 were not modified by the current work.
- Inspect commits newer than the stored STATUS SHA; preserve legitimate work.
- If a working tree exists, verify it before editing/committing.

## Private deployment
- Confirm target project is `vashudevan-intelligence-preview`, not the public VMG project.
- Record deploy ID/state.
- Verify source provenance: deployed commit/ref, or explicitly record `commit_ref=null`.
- Compare deployed function inventory with current branch when provenance is weak.
- Never treat an unknown preview URL as auth.

## Supabase
Dedicated project currently expected: `xocwnbbltltmbxzdvdfy`; verify before mutation.

Useful proof:
```sql
select public.vmg_system_security_health();
select provider,status,health,last_verified_at,selected_model,provider_metadata
from public.provider_connections order by provider;
```

Expected security-health conditions: table count complete, RLS true, browser roles denied, Vault RPCs service-role-only, private bucket true.

## Provider readiness
Live research is ready only when:
Database + migrations/security + Vault + Storage + Gemini + Google Search grounding are genuinely verified.

## Documentation
If reality differs materially from `STATUS.md`, update STATUS in the same safe branch. Never “fix” reality to match stale docs.
