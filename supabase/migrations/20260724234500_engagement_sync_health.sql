alter table public.learn_activity
  add column if not exists client_event_id text,
  add column if not exists occurred_at timestamptz,
  add column if not exists delivery_attempts integer not null default 1;

create unique index if not exists learn_activity_student_client_event_idx
  on public.learn_activity (student_id, client_event_id)
  where client_event_id is not null;

create table if not exists public.activity_sync_health (
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  attempted bigint not null default 0 check (attempted >= 0),
  delivered bigint not null default 0 check (delivered >= 0),
  recovered bigint not null default 0 check (recovered >= 0),
  storage_failures bigint not null default 0 check (storage_failures >= 0),
  pending bigint not null default 0 check (pending >= 0),
  lost bigint not null default 0 check (lost >= 0),
  oldest_pending_at timestamptz,
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, device_id),
  check (delivered <= attempted),
  check (recovered <= delivered),
  check (lost <= attempted),
  check (delivered + pending + lost <= attempted)
);

create index if not exists activity_sync_health_class_idx
  on public.activity_sync_health (class_id, observed_at desc);

alter table public.activity_sync_health enable row level security;
revoke all on public.activity_sync_health from anon;
grant select on public.activity_sync_health to authenticated;

drop policy if exists "Teachers read their class activity sync health"
  on public.activity_sync_health;
create policy "Teachers read their class activity sync health"
  on public.activity_sync_health for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

create or replace function public.student_log_activity_v2(
  p_token text,
  p_client_event_id text,
  p_area text,
  p_item_id text,
  p_event text,
  p_payload jsonb default null,
  p_occurred_at timestamptz default null,
  p_delivery_attempts integer default 1
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if
    nullif(btrim(p_client_event_id), '') is null
    or length(p_client_event_id) > 120
    or nullif(btrim(p_area), '') is null
    or length(p_area) > 80
    or nullif(btrim(p_event), '') is null
    or length(p_event) > 80
    or length(coalesce(p_item_id, '')) > 160
    or octet_length(coalesce(p_payload, '{}'::jsonb)::text) > 16384
    or p_delivery_attempts < 1
    or p_delivery_attempts > 10000
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  insert into public.learn_activity (
    student_id,
    class_id,
    teacher_id,
    client_event_id,
    area,
    item_id,
    event,
    payload,
    occurred_at,
    delivery_attempts
  )
  values (
    v_student.id,
    v_student.class_id,
    v_student.teacher_id,
    p_client_event_id,
    p_area,
    p_item_id,
    p_event,
    p_payload,
    least(coalesce(p_occurred_at, now()), now()),
    p_delivery_attempts
  )
  on conflict (student_id, client_event_id)
    where client_event_id is not null
  do nothing;

  return json_build_object('ok', true);
end;
$$;

create or replace function public.student_report_activity_sync_health(
  p_token text,
  p_device_id text,
  p_attempted bigint,
  p_delivered bigint,
  p_recovered bigint,
  p_storage_failures bigint,
  p_pending bigint,
  p_lost bigint,
  p_oldest_pending_at timestamptz default null
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if
    v_student.class_id is null
    or nullif(btrim(p_device_id), '') is null
    or length(p_device_id) > 120
    or p_attempted < 0
    or p_delivered < 0
    or p_recovered < 0
    or p_storage_failures < 0
    or p_pending < 0
    or p_lost < 0
    or p_delivered > p_attempted
    or p_recovered > p_delivered
    or p_lost > p_attempted
    or p_delivered + p_pending + p_lost > p_attempted
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  insert into public.activity_sync_health (
    student_id,
    class_id,
    teacher_id,
    device_id,
    attempted,
    delivered,
    recovered,
    storage_failures,
    pending,
    lost,
    oldest_pending_at,
    observed_at,
    updated_at
  )
  values (
    v_student.id,
    v_student.class_id,
    v_student.teacher_id,
    p_device_id,
    p_attempted,
    p_delivered,
    p_recovered,
    p_storage_failures,
    p_pending,
    p_lost,
    case
      when p_oldest_pending_at is null then null
      else least(p_oldest_pending_at, now())
    end,
    now(),
    now()
  )
  on conflict (student_id, device_id)
  do update set
    class_id = excluded.class_id,
    teacher_id = excluded.teacher_id,
    attempted = greatest(activity_sync_health.attempted, excluded.attempted),
    delivered = greatest(activity_sync_health.delivered, excluded.delivered),
    recovered = greatest(activity_sync_health.recovered, excluded.recovered),
    storage_failures = greatest(activity_sync_health.storage_failures, excluded.storage_failures),
    pending = excluded.pending,
    lost = excluded.lost,
    oldest_pending_at = excluded.oldest_pending_at,
    observed_at = excluded.observed_at,
    updated_at = now();

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;

grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
