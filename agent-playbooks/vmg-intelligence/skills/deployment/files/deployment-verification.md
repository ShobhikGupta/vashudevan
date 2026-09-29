# Deployment Verification

PASS requires:
- intended target is the separate private intelligence Netlify project,
- public VMG project was not modified,
- deploy reached ready/success,
- deployed source is tied to the expected commit/ref or reconciled file inventory,
- `/api/system-health` reports expected infrastructure state after authenticated access,
- unauthenticated private API access fails,
- no secret appears in deploy secret scan/log/client bundle,
- critical workflow loads after deployment.

Current special case: the Sep 23 private deploy has `commit_ref=null` and includes a live `provider-admin-security` function absent from current GitHub HEAD. Reconcile before replacing it.
