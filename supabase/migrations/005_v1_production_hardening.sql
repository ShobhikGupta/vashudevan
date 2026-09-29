-- VMG Company Intelligence V1: production hardening and live security-health verification.

-- The normalized name + jurisdiction index is the intended identity fallback. The original
-- exact-name constraint was too strict for unrelated companies sharing a legal name in different countries.
alter table public.companies drop constraint if exists companies_workspace_id_legal_name_key;

-- Add covering indexes for single-column foreign keys used by deletes, profile views and report history.
do $$
declare r record;
declare index_name text;
begin
  for r in
    select c.conrelid::regclass as table_ref, cls.relname as table_name, a.attname as column_name
    from pg_constraint c
    join pg_class cls on cls.oid=c.conrelid
    join pg_namespace n on n.oid=cls.relnamespace
    join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    where c.contype='f' and n.nspname='public' and array_length(c.conkey,1)=1
  loop
    index_name:=left('idx_'||r.table_name||'_'||r.column_name,50)||'_'||substr(md5(r.table_name||'.'||r.column_name),1,8);
    execute format('create index if not exists %I on %s (%I)',index_name,r.table_ref,r.column_name);
  end loop;
end $$;

create or replace function public.vmg_system_security_health()
returns jsonb
language sql
security definer
set search_path = public, storage, pg_catalog
as $$
  with expected(table_name) as (
    values
      ('workspaces'),('companies'),('company_identifiers'),('research_templates'),('research_jobs'),
      ('research_job_stages'),('research_reports'),('report_versions'),('sources'),('source_snapshots'),
      ('evidence_items'),('financial_periods'),('financial_metrics'),('directors'),('ownership_records'),
      ('facilities'),('products'),('borrowings'),('charges'),('credit_ratings'),('legal_events'),
      ('trade_findings'),('counterparties'),('competitors'),('procurement_items'),('risk_findings'),
      ('opportunity_findings'),('attachments'),('attachment_extractions'),('exports'),('provider_usage'),
      ('activity_logs'),('provider_connections'),('workspace_settings')
  ), table_state as (
    select count(*)::int expected_count,
           count(c.oid)::int present_count,
           coalesce(bool_and(c.relrowsecurity),false) rls_enabled
    from expected e
    left join pg_class c on c.relname=e.table_name and c.relnamespace='public'::regnamespace
  ), browser_grants as (
    select count(*)::int grant_count
    from information_schema.role_table_grants
    where table_schema='public' and grantee in ('anon','authenticated')
  ), provider_rpcs as (
    select count(*)::int rpc_count,
           coalesce(bool_and(
             has_function_privilege('service_role',p.oid,'EXECUTE') and
             not has_function_privilege('anon',p.oid,'EXECUTE') and
             not has_function_privilege('authenticated',p.oid,'EXECUTE') and
             p.prosecdef
           ),false) service_role_only
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('vmg_store_provider_secret','vmg_get_provider_secret','vmg_disconnect_provider')
  ), bucket_state as (
    select count(*)::int bucket_count,coalesce(bool_and(public=false),false) private
    from storage.buckets where id='company-documents'
  )
  select jsonb_build_object(
    'expected_table_count',t.expected_count,
    'present_table_count',t.present_count,
    'rls_enabled',t.rls_enabled and t.expected_count=t.present_count,
    'browser_table_grant_count',g.grant_count,
    'browser_roles_denied',g.grant_count=0,
    'provider_rpc_count',p.rpc_count,
    'vault_rpcs_service_role_only',p.rpc_count=3 and p.service_role_only,
    'private_bucket',b.bucket_count=1 and b.private
  )
  from table_state t cross join browser_grants g cross join provider_rpcs p cross join bucket_state b;
$$;

revoke all on function public.vmg_system_security_health() from public, anon, authenticated;
grant execute on function public.vmg_system_security_health() to service_role;
