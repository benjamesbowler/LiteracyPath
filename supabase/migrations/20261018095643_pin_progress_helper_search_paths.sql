begin;

-- Pin the remaining progress JSON helpers to trusted PostgreSQL built-ins.
-- Application helper calls are already schema-qualified with public.
-- Preserve function bodies, signatures, ownership, volatility and EXECUTE ACLs.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter function public.lp_el_quest_epoch(jsonb) set search_path = '';
alter function public.lp_el_quest_number(jsonb, text) set search_path = '';
alter function public.lp_el_quest_schema(jsonb) set search_path = '';
alter function public.lp_forward_merge_progress(text, jsonb, jsonb) set search_path = '';
alter function public.lp_has_canonical_el_quest_cycles(jsonb) set search_path = '';
alter function public.lp_hollow_merge_feeds(jsonb, jsonb) set search_path = '';
alter function public.lp_hollow_merge_records(jsonb, jsonb, integer) set search_path = '';
alter function public.lp_is_current_el_quest(jsonb) set search_path = '';
alter function public.lp_jsonb_forward_merge(jsonb, jsonb) set search_path = '';
alter function public.lp_merge_daily_mission(jsonb, jsonb) set search_path = '';
alter function public.lp_merge_el_quest_cycles(jsonb, jsonb) set search_path = '';
alter function public.lp_merge_hollow(jsonb, jsonb) set search_path = '';
alter function public.lp_merge_transfer_missions(jsonb, jsonb) set search_path = '';
alter function public.lp_normalize_el_quest(jsonb) set search_path = '';
alter function public.lp_quest_independent_count(jsonb) set search_path = '';
alter function public.lp_quest_merge_learning_v2(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_merge_mastery(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_merge_mastery_record(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_merge_v2_content_decks(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_merge_v2_deck(text, jsonb, jsonb) set search_path = '';
alter function public.lp_quest_normalize_v2_activity_type(text, text) set search_path = '';
alter function public.lp_quest_normalize_v2_assignment(jsonb) set search_path = '';
alter function public.lp_quest_normalize_v2_attempt_receipt(text, jsonb) set search_path = '';
alter function public.lp_quest_normalize_v2_deck_use(text, text, jsonb) set search_path = '';
alter function public.lp_quest_normalize_v2_deck_visit(text, text, jsonb) set search_path = '';
alter function public.lp_quest_num(jsonb, text) set search_path = '';
alter function public.lp_quest_pending_reset_ids(jsonb, text, jsonb) set search_path = '';
alter function public.lp_quest_reset_history(jsonb, jsonb, text, text) set search_path = '';
alter function public.lp_quest_reset_id_set(jsonb, jsonb, jsonb, jsonb) set search_path = '';
alter function public.lp_quest_union_by_id(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_union_v2_attempt_receipts(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_union_v2_deck_uses(text, jsonb, jsonb) set search_path = '';
alter function public.lp_quest_union_v2_deck_visits(text, jsonb, jsonb) set search_path = '';
alter function public.lp_quest_union_v2_evidence(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_union_v2_ids(jsonb, jsonb) set search_path = '';
alter function public.lp_quest_valid_v2_attempt_receipts(jsonb, jsonb, jsonb) set search_path = '';
alter function public.lp_quest_valid_v2_content_decks(jsonb, jsonb, jsonb) set search_path = '';
alter function public.lp_status_rank(text) set search_path = '';

notify pgrst, 'reload schema';
commit;
