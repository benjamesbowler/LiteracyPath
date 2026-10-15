-- Inspect newest canonical observations first. Help resolution can change
-- eligibility, so evaluate it until the newest eligible response is found.
create or replace function public.lp_mock_area_next_band(p_session_id uuid,p_student_id uuid,p_domain text)
returns integer language plpgsql stable security definer set search_path='' as $$
declare v_response jsonb; v_item jsonb; v_effective jsonb;
begin
 for v_response in
  select r.response from public.literacy_mock_runs run
  cross join lateral jsonb_array_elements(run.responses) with ordinality r(response,position)
  where run.session_id=p_session_id and run.student_id=p_student_id and r.response->>'domainId'=p_domain
  order by r.position desc
 loop
  -- A point lookup avoids a generic PL/pgSQL join plan scanning the catalogue.
  select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v5' and id=v_response->>'questionId';
  if v_item->>'domainId' is distinct from p_domain or public.lp_mock_area_band(v_item) is null then continue; end if;
  v_effective:=public.lp_literacy_mock_effective_response(p_session_id,p_student_id,v_response);
  if public.lp_literacy_response_eligible(v_effective) then
   return greatest(0,least(public.lp_mock_area_max(p_domain),public.lp_mock_area_band(v_item)
    +case when (v_effective->>'isCorrect')::boolean then 1 else -1 end));
  end if;
 end loop;
 return 1;
end; $$;

-- A batch consumes only ok/error from its inner mutations. Suppress repeated
-- JSON projection, never validation or writes. Restore the local setting before
-- the final receipt, and on error. Public calls still receive the complete run.
create or replace function public.lp_literacy_mock_run_json(p_session_id uuid,p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_run public.literacy_mock_runs;
begin
 if current_setting('literacy_mock.batch_receipt_only',true)='on' then return null; end if;
 select * into v_run from public.literacy_mock_runs where session_id=p_session_id and student_id=p_student_id;
 if not found then return null; end if;
 return public.lp_mock_run_before_delivery(p_session_id,p_student_id)||jsonb_build_object(
  'offlineLeaseId',v_run.offline_lease_id,'offlineLeaseExpiresAt',v_run.offline_lease_expires_at,
  'collectionAckId',v_run.collection_ack_id,'collectionAckAt',v_run.collection_ack_at);
end; $$;
