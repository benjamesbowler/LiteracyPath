-- Ordered plans, adaptive demand and response drafts are one mutable snapshot.
-- Append-only answers and earned achievements retain their existing merge.
begin;

create or replace function public.lp_merge_practice_checkpoint(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = pg_catalog, public as $$
declare
  old_start timestamptz;
  new_start timestamptz;
  old_index numeric := 0;
  new_index numeric := 0;
  old_revision numeric := 0;
  new_revision numeric := 0;
begin
  if incoming is null then return existing; end if;
  if jsonb_typeof(incoming) = 'null' then return incoming; end if;
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if jsonb_typeof(incoming) <> 'object' then return existing; end if;
  begin old_start := (existing->>'startedAt')::timestamptz; exception when others then old_start := null; end;
  begin new_start := (incoming->>'startedAt')::timestamptz; exception when others then new_start := null; end;
  if existing->>'id' is distinct from incoming->>'id' then
    if old_start is not null and (new_start is null or new_start < old_start) then return existing; end if;
    return incoming;
  end if;
  -- Clearing a completed/free sitting is terminal for that sitting's ID.
  if existing->>'cleared' = 'true' then return existing; end if;
  if incoming->>'cleared' = 'true' then return incoming; end if;
  -- A healthy snapshot from the original device also replaces a legacy cloud
  -- plan bloated by array union. Do not treat its inflated index as progress.
  if jsonb_typeof(existing->'questionIds') = 'array' and jsonb_typeof(incoming->'questionIds') = 'array'
    and jsonb_array_length(existing->'questionIds') > 40
    and jsonb_array_length(incoming->'questionIds') between 1 and 40 then return incoming; end if;
  if jsonb_typeof(existing->'index') = 'number' then old_index := (existing->>'index')::numeric; end if;
  if jsonb_typeof(incoming->'index') = 'number' then new_index := (incoming->>'index')::numeric; end if;
  if jsonb_typeof(existing->'checkpointRevision') = 'number' then old_revision := (existing->>'checkpointRevision')::numeric; end if;
  if jsonb_typeof(incoming->'checkpointRevision') = 'number' then new_revision := (incoming->>'checkpointRevision')::numeric; end if;
  -- Both stamped clients can reject a late earlier draft at the same index.
  -- Legacy clients still advance by their answered prefix, never array union.
  if old_revision > 0 and new_revision > 0 then
    if new_revision < old_revision then return existing; end if;
  elsif new_index < old_index then return existing;
  end if;
  return incoming;
end;
$$;

create or replace function public.lp_merge_learn_games(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = pg_catalog, public as $$
declare
  merged jsonb := public.lp_jsonb_forward_merge(existing, incoming);
  game_id text;
  old_checkpoint jsonb;
  new_checkpoint jsonb;
begin
  -- These two routes share skillsPracticeProgress. Arcade checkpoints keep
  -- their separate contract and are unaffected by this focused change.
  foreach game_id in array array['literacy-practice', 'skills-trail'] loop
    old_checkpoint := existing #> array['games', game_id, 'checkpoints', 'practice'];
    new_checkpoint := incoming #> array['games', game_id, 'checkpoints', 'practice'];
    if old_checkpoint is not null or new_checkpoint is not null then
      merged := jsonb_set(merged, array['games', game_id, 'checkpoints', 'practice'],
        public.lp_merge_practice_checkpoint(old_checkpoint, new_checkpoint), true);
    end if;
  end loop;
  return merged;
end;
$$;

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area in ('profile','progress_check') then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    when p_area = 'transfer_missions' then public.lp_merge_transfer_missions(p_existing, p_incoming)
    when p_area = 'el_quest' then public.lp_merge_el_quest(p_existing, p_incoming)
    when p_area = 'learn_games' then public.lp_merge_learn_games(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

-- Pure JSON helpers contain no table reads or privileged data access. The
-- existing trigger invokes them for authenticated teacher-mode upserts too.
revoke all on function public.lp_merge_practice_checkpoint(jsonb,jsonb) from public;
revoke all on function public.lp_merge_learn_games(jsonb,jsonb) from public;
grant execute on function public.lp_merge_practice_checkpoint(jsonb,jsonb) to anon, authenticated, service_role;
grant execute on function public.lp_merge_learn_games(jsonb,jsonb) to anon, authenticated, service_role;
commit;
