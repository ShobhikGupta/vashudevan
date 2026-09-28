# VMG Intelligence QA Checklist

Status: PASS / FAIL / BLOCKED / NOT APPLICABLE / NOT TESTED.

## Access and infrastructure
- login / logout / session persistence / expiration
- unauthenticated app/API denial
- Dashboard refresh
- System Connections: DB, migrations/security, Vault, Storage, provider/search
- Admin Settings unlock; wrong secret denied

## Research
- New Research and Quick Research
- Resolve Entity and entity selection
- templates + custom prompt
- research defaults cause intended stages to SKIP, not FAIL
- 24-stage progress reflects honest states
- provider auth failure / quota / partial path
- UNKNOWN/PARTIAL path with no fabricated chart points

## Documents
- upload public/private classification
- direct signed upload; >6 MB resumable path where applicable
- upload/parse progress
- PDF/DOCX/XLSX/CSV local parsing
- image stored-only if no image parser
- private file with external AI disabled produces no external provider transmission

## Reports
- Company Profile tabs/evidence
- Companies filtering
- Reports open
- PDF/DOCX/XLSX native open and correct entity/version
- refresh persistence
- re-run creates V2
- What Changed compares same company only
- Compare 2–5 companies and exposes periods

## Settings/usage
- AI Strategy
- Research Defaults
- Cost Protection
- Alerts
- Privacy
- Report Defaults
- Usage/cost labels estimates correctly

## Failure modes
- slow network
- provider failure
- failed Gemini auth
- no reliable data
- cost limit reached
- direct unauthenticated API call
- expired session

## Viewports
- desktop
- tablet
- mobile
