-- Align declared function volatility with the routines each function calls.
-- This is deliberately conservative: marking a function STABLE or VOLATILE
-- removes planner assumptions; it does not grant the routine any new access or
-- weaken its row and actor checks.

-- Authenticated teacher reads begin with the account-access assertion. That
-- assertion is VOLATILE, so the wrapper must not promise STABLE semantics.
alter function public.teacher_class_access_summary(uuid) volatile;
alter function public.teacher_class_access_log(uuid, integer) volatile;
alter function public.teacher_get_reading_session_presence(uuid) volatile;
alter function public.teacher_get_live_lesson_snapshot(uuid) volatile;
alter function public.teacher_get_active_live_lesson() volatile;
alter function public.teacher_list_press_work(uuid) volatile;
alter function public.teacher_resolve_worksheet_code(text) volatile;
alter function public.teacher_read_worksheet_history(uuid) volatile;
alter function public.teacher_read_lesson_plan(uuid) volatile;

-- These JSON transforms call PostgreSQL routines classified as STABLE. They
-- remain deterministic for LiteracyPath, but STABLE is the strongest database
-- promise their complete call graph can safely make.
alter function public.lp_jsonb_forward_merge(jsonb, jsonb) stable;
alter function public.lp_quest_union_by_id(jsonb, jsonb) stable;
alter function public.lp_quest_merge_mastery_record(jsonb, jsonb) stable;
alter function public.lp_merge_hollow(jsonb, jsonb) stable;
alter function public.lp_merge_daily_mission(jsonb, jsonb) stable;
alter function public.lp_merge_phonics_quest(jsonb, jsonb) stable;
alter function public.lp_merge_reading_passport(jsonb, jsonb) stable;
alter function public.redact_learner_jsonb(jsonb, uuid, text) stable;
alter function public.jsonb_strip_student_entries(jsonb, text) stable;
-- PL/pgSQL creates integer FOR-loop variables itself. Removing duplicate
-- declarations clears shadowed/unused-variable warnings without changing either
-- algorithm.
create or replace function public.gen_class_access_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(
        v_alphabet,
        1 + floor(random() * length(v_alphabet))::int,
        1
      );
    end loop;
    select exists (
      select 1 from public.classes where access_code = v_code
    ) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;
create or replace function public.class_access_rate_limit_status(
  p_device_id text,
  p_code text
)
returns json
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_dimensions text[] := array['device', 'network', 'code'];
  v_values text[];
  v_thresholds integer[] := array[10, 60, 120];
  v_bucket public.class_access_rate_limits;
  v_key text;
  v_retry_seconds integer := 0;
  v_blocked_dimension text := null;
begin
  if p_device_id is null
    or p_device_id !~ '^[A-Za-z0-9._:-]{16,120}$'
  then
    return json_build_object('ok', false, 'error', 'invalid_device');
  end if;

  v_values := array[
    public.class_access_fingerprint('device', p_device_id),
    public.class_access_network_fingerprint(),
    public.class_access_fingerprint('code', upper(btrim(coalesce(p_code, ''))))
  ];

  for v_index in 1..3 loop
    v_key := public.class_access_fingerprint(
      'bucket',
      v_dimensions[v_index] || ':' || v_values[v_index]
    );

    insert into public.class_access_rate_limits (
      bucket_key,
      dimension,
      attempt_count,
      window_started_at,
      locked_until,
      updated_at
    ) values (
      v_key,
      v_dimensions[v_index],
      1,
      now(),
      null,
      now()
    )
    on conflict (bucket_key)
    do update set
      attempt_count = case
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then 1
        else class_access_rate_limits.attempt_count + 1
      end,
      window_started_at = case
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then now()
        else class_access_rate_limits.window_started_at
      end,
      locked_until = case
        when class_access_rate_limits.locked_until > now()
          then class_access_rate_limits.locked_until
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then null
        else class_access_rate_limits.locked_until
      end,
      updated_at = now()
    returning * into v_bucket;

    if v_bucket.locked_until > now()
      or v_bucket.attempt_count > v_thresholds[v_index]
    then
      if v_bucket.locked_until is null or v_bucket.locked_until <= now() then
        update public.class_access_rate_limits
        set
          locked_until = now() + interval '2 minutes',
          updated_at = now()
        where bucket_key = v_key
        returning * into v_bucket;
      end if;

      if v_blocked_dimension is null then
        v_blocked_dimension := v_dimensions[v_index];
      end if;
      v_retry_seconds := greatest(
        v_retry_seconds,
        ceil(extract(epoch from (v_bucket.locked_until - now())))::integer
      );
    end if;
  end loop;

  if v_blocked_dimension is not null then
    return json_build_object(
      'ok', false,
      'error', 'rate_limited',
      'dimension', v_blocked_dimension,
      'retry_seconds', greatest(v_retry_seconds, 1)
    );
  end if;

  return json_build_object('ok', true);
end;
$$;
