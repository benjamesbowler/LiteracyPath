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

create or replace function public.lp_el_quest_schema(payload jsonb)
returns numeric language sql immutable as $$
  select public.lp_el_quest_number(payload, 'schemaVersion');
$$;

create or replace function public.lp_has_canonical_el_quest_cycles(payload jsonb)
returns boolean language plpgsql immutable as $$
declare
  cycle_record record;
begin
  if coalesce(jsonb_typeof(payload), '') <> 'object'
    or coalesce(jsonb_typeof(payload -> 'cycles'), '') <> 'object'
  then
    return false;
  end if;

  for cycle_record in select value from jsonb_each(payload -> 'cycles')
  loop
    if coalesce(jsonb_typeof(cycle_record.value), '') <> 'object' then
      return false;
    end if;
    if cycle_record.value ? 'stations'
      and coalesce(jsonb_typeof(cycle_record.value -> 'stations'), '') <> 'object'
    then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.lp_is_current_el_quest(payload jsonb)
returns boolean language sql immutable as $$
  select public.lp_el_quest_schema(payload) = 2
    and public.lp_el_quest_epoch(payload) = 2
    and public.lp_has_canonical_el_quest_cycles(payload);
$$;

create or replace function public.lp_normalize_el_quest(payload jsonb)
returns jsonb language sql immutable as $$
  select case
    when public.lp_el_quest_schema(payload) > 2
      or public.lp_el_quest_epoch(payload) > 2
      then coalesce(payload, '{}'::jsonb)
    when public.lp_is_current_el_quest(payload) then
      '{"cycles":{}}'::jsonb || case
        when jsonb_typeof(payload) = 'object' then payload
        else '{}'::jsonb
      end
    else case
      when jsonb_typeof(payload) = 'object' then payload
      else '{}'::jsonb
    end ||
      jsonb_build_object('schemaVersion', 2, 'progressEpoch', 2, 'cycles', '{}'::jsonb)
  end;
$$;

-- Forward-only achievements and station completion can merge recursively, but
-- the recovery count and construct manifest describe one particular latest
-- Cycle Quest run. Keep that snapshot together instead of maxing or unioning
-- its fields across devices.
create or replace function public.lp_merge_el_quest_cycle(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  local_cycle jsonb := case when jsonb_typeof(existing) = 'object' then existing else '{}'::jsonb end;
  incoming_cycle jsonb := case when jsonb_typeof(incoming) = 'object' then incoming else '{}'::jsonb end;
  merged jsonb;
  latest jsonb;
  local_played_at text := coalesce(local_cycle ->> 'lastPlayedAt', '');
  incoming_played_at text := coalesce(incoming_cycle ->> 'lastPlayedAt', '');
  field_name text;
begin
  merged := public.lp_jsonb_forward_merge(local_cycle, incoming_cycle);
  latest := case
    when incoming_played_at > local_played_at then incoming_cycle
    when incoming_played_at < local_played_at then local_cycle
    when public.lp_el_quest_number(incoming_cycle, 'plays') >= public.lp_el_quest_number(local_cycle, 'plays')
      then incoming_cycle
    else local_cycle
  end;

  foreach field_name in array array['recoveries', 'sampledConstructs', 'lastRunSeed', 'lastIndependent', 'lastTotal', 'lastPlayedAt']
  loop
    merged := merged - field_name;
    if latest ? field_name then
      merged := merged || jsonb_build_object(field_name, latest -> field_name);
    end if;
  end loop;
  return merged;
end;
$$;

create or replace function public.lp_merge_el_quest_cycles(existing jsonb, incoming jsonb)
returns jsonb language sql immutable as $$
  select coalesce(
    jsonb_object_agg(
      cycle_id,
      public.lp_merge_el_quest_cycle(
        case when jsonb_typeof(existing) = 'object' then existing -> cycle_id else null end,
        case when jsonb_typeof(incoming) = 'object' then incoming -> cycle_id else null end
      )
    ),
    '{}'::jsonb
  )
  from (
    select jsonb_object_keys(case when jsonb_typeof(existing) = 'object' then existing else '{}'::jsonb end) as cycle_id
    union
    select jsonb_object_keys(case when jsonb_typeof(incoming) = 'object' then incoming else '{}'::jsonb end) as cycle_id
  ) cycle_ids;
$$;

create or replace function public.lp_merge_el_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_epoch numeric := public.lp_el_quest_epoch(existing);
  incoming_epoch numeric := public.lp_el_quest_epoch(incoming);
  existing_schema numeric := public.lp_el_quest_schema(existing);
  incoming_schema numeric := public.lp_el_quest_schema(incoming);
  existing_is_future boolean := existing_epoch > 2 or existing_schema > 2;
  incoming_is_future boolean := incoming_epoch > 2 or incoming_schema > 2;
  local_payload jsonb := public.lp_normalize_el_quest(existing);
  incoming_payload jsonb := public.lp_normalize_el_quest(incoming);
begin
  -- An unknown future schema or epoch is opaque to this release. Keep the
  -- winning payload intact instead of applying this release's v2 merge rules.
  if existing_is_future or incoming_is_future then
    if not incoming_is_future then return existing; end if;
    if not existing_is_future then return incoming; end if;
    if existing_epoch <> incoming_epoch then
      if existing_epoch > incoming_epoch then return existing; end if;
      return incoming;
    end if;
    if existing_schema > incoming_schema then return existing; end if;
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
    'cycles', public.lp_merge_el_quest_cycles(local_payload -> 'cycles', incoming_payload -> 'cycles')
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
grant execute on function public.lp_el_quest_schema(jsonb) to anon, authenticated;
grant execute on function public.lp_has_canonical_el_quest_cycles(jsonb) to anon, authenticated;
grant execute on function public.lp_is_current_el_quest(jsonb) to anon, authenticated;
grant execute on function public.lp_normalize_el_quest(jsonb) to anon, authenticated;
grant execute on function public.lp_merge_el_quest_cycle(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_el_quest_cycles(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_el_quest(jsonb, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
