-- VMG Company Intelligence V1: provider credential rotation/security hardening.
-- Preserves the live Supabase state introduced during private-deployment security QA.

alter table public.provider_connections
  add column if not exists last_error_safe text;

create or replace function public.vmg_store_provider_secret(
  p_workspace_id uuid,
  p_provider text,
  p_secret text,
  p_masked_suffix text,
  p_selected_model text,
  p_billing_mode text default 'free',
  p_metadata jsonb default '{}'::jsonb
) returns public.provider_connections
language plpgsql
security definer
set search_path = public, vault, pg_catalog
as $$
declare
  existing public.provider_connections;
  sid uuid;
  result public.provider_connections;
begin
  if p_provider not in ('gemini','tavily','openai') then raise exception 'Unsupported provider'; end if;
  if p_secret is null or length(btrim(p_secret)) < 8 then raise exception 'Credential format is not valid'; end if;

  select * into existing
  from public.provider_connections
  where workspace_id=p_workspace_id and provider=p_provider
  for update;

  if existing.vault_secret_id is not null then
    perform vault.update_secret(
      existing.vault_secret_id,
      p_secret,
      'vmg_'||p_workspace_id::text||'_'||p_provider,
      'VMG Company Intelligence provider credential'
    );
    sid:=existing.vault_secret_id;
  else
    sid:=vault.create_secret(
      p_secret,
      'vmg_'||p_workspace_id::text||'_'||p_provider,
      'VMG Company Intelligence provider credential'
    );
  end if;

  insert into public.provider_connections(
    workspace_id,provider,vault_secret_id,masked_suffix,status,selected_model,
    billing_mode,connected_at,last_verified_at,health,last_error_safe,
    provider_metadata,updated_at
  ) values(
    p_workspace_id,p_provider,sid,null,'CONNECTED',p_selected_model,
    coalesce(p_billing_mode,'unknown'),now(),now(),'CONNECTED',null,
    coalesce(p_metadata,'{}'::jsonb),now()
  )
  on conflict(workspace_id,provider) do update set
    vault_secret_id=excluded.vault_secret_id,
    masked_suffix=null,
    status='CONNECTED',
    selected_model=excluded.selected_model,
    billing_mode=excluded.billing_mode,
    connected_at=coalesce(public.provider_connections.connected_at,now()),
    last_verified_at=now(),
    health='CONNECTED',
    last_error_safe=null,
    provider_metadata=excluded.provider_metadata,
    updated_at=now()
  returning * into result;
  return result;
end $$;

create or replace function public.vmg_get_provider_secret(
  p_workspace_id uuid,
  p_provider text
) returns text
language sql
security definer
set search_path = public, vault, pg_catalog
as $$
  select ds.decrypted_secret
  from public.provider_connections pc
  join vault.decrypted_secrets ds on ds.id=pc.vault_secret_id
  where pc.workspace_id=p_workspace_id and pc.provider=p_provider
  limit 1;
$$;

create or replace function public.vmg_disconnect_provider(
  p_workspace_id uuid,
  p_provider text
) returns boolean
language plpgsql
security definer
set search_path = public, vault, pg_catalog
as $$
declare sid uuid;
begin
  if p_provider not in ('gemini','tavily','openai') then raise exception 'Unsupported provider'; end if;
  select vault_secret_id into sid
  from public.provider_connections
  where workspace_id=p_workspace_id and provider=p_provider
  for update;
  if sid is not null then delete from vault.secrets where id=sid; end if;
  update public.provider_connections set
    vault_secret_id=null,masked_suffix=null,status='NOT_CONNECTED',health='NOT_CONNECTED',
    last_error_safe=null,last_verified_at=null,last_latency_ms=null,updated_at=now()
  where workspace_id=p_workspace_id and provider=p_provider;
  return true;
end $$;

create or replace function public.vmg_provider_admin_rate_limit(
  p_workspace_id uuid,
  p_provider text,
  p_operation text,
  p_limit integer default 10,
  p_window_seconds integer default 600
) returns boolean
language plpgsql
security definer
set search_path = public, vault, pg_catalog
as $$
declare attempts integer;
begin
  if p_provider not in ('gemini','tavily','openai') then raise exception 'Unsupported provider'; end if;
  if p_limit < 1 or p_limit > 100 or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_workspace_id::text||':'||p_provider,0));
  select count(*) into attempts
  from public.activity_logs
  where workspace_id=p_workspace_id
    and action='PROVIDER_ADMIN_ATTEMPT'
    and metadata->>'provider'=p_provider
    and created_at >= now()-make_interval(secs=>p_window_seconds);

  if attempts >= p_limit then return false; end if;
  insert into public.activity_logs(workspace_id,action,metadata)
  values(p_workspace_id,'PROVIDER_ADMIN_ATTEMPT',jsonb_build_object(
    'actor','vmg_admin_session','provider',p_provider,
    'operation',left(coalesce(p_operation,'unknown'),40),'result','ACCEPTED'
  ));
  return true;
end $$;

revoke all on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.vmg_get_provider_secret(uuid,text) from public, anon, authenticated;
revoke all on function public.vmg_disconnect_provider(uuid,text) from public, anon, authenticated;
revoke all on function public.vmg_provider_admin_rate_limit(uuid,text,text,integer,integer) from public, anon, authenticated;

grant execute on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.vmg_get_provider_secret(uuid,text) to service_role;
grant execute on function public.vmg_disconnect_provider(uuid,text) to service_role;
grant execute on function public.vmg_provider_admin_rate_limit(uuid,text,text,integer,integer) to service_role;
