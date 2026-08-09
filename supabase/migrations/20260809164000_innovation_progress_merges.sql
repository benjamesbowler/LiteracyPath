-- Purpose-built forward merges for the new student-progress areas.
-- The generic JSON merge is monotonic, but it cannot clear a finished resume
-- object and it cannot choose a per-book reflection by its own timestamp.

create or replace function public.lp_merge_transfer_missions(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  merged jsonb := public.lp_jsonb_forward_merge(coalesce(existing, '{}'::jsonb), coalesce(incoming, '{}'::jsonb));
  old_active jsonb := existing -> 'active';
  new_active jsonb := incoming -> 'active';
  active_id text := old_active ->> 'missionId';
begin
  if incoming ? 'active' and jsonb_typeof(new_active) = 'null' and (
    active_id is null or coalesce(incoming -> 'completed', '[]'::jsonb) ? active_id
  ) then
    return jsonb_set(merged, '{active}', 'null'::jsonb, true);
  end if;
  if jsonb_typeof(old_active) = 'object' and jsonb_typeof(new_active) = 'object' then
    if coalesce(new_active ->> 'updatedAt', '') >= coalesce(old_active ->> 'updatedAt', '') then
      return jsonb_set(merged, '{active}', new_active, true);
    end if;
    return jsonb_set(merged, '{active}', old_active, true);
  end if;
  return merged;
end;
$$;

create or replace function public.lp_merge_reading_passport(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  reflections jsonb := coalesce(existing -> 'reflections', '{}'::jsonb);
  book_id text;
  incoming_reflection jsonb;
  existing_reflection jsonb;
begin
  for book_id, incoming_reflection in
    select key, value from jsonb_each(coalesce(incoming -> 'reflections', '{}'::jsonb))
  loop
    existing_reflection := reflections -> book_id;
    if existing_reflection is null or
       coalesce(incoming_reflection ->> 'updatedAt', '') >= coalesce(existing_reflection ->> 'updatedAt', '') then
      reflections := jsonb_set(reflections, array[book_id], incoming_reflection, true);
    end if;
  end loop;
  return jsonb_build_object('schemaVersion', 1, 'reflections', reflections);
end;
$$;

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area = 'profile' then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    when p_area = 'transfer_missions' then public.lp_merge_transfer_missions(p_existing, p_incoming)
    when p_area = 'reading_passport' then public.lp_merge_reading_passport(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

grant execute on function public.lp_merge_transfer_missions(jsonb,jsonb) to anon, authenticated;
grant execute on function public.lp_merge_reading_passport(jsonb,jsonb) to anon, authenticated;

comment on function public.lp_merge_transfer_missions(jsonb,jsonb) is
  'Forward-merges transfer evidence while allowing a completed mission to clear its resume state.';
comment on function public.lp_merge_reading_passport(jsonb,jsonb) is
  'Merges each book reflection by its own updatedAt timestamp.';
