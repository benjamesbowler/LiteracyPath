-- Sound Seekers (phonics_quest) server merge.
--
-- Why: 20260614090000_progress_forward_merge.sql routes EVERY area through the
-- naive recursive forward-merge. For phonics_quest that is destructive — the
-- client (src/utils/progressMerge.js, `area === "phonics_quest"` branch) says
-- exactly why and refuses to do it:
--
--   mastery.window  is an ORDERED list of the last results. Array-union
--                   collapses [1,1,0,1] to [1,0] and destroys the accuracy
--                   calculation the whole mastery gate runs on.
--   mastery.state   last-write/forward merge silently UNDOES a demotion.
--   trail.routeCursor  journey position, not an achievement — greatest() pins
--                   a second review circuit at stop 40 forever.
--   ledger.purchases   union by whole-object identity duplicates a purchase
--                   whose timestamp differs between devices; the client unions
--                   by id.
--   checkpoint      resume state — merging two checkpoints teleports a child
--                   mid-stop. Each write keeps the WRITER's own checkpoint.
--
-- This migration mirrors the client rules field for field. The fixtures in
-- tests/unit/progressMerge.test.js ("phonics_quest:" cases) are the shared
-- contract: if a rule changes there, change it here in the same commit.
--
-- Perspective note: on the server, `existing` is the stored row and `incoming`
-- is the device write. The client's "local" corresponds to `existing` and its
-- "cloud" to `incoming`; ties therefore prefer `incoming`, matching the
-- client's "ties prefer cloud".

create or replace function public.lp_quest_num(j jsonb, k text)
returns numeric language sql immutable as $$
  select coalesce(nullif(j ->> k, '')::numeric, 0);
$$;

-- Union two arrays of {id: ...} records (or bare scalars) by id, first
-- occurrence wins, order: existing then incoming. Mirrors the client unionById.
create or replace function public.lp_quest_union_by_id(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb := '[]'::jsonb;
  seen jsonb := '{}'::jsonb;
  elem jsonb;
  id text;
begin
  for elem in
    select * from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select * from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  loop
    id := case when jsonb_typeof(elem) = 'object' then elem ->> 'id' else elem #>> '{}' end;
    if id is null or seen ? id then continue; end if;
    seen := seen || jsonb_build_object(id, true);
    result := result || jsonb_build_array(elem);
  end loop;
  return result;
end;
$$;

-- One mastery record. `seen` is the clock: the side that has watched the child
-- answer more times owns the ordered/volatile fields (window, misses, state,
-- box, lastAt). Counters take the max; evidence sets union.
create or replace function public.lp_quest_merge_mastery_record(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  newer jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' then return b; end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;
  -- Strictly-greater keeps a; tie goes to b (the incoming write), mirroring the
  -- client where the tie goes to the cloud side.
  newer := case when public.lp_quest_num(a, 'seen') > public.lp_quest_num(b, 'seen') then a else b end;
  return (b || a || newer) || jsonb_build_object(
    'seen',     to_jsonb(greatest(public.lp_quest_num(a, 'seen'),    public.lp_quest_num(b, 'seen'))),
    'correct',  to_jsonb(greatest(public.lp_quest_num(a, 'correct'), public.lp_quest_num(b, 'correct'))),
    'streak',   to_jsonb(greatest(public.lp_quest_num(a, 'streak'),  public.lp_quest_num(b, 'streak'))),
    'shells',   public.lp_quest_union_by_id(a -> 'shells',   b -> 'shells'),
    'sessions', public.lp_quest_union_by_id(a -> 'sessions', b -> 'sessions'),
    'window',   coalesce(case when jsonb_typeof(newer -> 'window') = 'array' then newer -> 'window' end, '[]'::jsonb),
    'misses',   to_jsonb(public.lp_quest_num(newer, 'misses')),
    'state',    coalesce(newer -> 'state', '"not-started"'::jsonb),
    'box',      to_jsonb(greatest(public.lp_quest_num(newer, 'box'), 1)),
    'lastAt',   coalesce(newer -> 'lastAt', '""'::jsonb),
    'lastStop', to_jsonb(greatest(public.lp_quest_num(a, 'lastStop'), public.lp_quest_num(b, 'lastStop')))
  );
end;
$$;

create or replace function public.lp_quest_merge_mastery(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  k text;
begin
  if a is null or jsonb_typeof(a) <> 'object' then return coalesce(b, '{}'::jsonb); end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;
  result := a;
  for k in select jsonb_object_keys(b) loop
    result := jsonb_set(result, array[k], public.lp_quest_merge_mastery_record(a -> k, b -> k), true);
  end loop;
  return result;
end;
$$;

create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  trail jsonb;
  cursor_val numeric;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;

  -- Unknown/extra keys: incoming wins (client: {...base, ...cloud}).
  result := existing || incoming;

  -- trail: achievements merge forward, but routeCursor is journey state — the
  -- writer's own position is stored, never greatest().
  trail := public.lp_jsonb_forward_merge(existing -> 'trail', incoming -> 'trail');
  cursor_val := case
    when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0 then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0 then public.lp_quest_num(existing -> 'trail', 'routeCursor')
    else 1
  end;
  if trail is null or jsonb_typeof(trail) <> 'object' then trail := '{}'::jsonb; end if;
  trail := trail || jsonb_build_object('routeCursor', to_jsonb(cursor_val));

  result := result || jsonb_build_object(
    'creature', coalesce(
      case when jsonb_typeof(incoming -> 'creature') = 'object' then incoming -> 'creature' end,
      existing -> 'creature', 'null'::jsonb),
    'hatched', to_jsonb(
      coalesce((existing ->> 'hatched')::boolean, false) or coalesce((incoming ->> 'hatched')::boolean, false)),
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
    'settings', coalesce(
      case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
      existing -> 'settings', 'null'::jsonb),
    'telemetry', jsonb_build_object(
      'sessions', public.lp_quest_union_by_id(existing #> '{telemetry,sessions}', incoming #> '{telemetry,sessions}'),
      'current', coalesce(incoming #> '{telemetry,current}', 'null'::jsonb)),
    -- The WRITER's checkpoint, never a merge of two devices' checkpoints.
    'checkpoint', coalesce(incoming -> 'checkpoint', 'null'::jsonb)
  );
  return result;
end;
$$;

-- Route phonics_quest away from the naive merge. daily_mission / profile keep
-- their existing last-write behaviour; everything else is unchanged.
create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area in ('daily_mission', 'profile') then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

grant execute on function public.lp_quest_num(jsonb, text) to anon, authenticated;
grant execute on function public.lp_quest_union_by_id(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_mastery_record(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_mastery(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;

-- ── Verification (run in the Supabase SQL editor after applying) ─────────────
-- Each select must return TRUE. These mirror tests/unit/progressMerge.test.js.
--
-- select public.lp_merge_phonics_quest(
--   '{"mastery":{"s":{"seen":6,"window":[1,1,0,1],"state":"learning","box":2}}}',
--   '{"mastery":{"s":{"seen":4,"window":[1,0],"state":"learning","box":2}}}'
-- ) #> '{mastery,s,window}' = '[1,1,0,1]'::jsonb as window_preserved;
--
-- select public.lp_merge_phonics_quest(
--   '{"mastery":{"sh":{"seen":12,"state":"learning","box":1,"window":[0,0,1,1]}}}',
--   '{"mastery":{"sh":{"seen":10,"state":"mastered","box":4,"window":[1,1,1,1]}}}'
-- ) #>> '{mastery,sh,state}' = 'learning' as demotion_sticks;
--
-- select public.lp_merge_phonics_quest(
--   '{"trail":{"routeCursor":3,"stopsDone":["s1"]}}',
--   '{"trail":{"routeCursor":40,"stopsDone":["s1","s2"]}}'
-- ) #> '{trail,routeCursor}' = '40'::jsonb as cursor_is_writers_not_greatest;
--
-- select jsonb_array_length(public.lp_merge_phonics_quest(
--   '{"ledger":{"purchases":[{"id":"leaf-cap","at":"t1"}]}}',
--   '{"ledger":{"purchases":[{"id":"leaf-cap","at":"t2"},{"id":"moth-wings","at":"t3"}]}}'
-- ) #> '{ledger,purchases}') = 2 as purchases_union_by_id;
--
-- select public.lp_merge_phonics_quest(
--   '{"checkpoint":{"stopId":"s3"}}',
--   '{"checkpoint":{"stopId":"s9"}}'
-- ) #>> '{checkpoint,stopId}' = 's9' as checkpoint_is_writers_own;
