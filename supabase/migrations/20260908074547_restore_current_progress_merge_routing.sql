begin;

-- Restore the current routing after older Sound Seekers SQL replaced the
-- dispatcher in the hosted database. Keep each area's canonical merge helper.
-- This changes only the function: no progress rows or reset are replayed.
CREATE OR REPLACE FUNCTION public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area = 'profile' then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    when p_area = 'transfer_missions' then public.lp_merge_transfer_missions(p_existing, p_incoming)
    when p_area = 'el_quest' then public.lp_merge_el_quest(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$function$;

notify pgrst, 'reload schema';

commit;
