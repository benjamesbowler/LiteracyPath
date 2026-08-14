-- Foundation Maths v3 keeps every authored value from v2 while requiring
-- both directions of the count/construct and numeral/quantity relationships.
-- Existing v1 and v2 device queues remain valid and version-dispatched.

begin;

create function public.maths_validate_student_evidence_v3(
  p_skill_id text,
  p_event_type text,
  p_evidence jsonb
)
returns jsonb
language plpgsql immutable
set search_path = public
as $$
declare
  v_item_key text;
  v_index integer;
  v_variant integer;
  v_blueprint text;
  v_old_blueprint text;
  v_expected_representation text;
  v_old_representation text;
  v_compat jsonb;
  v_validated jsonb;
begin
  if p_event_type='practice_attempt' then
    return public.maths_validate_student_evidence_v1(
      p_skill_id,p_event_type,'maths-foundation-number-v1',p_evidence
    );
  end if;

  if p_event_type<>'skills_check_response'
    or p_evidence->>'source'<>'maths_skills_check'
  then return null; end if;

  v_item_key := p_evidence->>'itemKey';
  v_blueprint := p_evidence->>'blueprintId';
  begin
    v_index := substring(v_item_key from '-([0-9]{2}):v[1-4]$')::integer;
    v_variant := substring(v_item_key from ':v([1-4])$')::integer;
  exception when others then return null;
  end;

  -- Models 11–20 reverse the relationship for these three goals. The
  -- authored target arrays are unchanged, so the v2 value validator remains
  -- the single source of truth after a tightly checked compatibility rewrite.
  if v_index between 11 and 20 and p_skill_id in ('F-N-COUNT-10','F-N-COUNT-20') then
    v_old_blueprint := 'count_collection';
    if v_blueprint<>'make_quantity' then return null; end if;
    v_expected_representation := case when mod(v_variant,2)=1 then 'frame' else 'counter_tray' end;
    v_old_representation := case when mod(v_variant,2)=1 then 'objects' else 'structured_frame' end;
  elsif v_index between 11 and 20 and p_skill_id='F-N-MATCH' then
    v_old_blueprint := 'make_quantity';
    if v_blueprint<>'count_collection' then return null; end if;
    v_expected_representation := case when mod(v_variant,2)=1 then 'objects' else 'structured_frame' end;
    v_old_representation := case when mod(v_variant,2)=1 then 'frame' else 'counter_tray' end;
  else
    return public.maths_validate_student_evidence_v2(p_skill_id,p_event_type,p_evidence);
  end if;

  if p_evidence->>'representation' is distinct from v_expected_representation
    or v_item_key not like lower(p_skill_id)||'-'||v_blueprint||'-%'
    or (p_evidence->>'modelIndex')::integer is distinct from v_index
  then return null; end if;

  v_compat := jsonb_set(p_evidence,'{itemKey}',to_jsonb(replace(v_item_key,'-'||v_blueprint||'-','-'||v_old_blueprint||'-')));
  v_compat := jsonb_set(v_compat,'{blueprintId}',to_jsonb(v_old_blueprint));
  v_compat := jsonb_set(v_compat,'{representation}',to_jsonb(v_old_representation));
  v_validated := public.maths_validate_student_evidence_v2(p_skill_id,p_event_type,v_compat);
  if v_validated is null then return null; end if;

  return (p_evidence-'expected'-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
    || jsonb_build_object(
      'correct',v_validated->'correct',
      'classification',v_validated->'classification',
      'observedSignals',v_validated->'observedSignals',
      'misconceptionCodes',coalesce(v_validated->'misconceptionCodes','[]'::jsonb),
      'serverValidated',true
    );
exception when others then
  return null;
end;
$$;

create or replace function public.maths_validate_student_evidence(
  p_skill_id text,
  p_event_type text,
  p_content_version text,
  p_evidence jsonb
)
returns jsonb
language plpgsql immutable
set search_path = public
as $$
declare
  v_validated jsonb;
begin
  if p_content_version='maths-foundation-number-v1' then
    return public.maths_validate_student_evidence_v1(p_skill_id,p_event_type,p_content_version,p_evidence);
  elsif p_content_version='maths-foundation-number-v2' then
    v_validated := public.maths_validate_student_evidence_v2(p_skill_id,p_event_type,p_evidence);
  elsif p_content_version='maths-foundation-number-v3' then
    v_validated := public.maths_validate_student_evidence_v3(p_skill_id,p_event_type,p_evidence);
  else
    return null;
  end if;
  if v_validated is null then return null; end if;
  if p_event_type='skills_check_response' and p_evidence->>'response' is null then
    return (v_validated-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
      || jsonb_build_object('correct',false,'classification','not_checked','observedSignals','[]'::jsonb,'misconceptionCodes','[]'::jsonb);
  end if;
  return v_validated;
end;
$$;

revoke all on function public.maths_validate_student_evidence_v3(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.maths_validate_student_evidence(text,text,text,jsonb) from public,anon,authenticated;

notify pgrst, 'reload schema';
commit;
