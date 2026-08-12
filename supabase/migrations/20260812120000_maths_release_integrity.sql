-- Release integrity for the Foundation Number Sense pilot.
--
-- Student assessment outcomes are derived from the authored item key on the
-- server. Assignment completion requires a matching saved evidence event.
-- Maths audio is accepted after technical QA and may be flagged per clip.

begin;

create table public.maths_media_issue_reports (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid,
  student_id uuid,
  actor_type text not null check (actor_type in ('student', 'teacher')),
  audio_id text not null check (char_length(btrim(audio_id)) between 1 and 180),
  reason text not null check (reason in ('playback_or_content_issue')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint maths_media_issue_class_teacher_fk
    foreign key (class_id, teacher_id) references public.classes(id, teacher_id) on delete cascade,
  constraint maths_media_issue_student_teacher_fk
    foreign key (student_id, teacher_id) references public.students(id, teacher_id) on delete cascade
);

create index maths_media_issue_open_idx
  on public.maths_media_issue_reports (audio_id, created_at desc)
  where reviewed_at is null;

create unique index maths_media_issue_open_actor_idx
  on public.maths_media_issue_reports (
    teacher_id,
    actor_type,
    coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid),
    audio_id
  ) where reviewed_at is null;

alter table public.maths_media_issue_reports enable row level security;
revoke all on table public.maths_media_issue_reports from public, anon, authenticated;

create table public.maths_evidence_sync_health (
  student_id uuid primary key references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  delivered bigint not null default 0 check (delivered >= 0),
  pending bigint not null default 0 check (pending >= 0),
  rejected bigint not null default 0 check (rejected >= 0),
  reported_at timestamptz not null default now(),
  constraint maths_sync_health_class_teacher_fk
    foreign key (class_id, teacher_id) references public.classes(id, teacher_id) on delete cascade,
  constraint maths_sync_health_student_teacher_fk
    foreign key (student_id, teacher_id) references public.students(id, teacher_id) on delete cascade
);

alter table public.maths_evidence_sync_health enable row level security;
revoke all on table public.maths_evidence_sync_health from public, anon, authenticated;

create function public.maths_released_skill(p_skill_id text)
returns boolean
language sql immutable
set search_path = public
as $$
  select btrim(coalesce(p_skill_id, '')) = any(array[
    'F-N-SEQ-20','F-N-COUNT-10','F-N-COUNT-20','F-N-SUBITISE-5',
    'F-N-MATCH','F-N-COMPARE','F-N-PART-5','F-N-PART-10'
  ]::text[]);
$$;

create function public.maths_valid_assignment_content(
  p_skill_id text,
  p_activity_type text,
  p_activity_id text
)
returns boolean
language sql immutable
set search_path = public
as $$
  select public.maths_released_skill(p_skill_id) and case p_activity_type
    when 'lesson' then p_activity_id = any(array[
      p_skill_id || '-retrieve-1',p_skill_id || '-model-2',p_skill_id || '-guided-3',
      p_skill_id || '-independent-4',p_skill_id || '-transfer-5'
    ]::text[])
    when 'skills_check' then p_activity_id = 'check:' || p_skill_id
    when 'game' then (p_activity_id,p_skill_id) in (
      ('number-trail','F-N-SEQ-20'),
      ('frame-foundry','F-N-PART-5'),('frame-foundry','F-N-PART-10'),
      ('count-and-carry','F-N-COUNT-10'),('count-and-carry','F-N-COUNT-20'),
      ('quantity-match','F-N-MATCH'),('quantity-match','F-N-COMPARE')
    )
    when 'number_story' then (p_activity_id,p_skill_id) in (
      ('maths-story-f-five-buns','F-N-SUBITISE-5'),('maths-story-f-five-buns','F-N-PART-5'),
      ('maths-story-f-ten-lights','F-N-PART-10')
    )
    else false
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
declare
  v_item_key text;
  v_blueprint text;
  v_index integer;
  v_variant integer;
  v_maximum integer;
  v_target integer;
  v_other integer;
  v_part_a integer;
  v_part_b integer;
  v_expected_text text;
  v_expected_number integer;
  v_response_text text;
  v_response_number integer;
  v_correct boolean;
  v_classification text;
  v_game_id text;
  v_round_id text;
  v_round_index integer;
  v_left integer;
  v_right integer;
  v_story_pages integer;
begin
  if not public.maths_released_skill(p_skill_id)
    or p_content_version <> 'maths-foundation-number-v1'
    or jsonb_typeof(p_evidence) is distinct from 'object'
    or p_evidence -> 'schemaVersion' is distinct from '1'::jsonb
    or coalesce(p_evidence ->> 'source', '') not in (
      'lesson_player','maths_skills_check','maths_arcade','maths_number_story'
    )
  then
    return null;
  end if;

  if p_event_type = 'practice_attempt' then
    if p_evidence ->> 'source' = 'lesson_player' then
      if not (
        coalesce(p_evidence ->> 'recipeId','') = any(array[
          p_skill_id || '-retrieve-1',p_skill_id || '-model-2',p_skill_id || '-guided-3',
          p_skill_id || '-independent-4',p_skill_id || '-transfer-5'
        ]::text[])
        and jsonb_typeof(p_evidence -> 'renderedRepresentation') = 'object'
        and p_evidence ->> 'stage' = 'check'
        and p_evidence ->> 'outcome' = 'completed_formative_check'
      ) then return null; end if;
    elsif p_evidence ->> 'source' = 'maths_arcade' then
      if not public.maths_valid_assignment_content(
        p_skill_id,'game',p_evidence ->> 'gameId'
      ) then return null; end if;
    elsif p_evidence ->> 'source' = 'maths_number_story' then
      if not public.maths_valid_assignment_content(
        p_skill_id,'number_story',p_evidence ->> 'storyId'
      ) or p_evidence ->> 'outcome' <> 'story_completed'
        or jsonb_typeof(p_evidence -> 'renderedRepresentation') is null
      then return null; end if;
    else
      return null;
    end if;
    if p_evidence ->> 'source' = 'maths_arcade' then
      v_game_id := p_evidence ->> 'gameId';
      v_round_id := p_evidence ->> 'roundId';
      begin
        if v_game_id = 'number-trail' and v_round_id ~ '^sequence-[0-9]+-[0-9]+$' then
          v_expected_number := split_part(v_round_id,'-',2)::integer + 1;
          v_round_index := split_part(v_round_id,'-',3)::integer;
        elsif v_game_id = 'frame-foundry' and v_round_id ~ '^frame-[0-9]+-[0-9]+-[0-9]+$' then
          v_expected_number := split_part(v_round_id,'-',2)::integer - split_part(v_round_id,'-',3)::integer;
          v_round_index := split_part(v_round_id,'-',4)::integer;
        elsif v_game_id = 'count-and-carry' and v_round_id ~ '^count-[0-9]+-[0-9]+$' then
          v_expected_number := split_part(v_round_id,'-',2)::integer;
          v_round_index := split_part(v_round_id,'-',3)::integer;
          if (p_skill_id='F-N-COUNT-10' and (v_expected_number not between 1 and 10 or mod(v_round_index,2)<>0))
            or (p_skill_id='F-N-COUNT-20' and (v_expected_number not between 11 and 20 or mod(v_round_index,2)<>1))
          then return null; end if;
        elsif v_game_id = 'quantity-match' and v_round_id ~ '^match-[0-9]+-[0-9]+$' then
          v_expected_number := split_part(v_round_id,'-',2)::integer;
          v_round_index := split_part(v_round_id,'-',3)::integer;
          if p_skill_id<>'F-N-MATCH' or mod(v_round_index,2)<>0 then return null; end if;
        elsif v_game_id = 'quantity-match' and v_round_id ~ '^compare-[0-9]+-[0-9]+-[0-9]+$' then
          v_left := split_part(v_round_id,'-',2)::integer;
          v_right := split_part(v_round_id,'-',3)::integer;
          v_round_index := split_part(v_round_id,'-',4)::integer;
          if p_skill_id<>'F-N-COMPARE' or mod(v_round_index,2)<>1
            or v_left not between 0 and 10 or v_right not between 0 and 10
          then return null; end if;
          v_expected_text := case when v_left>v_right then 'a' when v_left<v_right then 'b' else 'same' end;
        else return null; end if;
      exception when others then return null;
      end;
      if v_round_index not between 0 and 499 then return null; end if;
      if v_expected_text is not null then
        v_correct := p_evidence ->> 'response' = v_expected_text;
      else
        begin v_response_number := (p_evidence ->> 'response')::integer;
        exception when others then v_response_number := null; end;
        v_correct := v_response_number is not null and v_response_number=v_expected_number;
      end if;
      v_classification := case when v_correct then 'correct' else coalesce(p_evidence->>'representation','arcade') || '_mismatch' end;
      return (p_evidence-'expected'-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
        || jsonb_build_object('correct',v_correct,'classification',v_classification,
          'observedSignals',case when v_correct then '[]'::jsonb else jsonb_build_array(v_classification) end,
          'serverValidated',true);
    end if;
    if p_evidence ->> 'source' = 'maths_number_story' then
      begin v_story_pages := (p_evidence ->> 'pagesRead')::integer;
      exception when others then v_story_pages := null; end;
      if v_story_pages <> 8 then return null; end if;
      return (p_evidence-'expected'-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
        || jsonb_build_object('serverValidated',true);
    end if;
    return (p_evidence-'expected'-'correct'-'classification'-'observedSignals'-'misconceptionCodes')
      || jsonb_build_object('serverValidated',true);
  end if;
  if p_event_type <> 'skills_check_response'
    or p_evidence ->> 'source' <> 'maths_skills_check'
  then
    return null;
  end if;

  v_item_key := p_evidence ->> 'itemKey';
  v_blueprint := p_evidence ->> 'blueprintId';
  if v_item_key is null
    or v_item_key !~ '^[a-z0-9_-]+:v[1-4]$'
    or v_blueprint not in (
      'count_collection','quick_quantity','make_quantity','compare_quantities','part_whole'
    )
    or v_item_key not like lower(p_skill_id) || '-' || v_blueprint || '-%'
  then
    return null;
  end if;

  begin
    v_index := substring(v_item_key from '-([0-9]{2}):v[1-4]$')::integer - 1;
    v_variant := substring(v_item_key from ':v([1-4])$')::integer;
  exception when others then
    return null;
  end;
  if v_index not between 0 and 19 or v_variant not between 1 and 4 then return null; end if;

  if jsonb_typeof(p_evidence -> 'renderedRepresentation') is distinct from 'object'
    or not (
      p_evidence ->> 'representation' = case v_blueprint
        when 'count_collection' then case when mod(v_variant,2)=1 then 'objects' else 'structured_frame' end
        when 'quick_quantity' then case when mod(v_variant,2)=1 then 'five_frame' else 'scattered_dots' end
        when 'make_quantity' then case when mod(v_variant,2)=1 then 'frame' else 'counter_tray' end
        when 'compare_quantities' then case when mod(v_variant,2)=1 then 'matched_rows' else 'structured_frames' end
        when 'part_whole' then case when mod(v_variant,2)=1 then 'part_whole' else 'two_colour_frame' end
        else '' end
      or (v_blueprint='quick_quantity' and p_evidence ->> 'representation'='auditory_count_description')
    )
  then return null; end if;

  v_maximum := case
    when p_skill_id in ('F-N-COUNT-20','F-N-COMPARE','F-N-SEQ-20') then 20
    when p_skill_id in ('F-N-PART-5','F-N-SUBITISE-5') then 5
    else 10
  end;
  v_target := 1 + mod(v_index * 7, v_maximum);
  v_other := greatest(0, least(v_maximum, v_target + (array[1,-1,2,-2])[mod(v_index, 4) + 1]));
  if v_other = v_target then v_other := greatest(0, v_target - 1); end if;
  v_part_a := mod(v_index, v_target + 1);
  v_part_b := v_target - v_part_a;

  if v_blueprint = 'compare_quantities' then
    v_expected_text := case when v_target > v_other then 'a' when v_target < v_other then 'b' else 'same' end;
    v_response_text := p_evidence ->> 'response';
    v_correct := v_response_text = v_expected_text;
    v_classification := case when v_correct then 'correct' else 'comparison_choice_mismatch' end;
  else
    v_expected_number := case when v_blueprint = 'part_whole' then v_part_b else v_target end;
    begin
      v_response_number := (p_evidence ->> 'response')::integer;
    exception when others then
      v_response_number := null;
    end;
    v_correct := v_response_number is not null and v_response_number = v_expected_number;
    v_classification := case
      when v_correct then 'correct'
      when v_response_number is null then 'not_checked'
      when abs(v_response_number - v_expected_number) = 1 then 'off_by_one_response'
      when v_blueprint = 'part_whole' then 'missing_part_mismatch'
      else 'other_incorrect_response'
    end;
  end if;

  return (p_evidence
      - 'expected'
      - 'correct'
      - 'classification'
      - 'observedSignals'
      - 'misconceptionCodes')
    || jsonb_build_object(
      'correct', v_correct,
      'classification', v_classification,
      'observedSignals', case
        when v_correct or v_classification = 'not_checked' then '[]'::jsonb
        else jsonb_build_array(v_classification)
      end,
      'serverValidated', true
    );
end;
$$;

create or replace function public.student_record_maths_evidence(
  p_token text,
  p_client_event_id text,
  p_skill_id text,
  p_event_type text,
  p_evidence jsonb,
  p_occurred_at timestamptz,
  p_content_version text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_event public.maths_evidence_events;
  v_validated jsonb;
  v_assignment_id uuid;
  v_assignment public.maths_assignments;
  v_inserted boolean := false;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_student_session'); end if;
  if v_student.archived_at is not null then return jsonb_build_object('ok', false, 'error', 'learner_archived'); end if;
  if nullif(btrim(coalesce(p_client_event_id, '')), '') is null
    or char_length(p_client_event_id) > 120
    or coalesce(p_event_type, '') not in ('practice_attempt','skills_check_response')
    or octet_length(coalesce(p_evidence::text, '')) > 8192
    or p_occurred_at is null
    or p_occurred_at < now() - interval '90 days'
    or p_occurred_at > now() + interval '5 minutes'
  then return jsonb_build_object('ok', false, 'error', 'invalid_payload'); end if;

  v_validated := public.maths_validate_student_evidence(
    btrim(p_skill_id), p_event_type, btrim(p_content_version), p_evidence
  );
  if v_validated is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_content_reference');
  end if;

  if nullif(v_validated ->> 'assignmentId','') is not null then
    if (v_validated ->> 'assignmentId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then return jsonb_build_object('ok',false,'error','invalid_assignment_reference'); end if;
    v_assignment_id := (v_validated ->> 'assignmentId')::uuid;
    select assignment.* into v_assignment
    from public.maths_assignments assignment
    join public.maths_assignment_students link on link.assignment_id = assignment.id
    where assignment.id = v_assignment_id and assignment.class_id = v_student.class_id
      and assignment.skill_id = btrim(p_skill_id) and assignment.archived_at is null
      and link.student_id = v_student.id;
    if v_assignment.id is null
      or (case v_assignment.activity_type
        when 'lesson' then v_validated ->> 'source' <> 'lesson_player'
        when 'skills_check' then v_validated ->> 'source' <> 'maths_skills_check'
        when 'game' then v_validated ->> 'source' <> 'maths_arcade'
          or v_validated ->> 'gameId' <> v_assignment.activity_id
        when 'number_story' then v_validated ->> 'source' <> 'maths_number_story'
          or v_validated ->> 'storyId' <> v_assignment.activity_id
        else true end)
    then return jsonb_build_object('ok',false,'error','invalid_assignment_reference'); end if;
  end if;

  insert into public.maths_evidence_events (
    teacher_id,class_id,student_id,actor_type,skill_id,event_type,evidence,
    content_version,client_event_id,occurred_at
  ) values (
    v_student.teacher_id,v_student.class_id,v_student.id,'student',btrim(p_skill_id),
    p_event_type,v_validated,btrim(p_content_version),btrim(p_client_event_id),p_occurred_at
  ) on conflict (student_id,client_event_id) do nothing returning * into v_event;
  v_inserted := v_event.id is not null;
  if v_event.id is null then
    select event.* into v_event from public.maths_evidence_events event
    where event.student_id = v_student.id and event.client_event_id = btrim(p_client_event_id);
    if v_event.actor_type <> 'student'
      or v_event.skill_id <> btrim(p_skill_id)
      or v_event.event_type <> p_event_type
      or v_event.evidence <> v_validated
      or v_event.content_version <> btrim(p_content_version)
      or v_event.occurred_at <> p_occurred_at
    then return jsonb_build_object('ok', false, 'error', 'client_event_id_conflict'); end if;
  end if;
  return jsonb_build_object('ok', true, 'id', v_event.id, 'clientEventId', v_event.client_event_id, 'idempotent', not v_inserted);
end;
$$;

create function public.teacher_read_maths_evidence_page(
  p_class_id uuid,
  p_student_id uuid default null,
  p_limit integer default 500,
  p_before_occurred_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_events jsonb;
  v_has_more boolean := false;
  v_next_time timestamptz;
  v_next_id uuid;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_limit is null or p_limit not between 1 and 500
    or ((p_before_occurred_at is null) <> (p_before_id is null))
  then return jsonb_build_object('ok', false, 'error', 'invalid_payload'); end if;
  if not exists (select 1 from public.classes class where class.id = p_class_id and class.teacher_id = auth.uid())
  then return jsonb_build_object('ok', false, 'error', 'class_not_found'); end if;
  if p_student_id is not null and not exists (
    select 1 from public.students student where student.id = p_student_id
      and student.class_id = p_class_id and student.teacher_id = auth.uid()
  ) then return jsonb_build_object('ok', false, 'error', 'learner_not_in_owned_class'); end if;

  select coalesce(jsonb_agg(payload order by occurred_at desc,id desc), '[]'::jsonb)
  into v_events
  from (
    select event.occurred_at,event.id,jsonb_build_object(
      'id',event.id,'classId',event.class_id,'studentId',event.student_id,
      'actorType',event.actor_type,'skillId',event.skill_id,'eventType',event.event_type,
      'evidence',event.evidence,'evidencePurpose',event.evidence_purpose,
      'contentVersion',event.content_version,'clientEventId',event.client_event_id,
      'occurredAt',event.occurred_at,'receivedAt',event.received_at
    ) payload
    from public.maths_evidence_events event
    where event.teacher_id = auth.uid()
      and event.class_id = p_class_id
      and (p_student_id is null or event.student_id = p_student_id)
      and (p_before_occurred_at is null or (event.occurred_at,event.id) < (p_before_occurred_at,p_before_id))
    order by event.occurred_at desc,event.id desc
    limit p_limit
  ) page;

  select event.occurred_at,event.id into v_next_time,v_next_id
  from public.maths_evidence_events event
  where event.teacher_id = auth.uid() and event.class_id = p_class_id
    and (p_student_id is null or event.student_id = p_student_id)
    and (p_before_occurred_at is null or (event.occurred_at,event.id) < (p_before_occurred_at,p_before_id))
  order by event.occurred_at desc,event.id desc offset greatest(p_limit - 1,0) limit 1;
  if v_next_id is not null then
    select exists(
      select 1 from public.maths_evidence_events event
      where event.teacher_id = auth.uid() and event.class_id = p_class_id
        and (p_student_id is null or event.student_id = p_student_id)
        and (event.occurred_at,event.id) < (v_next_time,v_next_id)
    ) into v_has_more;
  end if;

  return jsonb_build_object(
    'ok',true,'events',v_events,'hasMore',coalesce(v_has_more,false),
    'nextBeforeOccurredAt',case when v_has_more then v_next_time else null end,
    'nextBeforeId',case when v_has_more then v_next_id else null end
  );
end;
$$;

create function public.teacher_read_maths_sync_health(p_class_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare v_rows jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists (select 1 from public.classes class where class.id=p_class_id and class.teacher_id=auth.uid())
  then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'studentId',health.student_id,'delivered',health.delivered,'pending',health.pending,
    'rejected',health.rejected,'reportedAt',health.reported_at
  ) order by health.reported_at desc),'[]'::jsonb) into v_rows
  from public.maths_evidence_sync_health health
  where health.class_id=p_class_id and health.teacher_id=auth.uid();
  return jsonb_build_object('ok',true,'learners',v_rows);
end;
$$;

create or replace function public.teacher_create_maths_assignment(
  p_class_id uuid,p_skill_id text,p_activity_type text,p_activity_id text,p_title text,
  p_student_ids uuid[],p_due_at timestamptz default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare v_assignment public.maths_assignments; v_unique_count integer;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null
    or not public.maths_valid_assignment_content(btrim(p_skill_id),p_activity_type,btrim(p_activity_id))
    or nullif(btrim(coalesce(p_title,'')),'') is null or char_length(p_title)>160
    or coalesce(array_length(p_student_ids,1),0) not between 1 and 200
    or (p_due_at is not null and p_due_at < now() - interval '5 minutes')
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  if not exists(select 1 from public.classes class where class.id=p_class_id and class.teacher_id=auth.uid())
  then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select count(distinct student_id) into v_unique_count from unnest(p_student_ids) student_id;
  if v_unique_count<>array_length(p_student_ids,1) or exists(
    select 1 from unnest(p_student_ids) requested(student_id)
    left join public.students student on student.id=requested.student_id and student.class_id=p_class_id
      and student.teacher_id=auth.uid() and student.archived_at is null where student.id is null
  ) then return jsonb_build_object('ok',false,'error','learner_not_in_owned_class'); end if;
  insert into public.maths_assignments(teacher_id,class_id,skill_id,activity_type,activity_id,title,due_at)
  values(auth.uid(),p_class_id,btrim(p_skill_id),p_activity_type,btrim(p_activity_id),btrim(p_title),p_due_at)
  returning * into v_assignment;
  insert into public.maths_assignment_students(assignment_id,student_id)
  select v_assignment.id,requested.student_id from unnest(p_student_ids) requested(student_id);
  return jsonb_build_object('ok',true,'assignmentId',v_assignment.id,'assignedCount',v_unique_count);
end;
$$;

create function public.teacher_archive_maths_assignment(p_class_id uuid,p_assignment_id uuid)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  perform public.assert_current_actor_teacher_access();
  update public.maths_assignments assignment set archived_at = coalesce(assignment.archived_at,now())
  where assignment.id = p_assignment_id and assignment.class_id = p_class_id and assignment.teacher_id = auth.uid();
  if not found then return jsonb_build_object('ok',false,'error','assignment_not_found'); end if;
  return jsonb_build_object('ok',true,'assignmentId',p_assignment_id);
end;
$$;

create or replace function public.student_complete_maths_assignment(p_token text,p_assignment_id uuid)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_assignment public.maths_assignments;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select assignment.* into v_assignment
  from public.maths_assignments assignment
  join public.maths_assignment_students link on link.assignment_id = assignment.id
  where assignment.id = p_assignment_id and assignment.class_id = v_student.class_id
    and assignment.archived_at is null and link.student_id = v_student.id;
  if v_assignment.id is null then return jsonb_build_object('ok',false,'error','assignment_not_found'); end if;
  if not exists (
    select 1
    from public.maths_evidence_events event
    where event.student_id=v_student.id and event.class_id=v_student.class_id
      and event.skill_id=v_assignment.skill_id and event.evidence->>'assignmentId'=p_assignment_id::text
    group by event.student_id
    having case v_assignment.activity_type
      when 'lesson' then bool_or(event.evidence->>'source'='lesson_player'
        and event.evidence->>'serverValidated'='true'
        and event.evidence->>'outcome'='completed_formative_check')
      when 'skills_check' then count(distinct event.evidence->>'itemKey') filter (
        where event.evidence->>'source'='maths_skills_check' and event.evidence->>'serverValidated'='true'
      ) >= 6
      when 'game' then count(distinct event.evidence->>'roundId') filter (
        where event.evidence->>'source'='maths_arcade' and event.evidence->>'correct'='true'
          and event.evidence->>'serverValidated'='true'
      ) >= 8
      when 'number_story' then bool_or(event.evidence->>'source'='maths_number_story'
        and event.evidence->>'storyId'=v_assignment.activity_id
        and event.evidence->>'serverValidated'='true'
        and event.evidence->>'pagesRead'='8')
      else false end
  ) then return jsonb_build_object('ok',false,'error','completion_evidence_required'); end if;
  update public.maths_assignment_students set completed_at = coalesce(completed_at,now())
  where assignment_id = p_assignment_id and student_id = v_student.id;
  return jsonb_build_object('ok',true,'assignmentId',p_assignment_id);
end;
$$;

create function public.student_report_maths_media_issue(p_token text,p_audio_id text,p_reason text)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare v_student public.students; v_id uuid;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  if char_length(btrim(coalesce(p_audio_id,''))) not between 1 and 180 or p_reason <> 'playback_or_content_issue'
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  insert into public.maths_media_issue_reports(teacher_id,class_id,student_id,actor_type,audio_id,reason)
  values(v_student.teacher_id,v_student.class_id,v_student.id,'student',btrim(p_audio_id),p_reason)
  on conflict (teacher_id,actor_type,coalesce(student_id,'00000000-0000-0000-0000-000000000000'::uuid),audio_id)
    where reviewed_at is null do update set created_at=excluded.created_at returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create function public.teacher_report_maths_media_issue(p_audio_id text,p_reason text)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare v_id uuid;
begin
  perform public.assert_current_actor_teacher_access();
  if char_length(btrim(coalesce(p_audio_id,''))) not between 1 and 180 or p_reason <> 'playback_or_content_issue'
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  insert into public.maths_media_issue_reports(teacher_id,actor_type,audio_id,reason)
  values(auth.uid(),'teacher',btrim(p_audio_id),p_reason)
  on conflict (teacher_id,actor_type,coalesce(student_id,'00000000-0000-0000-0000-000000000000'::uuid),audio_id)
    where reviewed_at is null do update set created_at=excluded.created_at returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create function public.student_report_maths_evidence_sync_health(
  p_token text,p_delivered bigint,p_pending bigint,p_rejected bigint
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  if p_delivered is null or p_pending is null or p_rejected is null
    or least(p_delivered,p_pending,p_rejected) < 0 or greatest(p_delivered,p_pending,p_rejected) > 100000
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  insert into public.maths_evidence_sync_health(student_id,teacher_id,class_id,delivered,pending,rejected,reported_at)
  values(v_student.id,v_student.teacher_id,v_student.class_id,p_delivered,p_pending,p_rejected,now())
  on conflict(student_id) do update set
    delivered=public.maths_evidence_sync_health.delivered+excluded.delivered,
    pending=excluded.pending,rejected=public.maths_evidence_sync_health.rejected+excluded.rejected,
    reported_at=excluded.reported_at;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.maths_released_skill(text) from public,anon,authenticated;
revoke all on function public.maths_valid_assignment_content(text,text,text) from public,anon,authenticated;
revoke all on function public.maths_validate_student_evidence(text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.teacher_read_maths_evidence_page(uuid,uuid,integer,timestamptz,uuid) from public,anon,authenticated;
revoke all on function public.teacher_read_maths_sync_health(uuid) from public,anon,authenticated;
revoke all on function public.teacher_archive_maths_assignment(uuid,uuid) from public,anon,authenticated;
revoke all on function public.student_report_maths_media_issue(text,text,text) from public,anon,authenticated;
revoke all on function public.teacher_report_maths_media_issue(text,text) from public,anon,authenticated;
revoke all on function public.student_report_maths_evidence_sync_health(text,bigint,bigint,bigint) from public,anon,authenticated;

grant execute on function public.teacher_read_maths_evidence_page(uuid,uuid,integer,timestamptz,uuid) to authenticated;
grant execute on function public.teacher_read_maths_sync_health(uuid) to authenticated;
grant execute on function public.teacher_archive_maths_assignment(uuid,uuid) to authenticated;
grant execute on function public.student_report_maths_media_issue(text,text,text) to anon,authenticated;
grant execute on function public.teacher_report_maths_media_issue(text,text) to authenticated;
grant execute on function public.student_report_maths_evidence_sync_health(text,bigint,bigint,bigint) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
