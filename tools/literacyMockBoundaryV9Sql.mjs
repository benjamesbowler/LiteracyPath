import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_ORDER } from '../src/policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_V9_AREA_BUDGETS, LITERACY_MOCK_V9_MAX_ITEMS,
  LITERACY_MOCK_V9_PRINT_LETTER_LIMIT, LITERACY_MOCK_V9_CONFIRMATIONS } from '../src/policy/literacyMockBoundaryV9.js';

const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;

/** Canonical SQL mirror of the V9 observed-boundary policy. All helpers are
 * private; existing teacher ownership and child-token RPC checks remain. */
export function literacyMockBoundaryV9Sql() {
  return `create or replace function public.lp_mock_boundary_rows_v9(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(public.lp_literacy_mock_effective_response(p_session_id,p_student_id,r.response)
   ||jsonb_build_object('questionId',i.id,'domainId',i.item->'domainId','skillId',i.item->'skillId','itemSnapshot',i.item->'itemSnapshot') order by r.position),'[]'::jsonb)
 from public.literacy_mock_runs run cross join lateral jsonb_array_elements(run.responses) with ordinality r(response,position)
 join public.literacy_mock_items i on i.content_version='literacy-mock-v9' and i.id=r.response->>'questionId'
 where run.session_id=p_session_id and run.student_id=p_student_id;
$$;

create or replace function public.lp_mock_boundary_state_v9(p_rows jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v_budgets jsonb:=${literal(LITERACY_MOCK_V9_AREA_BUDGETS)}; v_maxima jsonb:=${literal(LITERACY_MOCK_AREA_MAX)};
 v_result jsonb:='{}'; v_domain text; v_max integer; v_row jsonb; v_item jsonb; v_band integer;
 v_next integer; v_answered integer; v_eligible integer; v_correct jsonb; v_wrong jsonb;
 v_letters text[]; v_letter text; v_reason text; v_boundary jsonb; v_non_independent integer; v_non_band integer;
begin
 for v_domain in select value from jsonb_array_elements_text(${literal(LITERACY_MOCK_AREA_ORDER)}) loop
  v_max:=(v_maxima->>v_domain)::integer; v_next:=0; v_answered:=0; v_eligible:=0;
  v_correct:=to_jsonb(array_fill(0,array[v_max+1])); v_wrong:=v_correct; v_letters:='{}'; v_reason:=null; v_boundary:=null; v_non_independent:=0; v_non_band:=null;
  for v_row in select value from jsonb_array_elements(coalesce(p_rows,'[]')) loop
   if v_row->>'responseStatus'='media_failed' then continue; end if;
   v_item:=coalesce(v_row->'itemSnapshot',v_row->'questionSnapshot',v_row);
   if v_item->>'domainId' is distinct from v_domain then continue; end if;
   v_band:=public.lp_mock_area_band(jsonb_build_object('itemSnapshot',v_item));
   if v_band is null or v_band<0 or v_band>v_max then continue; end if;
   v_answered:=v_answered+1;
   if v_domain='print' and v_band<=1 then
    v_letter:=coalesce(public.lp_literacy_print_letter_target(v_item),'question:'||coalesce(v_row->>'questionId',v_item->>'id',v_answered::text));
    if not v_letter=any(v_letters) then v_letters:=array_append(v_letters,v_letter); end if;
   end if;
   if (v_row ? 'classification' and v_row->>'classification'<>'independent') or not public.lp_literacy_response_eligible(v_row) then
    v_non_independent:=case when v_non_band=v_band then v_non_independent+1 else 1 end; v_non_band:=v_band; continue;
   end if;
   v_non_independent:=0; v_non_band:=null;
   v_eligible:=v_eligible+1;
   if (v_row->>'isCorrect')::boolean then
    v_correct:=jsonb_set(v_correct,array[v_band::text],to_jsonb((v_correct->>v_band)::integer+1)); v_next:=least(v_max,v_band+1);
   else
    v_wrong:=jsonb_set(v_wrong,array[v_band::text],to_jsonb((v_wrong->>v_band)::integer+1)); v_next:=greatest(0,v_band-1);
   end if;
  end loop;
  if (v_correct->>v_max)::integer>=${LITERACY_MOCK_V9_CONFIRMATIONS} then
   v_reason:='ceiling_confirmed'; v_boundary:=jsonb_build_object('lowerBand',v_max,'upperBand',null);
  elsif (v_wrong->>0)::integer>=${LITERACY_MOCK_V9_CONFIRMATIONS} then
   v_reason:='floor_confirmed'; v_boundary:=jsonb_build_object('lowerBand',null,'upperBand',0);
  else
   for v_band in reverse v_max-1..0 loop
    if (v_correct->>v_band)::integer>=${LITERACY_MOCK_V9_CONFIRMATIONS} and (v_wrong->>(v_band+1))::integer>=${LITERACY_MOCK_V9_CONFIRMATIONS} then
     v_reason:='adjacent_boundary'; v_boundary:=jsonb_build_object('lowerBand',v_band,'upperBand',v_band+1); exit;
    end if;
   end loop;
  end if;
  if v_reason is null and v_non_independent>=2 then v_reason:='independent_followup_needed'; end if;
  if v_reason is null and v_domain='print' and v_next<=1 and cardinality(v_letters)>=${LITERACY_MOCK_V9_PRINT_LETTER_LIMIT} then v_reason:='letter_limit'; end if;
  if v_reason is null and v_answered>=(v_budgets->>v_domain)::integer then v_reason:='budget_limit'; end if;
  v_result:=v_result||jsonb_build_object(v_domain,jsonb_build_object('domainId',v_domain,'nextBand',v_next,'answered',v_answered,'eligible',v_eligible,
   'correctByBand',v_correct,'incorrectByBand',v_wrong,'lowerLetterTargets',to_jsonb(v_letters),'nonIndependentStreak',v_non_independent,'nonIndependentBand',v_non_band,'stopReason',v_reason,'boundary',v_boundary,'complete',v_reason is not null));
 end loop;
 return v_result;
end; $$;

create or replace function public.lp_mock_boundary_schedule_v9(p_rows jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v_budgets jsonb:=${literal(LITERACY_MOCK_V9_AREA_BUDGETS)}; v_states jsonb:=public.lp_mock_boundary_state_v9(p_rows);
 v_order jsonb:=${literal(LITERACY_MOCK_AREA_ORDER)}; v_seen jsonb:='{}'; v_schedule jsonb:='[]'; v_row jsonb; v_domain text; v_round integer; v_slot integer; v_ordinal integer;
begin
 for v_row in select value from jsonb_array_elements(coalesce(p_rows,'[]')) loop
  if v_row->>'responseStatus'='media_failed' then continue; end if;
  v_domain:=coalesce(v_row#>>'{itemSnapshot,domainId}',v_row#>>'{questionSnapshot,domainId}',v_row->>'domainId');
  if v_domain is null or not v_budgets ? v_domain then raise exception 'Invalid adaptive boundary history'; end if;
  v_schedule:=v_schedule||jsonb_build_array(v_domain);
 end loop;
 for v_domain in select value from jsonb_array_elements_text(v_order) loop
  if (v_states#>>array[v_domain,'answered'])::integer>(v_budgets->>v_domain)::integer then raise exception 'Invalid adaptive boundary history'; end if;
 end loop;
 if jsonb_array_length(v_schedule)>${LITERACY_MOCK_V9_MAX_ITEMS} then raise exception 'Invalid adaptive boundary history'; end if;
 for v_round in 0..${Math.ceil(Math.max(...Object.values(LITERACY_MOCK_V9_AREA_BUDGETS)) / 2) - 1} loop
  for v_domain in select value from jsonb_array_elements_text(v_order) loop
   for v_slot in 1..2 loop
    v_ordinal:=v_round*2+v_slot;
    if v_ordinal<=(v_budgets->>v_domain)::integer and v_ordinal>(v_states#>>array[v_domain,'answered'])::integer
     and not (v_states#>>array[v_domain,'complete'])::boolean then v_schedule:=v_schedule||jsonb_build_array(v_domain); end if;
   end loop;
  end loop;
 end loop;
 return v_schedule;
end; $$;

create or replace function public.lp_mock_boundary_plan_error_v9(p_session_id uuid,p_student_id uuid,p_plan jsonb,p_old_plan jsonb,p_answered integer,p_failures jsonb)
returns text language plpgsql stable security definer set search_path='' as $$
declare v_rows jsonb:=public.lp_mock_boundary_rows_v9(p_session_id,p_student_id); v_reserved jsonb; v_states jsonb; v_schedule jsonb;
 v_id text; v_index integer; v_item jsonb; v_old jsonb; v_current jsonb; v_domain text; v_band integer; v_expected integer;
 v_ordinals jsonb:='{}'; v_first jsonb:='{}'; v_ordinal integer; v_shown boolean:=false; v_repair boolean:=false;
begin
 if p_answered<>jsonb_array_length(v_rows) or jsonb_typeof(p_plan->'itemIds') is distinct from 'array'
  or jsonb_array_length(p_plan->'itemIds') not between p_answered and ${LITERACY_MOCK_V9_MAX_ITEMS} then return 'invalid_plan'; end if;
 v_states:=public.lp_mock_boundary_state_v9(v_rows); v_reserved:=v_rows;
 if p_old_plan is not null then
  select item into v_current from public.literacy_mock_items where content_version='literacy-mock-v9' and id=p_old_plan->'itemIds'->>p_answered;
  v_shown:=v_current is not null and exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and question_id=v_current->>'id' and event_type='presented');
  if v_current is not null and (v_shown or public.lp_literacy_mock_item_blocked(v_current,p_failures)) then
   v_reserved:=v_rows||jsonb_build_array(jsonb_build_object('questionId',v_current->'id','itemSnapshot',v_current->'itemSnapshot','responseStatus','skipped','evidenceType','unscored','isCorrect',null));
  end if;
  -- Media/content repair is a separate transition, preserving every other
  -- slot and the exact failed task before ordinary adaptation resumes.
  if jsonb_array_length(p_plan->'itemIds')=jsonb_array_length(p_old_plan->'itemIds') and p_plan->'itemIds' is distinct from p_old_plan->'itemIds' then
   v_repair:=true;
   for v_id,v_index in select value,ordinality::integer from jsonb_array_elements_text(p_plan->'itemIds') with ordinality loop
    if v_id=p_old_plan->'itemIds'->>(v_index-1) then continue; end if;
    select item into v_old from public.literacy_mock_items where content_version='literacy-mock-v9' and id=p_old_plan->'itemIds'->>(v_index-1);
    select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v9' and id=v_id;
    if v_index<=p_answered or v_item is null or not (public.lp_literacy_mock_item_blocked(v_old,p_failures) or public.lp_literacy_item_quarantined(v_old))
     or public.lp_literacy_mock_conditions(v_item) is distinct from public.lp_literacy_mock_conditions(v_old)
     or public.lp_mock_area_band(v_item) is distinct from public.lp_mock_area_band(v_old)
     or public.lp_literacy_item_quarantined(v_item) or public.lp_literacy_mock_item_blocked(v_item,p_failures)
     or v_item#>>'{itemSnapshot,adaptiveMixedEligible}' is distinct from 'true' then v_repair:=false; exit; end if;
   end loop;
   if v_repair then return null; end if;
  end if;
 end if;
 v_schedule:=public.lp_mock_boundary_schedule_v9(v_reserved);
 if jsonb_array_length(p_plan->'itemIds')<>jsonb_array_length(v_schedule) then return 'invalid_plan'; end if;
 for v_id,v_index in select value,ordinality::integer from jsonb_array_elements_text(p_plan->'itemIds') with ordinality loop
  select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v9' and id=v_id;
  v_domain:=v_schedule->>(v_index-1); v_band:=public.lp_mock_area_band(v_item);
  if v_item is null or v_item->>'domainId' is distinct from v_domain or v_band is null
   or v_item#>>'{itemSnapshot,adaptiveAreaVersion}' is distinct from 'areas-v5'
   or v_item#>>'{itemSnapshot,adaptiveMixedEligible}' is distinct from 'true' then return 'invalid_area_plan'; end if;
  v_ordinal:=coalesce((v_ordinals->>v_domain)::integer,0)+1; v_ordinals:=v_ordinals||jsonb_build_object(v_domain,v_ordinal);
  if v_index<=p_answered then
   if v_id is distinct from v_rows->(v_index-1)->>'questionId' then return 'plan_conflict'; end if;
   continue;
  end if;
  if not v_first ? v_domain then
   v_first:=v_first||jsonb_build_object(v_domain,true); v_expected:=(v_states#>>array[v_domain,'nextBand'])::integer;
  else v_expected:=case when v_domain='print' and v_ordinal>${LITERACY_MOCK_V9_PRINT_LETTER_LIMIT} then 2 else 0 end;
  end if;
  if v_index=p_answered+1 and jsonb_array_length(v_reserved)>p_answered then
   if v_id is distinct from v_current->>'id' then return 'presented_item_frozen'; end if;
   v_expected:=public.lp_mock_area_band(v_current);
  end if;
  if v_band is distinct from v_expected then return case when p_old_plan is null then 'invalid_entry_level' else 'invalid_adaptation' end; end if;
 end loop;
 return null;
end; $$;

revoke all on function public.lp_mock_boundary_rows_v9(uuid,uuid) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_state_v9(jsonb) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_schedule_v9(jsonb) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_plan_error_v9(uuid,uuid,jsonb,jsonb,integer,jsonb) from public,anon,authenticated;
`;
}
