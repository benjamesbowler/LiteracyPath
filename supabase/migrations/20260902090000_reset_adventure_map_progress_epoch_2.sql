begin;

-- Adventure Map v2 deliberately begins a new progress epoch. The ordinary
-- recursive forward merge would otherwise reattach v1 cycles from an offline
-- device after this reset. Keep the epoch decision in one pure server helper so
-- the conflict trigger and first-write path agree.
create or replace function public.lp_el_quest_number(payload jsonb, field_name text)
returns numeric language sql immutable as $$
  select case
    when jsonb_typeof(coalesce(payload, '{}'::jsonb) -> field_name) = 'number'
      then (payload ->> field_name)::numeric
    when jsonb_typeof(coalesce(payload, '{}'::jsonb) -> field_name) = 'string'
      and trim(payload ->> field_name) ~ '^[+-]?[0-9]+(?:\.[0-9]+)?$'
      then trim(payload ->> field_name)::numeric
    else 0
  end;
$$;

create or replace function public.lp_el_quest_epoch(payload jsonb)
returns numeric language sql immutable as $$
  select public.lp_el_quest_number(payload, 'progressEpoch');
$$;

create or replace function public.lp_is_current_el_quest(payload jsonb)
returns boolean language sql immutable as $$
  select public.lp_el_quest_number(payload, 'schemaVersion') = 2
    and public.lp_el_quest_epoch(payload) = 2;
$$;

create or replace function public.lp_normalize_el_quest(payload jsonb)
returns jsonb language sql immutable as $$
  select case
    when public.lp_el_quest_epoch(payload) > 2 then coalesce(payload, '{}'::jsonb)
    when public.lp_is_current_el_quest(payload) then
      '{"cycles":{}}'::jsonb || coalesce(payload, '{}'::jsonb)
    else coalesce(payload, '{}'::jsonb) ||
      jsonb_build_object('schemaVersion', 2, 'progressEpoch', 2, 'cycles', '{}'::jsonb)
  end;
$$;

create or replace function public.lp_merge_el_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_epoch numeric := public.lp_el_quest_epoch(existing);
  incoming_epoch numeric := public.lp_el_quest_epoch(incoming);
  local_payload jsonb := public.lp_normalize_el_quest(existing);
  incoming_payload jsonb := public.lp_normalize_el_quest(incoming);
begin
  -- An unknown future epoch is opaque to this release. Keep the winning payload
  -- intact instead of accidentally applying this release's v2 merge rules.
  if existing_epoch > 2 or incoming_epoch > 2 then
    if existing_epoch > incoming_epoch then return existing; end if;
    return incoming;
  end if;

  if public.lp_is_current_el_quest(existing) and not public.lp_is_current_el_quest(incoming) then
    return local_payload;
  end if;
  if not public.lp_is_current_el_quest(existing) and public.lp_is_current_el_quest(incoming) then
    return incoming_payload;
  end if;

  return (local_payload || incoming_payload) || jsonb_build_object(
    'schemaVersion', 2,
    'progressEpoch', 2,
    'cycles', public.lp_jsonb_forward_merge(local_payload -> 'cycles', incoming_payload -> 'cycles')
  );
end;
$$;

-- Keep the newest complete forward-merge CASE intact and route Adventure Map
-- through its epoch-aware merge instead of the generic recursive merge.
create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area = 'profile' then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    when p_area = 'transfer_missions' then public.lp_merge_transfer_missions(p_existing, p_incoming)
    when p_area = 'el_quest' then public.lp_merge_el_quest(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

-- INSERT must be normalized too: a stale first write does not invoke the
-- conflict-update merge trigger, so it needs the same v2 boundary on arrival.
create or replace function public.lp_normalize_el_quest_progress_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.area = 'el_quest' and new.key = '__all__' then
    new.payload := public.lp_normalize_el_quest(new.payload);
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_el_quest_progress_insert on public.student_progress;
create trigger normalize_el_quest_progress_insert
before insert on public.student_progress
for each row execute function public.lp_normalize_el_quest_progress_insert();

-- Preserve the original progress chronology: this release changes only the
-- canonical Adventure Map payload, never its updated_at evidence timestamp.
update public.student_progress
set payload = public.lp_normalize_el_quest(payload)
where area = 'el_quest'
  and key = '__all__'
  and payload is distinct from public.lp_normalize_el_quest(payload);

grant execute on function public.lp_el_quest_epoch(jsonb) to anon, authenticated;
grant execute on function public.lp_el_quest_number(jsonb, text) to anon, authenticated;
grant execute on function public.lp_is_current_el_quest(jsonb) to anon, authenticated;
grant execute on function public.lp_normalize_el_quest(jsonb) to anon, authenticated;
grant execute on function public.lp_merge_el_quest(jsonb, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
