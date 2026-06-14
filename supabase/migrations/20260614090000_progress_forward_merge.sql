-- Forward-only merge of student progress on the SERVER.
--
-- Why: kids in schools use multiple class iPads. With plain last-write-wins, a
-- stale or offline iPad could overwrite progress earned on another device,
-- wiping stars / completions / found words. This makes every write a forward
-- merge: progress can only move forward, the same rule the client already uses
-- in src/utils/progressMerge.js. Mirrors that logic so the two never disagree.

-- Rank for the phonics / cvc mastery status vocabulary. -1 = not a status word.
create or replace function public.lp_status_rank(s text)
returns int language sql immutable as $$
  select case s
    when 'completed' then 3
    when 'inprogress' then 2
    when 'locked' then 1
    when 'default' then 0
    else -1
  end;
$$;

-- Recursive forward merge of two jsonb values:
--   objects  -> merge key-by-key (union of keys)
--   arrays   -> union (keep every element seen on any device)
--   numbers  -> greatest (best score / most stars)
--   booleans -> OR (an earned true is never un-earned)
--   strings  -> status-rank wins if both are status words, else incoming wins
--   anything else / type mismatch -> incoming wins
create or replace function public.lp_jsonb_forward_merge(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  k text;
  elem jsonb;
  ta text := jsonb_typeof(a);
  tb text := jsonb_typeof(b);
  rank_a int;
  rank_b int;
begin
  if a is null or ta = 'null' then return b; end if;
  if b is null or tb = 'null' then return a; end if;

  if ta = 'object' and tb = 'object' then
    result := a;
    for k in select jsonb_object_keys(b) loop
      result := jsonb_set(result, array[k], public.lp_jsonb_forward_merge(a -> k, b -> k), true);
    end loop;
    return result;
  end if;

  if ta = 'array' and tb = 'array' then
    result := a;
    for elem in select * from jsonb_array_elements(b) loop
      if not (result @> jsonb_build_array(elem)) then
        result := result || jsonb_build_array(elem);
      end if;
    end loop;
    return result;
  end if;

  if ta = 'number' and tb = 'number' then
    return to_jsonb(greatest((a::text)::numeric, (b::text)::numeric));
  end if;

  if ta = 'boolean' and tb = 'boolean' then
    return to_jsonb((a::text)::boolean or (b::text)::boolean);
  end if;

  if ta = 'string' and tb = 'string' then
    rank_a := public.lp_status_rank(a #>> '{}');
    rank_b := public.lp_status_rank(b #>> '{}');
    if rank_a >= 0 and rank_b >= 0 then
      if rank_a > rank_b then return a; else return b; end if;
    end if;
    return b;
  end if;

  return b;
end;
$$;

-- Per-area gate. daily_mission (streaks) and profile (chosen companion) are
-- "latest state", not cumulative progress, so they stay last-write-wins - a
-- streak that legitimately reset must NOT be inflated back up by a merge.
create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area in ('daily_mission', 'profile') then p_incoming
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

-- On any conflict-update of a progress row, merge the incoming payload forward
-- with what is already stored. Covers BOTH the student_save_progress RPC and the
-- teacher-mode upsert, since both run INSERT ... ON CONFLICT DO UPDATE.
create or replace function public.lp_student_progress_merge()
returns trigger language plpgsql as $$
begin
  new.payload := public.lp_forward_merge_progress(new.area, old.payload, new.payload);
  return new;
end;
$$;

drop trigger if exists student_progress_forward_merge on public.student_progress;
create trigger student_progress_forward_merge
  before update on public.student_progress
  for each row execute function public.lp_student_progress_merge();

-- The trigger fires for teacher (authenticated) upserts too, so make sure those
-- roles can execute the helper functions it calls.
grant execute on function public.lp_status_rank(text) to anon, authenticated;
grant execute on function public.lp_jsonb_forward_merge(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_forward_merge_progress(text, jsonb, jsonb) to anon, authenticated;
