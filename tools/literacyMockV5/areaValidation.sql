-- These private rules use canonical published items and server-scored answers.
create or replace function public.lp_mock_area_band(p_item jsonb)
returns integer language sql immutable set search_path='' as $$
 select case when p_item#>>'{itemSnapshot,adaptiveAreaVersion}'='areas-v1'
  and p_item#>>'{itemSnapshot,adaptiveAreaBand}'~'^[0-6]$'
  then (p_item#>>'{itemSnapshot,adaptiveAreaBand}')::integer else null end;
$$;

create or replace function public.lp_mock_area_next_band(p_session_id uuid,p_student_id uuid,p_domain text)
returns integer language sql stable security definer set search_path='' as $$
 with observations as (
  select i.item,public.lp_literacy_mock_effective_response(p_session_id,p_student_id,r.response) response,r.position
  from public.literacy_mock_runs run
  cross join lateral jsonb_array_elements(run.responses) with ordinality r(response,position)
  join public.literacy_mock_items i on i.content_version='literacy-mock-v5' and i.id=r.response->>'questionId'
  where run.session_id=p_session_id and run.student_id=p_student_id and i.item->>'domainId'=p_domain
 ), latest as (
  select greatest(0,least(public.lp_mock_area_max(p_domain),public.lp_mock_area_band(item)
   +case when (response->>'isCorrect')::boolean then 1 else -1 end)) band
  from observations where public.lp_literacy_response_eligible(response) and public.lp_mock_area_band(item) is not null
  order by position desc limit 1
 ) select coalesce((select band from latest),1);
$$;

create or replace function public.lp_mock_area_plan_error(p_session_id uuid,p_student_id uuid,p_plan jsonb,p_old_plan jsonb,
 p_answered integer,p_failures jsonb)
returns text language plpgsql stable security definer set search_path='' as $$
declare v_id text; v_index integer; v_item jsonb; v_old jsonb; v_domain text; v_band integer; v_expected integer; v_shown boolean;
begin
 if jsonb_array_length(p_plan->'itemIds')<>43 then return 'invalid_plan'; end if;
 for v_id,v_index in select value,ordinality::integer from jsonb_array_elements_text(p_plan->'itemIds') with ordinality loop
  select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v5' and id=v_id;
  v_domain:=public.lp_mock_area_at(v_index);
  v_band:=public.lp_mock_area_band(v_item);
  if v_item->>'domainId' is distinct from v_domain or v_band is null
   or v_item#>>'{itemSnapshot,adaptiveMixedEligible}' is distinct from 'true' then return 'invalid_area_plan'; end if;
  if v_index<=p_answered then continue; end if;
  if p_old_plan is null then
   if v_band<>1 then return 'invalid_entry_level'; end if;
   continue;
  end if;
  select item into v_old from public.literacy_mock_items where content_version='literacy-mock-v5' and id=p_old_plan->'itemIds'->>(v_index-1);
  v_shown:=exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id
   and question_id=v_old->>'id' and event_type='presented');
  if public.lp_literacy_mock_item_blocked(v_old,p_failures) or public.lp_literacy_item_quarantined(v_old) then
   if public.lp_literacy_mock_conditions(v_item) is distinct from public.lp_literacy_mock_conditions(v_old)
    or v_band is distinct from public.lp_mock_area_band(v_old) then return 'plan_condition_conflict'; end if;
   v_expected:=public.lp_mock_area_band(v_old);
  elsif v_shown then
   if v_id is distinct from v_old->>'id' then return 'presented_item_frozen'; end if;
   v_expected:=public.lp_mock_area_band(v_old);
  elsif not exists(select 1 from generate_series(p_answered+1,v_index-1) n where public.lp_mock_area_at(n)=v_domain) then
   v_expected:=public.lp_mock_area_next_band(p_session_id,p_student_id,v_domain);
  else
   v_expected:=public.lp_mock_area_band(v_old);
  end if;
  if v_band is distinct from v_expected then return 'invalid_adaptation'; end if;
 end loop;
 return null;
end; $$;
