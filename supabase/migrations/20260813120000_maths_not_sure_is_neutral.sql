begin;

-- A learner choosing “Not sure yet” is missing evidence, never an incorrect
-- response. Keep the authored-v2 validator as the authority for every other
-- field, then normalise this one explicit neutral action after validation.
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
    return public.maths_validate_student_evidence_v1(
      p_skill_id,p_event_type,p_content_version,p_evidence
    );
  end if;
  if p_content_version<>'maths-foundation-number-v2' then
    return null;
  end if;
  v_validated := public.maths_validate_student_evidence_v2(
    p_skill_id,p_event_type,p_evidence
  );
  if v_validated is null then return null; end if;
  if p_event_type='skills_check_response' and p_evidence->>'response' is null then
    return (v_validated-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
      || jsonb_build_object(
        'correct',false,
        'classification','not_checked',
        'observedSignals','[]'::jsonb,
        'misconceptionCodes','[]'::jsonb
      );
  end if;
  return v_validated;
end;
$$;

revoke all on function public.maths_validate_student_evidence(text,text,text,jsonb) from public,anon,authenticated;

notify pgrst, 'reload schema';
commit;
