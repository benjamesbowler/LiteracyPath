create or replace function public.lp_mock_area_plan_error(p_session_id uuid,p_student_id uuid,p_plan jsonb,p_old_plan jsonb,
 p_answered integer,p_failures jsonb)
returns text language plpgsql stable security definer set search_path='' as $$
declare v_id text; v_index integer; v_item jsonb; v_old jsonb; v_domain text; v_band integer; v_expected integer; v_shown boolean;
begin
 if jsonb_array_length(p_plan->'itemIds')<>43 then return 'invalid_plan'; end if;
 for v_id,v_index in select value,ordinality::integer from jsonb_array_elements_text(p_plan->'itemIds') with ordinality loop
  v_domain:=public.lp_mock_area_at(v_index);
  -- Unchanged non-current slots were validated with the immutable publication.
  -- The public save still checks their current quarantine/media status.
  if p_old_plan is not null and v_id=p_old_plan->'itemIds'->>(v_index-1)
   and (v_index<=p_answered or exists(select 1 from generate_series(p_answered+1,v_index-1) n where public.lp_mock_area_at(n)=v_domain)) then continue; end if;
  select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v5' and id=v_id;
  v_band:=public.lp_mock_area_band(v_item);
  if v_item->>'domainId' is distinct from v_domain or v_band is null
   or v_item#>>'{itemSnapshot,adaptiveMixedEligible}' is distinct from 'true' then return 'invalid_area_plan'; end if;
  if v_index<=p_answered then continue; end if;
  if p_old_plan is null then
   if v_band<>1 then return 'invalid_entry_level'; end if;
   continue;
  end if;
  if v_id=p_old_plan->'itemIds'->>(v_index-1) then v_old:=v_item;
  else select item into v_old from public.literacy_mock_items where content_version='literacy-mock-v5' and id=p_old_plan->'itemIds'->>(v_index-1); end if;
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
