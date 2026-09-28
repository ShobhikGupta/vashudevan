# Proof Matrix

| Area | Minimum objective proof |
|---|---|
| Code | relevant syntax/type/build/tests pass |
| Git | correct branch/commit; no unintended main/PR12/public change |
| Deploy | intended private target ready and source provenance known |
| API | endpoint returns expected success/error behavior |
| Auth | unauthenticated private API fails; session behaviors exercised |
| Database | real query confirms schema/data/security state |
| Storage | private bucket + access behavior tested |
| Security | no secret exposure; grants/RLS/Vault proven |
| Browser | actual workflow exercised |
| Persistence | refresh/reopen retains correct report |
| Export | native file opens and matches company/version |
| Mobile | relevant workflow exercised at mobile width |
| Research | entity/source/period/UNKNOWN/isolation checks pass |

Only applicable rows are required for a task. Never mark unexercised rows PASS.
