-- VMG Company Intelligence V1: security hardening, explicit Data API grants and document lifecycle.
-- Run after 001_company_intelligence.sql and 002_provider_connections_and_settings.sql.

alter table public.research_jobs add column if not exists preparation_completed_at timestamptz;

alter table public.attachments add column if not exists upload_status text not null default 'UPLOADED';
alter table public.attachments add column if not exists parse_status text not null default 'QUEUED';
alter table public.attachments add column if not exists extraction_metadata jsonb not null default '{}'::jsonb;
alter table public.attachments add column if not exists uploaded_at timestamptz;
alter table public.attachments add column if not exists parse_started_at timestamptz;
alter table public.attachments add column if not exists parsed_at timestamptz;
alter table public.attachments add column if not exists parse_error text;

create unique index if not exists uq_attachments_storage_path on public.attachments(storage_path);
create unique index if not exists uq_research_reports_job on public.research_reports(research_job_id);

create table if not exists public.attachment_extractions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  segment_type text not null default 'text',
  page_number int,
  sheet_name text,
  row_start int,
  row_end int,
  extracted_text text not null,
  extraction_method text not null,
  extracted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_attachment_extractions_attachment on public.attachment_extractions(attachment_id,id);
alter table public.attachment_extractions enable row level security;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'company-documents','company-documents',false,20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv','image/jpeg','image/png','image/webp'
  ]::text[]
)
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- RLS and SQL privileges are separate. The browser roles receive no VMG business-data privileges.
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
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all privileges on table public.%I from anon, authenticated',t);
    execute format('grant select, insert, update, delete on table public.%I to service_role',t);
  end loop;
end $$;

revoke all privileges on all sequences in schema public from anon, authenticated;
grant usage, select on all sequences in schema public to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Provider-secret functions remain service-role only.
revoke all on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.vmg_get_provider_secret(uuid,text) from public, anon, authenticated;
revoke all on function public.vmg_disconnect_provider(uuid,text) from public, anon, authenticated;
grant execute on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.vmg_get_provider_secret(uuid,text) to service_role;
grant execute on function public.vmg_disconnect_provider(uuid,text) to service_role;
