-- Foundation Maths v4 binds each assessment result to the interaction that
-- produced it. Values and correctness remain delegated to the released v3
-- manifest; this layer verifies recognition/construction direction, transfer
-- purpose and the bounded interaction trace. Queued v1-v3 evidence remains
-- version-dispatched and valid.

begin;

create function public.maths_validate_student_evidence_v4(
  p_skill_id text,
  p_event_type text,
  p_evidence jsonb
)
returns jsonb
language plpgsql stable
set search_path = public
as $$
declare
  v_validated jsonb;
  v_item_key text;
  v_blueprint text;
  v_index integer;
  v_variant integer;
  v_response jsonb;
  v_response_trace jsonb;
  v_response_mode text;
  v_response_direction text;
  v_evidence_purpose text;
  v_item_representation text;
  v_expected_representation text;
  v_expected_response_mode text;
  v_expected_direction text;
  v_expected_purpose text;
  v_target integer;
  v_other integer;
  v_part_a integer;
  v_maximum integer;
  v_capacity integer;
  v_count integer;
  v_endpoint integer;
  v_pair_target integer;
  v_pairs_created integer;
  v_option_slot integer;
  v_actions jsonb;
  v_steps jsonb;
  v_start integer;
  v_last integer;
  v_value integer;
  v_position integer;
begin
  if p_event_type = 'practice_attempt' then
    return public.maths_validate_student_evidence_v1(
      p_skill_id,p_event_type,'maths-foundation-number-v1',p_evidence
    );
  end if;
  if p_event_type <> 'skills_check_response'
    or p_evidence ->> 'source' <> 'maths_skills_check'
    or not (p_evidence ? 'response')
    or jsonb_typeof(p_evidence -> 'renderedRepresentation') is distinct from 'object'
    or jsonb_typeof(p_evidence -> 'renderedRepresentation' -> 'response') is distinct from 'object'
  then return null; end if;

  -- v3 remains the single authority for item identity, authored values,
  -- representations, expected response and server-derived correctness.
  v_validated := public.maths_validate_student_evidence_v3(
    p_skill_id,p_event_type,p_evidence
  );
  if v_validated is null then return null; end if;

  v_item_key := p_evidence ->> 'itemKey';
  v_blueprint := p_evidence ->> 'blueprintId';
  v_response := p_evidence -> 'response';
  v_response_trace := p_evidence -> 'renderedRepresentation' -> 'response';
  v_response_mode := p_evidence ->> 'responseMode';
  v_response_direction := p_evidence ->> 'responseDirection';
  v_evidence_purpose := p_evidence ->> 'evidencePurpose';
  v_item_representation := p_evidence -> 'renderedRepresentation' ->> 'representation';
  begin
    v_index := substring(v_item_key from '-([0-9]{2}):v[1-4]$')::integer;
    v_variant := substring(v_item_key from ':v([1-4])$')::integer;
    v_target := (p_evidence -> 'renderedRepresentation' ->> 'target')::integer;
    v_other := (p_evidence -> 'renderedRepresentation' ->> 'other')::integer;
    v_part_a := (p_evidence -> 'renderedRepresentation' ->> 'partA')::integer;
    v_maximum := (p_evidence -> 'renderedRepresentation' ->> 'maximum')::integer;
  exception when others then return null;
  end;
  if v_index not between 1 and 20 or v_variant not between 1 and 4 then return null; end if;

  v_expected_direction := case
    when p_skill_id in ('F-N-COUNT-10','F-N-COUNT-20')
      then case when v_index <= 10 then 'recognition' else 'construction' end
    when p_skill_id = 'F-N-MATCH'
      then case when v_index <= 10 then 'construction' else 'recognition' end
    when p_skill_id in ('F-N-PART-5','F-N-PART-10')
      then case when v_index <= 10 then 'construction' else 'recognition' end
    when p_skill_id in ('F-N-SEQ-20','F-N-SUBITISE-5','F-N-COMPARE')
      then case when v_index <= 10 then 'recognition' else 'construction' end
    else null
  end;

  v_expected_representation := case v_blueprint
    when 'number_sequence' then case when mod(v_variant,2)=1 then 'stepping_stones' else 'number_line' end
    when 'count_collection' then case when mod(v_variant,2)=1 then 'objects' else 'structured_frame' end
    when 'quick_quantity' then case when mod(v_variant,2)=1 then 'five_frame' else 'scattered_dots' end
    when 'make_quantity' then case when mod(v_variant,2)=1 then 'frame' else 'counter_tray' end
    when 'compare_quantities' then case when mod(v_variant,2)=1 then 'matched_rows' else 'structured_frames' end
    when 'part_whole' then case when mod(v_variant,2)=1 then 'part_whole' else 'two_colour_frame' end
    else null
  end;
  if v_expected_direction is null
    or v_item_representation is distinct from v_expected_representation
    or v_response_direction is distinct from v_expected_direction
    or p_evidence -> 'renderedRepresentation' ->> 'responseDirection' is distinct from v_expected_direction
  then return null; end if;

  v_expected_purpose := case when
    (p_skill_id='F-N-SEQ-20' and v_item_representation='stepping_stones')
    or (p_skill_id='F-N-COUNT-10' and v_item_representation in ('structured_frame','frame'))
    or (p_skill_id='F-N-COUNT-20' and v_item_representation in ('objects','counter_tray'))
    or (p_skill_id='F-N-SUBITISE-5' and v_item_representation='scattered_dots')
    or (p_skill_id='F-N-MATCH' and v_item_representation in ('objects','counter_tray'))
    or (p_skill_id='F-N-COMPARE' and v_item_representation='structured_frames')
    or (p_skill_id='F-N-PART-5' and v_item_representation='two_colour_frame')
    or (p_skill_id='F-N-PART-10' and v_item_representation='part_whole')
    then 'transfer' else v_expected_direction end;
  if v_evidence_purpose is distinct from v_expected_purpose
    or p_evidence -> 'renderedRepresentation' ->> 'evidencePurpose' is distinct from v_expected_purpose
  then return null; end if;

  if v_response is null or v_response = 'null'::jsonb then
    if v_response_mode is distinct from 'not_sure'
      or v_response_trace ->> 'responseMode' is distinct from 'not_sure'
      or v_response_trace ->> 'representation' is distinct from v_item_representation
    then return null; end if;
    return (v_validated-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
      || jsonb_build_object(
        'correct',false,
        'classification','not_checked',
        'observedSignals','[]'::jsonb,
        'misconceptionCodes','[]'::jsonb,
        'serverValidated',true
      );
  end if;

  -- The untimed accessibility alternative is valid practice evidence, but it
  -- is not direct subitising evidence. Bind the stored representation and the
  -- exact response trace so a client cannot relabel one access path as the
  -- other. Visual access is the authored brief 1.5 second presentation.
  if v_response_trace ->> 'representation' is distinct from v_item_representation
  then return null; end if;
  if v_blueprint='quick_quantity' and not (
    (
      p_evidence ->> 'representation'=v_item_representation
      and p_evidence ->> 'constructChanged'='false'
      and v_response_trace ->> 'accessMode'='visual_flash'
      and (v_response_trace ->> 'flashDurationMs')::integer=1500
    )
    or (
      p_evidence ->> 'representation'='sequential_access_count'
      and p_evidence ->> 'constructChanged'='true'
      and v_response_trace ->> 'accessMode'='non_visual_description'
      and v_response_trace ->> 'flashDurationMs' is null
    )
  ) then return null; end if;

  v_expected_response_mode := case
    when v_expected_direction='recognition' then 'single_select'
    when v_blueprint='number_sequence' then 'construct_sequence'
    when v_blueprint='quick_quantity' then 'construct_quantity'
    when v_blueprint='compare_quantities' then 'construct_pair_then_select'
    else 'construct'
  end;
  if v_response_mode is distinct from v_expected_response_mode
    or v_response_trace ->> 'responseMode' is distinct from v_expected_response_mode
  then return null; end if;

  if v_expected_response_mode='single_select' then
    begin v_option_slot := (v_response_trace ->> 'optionSlot')::integer;
    exception when others then return null;
    end;
    if v_option_slot not between 0 and 2
      or jsonb_typeof(v_response_trace -> 'options') is distinct from 'array'
      or jsonb_array_length(v_response_trace -> 'options') <> 3
      or v_response_trace -> 'options' -> v_option_slot is distinct from v_response
    then return null; end if;

  elsif v_expected_response_mode in ('construct','construct_quantity') then
    begin
      v_count := (v_response_trace ->> 'count')::integer;
      v_capacity := (v_response_trace ->> 'capacity')::integer;
    exception when others then return null;
    end;
    v_actions := v_response_trace -> 'actions';
    if jsonb_typeof(v_response) <> 'number'
      or v_count is distinct from (p_evidence ->> 'response')::integer
      or v_capacity is distinct from (
        case
          when v_blueprint='quick_quantity' then 5
          when v_blueprint='part_whole' then v_target
          else v_maximum
        end
      )
      or jsonb_typeof(v_actions) is distinct from 'array'
      or exists (
        select 1 from jsonb_array_elements_text(v_actions) action(value)
        where action.value not in ('add','remove')
      )
      or exists (
        select 1 from (
          select sum(case when action.value='add' then 1 else -1 end)
            over (order by action.position) running_count
          from jsonb_array_elements_text(v_actions) with ordinality action(value,position)
        ) path
        where path.running_count < 0 or path.running_count > v_capacity
      )
      or (
        select count(*) filter (where action.value='add') - count(*) filter (where action.value='remove')
        from jsonb_array_elements_text(v_actions) action(value)
      ) <> v_count
      or (
        jsonb_array_length(v_actions)=0
        and not (v_blueprint='part_whole' and v_count=0)
      )
    then return null; end if;

  elsif v_expected_response_mode='construct_sequence' then
    begin
      v_endpoint := (v_response_trace ->> 'endpoint')::integer;
    exception when others then return null;
    end;
    v_steps := v_response_trace -> 'steps';
    v_start := case
      when jsonb_typeof(p_evidence -> 'renderedRepresentation' -> 'sequence')='array'
        then coalesce(
          (select value::integer from jsonb_array_elements_text(p_evidence -> 'renderedRepresentation' -> 'sequence') with ordinality entry(value,position)
            where entry.value <> 'null' and entry.position < (select position from jsonb_array_elements(p_evidence -> 'renderedRepresentation' -> 'sequence') with ordinality blank(value,position) where blank.value='null'::jsonb limit 1)
            order by entry.position desc limit 1),
          0
        )
      else null
    end;
    if jsonb_typeof(v_response) <> 'number'
      or v_endpoint is distinct from (p_evidence ->> 'response')::integer
      or jsonb_typeof(v_steps) is distinct from 'array'
      or jsonb_array_length(v_steps) < 1
    then return null; end if;
    v_last := v_start;
    for v_value,v_position in
      select entry.value::integer,entry.position::integer
      from jsonb_array_elements_text(v_steps) with ordinality entry(value,position)
      order by entry.position
    loop
      if v_value not between 0 and v_maximum or abs(v_value-v_last) <> 1 then return null; end if;
      v_last := v_value;
    end loop;
    if v_last is distinct from v_endpoint then return null; end if;

  elsif v_expected_response_mode='construct_pair_then_select' then
    begin
      v_pairs_created := (v_response_trace ->> 'pairsCreated')::integer;
      v_pair_target := (v_response_trace ->> 'pairTarget')::integer;
      v_option_slot := (v_response_trace ->> 'optionSlot')::integer;
    exception when others then return null;
    end;
    if v_pair_target is distinct from least(v_target,v_other)
      or v_pairs_created is distinct from v_pair_target
      or v_response_trace ->> 'relationship' is distinct from p_evidence ->> 'response'
      or v_option_slot not between 0 and 2
      or jsonb_typeof(v_response_trace -> 'options') is distinct from 'array'
      or jsonb_array_length(v_response_trace -> 'options') <> 3
      or v_response_trace -> 'options' -> v_option_slot is distinct from v_response
    then return null; end if;
  else
    return null;
  end if;

  return v_validated;
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
  elsif p_content_version='maths-foundation-number-v4' then
    v_validated := public.maths_validate_student_evidence_v4(p_skill_id,p_event_type,p_evidence);
  else
    return null;
  end if;
  if v_validated is null then return null; end if;
  if p_event_type='skills_check_response' and p_evidence->'response'='null'::jsonb then
    return (v_validated-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
      || jsonb_build_object('correct',false,'classification','not_checked','observedSignals','[]'::jsonb,'misconceptionCodes','[]'::jsonb);
  end if;
  return v_validated;
end;
$$;

revoke all on function public.maths_validate_student_evidence_v4(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.maths_validate_student_evidence(text,text,text,jsonb) from public,anon,authenticated;

notify pgrst, 'reload schema';
commit;
