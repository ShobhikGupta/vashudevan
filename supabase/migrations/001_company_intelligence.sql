-- VMG Company Intelligence V1
-- Apply to a dedicated Supabase project, not the public VMG website databases.

create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  legal_name text not null,
  brand text,
  country text,
  state_region text,
  website text,
  status text not null default 'ACTIVE',
  current_report_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, legal_name)
);

create table if not exists company_identifiers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  identifier_type text not null,
  identifier_value text not null,
  created_at timestamptz not null default now()
);

create table if not exists research_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  template_key text not null,
  name text not null,
  description text,
  prompt_text text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique(workspace_id, template_key)
);

create table if not exists research_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  template_key text not null,
  custom_prompt text,
  input_seed jsonb not null default '{}'::jsonb,
  provider text,
  status text not null default 'QUEUED',
  usage_day text,
  is_full_research boolean not null default true,
  source_count int not null default 0,
  evidence_coverage int,
  report_id uuid,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists research_job_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  research_job_id uuid not null references research_jobs(id) on delete cascade,
  stage_no int not null,
  stage_key text not null,
  stage_name text not null,
  status text not null default 'QUEUED',
  result_json jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(research_job_id, stage_no)
);

create table if not exists research_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  research_job_id uuid references research_jobs(id) on delete set null,
  version_no int not null,
  template_key text,
  report_json jsonb not null default '{}'::jsonb,
  evidence_coverage int,
  source_count int not null default 0,
  created_at timestamptz not null default now(),
  unique(company_id, version_no)
);

create table if not exists report_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  report_id uuid not null references research_reports(id) on delete cascade,
  version_no int not null,
  created_at timestamptz not null default now()
);

alter table companies drop constraint if exists companies_current_report_id_fkey;
alter table companies add constraint companies_current_report_id_fkey foreign key (current_report_id) references research_reports(id) on delete set null;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  research_job_id uuid references research_jobs(id) on delete cascade,
  title text,
  url text not null,
  publisher text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  source_type text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists source_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  excerpt text,
  created_at timestamptz not null default now()
);

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  research_job_id uuid references research_jobs(id) on delete set null,
  report_id uuid references research_reports(id) on delete cascade,
  finding_key text not null,
  label text,
  value_json jsonb,
  period text,
  evidence_class text not null,
  confidence text not null,
  notes text,
  conflict_status text not null default 'NONE',
  source_keys uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists financial_periods (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  report_id uuid references research_reports(id) on delete cascade,
  period_label text not null,
  period_end date,
  created_at timestamptz not null default now()
);

create table if not exists financial_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  financial_period_id uuid references financial_periods(id) on delete cascade,
  metric_key text not null,
  value_numeric numeric,
  value_text text,
  currency text,
  unit text,
  evidence_class text,
  confidence text,
  source_keys uuid[] not null default '{}'
);

create table if not exists directors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  identifier text,
  role text,
  appointed_at date,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists ownership_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  owner_name text not null,
  ownership_percent numeric,
  evidence_class text,
  source_keys uuid[] not null default '{}'
);

create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  facility_type text,
  name text,
  address text,
  products text[],
  installed_capacity text,
  actual_output text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  category text,
  specification text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists borrowings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  lender text,
  borrowing_type text,
  amount numeric,
  currency text,
  as_of_date date,
  evidence_class text,
  source_keys uuid[] not null default '{}'
);

create table if not exists charges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  lender text,
  charge_amount numeric,
  currency text,
  created_date date,
  modified_date date,
  satisfied_date date,
  status text,
  security text,
  charge_identifier text,
  source_keys uuid[] not null default '{}'
);

create table if not exists credit_ratings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  agency text,
  rating_date date,
  facility text,
  facility_amount numeric,
  currency text,
  rating text,
  outlook text,
  rationale text,
  source_keys uuid[] not null default '{}'
);

create table if not exists legal_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  event_type text,
  authority text,
  case_number text,
  event_date date,
  amount numeric,
  currency text,
  status text,
  summary text,
  source_keys uuid[] not null default '{}'
);

create table if not exists trade_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  direction text,
  counterparty text,
  country text,
  product text,
  hs_code text,
  quantity numeric,
  quantity_unit text,
  value numeric,
  currency text,
  transaction_date date,
  coverage_type text,
  source_keys uuid[] not null default '{}'
);

create table if not exists counterparties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  counterparty_name text not null,
  relationship_type text,
  country text,
  evidence_class text,
  confidence text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  competitor_name text not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists procurement_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  material text not null,
  reason text,
  estimated_quantity text,
  estimated_spend text,
  period text,
  evidence_class text,
  confidence text,
  calculation text,
  source_keys uuid[] not null default '{}'
);

create table if not exists risk_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  report_id uuid references research_reports(id) on delete cascade,
  category text,
  severity text,
  finding text,
  evidence_class text,
  confidence text,
  source_keys uuid[] not null default '{}'
);

create table if not exists opportunity_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  report_id uuid references research_reports(id) on delete cascade,
  opportunity_type text,
  finding text,
  evidence_class text,
  confidence text,
  source_keys uuid[] not null default '{}'
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  research_job_id uuid references research_jobs(id) on delete set null,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  public_private text not null default 'private',
  external_ai_allowed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  report_id uuid not null references research_reports(id) on delete cascade,
  export_type text not null,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists provider_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  research_job_id uuid references research_jobs(id) on delete set null,
  usage_day text not null,
  provider text not null,
  model text,
  operation text not null,
  request_count int not null default 1,
  search_calls int not null default 0,
  tavily_credits numeric not null default 0,
  success boolean not null default true,
  prompt_tokens bigint,
  output_tokens bigint,
  duration_ms int,
  estimated_cost_usd numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  action text not null,
  company_id uuid references companies(id) on delete set null,
  research_job_id uuid references research_jobs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_companies_workspace on companies(workspace_id);
create unique index if not exists uq_company_identifier_normalized
  on company_identifiers(workspace_id, lower(identifier_type), upper(identifier_value));
create unique index if not exists uq_company_name_jurisdiction_normalized
  on companies(
    workspace_id,
    regexp_replace(lower(legal_name), '[^a-z0-9]+', '', 'g'),
    coalesce(lower(country),'')
  );
create index if not exists idx_jobs_workspace_day on research_jobs(workspace_id, usage_day);
create index if not exists idx_stages_job on research_job_stages(research_job_id, stage_no);
create index if not exists idx_reports_company on research_reports(company_id, version_no desc);
create index if not exists idx_sources_job on sources(research_job_id);
create index if not exists idx_evidence_report on evidence_items(report_id);
create index if not exists idx_usage_day on provider_usage(workspace_id, usage_day);
create index if not exists idx_usage_job on provider_usage(research_job_id, created_at);

insert into workspaces(slug,name) values ('VMG','Vashudevan MetGlobal LLP') on conflict(slug) do nothing;

insert into research_templates(workspace_id,template_key,name,description,prompt_text,is_system)
select w.id, x.template_key, x.name, x.description, '', true
from workspaces w
cross join (values
 ('vmg_full_due_diligence','VMG Full Due Diligence','Full business, operational, financial, trade, legal and credit review.'),
 ('credit_counterparty_safety','Credit / Counterparty Safety','Debt, cash, payment behaviour, recovery and rating focus.'),
 ('supplier_due_diligence','Supplier Due Diligence','Supply capability, operations, financial resilience and reliability.'),
 ('buyer_intelligence','Buyer Intelligence','Demand potential, purchasing activity and payment safety.'),
 ('procurement_opportunity','Procurement Opportunity','What the target buys and where VMG may fit.'),
 ('quick_company_check','Quick Company Check','Lower-call initial screening before full research.')
) as x(template_key,name,description)
where w.slug='VMG'
on conflict(workspace_id,template_key) do nothing;

-- RLS is enabled even though V1 server-side access uses a secret/service-role key.
-- When Supabase Auth is added, create explicit authenticated policies scoped by workspace.
do $$
declare t text;
begin
  foreach t in array array[
    'workspaces','companies','company_identifiers','research_templates','research_jobs','research_job_stages',
    'research_reports','report_versions','sources','source_snapshots','evidence_items','financial_periods',
    'financial_metrics','directors','ownership_records','facilities','products','borrowings','charges',
    'credit_ratings','legal_events','trade_findings','counterparties','competitors','procurement_items',
    'risk_findings','opportunity_findings','attachments','exports','provider_usage','activity_logs'
  ]
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit)
values ('company-documents','company-documents',false,20971520)
on conflict(id) do nothing;
