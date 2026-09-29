# Architecture Reference

## Request/data paths

**Normal app request**  
Browser → Netlify edge app gate → static `intelligence/` or authenticated Netlify Function.

**Business data**  
Browser → Netlify Function → Supabase REST/Data API using server-only secret. Browser roles have no VMG business-table DML.

**Research**  
Resolve entity → create job → optional PREPARING document lifecycle → QUEUED → background function atomically claims RUNNING → provider research/synthesis → evidence/sources/report persistence → COMPLETE/PARTIAL/FAILED.

**Documents**  
Browser requests upload authorization → server selects private Storage path → browser uploads direct to Supabase Storage → server finalizes object → background local parser extracts PDF/DOCX/XLSX/CSV → READY/PARTIAL/FAILED/NOT_ALLOWED → research starts only when required documents are ready.

**Exports**  
Authenticated request → server fetches one workspace-scoped report/evidence/sources → generates native PDF/DOCX/XLSX.

## Auth

App session is signed server-side and stored in an HttpOnly/Secure/SameSite=Strict cookie. Settings/admin mutations use a separate signed admin session.

## Deployment separation

Public VMG and private Company Intelligence are separate Netlify projects. `netlify.toml` publishes `intelligence`, which is appropriate for the private project/PR preview but must not be merged into the public-site production path without deliberate architecture change and explicit approval.
