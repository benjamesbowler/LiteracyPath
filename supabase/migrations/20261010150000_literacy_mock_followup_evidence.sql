begin;

-- Preparation is a draft assignment, not an instruction to replace a class's
-- active lesson. Keep the existing one-active-focus-session teacher boundary.
alter table public.student_focus_sessions drop constraint if exists student_focus_sessions_status_check;
alter table public.student_focus_sessions add constraint student_focus_sessions_status_check
  check(status in ('prepared','active','ended'));
alter table public.literacy_mock_sessions add column entry_check boolean not null default false;
alter table public.literacy_mock_sessions add column source_skill_id text;
-- Existing v3 plans were accepted before cross-item family exclusions existed.
-- Preserve those immutable records; apply stricter sampling only to new drafts.
alter table public.literacy_mock_sessions add column fresh_sampling boolean not null default false;
create index literacy_mock_completed_student_history_idx on public.literacy_mock_runs(student_id,completed_at desc,session_id)
  where status='completed';

-- A shown multi-letter case match exposes every displayed target. Project the
-- frozen triples into the same letter identities used by new single probes;
-- leave their stored snapshots, outcomes and measurement evidence untouched.
create function public.lp_literacy_exposure_identities(p_value jsonb)
returns jsonb language sql immutable set search_path='' as $$
 with source as (
  select coalesce(p_value->'itemSnapshot',p_value->'questionSnapshot',p_value) s,
    public.lp_literacy_exposure_identity(p_value) identity
 ), shaped as (
  select *,case when jsonb_typeof(s->'matchTargets')='array' then s->'matchTargets' else '[]'::jsonb end targets,
    case when jsonb_typeof(s->'choices')='array' then s->'choices' else '[]'::jsonb end choices,
    coalesce(('{
      "mock.letters.round":"amt","mock.letters.lines":"efl","mock.letters.curves":"cos",
      "mock.letters.upright":"hin","mock.letters.similar":"bdp","mock.letters.tails":"gjq","mock.letters.angles":"nvw"
    }'::jsonb)->>(identity->>'exposureItemId'),'') legacy
  from source
 ), eligible as (
  select * from shaped where legacy<>'' or (s->>'constructClaim'='letter_case_correspondence' and s->>'format'='match'
    and (jsonb_array_length(targets)>1 or s->>'responseLength'~'^([2-9]|[1-9][0-9]+)$' or s->>'sequenceLength'~'^([2-9]|[1-9][0-9]+)$'))
 ), letters as (
  select substr(legacy,n,1) letter from eligible cross join lateral generate_series(1,length(legacy)) n
  union select lower(btrim(case when jsonb_typeof(c)='string' then c#>>'{}' else c->>'label' end)) letter
    from eligible cross join lateral jsonb_array_elements(targets||choices) c
    where btrim(case when jsonb_typeof(c)='string' then c#>>'{}' else c->>'label' end)~'^[A-Za-z]$'
 ), word_targets as (
  -- Known immutable category ids also cover compact historical records. For
  -- other snapshots require the exact word-category operation and its literal
  -- authored key. Never decode arbitrary response-evidence text or foil words.
  select identity,coalesce(('{
    "lp3.cvc_short_vowels.l1.B.short_a.v5":"cat","lp3.cvc_short_vowels.l1.C.short_a.v6":"pan",
    "lp3.cvc_short_vowels.l1.B.short_e.v5":"bed","lp3.cvc_short_vowels.l1.C.short_e.v6":"ten",
    "lp3.cvc_short_vowels.l1.B.short_i.v5":"pin","lp3.cvc_short_vowels.l1.C.short_i.v6":"big",
    "lp3.cvc_short_vowels.l1.B.short_o.v5":"dog","lp3.cvc_short_vowels.l1.C.short_o.v6":"pot",
    "lp3.cvc_short_vowels.l1.B.short_u.v5":"bug","lp3.cvc_short_vowels.l1.C.short_u.v6":"mud",
    "lp3.cvc_short_vowels.l1.A.short_a.v10":"ram","lp3.cvc_short_vowels.l1.A.short_e.v10":"hen",
    "lp3.cvc_short_vowels.l1.A.short_i.v10":"sit","lp3.cvc_short_vowels.l1.A.short_o.v10":"cot",
    "lp3.cvc_short_vowels.l1.A.short_u.v10":"hut",
    "lp3.long_vowels_silent_e.l2.A.a_e.v1":"gate","lp3.long_vowels_silent_e.l2.B.a_e.v2":"cane",
    "lp3.long_vowels_silent_e.l2.A.i_e.v1":"slide","lp3.long_vowels_silent_e.l2.B.i_e.v2":"shine",
    "lp3.long_vowels_silent_e.l2.A.o_e.v1":"home","lp3.long_vowels_silent_e.l2.B.o_e.v2":"stone",
    "lp3.long_vowels_silent_e.l2.A.u_e.v1":"cube","lp3.long_vowels_silent_e.l2.B.u_e.v2":"mule",
    "lp3.vowel_teams.l1.C.ai.v3":"rain","lp3.vowel_teams.l1.A.ai.v4":"chain",
    "lp3.vowel_teams.l1.C.ay.v3":"play","lp3.vowel_teams.l1.A.ay.v4":"day",
    "lp3.vowel_teams.l1.C.ee.v3":"feet","lp3.vowel_teams.l1.A.ee.v4":"tree",
    "lp3.vowel_teams.l1.C.ea.v3":"leaf","lp3.vowel_teams.l1.A.ea.v4":"bread",
    "lp3.vowel_teams.l1.B.ea.v5":"dead","lp3.vowel_teams.l1.C.oa.v3":"goat",
    "lp3.vowel_teams.l1.A.oa.v4":"road","lp3.vowel_teams.l1.C.igh.v3":"night",
    "lp3.vowel_teams.l1.A.igh.v4":"light"
  }'::jsonb)->>(identity->>'exposureItemId'),case when
    s->>'skillId' in ('cvc_short_vowels','vowel_teams','long_vowels') and s->>'format'='choice'
    and s->>'constructClaim'~'^identify_read_(short_vowel|vowel|split_vowel)_sound:'
    then (select lower(btrim(c->>'label')) from jsonb_array_elements(choices)c where c->>'id'=s->>'answer' limit 1)
    else '' end) word
  from shaped where coalesce(btrim(s->>'passage'),'')='' and coalesce(btrim(s->>'targetWord'),'')=''
 ), identities as (
  select identity from source union select jsonb_build_object('exposureItemId','',
    'exposurePassageKey','letter-case:'||letter,'exposureFamilyId','letter-case:'||letter) from letters
  union select jsonb_build_object('exposureItemId','','exposurePassageKey',word,
    'exposureFamilyId','mock-foundation-word:'||word) from word_targets
    where word~'^[a-z]+$' and identity->>'exposurePassageKey'<>word
 ) select coalesce(jsonb_agg(identity),'[]'::jsonb) from identities;
$$;

create or replace function public.lp_literacy_exposures(p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 with prior as (
  select response value from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses||r.media_failures) response where r.student_id=p_student_id
  union all select payload from public.literacy_mock_events where student_id=p_student_id and event_type='presented'
  union all select step from public.student_progress p
   cross join lateral jsonb_path_query(p.payload,'$.**.completions[*]') event
   cross join lateral jsonb_array_elements(case when jsonb_typeof(event->'steps')='array' then event->'steps' else '[]'::jsonb end) step
   where p.student_id=p_student_id and event->>'gameId'='literacy-practice'
 ), identities as (select identity from prior cross join lateral jsonb_array_elements(public.lp_literacy_exposure_identities(value)) identity)
 select coalesce(jsonb_agg(distinct identity),'[]'::jsonb) from identities;
$$;

create function public.lp_prepare_literacy_mock_focus(p_class_id uuid,p_student_ids uuid[],p_whole_class boolean,p_version text)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_ids uuid[]; v_id uuid; v_actor uuid:=auth.uid(); v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_whole_class is null or p_version is null
    or p_version not in ('literacy-mock-v1','literacy-mock-v2','literacy-mock-v3') then
    return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  perform 1 from public.classes where id=p_class_id and teacher_id=v_actor for update;
  if not found then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  if p_whole_class then
    if coalesce(cardinality(p_student_ids),0)<>0 then
      return jsonb_build_object('ok',false,'error','whole_class_ids_must_be_empty'); end if;
    select array_agg(id order by id) into v_ids from public.students
      where class_id=p_class_id and teacher_id=v_actor and archived_at is null;
    if coalesce(cardinality(v_ids),0)=0 then return jsonb_build_object('ok',false,'error','class_has_no_active_students'); end if;
  else
    v_ids:=p_student_ids;
  end if;
  if coalesce(cardinality(v_ids),0) not between 1 and 200
    or (select count(distinct id) from unnest(v_ids) id)<>cardinality(v_ids) then
    return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  perform 1 from public.students where id=any(v_ids) order by id for update;
  if exists(select 1 from unnest(v_ids) requested(id) left join public.students s
    on s.id=requested.id and s.class_id=p_class_id and s.teacher_id=v_actor and s.archived_at is null
    where s.id is null) then return jsonb_build_object('ok',false,'error','student_not_in_class'); end if;
  insert into public.student_focus_sessions(teacher_id,class_id,target,content_version,selection_scope,status,started_at,expires_at)
    values(v_actor,p_class_id,'progress_check',p_version,case when p_whole_class then 'whole_class' else 'selected_students' end,
      'prepared',v_now,v_now+interval '2 hours') returning id into v_id;
  insert into public.student_focus_session_members(session_id,student_id,resolved_config,active)
    select v_id,id,jsonb_build_object('plan_kind','mock','track_id','all','bank_version',p_version),false from unnest(v_ids) id;
  return jsonb_build_object('ok',true,'session',jsonb_build_object('id',v_id));
end; $$;

-- Capacity and preparation share one independent witness. A raw row count
-- overstates availability when item, canonical passage, stimulus or family identities cross.
-- Exhaustively solve small pools; for larger pools a deterministic witness is
-- explicitly a lower bound unless it attains a proved identity-count bound.
create function public.lp_literacy_mock_fresh_selection(p_student_id uuid,p_focus jsonb)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_candidate record; v_prior jsonb:=public.lp_literacy_exposures(p_student_id); v_identity jsonb;
  v_pool_ids text[]:='{}'; v_pool_items text[]:='{}'; v_pool_stimuli text[]:='{}'; v_pool_families text[]:='{}'; v_pool_raw_stimuli text[]:='{}';
  v_ids text[]:='{}'; v_items text[]:='{}'; v_stimuli text[]:='{}'; v_families text[]:='{}'; v_best text[]:='{}'; v_raw_stimuli text[]:='{}';
  v_item text; v_stimulus text; v_family text; v_raw_stimulus text; v_n integer; v_index integer; v_mask integer; v_bound integer; v_valid boolean;
begin
  for v_candidate in select id,item from public.literacy_mock_items i
    where content_version='literacy-mock-v3' and public.lp_literacy_mock_conditions(item)=p_focus
      and coalesce(item#>>'{itemSnapshot,tutorialOnly}','false')<>'true'
      and coalesce(item->>'mediaReady','true')<>'false'
      and coalesce(item#>>'{itemSnapshot,mediaReady}','true')<>'false'
      and not exists(select 1 from public.literacy_mock_items t where t.content_version=i.content_version
        and t.item#>>'{itemSnapshot,tutorialOnly}'='true'
        and nullif(t.item#>>'{itemSnapshot,stimulusKey}','')=i.item#>>'{itemSnapshot,stimulusKey}')
    order by id loop
    v_identity:=public.lp_literacy_exposure_identity(v_candidate.item);
    -- Read authoritative history once, retaining the familiarity helper's exact
    -- item/passage/family matching semantics for synced practice and mock events.
    if exists(select 1 from jsonb_each_text(v_identity) identity(key,value)
      where identity.value<>'' and exists(select 1 from jsonb_array_elements(v_prior) prior
        where prior->>identity.key=identity.value)) then continue; end if;
    v_item:=coalesce(nullif(v_identity->>'exposureItemId',''),v_candidate.id);
    v_stimulus:=coalesce(nullif(v_identity->>'exposurePassageKey',''),v_candidate.id);
    v_family:=coalesce(v_identity->>'exposureFamilyId','');
    v_raw_stimulus:=coalesce(nullif(v_candidate.item#>>'{itemSnapshot,stimulusKey}',''),v_candidate.id);
    v_pool_ids:=array_append(v_pool_ids,v_candidate.id); v_pool_items:=array_append(v_pool_items,v_item);
    v_pool_stimuli:=array_append(v_pool_stimuli,v_stimulus); v_pool_families:=array_append(v_pool_families,v_family);
    v_pool_raw_stimuli:=array_append(v_pool_raw_stimuli,v_raw_stimulus);
    if v_item=any(v_items) or v_stimulus=any(v_stimuli) or v_raw_stimulus=any(v_raw_stimuli) or (v_family<>'' and v_family=any(v_families)) then continue; end if;
    v_best:=array_append(v_best,v_candidate.id); v_items:=array_append(v_items,v_item); v_stimuli:=array_append(v_stimuli,v_stimulus); v_raw_stimuli:=array_append(v_raw_stimuli,v_raw_stimulus);
    if v_family<>'' then v_families:=array_append(v_families,v_family); end if;
  end loop;
  v_n:=cardinality(v_pool_ids);
  select least(count(distinct item_key),count(distinct stimulus),count(distinct raw_stimulus),
    count(distinct nullif(family,''))+count(*) filter(where family=''))::integer into v_bound
    from unnest(v_pool_items,v_pool_stimuli,v_pool_families,v_pool_raw_stimuli) pool(item_key,stimulus,family,raw_stimulus);
  if v_n between 1 and 10 and cardinality(v_best)<v_bound then
    for v_mask in 1..((1<<v_n)-1) loop
      if bit_count(v_mask::bit(10))<=cardinality(v_best) then continue; end if;
      v_ids:='{}'; v_items:='{}'; v_stimuli:='{}'; v_families:='{}'; v_raw_stimuli:='{}'; v_valid:=true;
      for v_index in 1..v_n loop
        if (v_mask & (1<<(v_index-1)))=0 then continue; end if;
        v_item:=v_pool_items[v_index]; v_stimulus:=v_pool_stimuli[v_index]; v_family:=v_pool_families[v_index]; v_raw_stimulus:=v_pool_raw_stimuli[v_index];
        if v_item=any(v_items) or v_stimulus=any(v_stimuli) or v_raw_stimulus=any(v_raw_stimuli) or (v_family<>'' and v_family=any(v_families)) then
          v_valid:=false; exit; end if;
        v_ids:=array_append(v_ids,v_pool_ids[v_index]); v_items:=array_append(v_items,v_item); v_stimuli:=array_append(v_stimuli,v_stimulus); v_raw_stimuli:=array_append(v_raw_stimuli,v_raw_stimulus);
        if v_family<>'' then v_families:=array_append(v_families,v_family); end if;
      end loop;
      if v_valid then v_best:=v_ids; end if;
      exit when cardinality(v_best)=v_bound;
    end loop;
  end if;
  return jsonb_build_object('candidateItemIds',to_jsonb(v_best),'remainingCount',cardinality(v_best),
    'countKind',case when v_n<=10 or cardinality(v_best)=v_bound then 'exact' else 'lower_bound' end);
end; $$;

create function public.lp_literacy_mock_fresh_candidates(p_student_id uuid,p_focus jsonb)
returns jsonb language sql stable security definer set search_path='' as $$
  select public.lp_literacy_mock_fresh_selection(p_student_id,p_focus)->'candidateItemIds';
$$;

-- A first sample uses one exact entry task, selected identically for the
-- preview and preparation. Unlike constructs never inflate the displayed count.
create function public.lp_literacy_mock_entry_selection(p_student_id uuid,p_skill_id text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_option record; v_selection jsonb;
  v_best jsonb:=jsonb_build_object('focus',null,'candidateItemIds','[]'::jsonb,'remainingCount',0,'countKind','exact');
begin
  for v_option in select distinct public.lp_literacy_mock_conditions(item) focus from public.literacy_mock_items
    where content_version='literacy-mock-v3' and item->>'skillId'=p_skill_id and item->>'level'='1'
    order by focus loop
    v_selection:=public.lp_literacy_mock_fresh_selection(p_student_id,v_option.focus);
    if v_best->'focus'='null'::jsonb or (v_selection->>'remainingCount')::integer>(v_best->>'remainingCount')::integer then
      v_best:=v_selection||jsonb_build_object('focus',v_option.focus);
    end if;
  end loop;
  return v_best;
end; $$;

-- A count-only teacher boundary. It does not create a draft, reserve items,
-- expose answer keys or return candidate identities. New evidence can reduce
-- capacity after this snapshot; preparation always recomputes it.
create function public.teacher_get_literacy_mock_fresh_capacity(p_source_session_id uuid,p_student_id uuid,
  p_question_id text default null,p_skill_id text default null)
returns json language plpgsql stable security definer set search_path='' as $$
declare v_source public.student_focus_sessions; v_focus jsonb; v_item jsonb; v_selection jsonb; v_ceiling jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_source from public.student_focus_sessions where id=p_source_session_id and teacher_id=auth.uid();
  if not found or not public.lp_literacy_mock_assignment(p_student_id,p_source_session_id) then
    return json_build_object('ok',false,'error','source_session_not_found'); end if;
  if v_source.content_version<>'literacy-mock-v3' then
    return json_build_object('ok',false,'error','unsupported_content_version'); end if;
  if (p_question_id is null)=(p_skill_id is null)
    or (p_question_id is not null and char_length(p_question_id) not between 1 and 240)
    or (p_skill_id is not null and char_length(p_skill_id) not between 1 and 120) then
    return json_build_object('ok',false,'error','invalid_payload'); end if;
  if not exists(select 1 from public.literacy_mock_publications p where content_version='literacy-mock-v3' and available_for_new_sessions
    and item_count=(select count(*) from public.literacy_mock_items where content_version=p.content_version)) then
    return json_build_object('ok',false,'error','mock_v3_unavailable'); end if;
  if p_question_id is not null then
    if not exists(select 1 from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses) response
        where r.session_id=p_source_session_id and r.student_id=p_student_id and response->>'questionId'=p_question_id)
      and not exists(select 1 from public.literacy_mock_events where session_id=p_source_session_id and student_id=p_student_id
        and question_id=p_question_id and event_type='presented') then
      return json_build_object('ok',false,'error','source_question_not_observed'); end if;
    select item into v_item from public.literacy_mock_items where content_version=v_source.content_version and id=p_question_id;
    if v_item is null then return json_build_object('ok',false,'error','source_item_unavailable'); end if;
    v_focus:=public.lp_literacy_mock_conditions(v_item);
    v_selection:=public.lp_literacy_mock_fresh_selection(p_student_id,v_focus);
  else
    if exists(select 1 from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses) response
        where r.session_id=p_source_session_id and r.student_id=p_student_id and response->>'skillId'=p_skill_id)
      or exists(select 1 from public.literacy_mock_events where session_id=p_source_session_id and student_id=p_student_id
        and event_type='presented' and payload->>'skillId'=p_skill_id) then
      return json_build_object('ok',false,'error','skill_already_observed'); end if;
    v_selection:=public.lp_literacy_mock_entry_selection(p_student_id,p_skill_id);
    v_focus:=v_selection->'focus';
    if v_focus='null'::jsonb then return json_build_object('ok',false,'error','skill_unavailable'); end if;
    select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v3'
      and public.lp_literacy_mock_conditions(item)=v_focus order by id limit 1;
  end if;
  if v_item#>'{itemSnapshot,demandCeiling}' is not null then
    v_ceiling:=jsonb_build_object('demandCeiling',v_item#>'{itemSnapshot,demandCeiling}',
      'ceilingReason',v_item#>>'{itemSnapshot,ceilingReason}','ceilingNextTask',v_item#>>'{itemSnapshot,ceilingNextTask}');
  end if;
  return json_build_object('ok',true,'capacity',jsonb_build_object('contentVersion','literacy-mock-v3',
    'sourceSessionId',p_source_session_id,'studentId',p_student_id,'questionId',p_question_id,'skillId',p_skill_id,
    'focus',v_focus,'remainingCount',v_selection->'remainingCount','countKind',v_selection->>'countKind',
    'checkItemCount',least(6,(v_selection->>'remainingCount')::integer),'checkedAt',statement_timestamp(),'taskCeiling',v_ceiling));
end; $$;

create function public.teacher_prepare_literacy_mock_entry_check(p_source_session_id uuid,p_student_id uuid,p_skill_id text,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_source public.student_focus_sessions; v_saved public.literacy_mock_preparations; v_hash text;
  v_focus jsonb; v_selection jsonb; v_ids jsonb:='[]'; v_result jsonb; v_id uuid; v_count integer;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_source from public.student_focus_sessions where id=p_source_session_id and teacher_id=auth.uid();
  if not found or not public.lp_literacy_mock_assignment(p_student_id,p_source_session_id) then
    return json_build_object('ok',false,'error','source_session_not_found'); end if;
  if coalesce(char_length(p_request_id),0) not between 1 and 160 or coalesce(char_length(p_skill_id),0) not between 1 and 120 then
    return json_build_object('ok',false,'error','invalid_request_id'); end if;
  perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
  v_hash:=encode(sha256(convert_to(jsonb_build_object('sourceSessionId',p_source_session_id,'studentId',p_student_id,
    'skillId',p_skill_id,'kind','entry_check')::text,'UTF8')),'hex');
  select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
  if found then
    if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
    return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
  end if;
  if not exists(select 1 from public.literacy_mock_publications p where content_version='literacy-mock-v3' and available_for_new_sessions
    and item_count=(select count(*) from public.literacy_mock_items where content_version=p.content_version)) then
    return json_build_object('ok',false,'error','mock_v3_unavailable'); end if;
  if exists(select 1 from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses) response
      where r.session_id=p_source_session_id and r.student_id=p_student_id and response->>'skillId'=p_skill_id)
    or exists(select 1 from public.literacy_mock_events where session_id=p_source_session_id and student_id=p_student_id
      and event_type='presented' and payload->>'skillId'=p_skill_id) then
    return json_build_object('ok',false,'error','skill_already_observed'); end if;
  v_selection:=public.lp_literacy_mock_entry_selection(p_student_id,p_skill_id);
  v_focus:=v_selection->'focus'; v_ids:=v_selection->'candidateItemIds';
  v_count:=least(6,jsonb_array_length(v_ids));
  if v_count=0 then return json_build_object('ok',false,'error','fresh_items_unavailable'); end if;
  v_result:=public.lp_prepare_literacy_mock_focus(v_source.class_id,array[p_student_id],false,'literacy-mock-v3');
  if v_result->>'ok'<>'true' then return v_result::json; end if;
  v_id:=(v_result#>>'{session,id}')::uuid;
  insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds,window_mode,plan_kind,focus,
      source_session_id,source_skill_id,candidate_item_ids,entry_check,fresh_sampling)
    values(v_id,v_count,600,600,'pause_at_window_end','fresh_check',v_focus,p_source_session_id,p_skill_id,v_ids,true,true);
  insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id) values(auth.uid(),p_request_id,v_hash,v_id);
  return public.teacher_get_student_focus_session(v_id);
end; $$;

-- Historical observations retain their source session's administration window.
-- Do not borrow the currently opened session's mode for an earlier run.
create or replace function public.lp_literacy_mock_run_json(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('schemaVersion',case when f.content_version='literacy-mock-v3' then 2 else 1 end,
  'contentVersion',f.content_version,'assignmentId',r.session_id,'studentId',r.student_id,'revision',r.revision,
  'windowMode',w.window_mode,'durationSeconds',w.duration_seconds,
  'timeExtensionCount',(select count(*) from public.literacy_mock_controls c where c.session_id=r.session_id and c.action='add_time'),
  'plan',r.plan,'planHistory',r.plan_history,'responses',case when f.content_version='literacy-mock-v3' then
   coalesce((select jsonb_agg(public.lp_literacy_mock_effective_response(p_session_id,p_student_id,response) order by position)
    from jsonb_array_elements(r.responses) with ordinality e(response,position)),'[]'::jsonb) else r.responses end,
  'status',r.status,'mediaFailures',r.media_failures,'completedAt',r.completed_at,'updatedAt',r.updated_at,
  'presentationTracking',f.content_version='literacy-mock-v3',
  'eventRevision',coalesce((select max(event_id) from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id),0),
  'presentations',coalesce((select jsonb_agg(e.payload||jsonb_build_object('serverReceivedAt',e.created_at) order by e.event_id)
   from public.literacy_mock_events e where e.session_id=p_session_id and e.student_id=p_student_id and e.event_type='presented'),'[]'::jsonb),
  'helpRequests',coalesce((select jsonb_agg(public.lp_literacy_mock_help(p_session_id,p_student_id,q.question_id)
   ||jsonb_build_object('itemSnapshot',(select payload->'itemSnapshot' from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and question_id=q.question_id and event_type='presented' order by event_id limit 1)))
   from (select distinct question_id from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id
    and event_type in ('help_requested','help_cancelled','support_resolved')) q),'[]'::jsonb),
  'unsampledItemIds',coalesce((select jsonb_agg(item_id order by position)
   from jsonb_array_elements(r.plan->'itemIds') with ordinality p(item_id,position)
   where position>jsonb_array_length(r.responses)),'[]'::jsonb))
 from public.literacy_mock_runs r join public.student_focus_sessions f on f.id=r.session_id
 join public.literacy_mock_sessions w on w.session_id=r.session_id
 where r.session_id=p_session_id and r.student_id=p_student_id;
$$;

create or replace function public.teacher_get_literacy_mock_report(p_session_id uuid)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_members jsonb:='[]'; v_member jsonb; v_prior jsonb; v_count integer; v_source public.student_focus_sessions; v_as_of timestamptz;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_source from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid();
  if not found then return json_build_object('ok',false,'error','session_not_found'); end if;
  v_result:=public.teacher_get_student_focus_session(p_session_id)::jsonb;
  if v_result#>'{session,mock}' is null then return json_build_object('ok',false,'error','mock_not_found'); end if;
  v_as_of:=coalesce((v_result#>>'{session,mock,started_at}')::timestamptz,v_source.started_at);
  for v_member in select value from jsonb_array_elements(v_result->'members') loop
    -- Historical responses retain their own run/version/dates. Current support
    -- annotations are overlaid at read time, never frozen into a stale summary.
    select count(*) into v_count from public.literacy_mock_runs r
      join public.student_focus_sessions f on f.id=r.session_id
      join public.students s on s.id=r.student_id
      where r.student_id=(v_member->>'student_id')::uuid and r.session_id<>p_session_id and r.status='completed'
        and r.completed_at<=v_as_of and r.completed_at>=v_as_of-interval '90 days'
        and f.teacher_id=auth.uid() and f.class_id=v_source.class_id and s.teacher_id=auth.uid() and s.class_id=v_source.class_id
        and s.archived_at is null and f.content_version=v_source.content_version;
    select coalesce(jsonb_agg(public.lp_literacy_mock_run_json(r.session_id,r.student_id) order by r.completed_at,r.session_id),'[]'::jsonb)
      into v_prior from (select r.* from public.literacy_mock_runs r
        join public.student_focus_sessions f on f.id=r.session_id join public.students s on s.id=r.student_id
        where r.student_id=(v_member->>'student_id')::uuid and r.session_id<>p_session_id and r.status='completed'
          and r.completed_at<=v_as_of and r.completed_at>=v_as_of-interval '90 days'
          and f.teacher_id=auth.uid() and f.class_id=v_source.class_id and s.teacher_id=auth.uid() and s.class_id=v_source.class_id
          and s.archived_at is null and f.content_version=v_source.content_version
        order by r.completed_at desc,r.session_id desc limit 20) r;
    v_members:=v_members||jsonb_build_array(v_member||jsonb_build_object('run',public.lp_literacy_mock_run_json(p_session_id,(v_member->>'student_id')::uuid),
      'priorRuns',v_prior,'historyCoverage',jsonb_build_object('windowDays',90,'limit',20,'returnedRuns',jsonb_array_length(v_prior),
        'truncated',v_count>20,'asOf',v_as_of,'contentVersion',v_source.content_version)));
  end loop;
  return jsonb_set(v_result,'{members}',v_members)::json;
end; $$;


create or replace function public.lp_literacy_mock_state(p_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_focus public.student_focus_sessions; v_mock public.literacy_mock_sessions; v_now timestamptz:=clock_timestamp();
begin
  select * into v_focus from public.student_focus_sessions where id=p_session_id for update;
  select * into v_mock from public.literacy_mock_sessions where session_id=p_session_id for update;
  if v_mock.session_id is null then return null; end if;
  v_now:=clock_timestamp();
  if v_mock.state<>'completed' and (v_focus.status='ended' or v_focus.expires_at<=v_now
    or (v_mock.state='running' and v_mock.deadline_at<=v_now and v_mock.window_mode='timed_sample')) then
    update public.literacy_mock_sessions set state='completed',revision=revision+1,remaining_seconds=0,deadline_at=null,
      ended_at=v_now,end_reason=case when v_focus.status='ended' then 'teacher_closed'
        when v_focus.expires_at<=v_now then 'session_expired' else 'time_finished' end,updated_at=v_now
      where session_id=p_session_id returning * into v_mock;
    update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id and status<>'completed';
    update public.student_focus_session_members set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id;
    update public.student_focus_session_members set active=false where session_id=p_session_id;
    update public.student_focus_sessions set status='ended',ended_at=coalesce(ended_at,v_now),updated_at=v_now where id=p_session_id;
  elsif v_mock.state='running' and v_mock.deadline_at<=v_now then
    update public.literacy_mock_sessions set state='paused',revision=revision+1,remaining_seconds=duration_seconds,
      deadline_at=null,pause_reason='window_elapsed',updated_at=v_now where session_id=p_session_id returning * into v_mock;
  end if;
  return (to_jsonb(v_mock)-'session_id')||jsonb_build_object('server_now',v_now,'content_version',v_focus.content_version,
    'capabilities',jsonb_build_object('presentationReceipts',v_focus.content_version='literacy-mock-v3','supportResolution',v_focus.content_version='literacy-mock-v3',
      'entryChecks',v_focus.content_version='literacy-mock-v3','freshChecks',v_focus.content_version='literacy-mock-v3','windowModes',v_focus.content_version='literacy-mock-v3'),
    'remaining_seconds',case when v_mock.state='running' then greatest(0,ceil(extract(epoch from(v_mock.deadline_at-v_now)))::integer)
      else least(v_mock.remaining_seconds,greatest(0,ceil(extract(epoch from(v_focus.expires_at-v_now)))::integer)) end);
end; $$;

create or replace function public.teacher_control_literacy_mock_session(p_session_id uuid,p_action text,p_expected_revision integer,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_mock jsonb; v_saved public.literacy_mock_controls; v_now timestamptz:=clock_timestamp(); v_remaining integer; v_expires timestamptz; v_class uuid; v_conflicts jsonb; v_students jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  -- Match assignment creation's class/student/focus lock order. A concurrent
  -- start cannot replace another assignment while this boundary activates.
  select class_id into v_class from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid();
  perform 1 from public.classes where id=v_class and teacher_id=auth.uid() for update;
  perform 1 from public.students s join public.student_focus_session_members m on m.student_id=s.id
    where m.session_id=p_session_id order by s.id for update of s;
  select expires_at into v_expires from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid() for update;
  if not found then return json_build_object('ok',false,'error','session_not_found'); end if;
  if p_action is null or p_action not in ('start','pause','resume','add_time','finish') or p_expected_revision is null
    or p_expected_revision<0 or coalesce(char_length(p_request_id),0) not between 1 and 160 then
    return json_build_object('ok',false,'error','invalid_control'); end if;
  v_mock:=public.lp_literacy_mock_state(p_session_id);
  if v_mock is null then return json_build_object('ok',false,'error','mock_not_found'); end if;
  select * into v_saved from public.literacy_mock_controls where session_id=p_session_id and request_id=p_request_id;
  if found then
    if v_saved.action<>p_action or v_saved.expected_revision<>p_expected_revision then
      return json_build_object('ok',false,'error','request_conflict'); end if;
    return (public.teacher_get_student_focus_session(p_session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
  end if;
  if (v_mock->>'revision')::integer<>p_expected_revision then return json_build_object('ok',false,'error','stale_revision','mock',v_mock); end if;
  if p_expected_revision>=500 then return json_build_object('ok',false,'error','control_limit'); end if;
  if v_mock->>'state'='completed' then return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
  if (p_action='start' and v_mock->>'state'<>'prepared') or (p_action='resume' and v_mock->>'state'<>'paused')
    or (p_action='pause' and v_mock->>'state'<>'running') then return json_build_object('ok',false,'error','invalid_transition','mock',v_mock); end if;
  if p_action='start' then
    if exists(select 1 from public.student_focus_session_members m left join public.students s on s.id=m.student_id
      and s.teacher_id=auth.uid() and s.class_id=v_class and s.archived_at is null
      where m.session_id=p_session_id and s.id is null) then
      return json_build_object('ok',false,'error','student_not_in_class','mock',v_mock); end if;
    select coalesce(jsonb_agg(f.id order by f.id),'[]'::jsonb) into v_conflicts
      from public.student_focus_sessions f where f.id<>p_session_id and f.status='active' and f.expires_at>clock_timestamp()
        and (f.teacher_id=auth.uid() or exists(select 1 from public.student_focus_session_members old
          join public.student_focus_session_members requested on requested.student_id=old.student_id and requested.session_id=p_session_id
          where old.session_id=f.id and old.active));
    select coalesce(jsonb_agg(distinct requested.student_id),'[]'::jsonb) into v_students
      from public.student_focus_session_members requested where requested.session_id=p_session_id
        and (exists(select 1 from public.student_focus_session_members old join public.student_focus_sessions f on f.id=old.session_id
          where old.student_id=requested.student_id and old.session_id<>p_session_id and old.active and f.status='active' and f.expires_at>clock_timestamp())
          or exists(select 1 from public.reading_sessions r where requested.student_id=any(r.student_ids)
            and r.status='active' and r.updated_at>=clock_timestamp()-interval '90 minutes'));
    if jsonb_array_length(v_conflicts)>0 or jsonb_array_length(v_students)>0 then
      return json_build_object('ok',false,'error','active_assignment_conflict','conflictingSessionIds',v_conflicts,
        'conflictingStudentIds',v_students,'mock',v_mock); end if;
    -- Release only expired assignments owned by this teacher, once activation
    -- is otherwise safe. No live assignment or classmate is displaced.
    update public.student_focus_session_members m set active=false,updated_at=clock_timestamp()
      from public.student_focus_sessions f where m.session_id=f.id and f.teacher_id=auth.uid() and f.expires_at<=clock_timestamp();
    update public.student_focus_sessions set status='ended',ended_at=coalesce(ended_at,clock_timestamp()),updated_at=clock_timestamp()
      where teacher_id=auth.uid() and status='active' and expires_at<=clock_timestamp();
    update public.student_focus_sessions set status='active',updated_at=clock_timestamp() where id=p_session_id;
    update public.student_focus_session_members set active=true,updated_at=clock_timestamp() where session_id=p_session_id;
  end if;
  v_now:=clock_timestamp();
  v_remaining:=(v_mock->>'remaining_seconds')::integer;
  if p_action='add_time' then v_remaining:=least(v_remaining+300,greatest(0,floor(extract(epoch from(v_expires-v_now)))::integer)); end if;
  update public.literacy_mock_sessions set
    state=case when p_action in ('start','resume') then 'running' when p_action='pause' then 'paused' when p_action='finish' then 'completed' else state end,
    pause_reason=case when p_action='pause' then 'teacher_pause' when p_action in ('start','resume','finish') then null else pause_reason end,
    revision=revision+1,remaining_seconds=case when p_action='finish' then 0 else v_remaining end,
    deadline_at=case when p_action in ('start','resume') or (p_action='add_time' and state='running') then least(v_expires,v_now+make_interval(secs=>v_remaining))
      when p_action in ('pause','finish') then null else deadline_at end,
    started_at=case when p_action='start' then v_now else started_at end,
    ended_at=case when p_action='finish' then v_now else ended_at end,
    end_reason=case when p_action='finish' then 'teacher_finished' else end_reason end,updated_at=v_now
    where session_id=p_session_id;
  if p_action='finish' then
    update public.student_focus_session_members set active=false where session_id=p_session_id;
    update public.student_focus_sessions set status='ended',ended_at=v_now,updated_at=v_now where id=p_session_id;
    update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now where session_id=p_session_id and status<>'completed';
    update public.student_focus_session_members set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now where session_id=p_session_id;
  end if;
  insert into public.literacy_mock_controls(session_id,request_id,action,expected_revision,result_revision)
    values(p_session_id,p_request_id,p_action,p_expected_revision,p_expected_revision+1);
  return public.teacher_get_student_focus_session(p_session_id);
exception when unique_violation then
  return json_build_object('ok',false,'error','active_assignment_conflict');
end; $$;

create or replace function public.teacher_prepare_literacy_mock_session(p_class_id uuid,p_student_ids uuid[] default '{}',
  p_whole_class boolean default false,p_duration_minutes integer default 20,p_item_count integer default 43,p_request_id text default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_id uuid; v_saved public.literacy_mock_preparations; v_hash text; v_version text:='literacy-mock-v1';
begin
  perform public.assert_current_actor_teacher_access();
  if p_duration_minutes is null or p_duration_minutes not in (10,20,30,40)
    or p_item_count is null or p_item_count not in (24,43) then
    return json_build_object('ok',false,'error','invalid_mock_options'); end if;
  if p_request_id is not null and char_length(p_request_id) not between 1 and 160 then
    return json_build_object('ok',false,'error','invalid_request_id'); end if;
  if p_request_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
    -- The fingerprint contains no recoverable pupil identifiers after deletion.
    v_hash:=encode(sha256(convert_to(jsonb_build_object('classId',p_class_id,'studentIds',p_student_ids,
      'wholeClass',p_whole_class,'minutes',p_duration_minutes,'count',p_item_count)::text,'UTF8')),'hex');
    select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
    if found then
      if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
      return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
    end if;
  end if;
  if exists(select 1 from public.literacy_mock_publications p where p.content_version='literacy-mock-v2' and p.available_for_new_sessions
      and p.item_count=(select count(*) from public.literacy_mock_items i where i.content_version=p.content_version)
      and (select count(distinct item->>'domainId') from public.literacy_mock_items i where i.content_version=p.content_version)=8) then
    v_version:='literacy-mock-v2'; end if;
  if (select count(distinct item->>'domainId') from public.literacy_mock_items where content_version=v_version)<>8 then
    return json_build_object('ok',false,'error','mock_content_unavailable'); end if;
  v_result:=public.lp_prepare_literacy_mock_focus(p_class_id,p_student_ids,p_whole_class,v_version);
  if v_result->>'ok'<>'true' then return v_result::json; end if;
  v_id:=(v_result#>>'{session,id}')::uuid;
  insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds)
    values(v_id,p_item_count,p_duration_minutes*60,p_duration_minutes*60);
  if p_request_id is not null then insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id)
    values(auth.uid(),p_request_id,v_hash,v_id); end if;
  return public.teacher_get_student_focus_session(v_id);
end; $$;

create or replace function public.teacher_prepare_literacy_mock_session_v3(p_class_id uuid,p_student_ids uuid[] default '{}',
  p_whole_class boolean default false,p_duration_minutes integer default 20,p_item_count integer default 43,p_request_id text default null,p_window_mode text default 'pause_at_window_end')
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_id uuid; v_saved public.literacy_mock_preparations; v_hash text; v_version text:='literacy-mock-v3';
begin
  perform public.assert_current_actor_teacher_access();
  if p_window_mode is null or p_window_mode not in ('pause_at_window_end','timed_sample') or p_duration_minutes is null or p_duration_minutes not in (10,20,30,40)
    or p_item_count is null or p_item_count not in (24,43) then
    return json_build_object('ok',false,'error','invalid_mock_options'); end if;
  if p_request_id is not null and char_length(p_request_id) not between 1 and 160 then
    return json_build_object('ok',false,'error','invalid_request_id'); end if;
  if p_request_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
    -- The fingerprint contains no recoverable pupil identifiers after deletion.
    v_hash:=encode(sha256(convert_to(jsonb_build_object('classId',p_class_id,'studentIds',p_student_ids,
      'wholeClass',p_whole_class,'minutes',p_duration_minutes,'count',p_item_count,'windowMode',p_window_mode,'version',v_version)::text,'UTF8')),'hex');
    select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
    if found then
      if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
      return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
    end if;
  end if;
  if not exists(select 1 from public.literacy_mock_publications p where p.content_version=v_version and p.available_for_new_sessions
      and p.item_count=(select count(*) from public.literacy_mock_items i where i.content_version=p.content_version)
      and (select count(distinct item->>'domainId') from public.literacy_mock_items i where i.content_version=p.content_version)=8) then
    return json_build_object('ok',false,'error','mock_v3_unavailable'); end if;
  v_result:=public.lp_prepare_literacy_mock_focus(p_class_id,p_student_ids,p_whole_class,v_version);
  if v_result->>'ok'<>'true' then return v_result::json; end if;
  v_id:=(v_result#>>'{session,id}')::uuid;
  insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds,window_mode,fresh_sampling)
    values(v_id,p_item_count,p_duration_minutes*60,p_duration_minutes*60,p_window_mode,true);
  if p_request_id is not null then insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id)
    values(auth.uid(),p_request_id,v_hash,v_id); end if;
  return public.teacher_get_student_focus_session(v_id);
end; $$;

create or replace function public.teacher_prepare_literacy_mock_fresh_check(p_source_session_id uuid,p_student_id uuid,p_question_id text,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_source public.student_focus_sessions; v_item jsonb; v_focus jsonb; v_candidate record; v_ids jsonb:='[]';
 v_item_keys text[]:='{}'; v_stimuli text[]:='{}'; v_families text[]:='{}'; v_item_key text; v_stimulus text; v_family text; v_result jsonb; v_id uuid;
 v_saved public.literacy_mock_preparations; v_hash text; v_count integer;
begin
 perform public.assert_current_actor_teacher_access();
 select * into v_source from public.student_focus_sessions where id=p_source_session_id and teacher_id=auth.uid();
 if not found or not public.lp_literacy_mock_assignment(p_student_id,p_source_session_id) then return json_build_object('ok',false,'error','source_session_not_found'); end if;
 if coalesce(char_length(p_request_id),0) not between 1 and 160 or coalesce(char_length(p_question_id),0) not between 1 and 240 then
  return json_build_object('ok',false,'error','invalid_request_id'); end if;
 perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
 v_hash:=encode(sha256(convert_to(jsonb_build_object('sourceSessionId',p_source_session_id,'studentId',p_student_id,'questionId',p_question_id,'kind','fresh_check')::text,'UTF8')),'hex');
 select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
 if found then
  if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
  return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
 end if;
 if not exists(select 1 from public.literacy_mock_publications p where content_version='literacy-mock-v3' and available_for_new_sessions
  and item_count=(select count(*) from public.literacy_mock_items where content_version=p.content_version)) then
  return json_build_object('ok',false,'error','mock_v3_unavailable'); end if;
 if not exists(select 1 from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses) response
   where r.session_id=p_source_session_id and r.student_id=p_student_id and response->>'questionId'=p_question_id)
  and not exists(select 1 from public.literacy_mock_events where session_id=p_source_session_id and student_id=p_student_id and question_id=p_question_id and event_type='presented') then
  return json_build_object('ok',false,'error','source_question_not_observed'); end if;
 select item into v_item from public.literacy_mock_items where content_version=v_source.content_version and id=p_question_id;
 if v_item is null then return json_build_object('ok',false,'error','source_item_unavailable'); end if;
 v_focus:=public.lp_literacy_mock_conditions(v_item);
 v_ids:=public.lp_literacy_mock_fresh_candidates(p_student_id,v_focus);
 v_count:=least(6,jsonb_array_length(v_ids));
 if v_count=0 then return json_build_object('ok',false,'error','fresh_items_unavailable','focus',v_focus); end if;
 v_result:=public.lp_prepare_literacy_mock_focus(v_source.class_id,array[p_student_id],false,'literacy-mock-v3');
 if v_result->>'ok'<>'true' then return v_result::json; end if;
 v_id:=(v_result#>>'{session,id}')::uuid;
 insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds,window_mode,plan_kind,focus,source_session_id,source_question_id,candidate_item_ids,fresh_sampling)
  values(v_id,v_count,600,600,'pause_at_window_end','fresh_check',v_focus,p_source_session_id,p_question_id,v_ids,true);
 insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id) values(auth.uid(),p_request_id,v_hash,v_id);
 return public.teacher_get_student_focus_session(v_id);
end; $$;

create or replace function public.student_save_literacy_mock_run(p_token text,p_session_id uuid,p_request_id text,
  p_expected_revision integer,p_plan jsonb default null,p_response jsonb default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare
  v_student public.students; v_mock jsonb; v_run public.literacy_mock_runs; v_request public.literacy_mock_run_requests;
  v_payload jsonb; v_plan jsonb; v_item jsonb; v_old_item jsonb; v_answer jsonb; v_previous jsonb; v_failure jsonb; v_failed_paths jsonb;
  v_version text; v_familiarity jsonb; v_presentation jsonb; v_id text; v_index integer; v_count integer; v_expected_level integer; v_valid boolean; v_now timestamptz;
begin
  v_student:=public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok',false,'error','invalid_session'); end if;
  perform 1 from public.students where id=v_student.id for share;
  if not public.lp_literacy_mock_assignment(v_student.id,p_session_id) then
    return json_build_object('ok',false,'error','assignment_not_found'); end if;
  if coalesce(char_length(p_request_id),0) not between 1 and 160 or p_expected_revision is null or p_expected_revision<0
    or (p_plan is null and p_response is null) or octet_length(coalesce(p_plan,'{}')::text)>20000
    or octet_length(coalesce(p_response,'{}')::text)>32000 then
    return json_build_object('ok',false,'error','invalid_payload'); end if;
  v_mock:=public.lp_literacy_mock_state(p_session_id);
  select content_version into v_version from public.student_focus_sessions where id=p_session_id;
  v_payload:=jsonb_build_object('expectedRevision',p_expected_revision,'plan',p_plan,'response',p_response);
  select * into v_request from public.literacy_mock_run_requests where session_id=p_session_id and student_id=v_student.id and request_id=p_request_id;
  if found then
    if v_request.request_payload<>v_payload then return json_build_object('ok',false,'error','request_conflict'); end if;
    return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
  end if;
  if v_mock->>'state'='completed' or not exists(select 1 from public.student_focus_sessions f
    join public.student_focus_session_members m on m.session_id=f.id where f.id=p_session_id
      and f.status='active' and f.expires_at>clock_timestamp() and m.student_id=v_student.id and m.active) then
    return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
  select * into v_run from public.literacy_mock_runs where session_id=p_session_id and student_id=v_student.id for update;
  if coalesce(v_run.revision,0)<>p_expected_revision then
    return json_build_object('ok',false,'error','stale_revision','mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id)); end if;
  if v_run.status='completed' then return json_build_object('ok',false,'error','run_completed'); end if;
  if p_response is not null and v_mock->>'state'<>'running' then
    return json_build_object('ok',false,'error','assessment_not_running','mock',v_mock); end if;
  v_count:=coalesce(jsonb_array_length(v_run.responses),0);
  if v_run.revision>=256 or (p_plan is not null and p_plan is distinct from v_run.plan and coalesce(jsonb_array_length(v_run.plan_history),0)>=128)
    or (p_response->>'responseStatus'='media_failed' and coalesce(jsonb_array_length(v_run.media_failures),0)>=128) then
    return json_build_object('ok',false,'error','run_mutation_limit'); end if;
  v_plan:=coalesce(v_run.plan,p_plan);
  if p_plan is not null then
    if jsonb_typeof(p_plan) is distinct from 'object' or jsonb_typeof(p_plan->'itemIds') is distinct from 'array'
      or jsonb_typeof(p_plan->'seed') is distinct from 'string' or char_length(p_plan->>'seed') not between 1 and 160
      or exists(select 1 from jsonb_object_keys(p_plan) k where k not in ('itemIds','seed'))
      or jsonb_array_length(p_plan->'itemIds')<>(v_mock->>'item_count')::integer
      or (select count(distinct value) from jsonb_array_elements(p_plan->'itemIds'))<>jsonb_array_length(p_plan->'itemIds') then
      return json_build_object('ok',false,'error','invalid_plan'); end if;
    if v_run.session_id is not null and (p_plan->'seed'<>v_run.plan->'seed'
      or (v_mock->>'state'<>'running' and p_plan<>v_run.plan)) then
      return json_build_object('ok',false,'error','plan_conflict'); end if;
    for v_id,v_index in select value,ordinality::integer from jsonb_array_elements_text(p_plan->'itemIds') with ordinality loop
      select item into v_item from public.literacy_mock_items where id=v_id and content_version=v_version;
      if v_item is null then return json_build_object('ok',false,'error','unknown_item'); end if;
      if v_index>v_count and public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures) then
        return json_build_object('ok',false,'error','blocked_media_item'); end if;
      if v_item#>>'{itemSnapshot,tutorialOnly}'='true' or exists (
        select 1 from public.literacy_mock_items tutorial where tutorial.content_version=v_version
          and tutorial.item#>>'{itemSnapshot,tutorialOnly}'='true'
          and nullif(v_item#>>'{itemSnapshot,stimulusKey}','')=tutorial.item#>>'{itemSnapshot,stimulusKey}') then
        return json_build_object('ok',false,'error','tutorial_item_not_scored'); end if;
      if v_version='literacy-mock-v3' and v_mock->>'fresh_sampling'='true' and v_index>v_count
        and (v_run.session_id is null or v_id is distinct from v_run.plan->'itemIds'->>(v_index-1))
        and not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=v_id and event_type='presented')
        and jsonb_array_length(public.lp_literacy_familiarity(v_student.id,v_item))>0 then
        return json_build_object('ok',false,'error','fresh_item_exposed'); end if;
      if v_version='literacy-mock-v3' and v_mock->>'plan_kind'='fresh_check' then
        if not (v_mock->'candidate_item_ids' ? v_id) or public.lp_literacy_mock_conditions(v_item)<>v_mock->'focus' then
          return json_build_object('ok',false,'error','invalid_fresh_check_plan'); end if;
        if v_index>v_count and not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=v_id and event_type='presented')
          and jsonb_array_length(public.lp_literacy_familiarity(v_student.id,v_item))>0 then
          return json_build_object('ok',false,'error','fresh_item_exposed'); end if;
      end if;
      if v_version='literacy-mock-v3' and v_run.session_id is null and v_mock->>'plan_kind'='mixed' and (v_item->>'level')::integer<>1 then
        return json_build_object('ok',false,'error','invalid_entry_level'); end if;
      if v_run.session_id is not null then
        select item into v_old_item from public.literacy_mock_items where id=v_run.plan->'itemIds'->>(v_index-1) and content_version=v_version;
        if (v_index<=v_count and to_jsonb(v_id)<>v_run.plan->'itemIds'->(v_index-1))
          or v_item->>'skillId' is distinct from v_old_item->>'skillId' or v_item->>'domainId' is distinct from v_old_item->>'domainId' then
          return json_build_object('ok',false,'error','plan_conflict'); end if;
        if v_version='literacy-mock-v3' and public.lp_literacy_mock_conditions(v_item)-'level' is distinct from public.lp_literacy_mock_conditions(v_old_item)-'level' then
          return json_build_object('ok',false,'error','plan_condition_conflict'); end if;
        if v_version='literacy-mock-v3' and v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1)
          and not public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures)
          and exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id
            and question_id=v_old_item->>'id' and event_type='presented') then
          return json_build_object('ok',false,'error','presented_item_frozen'); end if;
        if v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1) then
          select effective into v_previous from jsonb_array_elements(v_run.responses) with ordinality r(response,position)
            cross join lateral (select case when v_version='literacy-mock-v3'
              then public.lp_literacy_mock_effective_response(p_session_id,v_student.id,response) else response end effective) e
            where response->>'skillId'=v_item->>'skillId' and public.lp_literacy_response_eligible(effective)
              and (v_version<>'literacy-mock-v3' or public.lp_literacy_mock_conditions(effective)-'level'=public.lp_literacy_mock_conditions(v_item)-'level')
            order by position desc limit 1;
          v_expected_level:=case when v_mock->>'plan_kind'='fresh_check' or public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures)
            then (v_old_item->>'level')::integer when v_previous is null then case when v_version='literacy-mock-v3' then 1 else (v_old_item->>'level')::integer end
            when (v_previous->>'isCorrect')::boolean then 2 else 1 end;
          if (v_item->>'level')::integer<>v_expected_level then return json_build_object('ok',false,'error','invalid_adaptation'); end if;
        end if;
      end if;
    end loop;
    -- A mixed mock must actually cover every advertised area. No claims are
    -- inferred from an area that a timer prevented the child from reaching.
    if coalesce(v_mock->>'plan_kind','mixed')='mixed' and (select count(distinct i.item->>'domainId') from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version)<>8 then return json_build_object('ok',false,'error','incomplete_domain_plan'); end if;
    if v_version='literacy-mock-v3' and exists(select 1 from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version
      group by coalesce(nullif(i.item#>>'{itemSnapshot,stimulusKey}',''),i.id) having count(*)>1) then
      return json_build_object('ok',false,'error','repeated_stimulus'); end if;
    if v_version='literacy-mock-v3' and v_mock->>'fresh_sampling'='true' and exists(
      select identity.key,identity.value from jsonb_array_elements_text(p_plan->'itemIds') p(id)
        join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version
        cross join lateral jsonb_each_text(public.lp_literacy_exposure_identity(i.item)) identity
      where nullif(identity.value,'') is not null group by identity.key,identity.value having count(*)>1) then
      return json_build_object('ok',false,'error','repeated_exposure_identity'); end if;
    v_plan:=p_plan;
  end if;
  if v_plan is null then return json_build_object('ok',false,'error','plan_required'); end if;
  if p_response is null and v_run.session_id is not null and v_plan=v_run.plan then
    return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id)); end if;
  if p_response is not null then
    if jsonb_typeof(p_response) is distinct from 'object'
      or exists(select 1 from jsonb_object_keys(p_response) k where k not in ('questionId','selected','responseStatus','audioDelivery','supportUsed','responseTimeMs','knownFamiliar','failedMediaPaths'))
      or p_response->>'questionId' is distinct from v_plan->'itemIds'->>v_count
      or p_response->>'responseStatus' is null or p_response->>'responseStatus' not in ('answered','skipped','media_failed')
      or jsonb_typeof(p_response->'audioDelivery') is distinct from 'object'
      or jsonb_typeof(p_response->'supportUsed') is distinct from 'boolean'
      or (p_response ? 'knownFamiliar' and jsonb_typeof(p_response->'knownFamiliar') not in ('null','boolean'))
      or (p_response ? 'responseTimeMs' and (jsonb_typeof(p_response->'responseTimeMs')<>'number'
        or (p_response->>'responseTimeMs')::numeric not between 0 and 7200000)) then
      return json_build_object('ok',false,'error','invalid_response'); end if;
    select item into v_item from public.literacy_mock_items where id=p_response->>'questionId' and content_version=v_version;
    if v_version='literacy-mock-v3' then
      select payload into v_presentation from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id
        and question_id=p_response->>'questionId' and event_type='presented' order by event_id limit 1;
      if v_presentation is null then return json_build_object('ok',false,'error','presentation_required'); end if;
    end if;
    if p_response->>'responseStatus'<>'media_failed' and (p_response ? 'failedMediaPaths'
      or public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures)) then
      return json_build_object('ok',false,'error','blocked_media_item'); end if;
    if p_response->>'responseStatus'='media_failed' then
      if v_run.session_id is null or (p_plan is not null and p_plan<>v_run.plan)
        or jsonb_typeof(p_response->'selected') is distinct from 'null'
        or jsonb_typeof(p_response->'failedMediaPaths') is distinct from 'array'
        or jsonb_array_length(p_response->'failedMediaPaths') not between 1 and 100
        or exists(select 1 from jsonb_array_elements(p_response->'failedMediaPaths') path where jsonb_typeof(path)<>'string')
        or exists(select 1 from jsonb_array_elements_text(p_response->'failedMediaPaths') failed where not exists(
          select 1 from jsonb_array_elements_text(public.lp_literacy_mock_media_paths(v_item)) required
          where split_part(failed,'#',1)=split_part(required,'#',1))) then
        return json_build_object('ok',false,'error','invalid_media_failure'); end if;
      -- Store exact canonical source paths, even when an image element reports
      -- a source URL without its atlas-cell fragment.
      select jsonb_agg(distinct required order by required) into v_failed_paths
        from jsonb_array_elements_text(public.lp_literacy_mock_media_paths(v_item)) required
        where exists(select 1 from jsonb_array_elements_text(p_response->'failedMediaPaths') failed
          where split_part(failed,'#',1)=split_part(required,'#',1));
    end if;
    if p_response->>'responseStatus'='answered' then
      if jsonb_typeof(p_response->'selected') not in ('string','array') or p_response->'selected' is null then
        return json_build_object('ok',false,'error','invalid_answer'); end if;
      if (v_item->>'answerMode' in ('set','sequence') and (jsonb_typeof(p_response->'selected')<>'array'
        or jsonb_array_length(p_response->'selected') not between 1 and 30
        or exists(select 1 from jsonb_array_elements(p_response->'selected') choice where jsonb_typeof(choice)<>'string')))
        or (v_item->>'answerMode' in ('exact','sentence') and jsonb_typeof(p_response->'selected')<>'string') then
        return json_build_object('ok',false,'error','invalid_answer'); end if;
      if v_item->>'answerMode'='set' and (select count(distinct value) from jsonb_array_elements(p_response->'selected'))<>jsonb_array_length(p_response->'selected') then
        return json_build_object('ok',false,'error','invalid_answer'); end if;
      if v_item->>'format' in ('choice','select_text','multi_select','order','match') and exists(
        select 1 from jsonb_array_elements_text(case when jsonb_typeof(p_response->'selected')='array'
          then p_response->'selected' else jsonb_build_array(p_response->'selected') end) chosen
        where not exists(select 1 from jsonb_array_elements(v_item->'choices') choice where choice->>'id'=chosen)) then
        return json_build_object('ok',false,'error','invalid_answer_choice'); end if;
      if exists(select 1 from jsonb_array_elements_text(v_item->'requiredAudioPaths') path where p_response->'audioDelivery'->>path is distinct from 'completed') then
        return json_build_object('ok',false,'error','audio_not_delivered'); end if;
    elsif coalesce(p_response->'selected','null'::jsonb)<>'null'::jsonb then
      return json_build_object('ok',false,'error','unscored_response_has_answer');
    end if;
    if exists(select 1 from jsonb_each(p_response->'audioDelivery') cue
      where not (v_item->'requiredAudioPaths' ? cue.key) or cue.value not in ('"completed"'::jsonb,'"failed"'::jsonb)) then
      return json_build_object('ok',false,'error','invalid_audio_receipt'); end if;
    v_now:=clock_timestamp();
    -- Recheck after validation, so a slow transaction cannot submit on an old clock.
    if (v_mock->>'deadline_at')::timestamptz<=v_now then
      v_mock:=public.lp_literacy_mock_state(p_session_id);
      return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
    v_valid:=p_response->>'responseStatus'='answered' and not (p_response->>'supportUsed')::boolean;
    v_familiarity:=case when v_version='literacy-mock-v3' then v_presentation->'familiarityReasons' else public.lp_literacy_familiarity(v_student.id,v_item) end;
    v_answer:=p_response||public.lp_literacy_exposure_identity(v_item)||jsonb_build_object('questionId',v_item->>'id','skillId',v_item->>'skillId',
      'domainId',v_item->>'domainId','level',v_item->'level','itemSnapshot',v_item->'itemSnapshot',
      'isCorrect',case when p_response->>'responseStatus'='answered' then public.lp_literacy_mock_normalize_answer(p_response->'selected',v_item->>'answerMode')
        =public.lp_literacy_mock_normalize_answer(v_item->'answer',v_item->>'answerMode') else null end,
      'evidenceType',case when v_valid then 'independent' when p_response->>'responseStatus'='answered' then 'supported' else 'unscored' end,
      'presentationRole','first_probe','administration','rehearsal','presentationVersion','mock-explicit-submit-v1',
      'familiarityReasons',v_familiarity,'knownFamiliar',case when jsonb_array_length(v_familiarity)>0
        then 'true'::jsonb else coalesce(p_response->'knownFamiliar','null'::jsonb) end,'serverReceivedAt',v_now,'occurredAt',v_now);
    if v_version='literacy-mock-v3' then v_answer:=public.lp_literacy_mock_effective_response(p_session_id,v_student.id,v_answer); end if;
    if p_response->>'responseStatus'='media_failed' then
      v_failure:=v_answer||jsonb_build_object('failedMediaPaths',v_failed_paths);
      v_answer:=null;
    end if;
  end if;
  if v_run.session_id is null then
    insert into public.literacy_mock_runs(session_id,student_id,plan) values(p_session_id,v_student.id,v_plan) returning * into v_run;
  end if;
  update public.literacy_mock_runs set plan=v_plan,revision=revision+1,
    responses=responses||case when v_answer is null then '[]'::jsonb else jsonb_build_array(v_answer) end,
    media_failures=media_failures||case when v_failure is null then '[]'::jsonb else jsonb_build_array(v_failure) end,
    status=case when v_failure is not null then status when v_count+case when v_answer is null then 0 else 1 end=jsonb_array_length(v_plan->'itemIds') then 'completed'
      when v_mock->>'state'='prepared' then 'ready' else 'running' end,
    completed_at=case when v_count+case when v_answer is null then 0 else 1 end=jsonb_array_length(v_plan->'itemIds') then clock_timestamp() else null end,
    updated_at=clock_timestamp() where session_id=p_session_id and student_id=v_student.id returning * into v_run;
  insert into public.literacy_mock_run_requests(session_id,student_id,request_id,request_payload,result_revision)
    values(p_session_id,v_student.id,p_request_id,v_payload,v_run.revision);
  if v_run.status='completed' then update public.student_focus_session_members set status='completed',completed_at=v_run.completed_at,updated_at=clock_timestamp()
    where session_id=p_session_id and student_id=v_student.id; end if;
  return json_build_object('ok',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
exception when invalid_text_representation or numeric_value_out_of_range or invalid_parameter_value then
  return json_build_object('ok',false,'error','invalid_payload');
end; $$;

revoke all on function public.lp_literacy_exposure_identities(jsonb),public.lp_literacy_exposures(uuid),
 public.lp_prepare_literacy_mock_focus(uuid,uuid[],boolean,text),
 public.lp_literacy_mock_fresh_candidates(uuid,jsonb),public.lp_literacy_mock_fresh_selection(uuid,jsonb),
 public.lp_literacy_mock_entry_selection(uuid,text),public.lp_literacy_mock_state(uuid),
 public.lp_literacy_mock_run_json(uuid,uuid) from public,anon,authenticated;
revoke all on function public.teacher_get_literacy_mock_fresh_capacity(uuid,uuid,text,text),
 public.teacher_prepare_literacy_mock_entry_check(uuid,uuid,text,text),
 public.teacher_get_literacy_mock_report(uuid),public.teacher_control_literacy_mock_session(uuid,text,integer,text),
 public.teacher_prepare_literacy_mock_session(uuid,uuid[],boolean,integer,integer,text),
 public.teacher_prepare_literacy_mock_session_v3(uuid,uuid[],boolean,integer,integer,text,text),
 public.teacher_prepare_literacy_mock_fresh_check(uuid,uuid,text,text),
 public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.teacher_get_literacy_mock_fresh_capacity(uuid,uuid,text,text),
 public.teacher_prepare_literacy_mock_entry_check(uuid,uuid,text,text),
 public.teacher_get_literacy_mock_report(uuid),public.teacher_control_literacy_mock_session(uuid,text,integer,text),
 public.teacher_prepare_literacy_mock_session(uuid,uuid[],boolean,integer,integer,text),
 public.teacher_prepare_literacy_mock_session_v3(uuid,uuid[],boolean,integer,integer,text,text),
 public.teacher_prepare_literacy_mock_fresh_check(uuid,uuid,text,text) to authenticated;
grant execute on function public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
commit;
