-- VMG Company Intelligence V1: atomic provider verification sequencing and cooldowns.

create or replace function public.vmg_provider_verification_transition(
  p_workspace_id uuid,
  p_provider text,
  p_sequence_id text,
  p_action text,
  p_attempt integer default 1,
  p_delay_seconds integer default 15,
  p_cooldown_seconds integer default 0,
  p_failure jsonb default null,
  p_latency_ms integer default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  pc public.provider_connections;
  meta jsonb;
  active_id text;
  passed integer;
  in_flight boolean;
  active_attempt integer;
  expires_at timestamptz;
  next_attempt_at timestamptz;
  cooldown_until timestamptz;
  wait_seconds integer;
  cls text;
begin
  if p_provider not in ('gemini','tavily','openai') then raise exception 'Unsupported provider'; end if;
  if p_action not in ('begin','success','failure') then raise exception 'Unsupported verification action'; end if;
  if p_attempt < 1 or p_attempt > 3 then raise exception 'Invalid verification attempt'; end if;
  if p_delay_seconds < 0 or p_delay_seconds > 300 or p_cooldown_seconds < 0 or p_cooldown_seconds > 3600 then raise exception 'Invalid verification timing'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_workspace_id::text||':'||p_provider||':verification',0));

  select * into pc
  from public.provider_connections
  where workspace_id=p_workspace_id and provider=p_provider
  for update;

  if pc.id is null then raise exception 'Provider connection not configured'; end if;

  meta:=coalesce(pc.provider_metadata,'{}'::jsonb);
  active_id:=nullif(meta->>'verification_sequence_id','');
  passed:=coalesce((meta->>'verification_sequence_passed')::integer,0);
  in_flight:=coalesce((meta->>'verification_attempt_in_flight')::boolean,false);
  active_attempt:=coalesce((meta->>'verification_active_attempt')::integer,0);

  begin expires_at:=nullif(meta->>'verification_sequence_expires_at','')::timestamptz; exception when others then expires_at:=null; end;
  begin next_attempt_at:=nullif(meta->>'verification_next_attempt_at','')::timestamptz; exception when others then next_attempt_at:=null; end;
  begin cooldown_until:=nullif(meta->>'verification_cooldown_until','')::timestamptz; exception when others then cooldown_until:=null; end;

  if p_action='begin' then
    if cooldown_until is not null and cooldown_until > now() then
      wait_seconds:=greatest(1,ceil(extract(epoch from (cooldown_until-now())))::integer);
      return jsonb_build_object('accepted',false,'reason','COOLDOWN','retry_after_seconds',wait_seconds);
    end if;

    if p_attempt=1 then
      if active_id is not null and active_id<>p_sequence_id and expires_at is not null and expires_at>now() then
        wait_seconds:=greatest(1,ceil(extract(epoch from (expires_at-now())))::integer);
        return jsonb_build_object('accepted',false,'reason','SEQUENCE_ACTIVE','retry_after_seconds',wait_seconds);
      end if;
      if active_id=p_sequence_id and expires_at is not null and expires_at>now() then
        if in_flight and active_attempt=1 then
          return jsonb_build_object('accepted',false,'reason','ATTEMPT_IN_FLIGHT','retry_after_seconds',5);
        end if;
        return jsonb_build_object('accepted',false,'reason','SEQUENCE_ACTIVE','expected_attempt',passed+1,'retry_after_seconds',greatest(1,ceil(extract(epoch from (expires_at-now())))::integer));
      end if;
      passed:=0;
      meta:=meta||jsonb_build_object(
        'verification_sequence_id',p_sequence_id,
        'verification_sequence_passed',0,
        'stored_verification_passed',false,
        'stored_verification_attempts',0,
        'verification_attempt_in_flight',true,
        'verification_active_attempt',1,
        'verification_started_at',now(),
        'verification_sequence_expires_at',now()+interval '5 minutes',
        'verification_next_attempt_at',null,
        'verification_completed_at',null,
        'last_failure',null
      );
    else
      if active_id is distinct from p_sequence_id then
        return jsonb_build_object('accepted',false,'reason','SEQUENCE_MISMATCH','retry_after_seconds',0);
      end if;
      if passed<>p_attempt-1 then
        return jsonb_build_object('accepted',false,'reason','ATTEMPT_OUT_OF_ORDER','expected_attempt',passed+1,'retry_after_seconds',0);
      end if;
      if in_flight and active_attempt=p_attempt and expires_at is not null and expires_at>now() then
        return jsonb_build_object('accepted',false,'reason','ATTEMPT_IN_FLIGHT','retry_after_seconds',5);
      end if;
      if next_attempt_at is not null and next_attempt_at>now() then
        wait_seconds:=greatest(1,ceil(extract(epoch from (next_attempt_at-now())))::integer);
        return jsonb_build_object('accepted',false,'reason','TOO_EARLY','retry_after_seconds',wait_seconds);
      end if;
      meta:=meta||jsonb_build_object(
        'verification_attempt_in_flight',true,
        'verification_active_attempt',p_attempt,
        'verification_sequence_expires_at',now()+interval '5 minutes'
      );
    end if;

    update public.provider_connections set
      status='VERIFYING',health='VERIFYING',last_error_safe=null,
      provider_metadata=meta,updated_at=now()
    where id=pc.id;

    return jsonb_build_object('accepted',true,'sequence_id',p_sequence_id,'attempt',p_attempt,'passed',passed);
  end if;

  if active_id is distinct from p_sequence_id then
    return jsonb_build_object('accepted',false,'reason','SEQUENCE_MISMATCH');
  end if;

  if p_action='success' then
    if not in_flight or active_attempt<>p_attempt then
      return jsonb_build_object('accepted',false,'reason','ATTEMPT_NOT_ACTIVE');
    end if;
    if p_attempt<>passed+1 then
      return jsonb_build_object('accepted',false,'reason','ATTEMPT_OUT_OF_ORDER','expected_attempt',passed+1);
    end if;

    if p_attempt=3 then
      meta:=meta||jsonb_build_object(
        'verification_sequence_passed',3,
        'stored_verification_passed',true,
        'stored_verification_attempts',3,
        'verification_attempt_in_flight',false,
        'verification_active_attempt',null,
        'verification_sequence_expires_at',null,
        'verification_next_attempt_at',null,
        'verification_cooldown_until',null,
        'verification_completed_at',now(),
        'last_failure',null
      );
      update public.provider_connections set
        status='CONNECTED',health='CONNECTED',last_verified_at=now(),
        last_latency_ms=p_latency_ms,last_error_safe=null,provider_metadata=meta,updated_at=now()
      where id=pc.id;
      return jsonb_build_object('accepted',true,'connected',true,'passed',3,'retry_after_seconds',0);
    end if;

    meta:=meta||jsonb_build_object(
      'verification_sequence_passed',p_attempt,
      'stored_verification_passed',false,
      'stored_verification_attempts',p_attempt,
      'verification_attempt_in_flight',false,
      'verification_active_attempt',null,
      'verification_next_attempt_at',now()+make_interval(secs=>p_delay_seconds),
      'verification_sequence_expires_at',now()+interval '5 minutes',
      'last_failure',null
    );
    update public.provider_connections set
      status='VERIFYING',health='VERIFYING',last_verified_at=now(),
      last_latency_ms=p_latency_ms,last_error_safe=null,provider_metadata=meta,updated_at=now()
    where id=pc.id;
    return jsonb_build_object('accepted',true,'connected',false,'passed',p_attempt,'retry_after_seconds',p_delay_seconds);
  end if;

  cls:=coalesce(p_failure->>'classification','PROVIDER_ERROR');
  cooldown_until:=case when p_cooldown_seconds>0 then now()+make_interval(secs=>p_cooldown_seconds) else null end;
  meta:=meta||jsonb_build_object(
    'verification_sequence_id',null,
    'verification_sequence_passed',0,
    'stored_verification_passed',false,
    'stored_verification_attempts',0,
    'verification_attempt_in_flight',false,
    'verification_active_attempt',null,
    'verification_sequence_expires_at',null,
    'verification_next_attempt_at',null,
    'verification_cooldown_until',cooldown_until,
    'last_failure',coalesce(p_failure,'{}'::jsonb)
  );
  update public.provider_connections set
    status=cls,health=cls,last_verified_at=now(),last_latency_ms=null,
    last_error_safe=case when p_failure is null then null else p_failure::text end,
    provider_metadata=meta,updated_at=now()
  where id=pc.id;

  return jsonb_build_object('accepted',true,'connected',false,'passed',0,'cooldown_until',cooldown_until,'retry_after_seconds',p_cooldown_seconds);
end $$;

revoke all on function public.vmg_provider_verification_transition(uuid,text,text,text,integer,integer,integer,jsonb,integer) from public, anon, authenticated;
grant execute on function public.vmg_provider_verification_transition(uuid,text,text,text,integer,integer,integer,jsonb,integer) to service_role;
