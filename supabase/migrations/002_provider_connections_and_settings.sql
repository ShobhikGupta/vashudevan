-- VMG Company Intelligence V1 — provider connections and workspace settings
-- Secrets are encrypted with Supabase Vault. Only service_role may call the secret RPCs.

create extension if not exists supabase_vault with schema vault;

create table if not exists provider_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null check (provider in ('gemini','tavily','openai')),
  vault_secret_id uuid,
  masked_suffix text,
  status text not null default 'NOT_CONNECTED',
  selected_model text,
  billing_mode text not null default 'free' check (billing_mode in ('free','paid','unknown')),
  connected_at timestamptz,
  last_verified_at timestamptz,
  last_latency_ms int,
  health text not null default 'NOT_CONNECTED',
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,provider)
);

create table if not exists workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  settings_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table provider_connections enable row level security;
alter table workspace_settings enable row level security;

insert into workspace_settings(workspace_id,settings_json)
select id, jsonb_build_object(
  'ai_strategy','free_first',
  'primary_ai','gemini',
  'primary_search','google_grounding',
  'fallback_search','tavily',
  'second_opinion','none',
  'research_defaults',jsonb_build_object(
    'default_mode','deep',
    'default_template','vmg_full_due_diligence',
    'minimum_preferred_sources',5,
    'negative_signals',true,
    'directors_promoters',true,
    'credit_ratings',true,
    'debt_charges',true,
    'litigation_insolvency',true,
    'imports_exports',true,
    'buyers_suppliers',true,
    'competitors',true,
    'procurement',true,
    'follow_related_entities',true,
    'tavily_when_weak',true,
    'automatically_use_paid_provider',false
  ),
  'cost_protection',jsonb_build_object(
    'free_only_mode',true,
    'allow_paid_api_usage',false,
    'auto_switch_paid_provider',false,
    'max_cost_per_report_inr',0,
    'daily_budget_inr',0,
    'weekly_budget_inr',0,
    'monthly_budget_inr',0
  ),
  'alerts',jsonb_build_object(
    'warn_70',false,'warn_80',true,'warn_90',true,
    'quota_low',true,'quota_exhausted',true,'provider_disconnected',true,
    'auth_error',true,'research_completed',true,'research_failed',true,
    'partial_evidence',true,'budget_threshold',true
  ),
  'privacy',jsonb_build_object(
    'store_source_snapshots',true,'store_research_history',true,'preserve_report_versions',true,
    'public_document_ai',true,'private_document_ai',false
  ),
  'report_defaults',jsonb_build_object(
    'template','vmg_full_due_diligence','executive_summary',true,'five_year_financials',true,
    'graphs',true,'evidence_labels',true,'sources',true,'information_gaps',true,
    'credit_safety',true,'procurement_opportunity',true,'competitor_analysis',true,
    'management_takeaways',true,'pdf',true,'docx',true,'xlsx',true
  ),
  'daily_company_limit',20
)
from workspaces where slug='VMG'
on conflict(workspace_id) do nothing;

create or replace function public.vmg_store_provider_secret(
  p_workspace_id uuid,
  p_provider text,
  p_secret text,
  p_masked_suffix text,
  p_selected_model text,
  p_billing_mode text default 'free',
  p_metadata jsonb default '{}'::jsonb
) returns provider_connections
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  existing provider_connections;
  sid uuid;
  result provider_connections;
begin
  if p_provider not in ('gemini','tavily','openai') then raise exception 'Unsupported provider'; end if;
  select * into existing from provider_connections where workspace_id=p_workspace_id and provider=p_provider for update;
  if existing.vault_secret_id is not null then
    perform vault.update_secret(existing.vault_secret_id,p_secret,'vmg_'||p_workspace_id::text||'_'||p_provider,'VMG Company Intelligence provider credential');
    sid:=existing.vault_secret_id;
  else
    sid:=vault.create_secret(p_secret,'vmg_'||p_workspace_id::text||'_'||p_provider,'VMG Company Intelligence provider credential');
  end if;

  insert into provider_connections(workspace_id,provider,vault_secret_id,masked_suffix,status,selected_model,billing_mode,connected_at,last_verified_at,health,provider_metadata,updated_at)
  values(p_workspace_id,p_provider,sid,p_masked_suffix,'CONNECTED',p_selected_model,coalesce(p_billing_mode,'unknown'),now(),now(),'CONNECTED',coalesce(p_metadata,'{}'::jsonb),now())
  on conflict(workspace_id,provider) do update set
    vault_secret_id=excluded.vault_secret_id,masked_suffix=excluded.masked_suffix,status='CONNECTED',
    selected_model=excluded.selected_model,billing_mode=excluded.billing_mode,connected_at=coalesce(provider_connections.connected_at,now()),
    last_verified_at=now(),health='CONNECTED',provider_metadata=excluded.provider_metadata,updated_at=now()
  returning * into result;
  return result;
end $$;

create or replace function public.vmg_get_provider_secret(p_workspace_id uuid,p_provider text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select ds.decrypted_secret
  from provider_connections pc
  join vault.decrypted_secrets ds on ds.id=pc.vault_secret_id
  where pc.workspace_id=p_workspace_id and pc.provider=p_provider and pc.status='CONNECTED'
  limit 1;
$$;

create or replace function public.vmg_disconnect_provider(p_workspace_id uuid,p_provider text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare sid uuid;
begin
  select vault_secret_id into sid from provider_connections where workspace_id=p_workspace_id and provider=p_provider for update;
  if sid is not null then delete from vault.secrets where id=sid; end if;
  update provider_connections set vault_secret_id=null,masked_suffix=null,status='NOT_CONNECTED',health='NOT_CONNECTED',updated_at=now()
  where workspace_id=p_workspace_id and provider=p_provider;
  return true;
end $$;

revoke all on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.vmg_get_provider_secret(uuid,text) from public, anon, authenticated;
revoke all on function public.vmg_disconnect_provider(uuid,text) from public, anon, authenticated;
grant execute on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.vmg_get_provider_secret(uuid,text) to service_role;
grant execute on function public.vmg_disconnect_provider(uuid,text) to service_role;

create index if not exists idx_provider_connections_workspace on provider_connections(workspace_id,provider);
