begin;

-- These functions already qualify application functions/tables with public.
-- Pin name resolution instead of inheriting a caller-controlled search path.
-- No learner rows, ownership checks or merge behavior change.
alter function public.lp_campaign_canonical(jsonb) set search_path = '';
alter function public.lp_campaign_num(jsonb) set search_path = '';
alter function public.lp_campaign_earliest(jsonb,jsonb) set search_path = '';
alter function public.lp_campaign_union_records(jsonb,jsonb) set search_path = '';
alter function public.lp_campaign_strings(jsonb,jsonb) set search_path = '';
alter function public.lp_campaign_event_key(jsonb) set search_path = '';
alter function public.lp_campaign_events(jsonb) set search_path = '';
alter function public.lp_campaign_counts(jsonb,text) set search_path = '';
alter function public.lp_campaign_merge_targets(jsonb,jsonb,jsonb,jsonb,jsonb) set search_path = '';
alter function public.lp_campaign_challenge_identity(jsonb) set search_path = '';
alter function public.lp_campaign_checkpoint(jsonb,jsonb) set search_path = '';
alter function public.lp_merge_sound_seekers_campaign(jsonb,jsonb) set search_path = '';
alter function public.lp_merge_phonics_quest(jsonb,jsonb) set search_path = '';
alter function public.lp_campaign_require_full_insert() set search_path = '';

notify pgrst, 'reload schema';
commit;
