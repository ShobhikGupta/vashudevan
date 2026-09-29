-- VMG Company Intelligence V1: provider verification state hardening.
-- Storing a credential no longer marks it CONNECTED. The application must verify the
-- stored Vault value successfully before setting CONNECTED.

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
    p_workspace_id,p_provider,sid,p_masked_suffix,'CONFIGURED',p_selected_model,
    coalesce(p_billing_mode,'unknown'),coalesce(existing.connected_at,now()),null,
    'CONFIGURED',null,coalesce(p_metadata,'{}'::jsonb),now()
  )
  on conflict(workspace_id,provider) do update set
    vault_secret_id=excluded.vault_secret_id,
    masked_suffix=excluded.masked_suffix,
    status='CONFIGURED',
    selected_model=excluded.selected_model,
    billing_mode=excluded.billing_mode,
    connected_at=coalesce(public.provider_connections.connected_at,now()),
    last_verified_at=null,
    last_latency_ms=null,
    health='CONFIGURED',
    last_error_safe=null,
    provider_metadata=excluded.provider_metadata,
    updated_at=now()
  returning * into result;
  return result;
end $$;

revoke all on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.vmg_store_provider_secret(uuid,text,text,text,text,text,jsonb) to service_role;
