-- VMG Company Intelligence V1: explicit browser-deny RLS policies.
-- These policies intentionally keep anon/authenticated at zero-row access even if privileges are accidentally granted later.

do $$
declare t text;
begin
  foreach t in array array[
    'workspaces','companies','company_identifiers','research_templates','research_jobs','research_job_stages',
    'research_reports','report_versions','sources','source_snapshots','evidence_items','financial_periods',
    'financial_metrics','directors','ownership_records','facilities','products','borrowings','charges',
    'credit_ratings','legal_events','trade_findings','counterparties','competitors','procurement_items',
    'risk_findings','opportunity_findings','attachments','attachment_extractions','exports','provider_usage',
    'activity_logs','provider_connections','workspace_settings'
  ]
  loop
    execute format('drop policy if exists vmg_browser_deny on public.%I',t);
    execute format(
      'create policy vmg_browser_deny on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      t
    );
  end loop;
end $$;

-- Storage stays private and browser roles receive no direct company-documents object policies.
drop policy if exists vmg_company_documents_browser_deny on storage.objects;
create policy vmg_company_documents_browser_deny
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'company-documents')
with check (bucket_id <> 'company-documents');
