begin;

-- Question-level practice detail is one dated run, not cumulative achievement.
-- Preserve the whole latest snapshot; recursive maxima or array unions would
-- turn an old correct response plus a new error into invented learner evidence.
-- This pure helper keeps the existing signature, callers and grants. It does
-- not modify records, authorization, RLS or the existing progress epoch.
create or replace function public.lp_merge_el_quest_cycle(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
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

  foreach field_name in array array['recoveries', 'sampledConstructs', 'lastRunSeed', 'lastIndependent', 'lastTotal', 'lastPlayedAt', 'lastCheck']
  loop
    merged := merged - field_name;
    if latest ? field_name then
      merged := merged || jsonb_build_object(field_name, latest -> field_name);
    end if;
  end loop;
  return merged;
end;
$$;

commit;
