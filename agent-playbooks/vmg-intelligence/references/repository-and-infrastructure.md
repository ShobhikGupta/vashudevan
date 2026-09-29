# Repository and Infrastructure Reference

Repository: `ShobhikGupta/vashudevan`  
Safe intelligence branch historically/currently: `company-intelligence-preview`  
PR: #13, “Temporary preview: Vashudevan Intelligence V1”  
Public production branch: `main`  
PR #12 belongs to separate public-site work.

## Netlify

Public site project:
- name: `exquisite-hotteok-531d58`
- site ID: `a143e936-de46-486e-a1e0-30e595d2e058`
- public domain: `vashudevan.com`

Private intelligence project:
- name: `vashudevan-intelligence-preview`
- site ID: `1e4f8e5b-a82d-4c71-8016-2d99a284704f`

These identifiers are operational aids, not permission to deploy. Verify current state every run.

## Supabase

Dedicated project currently: `VMG Company Intelligence`  
Ref: `xocwnbbltltmbxzdvdfy`  
Region: `ap-south-1`

Required server environment names include:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ACCESS_SECRET`
- `SETTINGS_ADMIN_SECRET`
- optional `APP_ENV`
- optional `RESEARCH_DAILY_COMPANY_LIMIT`
- fallback provider envs only if deliberately used

Never record values here.
