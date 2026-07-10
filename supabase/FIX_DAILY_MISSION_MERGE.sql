-- FIX: daily mission (the 3 tasks that unlock the arcade) was resetting on
-- re-login. Root cause: the cloud merge treated daily_mission as blind
-- last-write-wins, so a STALE row pushed by any device could overwrite the
-- day's finished tasks. This makes the cloud merge day-aware, matching the
-- client fix in src/utils/progressMerge.js:
--   * same day on both sides  -> union the done flags, keep the best streak
--   * different days          -> whichever row holds the NEWER day wins
-- profile stays last-write-wins (it is genuinely "latest state").
--
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  v_existing_day text;
  v_incoming_day text;
begin
  if p_existing is null then return p_incoming; end if;
  if p_incoming is null then return p_existing; end if;

  if p_area = 'daily_mission' then
    v_existing_day := coalesce(p_existing->>'day', '');
    v_incoming_day := coalesce(p_incoming->>'day', '');
    if v_existing_day <> '' and v_existing_day = v_incoming_day then
      -- Same day: no device can un-finish a task another device finished.
      return p_incoming || p_existing
        || jsonb_build_object(
             'done',
             coalesce(p_existing->'done', '{}'::jsonb) || coalesce(p_incoming->'done', '{}'::jsonb),
             'streak',
             greatest(
               coalesce((p_existing->>'streak')::int, 0),
               coalesce((p_incoming->>'streak')::int, 0)
             ),
             'lastCompletedDay',
             greatest(
               coalesce(p_existing->>'lastCompletedDay', ''),
               coalesce(p_incoming->>'lastCompletedDay', '')
             )
           );
    elsif v_existing_day > v_incoming_day then
      -- Stored row is from a NEWER day than the incoming write: keep it.
      return p_existing;
    else
      return p_incoming;
    end if;
  end if;

  if p_area = 'profile' then
    return p_incoming;
  end if;

  return public.lp_jsonb_forward_merge(p_existing, p_incoming);
end;
$$;
