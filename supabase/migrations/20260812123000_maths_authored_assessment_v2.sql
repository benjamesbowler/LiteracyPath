-- Version the Foundation Maths assessment boundary against the authored v2
-- manifest. The v1 validator remains available for evidence already queued on
-- learner devices, while all new evidence is checked against explicit values.

begin;

alter function public.maths_validate_student_evidence(text,text,text,jsonb)
  rename to maths_validate_student_evidence_v1;

create function public.maths_validate_student_evidence_v2(
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
  v_blueprint text;
  v_expected_blueprint text;
  v_index integer;
  v_model_index integer;
  v_variant integer;
  v_target integer;
  v_other integer;
  v_part_a integer;
  v_expected_number integer;
  v_expected_text text;
  v_response_number integer;
  v_response_text text;
  v_rendered_target integer;
  v_rendered_other integer;
  v_rendered_part_a integer;
  v_correct boolean;
  v_classification text;
  v_expected_representation text;
  v_validated_practice jsonb;
begin
  if not public.maths_released_skill(p_skill_id)
    or jsonb_typeof(p_evidence) is distinct from 'object'
    or p_evidence -> 'schemaVersion' is distinct from '1'::jsonb
  then return null; end if;

  -- The v2 lesson, story and Arcade structures intentionally retain their v1
  -- stable IDs. Reuse the proven validator, then preserve the v2 envelope.
  if p_event_type = 'practice_attempt' then
    v_validated_practice := public.maths_validate_student_evidence_v1(
      p_skill_id,p_event_type,'maths-foundation-number-v1',p_evidence
    );
    return v_validated_practice;
  end if;

  if p_event_type <> 'skills_check_response'
    or p_evidence ->> 'source' <> 'maths_skills_check'
    or jsonb_typeof(p_evidence -> 'renderedRepresentation') is distinct from 'object'
  then return null; end if;

  v_item_key := p_evidence ->> 'itemKey';
  v_blueprint := p_evidence ->> 'blueprintId';
  v_expected_blueprint := case p_skill_id
    when 'F-N-SEQ-20' then 'number_sequence'
    when 'F-N-COUNT-10' then 'count_collection'
    when 'F-N-COUNT-20' then 'count_collection'
    when 'F-N-SUBITISE-5' then 'quick_quantity'
    when 'F-N-MATCH' then 'make_quantity'
    when 'F-N-COMPARE' then 'compare_quantities'
    when 'F-N-PART-5' then 'part_whole'
    when 'F-N-PART-10' then 'part_whole'
    else null
  end;
  if v_item_key is null
    or v_item_key !~ '^[a-z0-9_-]+:v[1-4]$'
    or v_blueprint is distinct from v_expected_blueprint
    or v_item_key not like lower(p_skill_id) || '-' || v_expected_blueprint || '-%'
  then return null; end if;

  begin
    v_index := substring(v_item_key from '-([0-9]{2}):v[1-4]$')::integer;
    v_variant := substring(v_item_key from ':v([1-4])$')::integer;
    v_model_index := (p_evidence ->> 'modelIndex')::integer;
  exception when others then return null;
  end;
  if v_index not between 1 and 20 or v_variant not between 1 and 4
    or v_model_index is distinct from v_index
  then return null; end if;

  v_expected_representation := case v_blueprint
    when 'number_sequence' then case when mod(v_variant,2)=1 then 'stepping_stones' else 'number_line' end
    when 'count_collection' then case when mod(v_variant,2)=1 then 'objects' else 'structured_frame' end
    when 'quick_quantity' then case when mod(v_variant,2)=1 then 'five_frame' else 'scattered_dots' end
    when 'make_quantity' then case when mod(v_variant,2)=1 then 'frame' else 'counter_tray' end
    when 'compare_quantities' then case when mod(v_variant,2)=1 then 'matched_rows' else 'structured_frames' end
    when 'part_whole' then case when mod(v_variant,2)=1 then 'part_whole' else 'two_colour_frame' end
    else null
  end;
  if not (
    p_evidence ->> 'representation' = v_expected_representation
    or (
      v_blueprint='quick_quantity'
      and p_evidence ->> 'representation'='sequential_access_count'
      and p_evidence ->> 'constructChanged'='true'
    )
  ) then return null; end if;

  v_target := case p_skill_id
    when 'F-N-SEQ-20' then (array[2,5,8,11,14,17,19,4,7,10,13,16,18,1,3,6,9,12,15,20])[v_index]
    when 'F-N-COUNT-10' then (array[3,6,9,2,8,5,10,4,7,1,6,4,8,3,9,5,7,2,10,1])[v_index]
    when 'F-N-COUNT-20' then (array[11,14,18,12,16,20,13,17,15,19,12,17,14,11,19,16,13,18,15,20])[v_index]
    when 'F-N-SUBITISE-5' then (array[1,3,5,2,4,3,4,2,5,1,4,3,2,5,1,3,5,2,4,1])[v_index]
    when 'F-N-MATCH' then (array[1,4,7,10,3,8,5,2,9,6,4,1,6,9,2,8,5,10,3,7])[v_index]
    when 'F-N-COMPARE' then (array[3,7,4,9,2,10,6,5,1,8,12,18,16,11,20,15,14,17,13,19])[v_index]
    when 'F-N-PART-5' then 5
    when 'F-N-PART-10' then 10
    else null
  end;
  v_other := case when p_skill_id='F-N-COMPARE'
    then (array[5,4,4,6,8,10,7,3,4,8,15,14,16,13,17,19,12,20,13,18])[v_index]
    else greatest(0,v_target-1) end;
  v_part_a := case p_skill_id
    when 'F-N-PART-5' then (array[1,2,3,4,0,2,1,4,3,0,4,2,1,3,0,2,4,1,3,0])[v_index]
    when 'F-N-PART-10' then (array[1,6,5,8,3,10,4,7,2,9,0,5,3,6,1,8,4,7,2,9])[v_index]
    else 0 end;

  begin
    v_rendered_target := (p_evidence -> 'renderedRepresentation' ->> 'target')::integer;
    v_rendered_other := (p_evidence -> 'renderedRepresentation' ->> 'other')::integer;
    v_rendered_part_a := (p_evidence -> 'renderedRepresentation' ->> 'partA')::integer;
  exception when others then return null;
  end;
  if v_rendered_target is distinct from v_target
    or (v_blueprint='compare_quantities' and v_rendered_other is distinct from v_other)
    or (v_blueprint='part_whole' and v_rendered_part_a is distinct from v_part_a)
  then return null; end if;

  if v_blueprint='compare_quantities' then
    v_expected_text := case when v_target>v_other then 'a' when v_target<v_other then 'b' else 'same' end;
    v_response_text := p_evidence ->> 'response';
    v_correct := v_response_text=v_expected_text;
    v_classification := case when v_correct then 'correct' else 'comparison_choice_mismatch' end;
  else
    v_expected_number := case when v_blueprint='part_whole' then v_target-v_part_a else v_target end;
    begin v_response_number := (p_evidence ->> 'response')::integer;
    exception when others then v_response_number := null;
    end;
    v_correct := v_response_number is not null and v_response_number=v_expected_number;
    v_classification := case
      when v_correct then 'correct'
      when v_response_number is null then 'not_checked'
      when abs(v_response_number-v_expected_number)=1 then 'off_by_one_response'
      when v_blueprint='number_sequence' then 'sequence_choice_mismatch'
      when v_blueprint='part_whole' then 'missing_part_mismatch'
      else 'other_incorrect_response'
    end;
  end if;

  return (p_evidence-'expected'-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
    || jsonb_build_object(
      'correct',v_correct,
      'classification',v_classification,
      'observedSignals',case
        when v_correct or v_classification='not_checked' then '[]'::jsonb
        else jsonb_build_array(v_classification)
      end,
      'serverValidated',true
    );
end;
$$;

create function public.maths_validate_student_evidence(
  p_skill_id text,
  p_event_type text,
  p_content_version text,
  p_evidence jsonb
)
returns jsonb
language plpgsql immutable
set search_path = public
as $$
begin
  if p_content_version='maths-foundation-number-v1' then
    return public.maths_validate_student_evidence_v1(
      p_skill_id,p_event_type,p_content_version,p_evidence
    );
  end if;
  if p_content_version='maths-foundation-number-v2' then
    return public.maths_validate_student_evidence_v2(
      p_skill_id,p_event_type,p_evidence
    );
  end if;
  return null;
end;
$$;

revoke all on function public.maths_validate_student_evidence_v1(text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.maths_validate_student_evidence_v2(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.maths_validate_student_evidence(text,text,text,jsonb) from public,anon,authenticated;

notify pgrst, 'reload schema';
commit;
