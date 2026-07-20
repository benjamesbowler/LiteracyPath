-- Sound Seekers audit-integrity follow-up.
--
-- 1. Mastery demotion now increments evidenceEpoch and clears the proof set.
--    A stale pre-demotion cloud row must therefore never win merely because
--    its lifetime `seen` counter is higher.
-- 2. Knowledge accuracy has an independentSeen denominator. Preserve it in
--    the same server-side merge that owns the ordered accuracy window.
-- 3. Hollow append-only records are bounded on the server too. Bounding only
--    the browser payload is ineffective when a forward-only cloud union keeps
--    resurrecting every historical row the browser intentionally compacted.

create or replace function public.lp_quest_independent_count(j jsonb)
returns numeric language sql immutable as $$
  select case
    when j is null or jsonb_typeof(j) <> 'object' then 0
    when j ? 'independentSeen' then
      case
        when public.lp_quest_num(j, 'independentSeen') = 0
          and public.lp_quest_num(j, 'correct') > 0
        then greatest(public.lp_quest_num(j, 'seen'), public.lp_quest_num(j, 'correct'))
        else greatest(public.lp_quest_num(j, 'independentSeen'), 0)
      end
    else greatest(public.lp_quest_num(j, 'seen'), 0)
  end;
$$;

create or replace function public.lp_quest_merge_mastery_record(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  newer jsonb;
  authoritative jsonb;
  a_epoch numeric := greatest(public.lp_quest_num(a, 'evidenceEpoch'), 0);
  b_epoch numeric := greatest(public.lp_quest_num(b, 'evidenceEpoch'), 0);
begin
  if a is null or jsonb_typeof(a) <> 'object' then return b; end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;

  -- A higher evidence epoch is an explicit invalidation boundary. Lifetime
  -- exposure remains monotone, but every field that could re-prove mastery
  -- comes intact from the post-demotion side.
  if a_epoch <> b_epoch then
    authoritative := case when a_epoch > b_epoch then a else b end;
    return (b || a || authoritative) || jsonb_build_object(
      'seen',            to_jsonb(greatest(public.lp_quest_num(a, 'seen'), public.lp_quest_num(b, 'seen'))),
      'evidenceEpoch',   to_jsonb(greatest(a_epoch, b_epoch)),
      'independentSeen', to_jsonb(public.lp_quest_independent_count(authoritative)),
      'correct',         to_jsonb(greatest(public.lp_quest_num(authoritative, 'correct'), 0)),
      'streak',          to_jsonb(greatest(public.lp_quest_num(authoritative, 'streak'), 0)),
      'shells',          coalesce(case when jsonb_typeof(authoritative -> 'shells') = 'array' then authoritative -> 'shells' end, '[]'::jsonb),
      'sessions',        coalesce(case when jsonb_typeof(authoritative -> 'sessions') = 'array' then authoritative -> 'sessions' end, '[]'::jsonb),
      'window',          coalesce(case when jsonb_typeof(authoritative -> 'window') = 'array' then authoritative -> 'window' end, '[]'::jsonb),
      'misses',          to_jsonb(greatest(public.lp_quest_num(authoritative, 'misses'), 0)),
      'state',           coalesce(authoritative -> 'state', '"not-started"'::jsonb),
      'box',             to_jsonb(greatest(public.lp_quest_num(authoritative, 'box'), 1)),
      'lastAt',          coalesce(authoritative -> 'lastAt', '""'::jsonb),
      'lastStop',        to_jsonb(greatest(public.lp_quest_num(authoritative, 'lastStop'), 0))
    );
  end if;

  -- Within one epoch, `seen` remains the ordered-history clock. Ties go to the
  -- incoming side, matching the client hydrate contract.
  newer := case when public.lp_quest_num(a, 'seen') > public.lp_quest_num(b, 'seen') then a else b end;
  return (b || a || newer) || jsonb_build_object(
    'seen',            to_jsonb(greatest(public.lp_quest_num(a, 'seen'), public.lp_quest_num(b, 'seen'))),
    'independentSeen', to_jsonb(greatest(public.lp_quest_independent_count(a), public.lp_quest_independent_count(b))),
    'correct',         to_jsonb(greatest(public.lp_quest_num(a, 'correct'), public.lp_quest_num(b, 'correct'))),
    'streak',          to_jsonb(greatest(public.lp_quest_num(newer, 'streak'), 0)),
    'shells',          public.lp_quest_union_by_id(a -> 'shells', b -> 'shells'),
    'sessions',        public.lp_quest_union_by_id(a -> 'sessions', b -> 'sessions'),
    'window',          coalesce(case when jsonb_typeof(newer -> 'window') = 'array' then newer -> 'window' end, '[]'::jsonb),
    'misses',          to_jsonb(greatest(public.lp_quest_num(newer, 'misses'), 0)),
    'state',           coalesce(newer -> 'state', '"not-started"'::jsonb),
    'box',             to_jsonb(greatest(public.lp_quest_num(newer, 'box'), 1)),
    'evidenceEpoch',   to_jsonb(a_epoch),
    'lastAt',          coalesce(newer -> 'lastAt', '""'::jsonb),
    'lastStop',        to_jsonb(greatest(public.lp_quest_num(a, 'lastStop'), public.lp_quest_num(b, 'lastStop')))
  );
end;
$$;

-- Keep the server write path aligned with computeHydratedValue. In particular,
-- a normalized fresh-device payload contains routeCursor=1 even though the
-- child has not played locally; that synthetic default must not erase the
-- stored review-circuit position or its matching mid-stop checkpoint.
create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  trail jsonb;
  cursor_val numeric;
  incoming_has_progress boolean := false;
  incoming_checkpoint jsonb;
  existing_checkpoint jsonb;
  chosen_checkpoint jsonb := 'null'::jsonb;
  existing_creature_at text := coalesce(existing ->> 'creatureAt', '');
  incoming_creature_at text := coalesce(incoming ->> 'creatureAt', '');
  existing_settings_at text := coalesce(existing ->> 'settingsAt', '');
  incoming_settings_at text := coalesce(incoming ->> 'settingsAt', '');
  chosen_creature jsonb;
  chosen_settings jsonb;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;

  result := existing || incoming;
  incoming_has_progress := case
    when jsonb_typeof(incoming #> '{trail,stopsDone}') = 'array'
      then jsonb_array_length(incoming #> '{trail,stopsDone}') > 0
    else false
  end;

  trail := public.lp_jsonb_forward_merge(existing -> 'trail', incoming -> 'trail');
  cursor_val := case
    when incoming_has_progress and public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(existing -> 'trail', 'routeCursor')
    when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    else 1
  end;
  if trail is null or jsonb_typeof(trail) <> 'object' then trail := '{}'::jsonb; end if;
  trail := trail || jsonb_build_object('routeCursor', to_jsonb(cursor_val));

  incoming_checkpoint := case
    when jsonb_typeof(incoming -> 'checkpoint') = 'object' then incoming -> 'checkpoint'
    else null
  end;
  existing_checkpoint := case
    when jsonb_typeof(existing -> 'checkpoint') = 'object' then existing -> 'checkpoint'
    else null
  end;
  if incoming_checkpoint is not null then
    chosen_checkpoint := incoming_checkpoint;
  elsif existing_checkpoint is not null
    and existing_checkpoint ->> 'stopId' = 's' || trunc(cursor_val)::bigint::text then
    chosen_checkpoint := existing_checkpoint;
  end if;

  -- Creature and settings are mutable choices, so their explicit clocks own
  -- last-write-wins. Ties/legacy rows retain the stored cloud value, matching
  -- the client's cloud-wins fallback when stamps are absent.
  chosen_creature := case
    when incoming_creature_at <> ''
      and (existing_creature_at = '' or incoming_creature_at > existing_creature_at)
      and jsonb_typeof(incoming -> 'creature') = 'object'
      then incoming -> 'creature'
    else coalesce(
      case when jsonb_typeof(existing -> 'creature') = 'object' then existing -> 'creature' end,
      case when jsonb_typeof(incoming -> 'creature') = 'object' then incoming -> 'creature' end,
      'null'::jsonb)
  end;
  chosen_settings := case
    when incoming_settings_at <> ''
      and (existing_settings_at = '' or incoming_settings_at > existing_settings_at)
      and jsonb_typeof(incoming -> 'settings') = 'object'
      then incoming -> 'settings'
    else coalesce(
      case when jsonb_typeof(existing -> 'settings') = 'object' then existing -> 'settings' end,
      case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
      'null'::jsonb)
  end;

  -- Telemetry is local-only child behavioural data. Removing an old cloud copy
  -- on the next write completes the client-side upload exclusion instead of
  -- preserving historical telemetry forever.
  result := (result - 'telemetry') || jsonb_build_object(
    'creature', chosen_creature,
    'creatureAt', greatest(existing_creature_at, incoming_creature_at),
    'hatched', to_jsonb(
      coalesce((existing ->> 'hatched')::boolean, false)
      or coalesce((incoming ->> 'hatched')::boolean, false)),
    'trail', trail,
    'mastery', public.lp_quest_merge_mastery(existing -> 'mastery', incoming -> 'mastery'),
    'stones', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'stones') = 'array' then existing -> 'stones' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'stones') = 'array' then incoming -> 'stones' end, '[]'::jsonb)),
    'trickies', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'trickies') = 'array' then existing -> 'trickies' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'trickies') = 'array' then incoming -> 'trickies' end, '[]'::jsonb)),
    'ledger', jsonb_build_object(
      'purchases', public.lp_quest_union_by_id(existing #> '{ledger,purchases}', incoming #> '{ledger,purchases}')),
    'settings', chosen_settings,
    'settingsAt', greatest(existing_settings_at, incoming_settings_at),
    'checkpoint', chosen_checkpoint
  );
  return result;
end;
$$;

-- Deterministic union of record arrays by id, ordered oldest-first, then
-- bounded. The earliest record wins an impossible duplicate-id conflict,
-- matching the irreversible nature of ownership/spend history.
create or replace function public.lp_hollow_merge_records(a jsonb, b jsonb, max_records integer)
returns jsonb language sql immutable as $$
  with combined as (
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  ), valid as (
    select elem,
           elem ->> 'id' as id,
           coalesce(elem ->> 'at', '') as at
      from combined
     where jsonb_typeof(elem) = 'object' and coalesce(elem ->> 'id', '') <> ''
  ), deduped as (
    select distinct on (id) elem, id, at
      from valid
     order by id, at, elem::text
  ), bounded as (
    select elem, id, at
      from deduped
     order by at, id
     limit greatest(max_records, 0)
  )
  select coalesce(jsonb_agg(elem order by at, id), '[]'::jsonb) from bounded;
$$;

create or replace function public.lp_hollow_merge_feeds(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  with combined as (
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  ), valid as (
    select elem,
           elem ->> 'id' as id,
           elem ->> 'species' as species,
           coalesce(elem ->> 'at', '') as at
      from combined
     where jsonb_typeof(elem) = 'object'
       and coalesce(elem ->> 'id', '') <> ''
       and coalesce(elem ->> 'species', '') <> ''
  ), deduped as (
    select distinct on (id) elem, id, species, at
      from valid
     order by id, at, elem::text
  ), ranked as (
    select elem, id, species, at,
           row_number() over (partition by species order by at, id) as species_rank
      from deduped
  )
  select coalesce(jsonb_agg(elem order by at, id), '[]'::jsonb)
    from ranked
   where species_rank <= 8;
$$;

create or replace function public.lp_merge_hollow(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_layout jsonb := coalesce(case when jsonb_typeof(existing -> 'layout') = 'object' then existing -> 'layout' end, '{}'::jsonb);
  incoming_layout jsonb := coalesce(case when jsonb_typeof(incoming -> 'layout') = 'object' then incoming -> 'layout' end, '{}'::jsonb);
  chosen_layout jsonb;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then existing := '{}'::jsonb; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then incoming := '{}'::jsonb; end if;
  chosen_layout := case
    when coalesce(existing_layout ->> 'at', '') > coalesce(incoming_layout ->> 'at', '') then existing_layout
    else incoming_layout
  end;
  return jsonb_build_object(
    'purchases', public.lp_hollow_merge_records(existing -> 'purchases', incoming -> 'purchases', 128),
    'feeds', public.lp_hollow_merge_feeds(existing -> 'feeds', incoming -> 'feeds'),
    -- Daily chests are derived earnings and cannot be truncated without taking
    -- coins away. They are still deduplicated deterministically by id.
    'chests', public.lp_hollow_merge_records(existing -> 'chests', incoming -> 'chests', 2147483647),
    'layout', chosen_layout
  );
end;
$$;

-- Tracked form of the day-aware daily-mission hotfix. Re-declaring the global
-- dispatcher below must not restore blind incoming-wins and let an offline
-- yesterday row un-finish today's three mission tasks.
create or replace function public.lp_merge_daily_mission(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_day text;
  incoming_day text;
  existing_done jsonb;
  incoming_done jsonb;
  merged_done jsonb;
  task_key text;
  later_meta jsonb;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;

  existing_day := coalesce(existing ->> 'day', '');
  incoming_day := coalesce(incoming ->> 'day', '');
  if existing_day <> '' and existing_day = incoming_day then
    existing_done := coalesce(
      case when jsonb_typeof(existing -> 'done') = 'object' then existing -> 'done' end,
      '{}'::jsonb);
    incoming_done := coalesce(
      case when jsonb_typeof(incoming -> 'done') = 'object' then incoming -> 'done' end,
      '{}'::jsonb);
    merged_done := existing_done || incoming_done;
    -- App-written done flags are monotone true values. OR duplicate keys too,
    -- so even a malformed/stale false cannot un-finish a task.
    for task_key in select jsonb_object_keys(existing_done || incoming_done) loop
      merged_done := jsonb_set(merged_done, array[task_key], to_jsonb(
        coalesce(case when jsonb_typeof(existing_done -> task_key) = 'boolean' then (existing_done ->> task_key)::boolean end, false)
        or coalesce(case when jsonb_typeof(incoming_done -> task_key) = 'boolean' then (incoming_done ->> task_key)::boolean end, false)
      ), true);
    end loop;
    later_meta := case
      when coalesce(incoming ->> 'lastCompletedDay', '') > coalesce(existing ->> 'lastCompletedDay', '')
        then incoming
      else existing
    end;
    return incoming || existing || jsonb_build_object(
      'done', merged_done,
      'streak', greatest(public.lp_quest_num(existing, 'streak'), public.lp_quest_num(incoming, 'streak')),
      'lastCompletedDay', greatest(coalesce(existing ->> 'lastCompletedDay', ''), coalesce(incoming ->> 'lastCompletedDay', '')),
      'shieldWeek', coalesce(later_meta -> 'shieldWeek', '""'::jsonb),
      'celebratedDay', greatest(coalesce(existing ->> 'celebratedDay', ''), coalesce(incoming ->> 'celebratedDay', ''))
    );
  end if;

  if existing_day > incoming_day then return existing; end if;
  return incoming;
end;
$$;

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area = 'profile' then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

grant execute on function public.lp_quest_independent_count(jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_mastery_record(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_hollow_merge_records(jsonb, jsonb, integer) to anon, authenticated;
grant execute on function public.lp_hollow_merge_feeds(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_hollow(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_daily_mission(jsonb, jsonb) to anon, authenticated;

-- Verification examples for the SQL editor (each must return true):
-- select public.lp_quest_merge_mastery_record(
--   '{"seen":14,"independentSeen":0,"correct":0,"state":"learning","evidenceEpoch":1,"shells":[],"sessions":[]}',
--   '{"seen":15,"independentSeen":12,"correct":12,"state":"mastered","evidenceEpoch":0,"shells":["stones","bridge"],"sessions":["d1","d2"]}'
-- ) #>> '{state}' = 'learning';
--
-- select jsonb_array_length(public.lp_hollow_merge_feeds(
--   (select jsonb_agg(jsonb_build_object('id', 'a-' || n, 'species', 'owl', 'at', n::text)) from generate_series(1, 12) n),
--   (select jsonb_agg(jsonb_build_object('id', 'b-' || n, 'species', 'owl', 'at', (n + 12)::text)) from generate_series(1, 12) n)
-- )) = 8;
--
-- select public.lp_merge_phonics_quest(
--   '{"trail":{"routeCursor":30,"stopsDone":["s1","s40"]},"checkpoint":{"stopId":"s30","beatIndex":1}}',
--   '{"trail":{"routeCursor":1,"stopsDone":[]},"checkpoint":null}'
-- ) #>> '{checkpoint,stopId}' = 's30';
--
-- select public.lp_merge_phonics_quest(
--   '{"trail":{"routeCursor":30,"stopsDone":["s1","s40"]}}',
--   '{"trail":{"routeCursor":1,"stopsDone":[]}}'
-- ) #>> '{trail,routeCursor}' = '30';
--
-- select public.lp_merge_daily_mission(
--   '{"day":"2026-07-20","done":{"quest":true},"streak":4}',
--   '{"day":"2026-07-19","done":{},"streak":3}'
-- ) #>> '{day}' = '2026-07-20';
