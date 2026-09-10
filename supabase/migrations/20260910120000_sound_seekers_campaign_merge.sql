begin;

-- Campaign v1 additions to the existing v3 Sound Seekers row:
-- student/teacher ownership remains enforced by the existing save RPC and RLS.
-- No progress rows, grants on tables, reset epochs or other area routes change.
-- The existing dispatcher already calls lp_merge_phonics_quest. Do not replace
-- that dispatcher: its other area-specific merge routes are independent.

create or replace function public.lp_campaign_canonical(value jsonb)
returns text language plpgsql immutable as $$
declare result text;
begin
  if jsonb_typeof(value) = 'object' then
    select '{' || coalesce(string_agg(to_jsonb(key)::text || ':' || public.lp_campaign_canonical(item), ',' order by key collate "C"), '') || '}'
      into result from jsonb_each(value) entry(key, item);
    return result;
  elsif jsonb_typeof(value) = 'array' then
    select '[' || coalesce(string_agg(public.lp_campaign_canonical(item), ',' order by ordinal), '') || ']'
      into result from jsonb_array_elements(value) with ordinality entry(item, ordinal);
    return result;
  end if;
  return coalesce(value::text, 'null');
end;
$$;

create or replace function public.lp_campaign_num(value jsonb)
returns numeric language sql immutable as $$
  select case when jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric else 0 end;
$$;

create or replace function public.lp_campaign_earliest(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare aa numeric; bb numeric;
begin
  if a is null then return b; end if;
  if b is null then return a; end if;
  aa := case when jsonb_typeof(a -> 'at') = 'number' then (a ->> 'at')::numeric else 'Infinity'::numeric end;
  bb := case when jsonb_typeof(b -> 'at') = 'number' then (b ->> 'at')::numeric else 'Infinity'::numeric end;
  if aa <> bb then return case when aa < bb then a else b end; end if;
  return case when public.lp_campaign_canonical(a) collate "C" <= public.lp_campaign_canonical(b) collate "C" then a else b end;
end;
$$;

create or replace function public.lp_campaign_union_records(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare result jsonb := coalesce(a, '{}'::jsonb); entry record;
begin
  for entry in select * from jsonb_each(coalesce(b, '{}'::jsonb)) loop
    result := jsonb_set(result, array[entry.key], public.lp_campaign_earliest(result -> entry.key, entry.value), true);
  end loop;
  return result;
end;
$$;

create or replace function public.lp_campaign_strings(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(value order by value collate "C"), '[]'::jsonb)
    from (select distinct item #>> '{}' value
      from jsonb_array_elements(coalesce(a, '[]'::jsonb) || coalesce(b, '[]'::jsonb)) entry(item)
      where jsonb_typeof(item) = 'string' and item #>> '{}' <> '') unique_values;
$$;

create or replace function public.lp_campaign_event_key(event jsonb)
returns text language sql immutable as $$
  select case when jsonb_typeof(event -> 'missionId') = 'string' and event ->> 'missionId' <> ''
    and jsonb_typeof(event -> 'attemptId') = 'string' and event ->> 'attemptId' <> ''
    and jsonb_typeof(event -> 'id') = 'string' and event ->> 'id' <> ''
    then public.lp_campaign_canonical(jsonb_build_array(event -> 'missionId', event -> 'attemptId', event -> 'id')) else null end;
$$;

create or replace function public.lp_campaign_events(progress jsonb)
returns jsonb language plpgsql immutable as $$
declare result jsonb := '{}'::jsonb; event jsonb; event_key text; receipt text;
begin
  for event in select * from jsonb_array_elements(coalesce(progress -> 'evidence', '[]'::jsonb)) loop
    event_key := public.lp_campaign_event_key(event);
    if event_key is not null then
      result := jsonb_set(result, array[event_key], public.lp_campaign_earliest(result -> event_key, event), true);
    end if;
  end loop;
  for receipt in select jsonb_object_keys(coalesce(progress #> '{campaign,attemptIds}', '{}'::jsonb)) loop
    if not result ? receipt then
      raise exception 'Campaign evidence body missing; unsupported compaction' using errcode = '22023';
    end if;
  end loop;
  return result;
end;
$$;

create or replace function public.lp_campaign_counts(events jsonb, target_id text)
returns jsonb language plpgsql immutable as $$
declare result jsonb := '{"independent":0,"supported":0,"missed":0,"confusions":{}}'::jsonb;
  event jsonb; field text; confusion text;
begin
  for event in select value from jsonb_each(events) loop
    if coalesce(event -> 'targetIds', '[]'::jsonb) ? target_id then
      field := case when event -> 'independent' = 'true'::jsonb then 'independent' else 'supported' end;
      result := jsonb_set(result, array[field], to_jsonb(public.lp_campaign_num(result -> field) + 1));
      if public.lp_campaign_num(event -> 'errors') > 0 then
        result := jsonb_set(result, array['missed'], to_jsonb(public.lp_campaign_num(result -> 'missed') + 1));
      end if;
      confusion := event ->> 'confusedWith';
      if field = 'supported' and confusion is not null and confusion <> '' then
        result := jsonb_set(result, array['confusions', confusion], to_jsonb(public.lp_campaign_num(result #> array['confusions', confusion]) + 1), true);
      end if;
    end if;
  end loop;
  return result;
end;
$$;

create or replace function public.lp_campaign_merge_targets(a jsonb, b jsonb, ae jsonb, be jsonb, events jsonb)
returns jsonb language plpgsql immutable as $$
declare result jsonb := '{}'::jsonb; target_id text; atarget jsonb; btarget jsonb;
  ac jsonb; bc jsonb; total jsonb; target jsonb; field text; confusion text; confusions jsonb; seen numeric;
begin
  for target_id in
    select key from jsonb_each(coalesce(a, '{}'::jsonb))
    union select key from jsonb_each(coalesce(b, '{}'::jsonb))
    union select item #>> '{}' from jsonb_each(events) e cross join lateral jsonb_array_elements(coalesce(e.value -> 'targetIds', '[]'::jsonb)) t(item)
  loop
    atarget := coalesce(a -> target_id, '{}'::jsonb); btarget := coalesce(b -> target_id, '{}'::jsonb);
    ac := public.lp_campaign_counts(ae, target_id); bc := public.lp_campaign_counts(be, target_id); total := public.lp_campaign_counts(events, target_id);
    target := atarget || btarget || jsonb_build_object('taught', coalesce(atarget -> 'taught' = 'true'::jsonb, false) or coalesce(btarget -> 'taught' = 'true'::jsonb, false));
    foreach field in array array['independent','supported','missed'] loop
      target := jsonb_set(target, array[field], to_jsonb(greatest(0,
        public.lp_campaign_num(atarget -> field) - public.lp_campaign_num(ac -> field),
        public.lp_campaign_num(btarget -> field) - public.lp_campaign_num(bc -> field)) + public.lp_campaign_num(total -> field)), true);
    end loop;
    confusions := '{}'::jsonb;
    for confusion in select key from jsonb_each(coalesce(atarget -> 'confusions', '{}'::jsonb))
      union select key from jsonb_each(coalesce(btarget -> 'confusions', '{}'::jsonb))
      union select key from jsonb_each(total -> 'confusions')
    loop
      confusions := jsonb_set(confusions, array[confusion], to_jsonb(greatest(0,
        public.lp_campaign_num(atarget #> array['confusions',confusion]) - public.lp_campaign_num(ac #> array['confusions',confusion]),
        public.lp_campaign_num(btarget #> array['confusions',confusion]) - public.lp_campaign_num(bc #> array['confusions',confusion]))
        + public.lp_campaign_num(total #> array['confusions',confusion])), true);
    end loop;
    seen := greatest(case when jsonb_typeof(atarget -> 'lastSeenStep') = 'number' then public.lp_campaign_num(atarget -> 'lastSeenStep') else -1 end,
      case when jsonb_typeof(btarget -> 'lastSeenStep') = 'number' then public.lp_campaign_num(btarget -> 'lastSeenStep') else -1 end);
    target := target || jsonb_build_object('confusions', confusions, 'lastSeenStep', case when seen < 0 then null else seen end);
    result := jsonb_set(result, array[target_id], target, true);
  end loop;
  return result;
end;
$$;

create or replace function public.lp_campaign_challenge_identity(value jsonb)
returns text language plpgsql immutable as $$
begin
  if jsonb_typeof(value) = 'array' then
    return encode(sha256(convert_to(public.lp_campaign_canonical(value),'UTF8')),'hex');
  elsif jsonb_typeof(value) = 'object' and value ->> 'codec' = 'campaign-challenges-gzip-v1'
    and value ->> 'sha256' ~ '^[a-f0-9]{64}$' and value ->> 'data' like 'lp-progress-gzip-v1:%' then
    return value ->> 'sha256';
  end if;
  raise exception 'Unsupported campaign challenge transport' using errcode = '22023';
end;
$$;

create or replace function public.lp_campaign_checkpoint(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare result jsonb; state jsonb; field text; av numeric; bv numeric; item record; merged_items jsonb;
begin
  if a is null then return b; end if;
  if b is null then return a; end if;
  if a ->> 'attemptId' <> b ->> 'attemptId' then
    foreach field in array array['replayOrdinal','startedAt'] loop
      av := public.lp_campaign_num(a -> field); bv := public.lp_campaign_num(b -> field);
      if av <> bv then return case when av > bv then a else b end; end if;
    end loop;
    return case when a ->> 'attemptId' collate "C" > b ->> 'attemptId' collate "C" then a else b end;
  end if;
  if public.lp_campaign_challenge_identity(a -> 'challenges') is distinct from public.lp_campaign_challenge_identity(b -> 'challenges') then
    raise exception 'Conflicting immutable campaign challenge checkpoint' using errcode = '22023';
  end if;
  foreach field in array array['beatIndex','done','itemIndex','placedLength','cardsHeardLength','updatedAt'] loop
    if field = 'done' then
      av := case when a #> '{beatState,done}' = 'true'::jsonb then 1 else 0 end;
      bv := case when b #> '{beatState,done}' = 'true'::jsonb then 1 else 0 end;
    elsif field = 'itemIndex' then
      av := public.lp_campaign_num(a #> '{beatState,itemIndex}'); bv := public.lp_campaign_num(b #> '{beatState,itemIndex}');
    elsif field in ('placedLength','cardsHeardLength') then
      av := case when jsonb_typeof(a #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) = 'array'
        then jsonb_array_length(a #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) else 0 end;
      bv := case when jsonb_typeof(b #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) = 'array'
        then jsonb_array_length(b #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) else 0 end;
    else av := public.lp_campaign_num(a -> field); bv := public.lp_campaign_num(b -> field); end if;
    if av <> bv then result := case when av > bv then a else b end; exit; end if;
  end loop;
  result := coalesce(result, case when public.lp_campaign_canonical(a) collate "C" <= public.lp_campaign_canonical(b) collate "C" then a else b end);
  if jsonb_typeof(b -> 'challenges') = 'object' then result := jsonb_set(result,'{challenges}',b -> 'challenges');
  elsif jsonb_typeof(a -> 'challenges') = 'object' then result := jsonb_set(result,'{challenges}',a -> 'challenges'); end if;
  result := result || jsonb_build_object('completed', coalesce(a -> 'completed' = 'true'::jsonb, false) or coalesce(b -> 'completed' = 'true'::jsonb, false));
  if a ? 'playTime' or b ? 'playTime' then
    result := result || jsonb_build_object('playTime', jsonb_build_object('v',1,
      'estimatedActiveMs',greatest(public.lp_campaign_num(a #> '{playTime,estimatedActiveMs}'),public.lp_campaign_num(b #> '{playTime,estimatedActiveMs}')),
      'estimatedHelpMs',greatest(least(public.lp_campaign_num(a #> '{playTime,estimatedActiveMs}'),public.lp_campaign_num(a #> '{playTime,estimatedHelpMs}')),
        least(public.lp_campaign_num(b #> '{playTime,estimatedActiveMs}'),public.lp_campaign_num(b #> '{playTime,estimatedHelpMs}')))));
  end if;
  if a -> 'beatIndex' = b -> 'beatIndex' then
    if jsonb_typeof(a #> '{beatState,placed}') = 'array' and jsonb_typeof(b #> '{beatState,placed}') = 'array' then
      if exists(select 1 from jsonb_array_elements(a #> '{beatState,placed}') with ordinality l(value,n)
        join jsonb_array_elements(b #> '{beatState,placed}') with ordinality r(value,n) on l.n = r.n where l.value <> r.value) then
        raise exception 'Conflicting immutable campaign placement sequence' using errcode = '22023';
      end if;
    end if;
    state := coalesce(result -> 'beatState', '{}'::jsonb) || jsonb_build_object(
      'supportUsed', public.lp_campaign_strings(a #> '{beatState,supportUsed}', b #> '{beatState,supportUsed}'),
      'errors', greatest(public.lp_campaign_num(a #> '{beatState,errors}'), public.lp_campaign_num(b #> '{beatState,errors}')),
      'modelShown', coalesce(a #> '{beatState,modelShown}' = 'true'::jsonb, false) or coalesce(b #> '{beatState,modelShown}' = 'true'::jsonb, false),
      'done', coalesce(a #> '{beatState,done}' = 'true'::jsonb, false) or coalesce(b #> '{beatState,done}' = 'true'::jsonb, false));
    foreach field in array array['heardSources','cardsHeard'] loop
      if (a -> 'beatState') ? field or (b -> 'beatState') ? field then
        state := jsonb_set(state, array[field], public.lp_campaign_strings(a #> array['beatState',field], b #> array['beatState',field]), true);
      end if;
    end loop;
    if (a -> 'beatState') ? 'heard' or (b -> 'beatState') ? 'heard' then state := state || jsonb_build_object('heard',
      coalesce(a #> '{beatState,heard}' = 'true'::jsonb,false) or coalesce(b #> '{beatState,heard}' = 'true'::jsonb,false)); end if;
    if (a -> 'beatState') ? 'slotErrors' or (b -> 'beatState') ? 'slotErrors' then state := state || jsonb_build_object('slotErrors',
      greatest(public.lp_campaign_num(a #> '{beatState,slotErrors}'),public.lp_campaign_num(b #> '{beatState,slotErrors}'))); end if;
    if (a -> 'beatState') ? 'sceneRepairs' or (b -> 'beatState') ? 'sceneRepairs' then state := state || jsonb_build_object('sceneRepairs',
      public.lp_campaign_union_records(a #> '{beatState,sceneRepairs}',b #> '{beatState,sceneRepairs}')); end if;
    if (a -> 'beatState') ? 'itemErrors' or (b -> 'beatState') ? 'itemErrors' then
      merged_items := coalesce(a #> '{beatState,itemErrors}','{}'::jsonb);
      for item in select key,value from jsonb_each(coalesce(b #> '{beatState,itemErrors}','{}'::jsonb)) loop
        merged_items := jsonb_set(merged_items,array[item.key],to_jsonb(greatest(public.lp_campaign_num(merged_items -> item.key),public.lp_campaign_num(item.value))),true);
      end loop;
      state := state || jsonb_build_object('itemErrors',merged_items);
    end if;
    if jsonb_typeof(a #> '{beatState,placed}') = 'object' and jsonb_typeof(b #> '{beatState,placed}') = 'object' then
      if exists(select 1 from jsonb_each(a #> '{beatState,placed}') l join jsonb_each(b #> '{beatState,placed}') r using(key) where l.value <> r.value) then
        raise exception 'Conflicting immutable campaign sorted placement' using errcode = '22023';
      end if;
      state := state || jsonb_build_object('placed',(a #> '{beatState,placed}') || (b #> '{beatState,placed}'));
    end if;
    result := result || jsonb_build_object('beatState', state);
  end if;
  return result;
end;
$$;

create or replace function public.lp_merge_sound_seekers_campaign(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare ae jsonb; be jsonb; events jsonb; event_key text; event jsonb; winner jsonb; result jsonb;
  ac jsonb; bc jsonb; campaign jsonb; completed jsonb; checkpoints jsonb := '{}'::jsonb; checkpoint_id text;
  legacy jsonb; evidence jsonb; anchors jsonb; stop_id text; attempt_ids jsonb := '{}'::jsonb; visits jsonb; step numeric;
begin
  if a is null or a in ('{}'::jsonb, 'null'::jsonb) then a := '{"v":3,"hero":"speedy","heroChosen":false,"journeyStep":0,"currentStopId":"s1","completed":{},"checkpoint":null,"targets":{},"evidence":[],"updatedAt":0}'::jsonb; end if;
  if b is null or b in ('{}'::jsonb, 'null'::jsonb) then b := '{"v":3,"hero":"speedy","heroChosen":false,"journeyStep":0,"currentStopId":"s1","completed":{},"checkpoint":null,"targets":{},"evidence":[],"updatedAt":0}'::jsonb; end if;
  if a ->> 'v' is distinct from '3' or b ->> 'v' is distinct from '3'
    or coalesce(a #>> '{campaign,v}', '1') <> '1' or coalesce(b #>> '{campaign,v}', '1') <> '1' then
    raise exception 'Unsupported Sound Seekers campaign save version' using errcode = '22023';
  end if;
  if b ? '_campaignDelta' and (b #>> '{_campaignDelta,v}' <> '1'
    or jsonb_typeof(b #> '{_campaignDelta,fullCompletionCount}') <> 'number'
    or not a ? 'campaign') then raise exception 'Campaign delta requires a saved full campaign' using errcode='22023'; end if;
  ae := public.lp_campaign_events(a); be := public.lp_campaign_events(b);
  events := public.lp_campaign_union_records(ae, be);
  winner := case when public.lp_campaign_num(a -> 'updatedAt') > public.lp_campaign_num(b -> 'updatedAt') then a
    when public.lp_campaign_num(a -> 'updatedAt') < public.lp_campaign_num(b -> 'updatedAt') then b
    when public.lp_campaign_canonical(a) collate "C" <= public.lp_campaign_canonical(b) collate "C" then a else b end;
  ac := coalesce(a -> 'campaign', '{}'::jsonb); bc := coalesce(b -> 'campaign', '{}'::jsonb);
  completed := public.lp_campaign_union_records(ac -> 'completedMissions', bc -> 'completedMissions');
  for checkpoint_id in select key from jsonb_each(coalesce(ac -> 'checkpoints', '{}'::jsonb))
    union select key from jsonb_each(coalesce(bc -> 'checkpoints', '{}'::jsonb)) loop
    checkpoints := jsonb_set(checkpoints, array[checkpoint_id], public.lp_campaign_checkpoint(ac #> array['checkpoints',checkpoint_id], bc #> array['checkpoints',checkpoint_id]), true);
  end loop;
  evidence := '[]'::jsonb;
  for event_key, event in select key, value from jsonb_each(events) order by key collate "C" loop
    evidence := evidence || jsonb_build_array(event);
    attempt_ids := jsonb_set(attempt_ids, array[event_key], 'true'::jsonb, true);
  end loop;
  -- Retain identical legacy records at their greatest observed multiplicity.
  -- These older records have no immutable ID: summing copies would double them.
  with left_events as (
    select item, count(*) n from jsonb_array_elements(coalesce(a -> 'evidence', '[]'::jsonb)) e(item)
      where public.lp_campaign_event_key(item) is null group by item
  ), right_events as (
    select item, count(*) n from jsonb_array_elements(coalesce(b -> 'evidence', '[]'::jsonb)) e(item)
      where public.lp_campaign_event_key(item) is null group by item
  ), copies as (
    select coalesce(l.item,r.item) item, greatest(coalesce(l.n,0),coalesce(r.n,0)) n
      from left_events l full join right_events r on l.item = r.item
  ) select coalesce(jsonb_agg(item order by public.lp_campaign_canonical(item) collate "C"), '[]'::jsonb)
    into legacy from copies cross join lateral generate_series(1, n);
  visits := public.lp_campaign_strings(ac -> 'visitedStageIds', bc -> 'visitedStageIds');
  anchors := public.lp_campaign_union_records(ac -> 'storyAnchors', bc -> 'storyAnchors');
  for stop_id in select key from jsonb_each(coalesce(a -> 'completed', '{}'::jsonb) || coalesce(b -> 'completed', '{}'::jsonb))
    where key ~ '^s([1-9]|[1-3][0-9]|40)$' and value not in ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '""'::jsonb)
  loop
    if not anchors ? stop_id then anchors := jsonb_set(anchors, array[stop_id], jsonb_build_object(
      'stopId', stop_id, 'stageId', null, 'sourceVersion', 3, 'narrativeOnly', true), true); end if;
  end loop;
  campaign := coalesce(winner -> 'campaign', '{}'::jsonb) || jsonb_build_object(
    'v', 1, 'contentVersion', coalesce(winner #> '{campaign,contentVersion}', '1'::jsonb),
    'activeMissionId', coalesce(winner #> '{campaign,activeMissionId}', 'null'::jsonb),
    'completedMissions', completed, 'repairs', public.lp_campaign_union_records(ac -> 'repairs', bc -> 'repairs'),
    'storyAnchors', anchors,
    'visitedStageIds', visits, 'checkpoints', checkpoints, 'attemptIds', attempt_ids,
    'startedAttemptIds', coalesce(ac -> 'startedAttemptIds', '{}'::jsonb) || coalesce(bc -> 'startedAttemptIds', '{}'::jsonb));
  -- Migration snapshots are deliberately device-only and must never expand
  -- cloud retention to old telemetry or teacher-owned assignments.
  campaign := campaign - 'legacySave' - 'legacySaves';
  step := greatest(0, public.lp_campaign_num(a -> 'journeyStep') - (select count(*) from jsonb_each(coalesce(ac -> 'completedMissions', '{}'::jsonb))),
    public.lp_campaign_num(b -> 'journeyStep') - coalesce(public.lp_campaign_num(b #> '{_campaignDelta,fullCompletionCount}') * case when b ? '_campaignDelta' then 1 else null end, (select count(*) from jsonb_each(coalesce(bc -> 'completedMissions', '{}'::jsonb)))))
    + (select count(*) from jsonb_each(completed));
  result := winner || jsonb_build_object('v',3,'campaign',campaign,'evidence',legacy || evidence,
    'completed',public.lp_campaign_union_records(a -> 'completed',b -> 'completed'),
    'journeyStep',step,'updatedAt',greatest(public.lp_campaign_num(a -> 'updatedAt'), public.lp_campaign_num(b -> 'updatedAt')),
    'targets',public.lp_campaign_merge_targets(a -> 'targets',b -> 'targets',ae,be,events));
  return result - 'assignment' - 'telemetry' - '_campaignDelta';
end;
$$;

create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language sql immutable as $$
  select case when existing ->> 'v' = '3' or incoming ->> 'v' = '3'
    or existing ? 'campaign' or incoming ? 'campaign'
    then public.lp_merge_sound_seekers_campaign(existing, incoming)
    else public.lp_quest_merge_learning_v2(existing, incoming) end;
$$;

-- Helpers operate only on supplied JSON. They are security invoker functions,
-- not a second save endpoint, and have no access to learner tables or tokens.
revoke all on function public.lp_campaign_canonical(jsonb) from public;
revoke all on function public.lp_campaign_num(jsonb) from public;
revoke all on function public.lp_campaign_earliest(jsonb,jsonb) from public;
revoke all on function public.lp_campaign_union_records(jsonb,jsonb) from public;
revoke all on function public.lp_campaign_strings(jsonb,jsonb) from public;
revoke all on function public.lp_campaign_event_key(jsonb) from public;
revoke all on function public.lp_campaign_events(jsonb) from public;
revoke all on function public.lp_campaign_counts(jsonb,text) from public;
revoke all on function public.lp_campaign_merge_targets(jsonb,jsonb,jsonb,jsonb,jsonb) from public;
revoke all on function public.lp_campaign_challenge_identity(jsonb) from public;
revoke all on function public.lp_campaign_checkpoint(jsonb,jsonb) from public;
revoke all on function public.lp_merge_sound_seekers_campaign(jsonb,jsonb) from public;
grant execute on function public.lp_campaign_canonical(jsonb), public.lp_campaign_num(jsonb),
  public.lp_campaign_earliest(jsonb,jsonb), public.lp_campaign_union_records(jsonb,jsonb),
  public.lp_campaign_strings(jsonb,jsonb), public.lp_campaign_event_key(jsonb), public.lp_campaign_events(jsonb),
  public.lp_campaign_counts(jsonb,text), public.lp_campaign_merge_targets(jsonb,jsonb,jsonb,jsonb,jsonb),
  public.lp_campaign_challenge_identity(jsonb), public.lp_campaign_checkpoint(jsonb,jsonb), public.lp_merge_sound_seekers_campaign(jsonb,jsonb)
  to anon, authenticated;

-- A confirmed earlier save is not proof that its row still exists after a
-- reset. Sparse upserts may update a base, but must never insert a partial save.
-- The existing authenticated RPC/RLS still determines the learner identity.
create or replace function public.lp_campaign_require_full_insert()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.area='phonics_quest' and new.key='sound_seekers_v3' and new.payload ? '_campaignDelta' then
    perform 1 from public.student_progress where student_id=new.student_id and area=new.area and key=new.key for update;
    if not found then raise exception 'Campaign delta requires a saved full campaign' using errcode='22023'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.lp_campaign_require_full_insert() from public;
drop trigger if exists campaign_require_full_insert on public.student_progress;
create trigger campaign_require_full_insert before insert on public.student_progress
for each row execute function public.lp_campaign_require_full_insert();

notify pgrst, 'reload schema';
commit;
