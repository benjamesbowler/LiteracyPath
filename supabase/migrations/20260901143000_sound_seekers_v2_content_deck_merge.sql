-- Sound Seekers v2 immutable content-deck and answer-safe receipt merge.
-- This forward migration extends, and does not edit, the learning-v2 migration.

create or replace function public.lp_quest_normalize_v2_activity_type(domain text, value text)
returns text language sql immutable as $$
  select case
    when domain = 'heart_word_mapping'
      and btrim(coalesce(value, '')) in (
        'recognition', 'heart_part_mapping', 'encoding', 'sentence_use'
      )
      then btrim(value)
    else null
  end;
$$;

-- Normalize the heart-only subtype before grouping immutable evidence by ID.
create or replace function public.lp_quest_union_v2_evidence(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  with raw(event) as (
    select value
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb
      ))
    union all
    select value
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb
      ))
  ), activity_normalized as (
    select case
      when public.lp_quest_normalize_v2_activity_type(
        event ->> 'domain', event ->> 'activityType'
      ) is not null
      then (event - 'activityType') || jsonb_build_object(
        'activityType', public.lp_quest_normalize_v2_activity_type(
          event ->> 'domain', event ->> 'activityType'
        )
      )
      else event - 'activityType'
    end as event
    from raw
    where jsonb_typeof(event) = 'object'
  ), valid as (
    select event || jsonb_build_object(
             'id', btrim(event ->> 'id'),
             'at', case
               when jsonb_typeof(event -> 'at') = 'number' then event -> 'at'
               when jsonb_typeof(event -> 'at') = 'string'
                 and btrim(event ->> 'at') <> '' then to_jsonb(btrim(event ->> 'at'))
               else '0'::jsonb end
           ) as event,
           btrim(event ->> 'id') as id,
           case when jsonb_typeof(event -> 'at') = 'number'
             then (event ->> 'at')::numeric else 0 end as at_number,
           case when jsonb_typeof(event -> 'at') = 'string'
             and btrim(event ->> 'at') <> '' then btrim(event ->> 'at') end as at_text
      from activity_normalized
     where coalesce(btrim(event ->> 'id'), '') <> ''
  ), grouped as (
    select id,
           count(distinct event) as payload_count,
           coalesce(bool_or(
             event ->> 'evidenceKind' = 'conflict'
             and event -> 'conflicted' = 'true'::jsonb
           ), false) as already_conflicted,
           (jsonb_agg(event) -> 0) as one_event,
           (jsonb_agg(
             event -> 'at'
             order by case when at_text is null then 0 else 1 end desc,
                      at_number desc,
                      at_text desc nulls last
           ) -> 0) as latest_at
      from valid
     group by id
  ), resolved as (
    select case when already_conflicted or payload_count > 1
             then jsonb_build_object(
               'id', id,
               'at', latest_at,
               'evidenceKind', 'conflict',
               'conflicted', true
             )
             else one_event
           end as event,
           id
      from grouped
  ), sortable as (
    select event,
           id,
           case when jsonb_typeof(event -> 'at') = 'number'
             then (event ->> 'at')::numeric else 0 end as at_number,
           case when jsonb_typeof(event -> 'at') = 'string'
             and btrim(event ->> 'at') <> '' then btrim(event ->> 'at') end as at_text
      from resolved
  ), retained as (
    select event, id, at_number, at_text
      from sortable
     order by case when at_text is null then 0 else 1 end desc,
              at_number desc,
              at_text desc nulls last,
              id desc
     limit 1200
  )
  select coalesce(
    jsonb_agg(event order by case when at_text is null then 0 else 1 end,
      at_number asc, at_text asc nulls last, id asc),
    '[]'::jsonb
  ) from retained;
$$;

create or replace function public.lp_quest_normalize_v2_deck_visit(category text, entry_id text, value jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  activity text;
  journey_step numeric;
  target_id jsonb;
  word_id jsonb;
begin
  entry_id := btrim(coalesce(entry_id, ''));
  if entry_id = '' or category not in (
    'heartWords', 'stories', 'alternatives', 'morphology', 'transfer'
  ) then return null; end if;
  if jsonb_typeof(value) <> 'object' then
    return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
  end if;
  if value ->> 'kind' = 'visit_conflict' then
    return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
  end if;
  if jsonb_typeof(value -> 'journeyStep') <> 'number'
    or (value ->> 'journeyStep') !~ '^[1-9][0-9]*$' then
    return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
  end if;
  journey_step := (value ->> 'journeyStep')::numeric;
  target_id := case
    when value -> 'targetId' = 'null'::jsonb then 'null'::jsonb
    when jsonb_typeof(value -> 'targetId') = 'string'
      and btrim(value ->> 'targetId') <> '' then to_jsonb(btrim(value ->> 'targetId'))
    else null end;
  word_id := case
    when value -> 'wordId' = 'null'::jsonb then 'null'::jsonb
    when jsonb_typeof(value -> 'wordId') = 'string'
      and btrim(value ->> 'wordId') <> '' then to_jsonb(btrim(value ->> 'wordId'))
    else null end;
  result := jsonb_build_object(
    'kind', 'visit',
    'visitId', btrim(value ->> 'visitId'),
    'contentInstanceId', btrim(value ->> 'contentInstanceId'),
    'visitOwnerId', btrim(value ->> 'visitOwnerId'),
    'ownerActionUseId', btrim(value ->> 'ownerActionUseId'),
    'category', btrim(value ->> 'category'),
    'slotId', btrim(value ->> 'slotId'),
    'recordId', btrim(value ->> 'recordId'),
    'contentId', btrim(value ->> 'contentId'),
    'targetId', target_id,
    'wordId', word_id,
    'stopId', btrim(value ->> 'stopId'),
    'journeyStep', to_jsonb(journey_step)
  );
  if value ->> 'kind' <> 'visit'
    or btrim(coalesce(value ->> 'visitId', '')) <> entry_id
    or btrim(coalesce(value ->> 'category', '')) <> category
    or exists (
      select 1 from jsonb_each_text(result - array['kind','category','targetId','wordId','journeyStep']) item
      where btrim(coalesce(item.value, '')) = ''
    ) then
    return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
  end if;

  if category = 'heartWords' then
    activity := public.lp_quest_normalize_v2_activity_type(
      'heart_word_mapping', value ->> 'ownerActivityType'
    );
    if activity is null or target_id is null or target_id = 'null'::jsonb
      or word_id is null or word_id = 'null'::jsonb then
      return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
    end if;
    result := result || jsonb_build_object('ownerActivityType', activity);
  elsif category = 'stories' then
    if target_id is null or target_id = 'null'::jsonb or word_id is null
      or word_id <> 'null'::jsonb then
      return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
    end if;
  elsif category = 'alternatives' then
    if target_id is null or target_id <> 'null'::jsonb
      or word_id is null or word_id <> 'null'::jsonb then
      return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
    end if;
  elsif category = 'morphology' then
    if target_id is null or target_id <> 'null'::jsonb
      or word_id is null or word_id = 'null'::jsonb then
      return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
    end if;
  elsif target_id is null or target_id = 'null'::jsonb or word_id is null then
    return jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
  end if;
  return result;
end;
$$;

create or replace function public.lp_quest_normalize_v2_deck_use(category text, entry_id text, value jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  activity text;
  receipt_ids jsonb;
  narrative_token jsonb;
  journey_step numeric;
begin
  entry_id := btrim(coalesce(entry_id, ''));
  if entry_id = '' or category not in (
    'heartWords', 'stories', 'alternatives', 'morphology', 'transfer'
  ) then return null; end if;
  if jsonb_typeof(value) <> 'object' or value ->> 'kind' = 'use_conflict' then
    return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
  end if;
  if jsonb_typeof(value -> 'journeyStep') <> 'number'
    or (value ->> 'journeyStep') !~ '^[1-9][0-9]*$' then
    return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
  end if;
  journey_step := (value ->> 'journeyStep')::numeric;
  result := jsonb_build_object(
    'kind', 'use',
    'useId', btrim(value ->> 'useId'),
    'visitId', btrim(value ->> 'visitId'),
    'contentInstanceId', btrim(value ->> 'contentInstanceId'),
    'visitOwnerId', btrim(value ->> 'visitOwnerId'),
    'actionUseId', btrim(value ->> 'actionUseId'),
    'category', btrim(value ->> 'category'),
    'slotId', btrim(value ->> 'slotId'),
    'recordId', btrim(value ->> 'recordId'),
    'journeyStep', to_jsonb(journey_step)
  );
  if value ->> 'kind' <> 'use'
    or btrim(coalesce(value ->> 'useId', '')) <> entry_id
    or btrim(coalesce(value ->> 'category', '')) <> category
    or exists (
      select 1 from jsonb_each_text(result - array['kind','category','journeyStep']) item
      where btrim(coalesce(item.value, '')) = ''
    ) then
    return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
  end if;

  if category = 'heartWords' then
    activity := public.lp_quest_normalize_v2_activity_type(
      'heart_word_mapping', value ->> 'activityType'
    );
    if activity is null then
      return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
    end if;
    return result || jsonb_build_object('activityType', activity);
  end if;

  if jsonb_typeof(value -> 'attemptReceiptIds') <> 'array' then
    return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
  end if;
  select coalesce(jsonb_agg(to_jsonb(id) order by decision_ordinal, attempt_ordinal, id collate "C"), '[]'::jsonb)
    into receipt_ids
    from (
      select id,
             case when id like 'content-placement-attempt:%'
               then coalesce((regexp_match(id, ':(\\d+):(\\d+)$'))[1]::numeric, 0)
               else 0 end as decision_ordinal,
             coalesce((regexp_match(id, ':(\\d+)$'))[1]::numeric, 0) as attempt_ordinal
        from (
          select distinct btrim(item #>> '{}') as id
            from jsonb_array_elements(value -> 'attemptReceiptIds') item
           where jsonb_typeof(item) = 'string' and btrim(item #>> '{}') <> ''
        ) ids
    ) ordered;
  if jsonb_array_length(receipt_ids) = 0
    or jsonb_array_length(receipt_ids) <> jsonb_array_length(value -> 'attemptReceiptIds') then
    return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
  end if;
  result := result || jsonb_build_object('attemptReceiptIds', receipt_ids);

  if category in ('stories', 'transfer') then
    narrative_token := case
      when value ? 'narrativeChoiceToken' and value -> 'narrativeChoiceToken' = 'null'::jsonb
        then 'null'::jsonb
      when jsonb_typeof(value -> 'narrativeChoiceToken') = 'string'
        and btrim(value ->> 'narrativeChoiceToken') <> ''
        then to_jsonb(btrim(value ->> 'narrativeChoiceToken'))
      else null end;
    if narrative_token is null
      or btrim(coalesce(value ->> 'transactionId', '')) = ''
      or btrim(coalesce(value ->> 'pairedUseId', '')) = ''
      or btrim(coalesce(value ->> 'evidenceEventId', '')) = '' then
      return jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
    end if;
    result := result || jsonb_build_object(
      'transactionId', btrim(value ->> 'transactionId'),
      'pairedUseId', btrim(value ->> 'pairedUseId'),
      'evidenceEventId', btrim(value ->> 'evidenceEventId'),
      'narrativeChoiceToken', narrative_token
    );
  end if;
  return result;
end;
$$;

create or replace function public.lp_quest_union_v2_deck_visits(
  category text, left_visits jsonb, right_visits jsonb
)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb := '{}'::jsonb;
  entry_id text;
  left_value jsonb;
  right_value jsonb;
  resolved jsonb;
begin
  for entry_id in
    select key from (
      select jsonb_object_keys(coalesce(
        case when jsonb_typeof(left_visits) = 'object' then left_visits end, '{}'::jsonb
      )) as key
      union
      select jsonb_object_keys(coalesce(
        case when jsonb_typeof(right_visits) = 'object' then right_visits end, '{}'::jsonb
      )) as key
    ) keys order by key collate "C"
  loop
    left_value := case when left_visits ? entry_id
      then public.lp_quest_normalize_v2_deck_visit(category, entry_id, left_visits -> entry_id) end;
    right_value := case when right_visits ? entry_id
      then public.lp_quest_normalize_v2_deck_visit(category, entry_id, right_visits -> entry_id) end;
    if left_value is null then resolved := right_value;
    elsif right_value is null then resolved := left_value;
    elsif left_value ->> 'kind' = 'visit_conflict'
      or right_value ->> 'kind' = 'visit_conflict'
      or left_value <> right_value then
      resolved := jsonb_build_object('kind', 'visit_conflict', 'visitId', entry_id);
    else resolved := left_value;
    end if;
    if resolved is not null then result := result || jsonb_build_object(entry_id, resolved); end if;
  end loop;
  return result;
end;
$$;

create or replace function public.lp_quest_union_v2_deck_uses(
  category text, left_uses jsonb, right_uses jsonb
)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb := '{}'::jsonb;
  entry_id text;
  left_value jsonb;
  right_value jsonb;
  resolved jsonb;
begin
  for entry_id in
    select key from (
      select jsonb_object_keys(coalesce(
        case when jsonb_typeof(left_uses) = 'object' then left_uses end, '{}'::jsonb
      )) as key
      union
      select jsonb_object_keys(coalesce(
        case when jsonb_typeof(right_uses) = 'object' then right_uses end, '{}'::jsonb
      )) as key
    ) keys order by key collate "C"
  loop
    left_value := case when left_uses ? entry_id
      then public.lp_quest_normalize_v2_deck_use(category, entry_id, left_uses -> entry_id) end;
    right_value := case when right_uses ? entry_id
      then public.lp_quest_normalize_v2_deck_use(category, entry_id, right_uses -> entry_id) end;
    if left_value is null then resolved := right_value;
    elsif right_value is null then resolved := left_value;
    elsif left_value ->> 'kind' = 'use_conflict'
      or right_value ->> 'kind' = 'use_conflict'
      or left_value <> right_value then
      resolved := jsonb_build_object('kind', 'use_conflict', 'useId', entry_id);
    else resolved := left_value;
    end if;
    if resolved is not null then result := result || jsonb_build_object(entry_id, resolved); end if;
  end loop;
  return result;
end;
$$;

create or replace function public.lp_quest_merge_v2_deck(
  category text, left_deck jsonb, right_deck jsonb
)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'visits', public.lp_quest_union_v2_deck_visits(
      category, left_deck -> 'visits', right_deck -> 'visits'
    ),
    'uses', public.lp_quest_union_v2_deck_uses(
      category, left_deck -> 'uses', right_deck -> 'uses'
    )
  );
$$;

create or replace function public.lp_quest_merge_v2_content_decks(left jsonb, right jsonb)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'heartWords', public.lp_quest_merge_v2_deck('heartWords', $1 -> 'heartWords', $2 -> 'heartWords'),
    'stories', public.lp_quest_merge_v2_deck('stories', $1 -> 'stories', $2 -> 'stories'),
    'alternatives', public.lp_quest_merge_v2_deck('alternatives', $1 -> 'alternatives', $2 -> 'alternatives'),
    'morphology', public.lp_quest_merge_v2_deck('morphology', $1 -> 'morphology', $2 -> 'morphology'),
    'transfer', public.lp_quest_merge_v2_deck('transfer', $1 -> 'transfer', $2 -> 'transfer')
  );
$$;

create or replace function public.lp_quest_normalize_v2_attempt_receipt(entry_id text, value jsonb)
returns jsonb language plpgsql immutable as $$
declare
  operation_value text;
  subject_id text;
  decision_ordinal numeric;
  attempt_ordinal numeric;
  input_sha text;
  correction_ids jsonb;
  event_ids jsonb;
  use_ids jsonb;
  result jsonb;
begin
  entry_id := btrim(coalesce(entry_id, ''));
  if entry_id = '' then return null; end if;
  if jsonb_typeof(value) <> 'object'
    or value ->> 'kind' = 'attempt_receipt_conflict' then
    return jsonb_build_object('kind', 'attempt_receipt_conflict', 'attemptId', entry_id);
  end if;
  operation_value := value ->> 'operation';
  subject_id := btrim(coalesce(value ->> 'subjectId', ''));
  input_sha := value ->> 'inputSha256';
  if operation_value not in ('content_placement', 'story_transfer')
    or subject_id = ''
    or jsonb_typeof(value -> 'decisionOrdinal') <> 'number'
    or (value ->> 'decisionOrdinal') !~ '^[0-9]+$'
    or jsonb_typeof(value -> 'attemptOrdinal') <> 'number'
    or (value ->> 'attemptOrdinal') !~ '^[0-9]+$'
    or coalesce(input_sha, '') !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(value -> 'completed') <> 'boolean' then
    return jsonb_build_object('kind', 'attempt_receipt_conflict', 'attemptId', entry_id);
  end if;
  decision_ordinal := (value ->> 'decisionOrdinal')::numeric;
  attempt_ordinal := (value ->> 'attemptOrdinal')::numeric;
  if operation_value = 'story_transfer' then
    if decision_ordinal <> 0
      or entry_id <> format('story-transfer-attempt:%s:%s', subject_id, attempt_ordinal) then
      return jsonb_build_object('kind', 'attempt_receipt_conflict', 'attemptId', entry_id);
    end if;
  elsif entry_id not like 'content-placement-attempt:%'
    or right(entry_id, length(format(':%s:%s:%s', subject_id, decision_ordinal, attempt_ordinal)))
      <> format(':%s:%s:%s', subject_id, decision_ordinal, attempt_ordinal) then
    return jsonb_build_object('kind', 'attempt_receipt_conflict', 'attemptId', entry_id);
  end if;
  if btrim(coalesce(value ->> 'attemptId', '')) <> entry_id then
    return jsonb_build_object('kind', 'attempt_receipt_conflict', 'attemptId', entry_id);
  end if;

  select coalesce(jsonb_agg(to_jsonb(id) order by id collate "C"), '[]'::jsonb)
    into correction_ids from (
      select distinct btrim(item #>> '{}') as id
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(value -> 'correctionRecordIds') = 'array'
          then value -> 'correctionRecordIds' end, '[]'::jsonb
      )) item where jsonb_typeof(item) = 'string' and btrim(item #>> '{}') <> ''
    ) ids;
  select coalesce(jsonb_agg(to_jsonb(id) order by id collate "C"), '[]'::jsonb)
    into event_ids from (
      select distinct btrim(item #>> '{}') as id
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(value -> 'eventIds') = 'array' then value -> 'eventIds' end,
        '[]'::jsonb
      )) item where jsonb_typeof(item) = 'string' and btrim(item #>> '{}') <> ''
    ) ids;
  select coalesce(jsonb_agg(to_jsonb(id) order by id collate "C"), '[]'::jsonb)
    into use_ids from (
      select distinct btrim(item #>> '{}') as id
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(value -> 'useIds') = 'array' then value -> 'useIds' end,
        '[]'::jsonb
      )) item where jsonb_typeof(item) = 'string' and btrim(item #>> '{}') <> ''
    ) ids;
  if jsonb_typeof(value -> 'correctionRecordIds') <> 'array'
    or jsonb_typeof(value -> 'eventIds') <> 'array'
    or jsonb_typeof(value -> 'useIds') <> 'array'
    or jsonb_array_length(correction_ids) <> jsonb_array_length(value -> 'correctionRecordIds')
    or jsonb_array_length(event_ids) <> jsonb_array_length(value -> 'eventIds')
    or jsonb_array_length(use_ids) <> jsonb_array_length(value -> 'useIds') then
    return jsonb_build_object('kind', 'attempt_receipt_conflict', 'attemptId', entry_id);
  end if;
  result := jsonb_build_object(
    'kind', 'attempt_receipt',
    'attemptId', entry_id,
    'operation', operation_value,
    'subjectId', subject_id,
    'decisionOrdinal', to_jsonb(decision_ordinal),
    'attemptOrdinal', to_jsonb(attempt_ordinal),
    'inputSha256', input_sha,
    'completed', value -> 'completed',
    'correctionRecordIds', correction_ids,
    'eventIds', event_ids,
    'useIds', use_ids
  );
  return result;
end;
$$;

create or replace function public.lp_quest_union_v2_attempt_receipts(left_receipts jsonb, right_receipts jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb := '{}'::jsonb;
  entry_id text;
  left_value jsonb;
  right_value jsonb;
  resolved jsonb;
begin
  for entry_id in
    select key from (
      select jsonb_object_keys(coalesce(
        case when jsonb_typeof(left_receipts) = 'object' then left_receipts end, '{}'::jsonb
      )) as key
      union
      select jsonb_object_keys(coalesce(
        case when jsonb_typeof(right_receipts) = 'object' then right_receipts end, '{}'::jsonb
      )) as key
    ) keys order by key collate "C"
  loop
    left_value := case when left_receipts ? entry_id
      then public.lp_quest_normalize_v2_attempt_receipt(entry_id, left_receipts -> entry_id) end;
    right_value := case when right_receipts ? entry_id
      then public.lp_quest_normalize_v2_attempt_receipt(entry_id, right_receipts -> entry_id) end;
    if left_value is null then resolved := right_value;
    elsif right_value is null then resolved := left_value;
    elsif left_value ->> 'kind' = 'attempt_receipt_conflict'
      or right_value ->> 'kind' = 'attempt_receipt_conflict'
      or left_value <> right_value then
      resolved := jsonb_build_object(
        'kind', 'attempt_receipt_conflict', 'attemptId', entry_id
      );
    else resolved := left_value;
    end if;
    if resolved is not null then result := result || jsonb_build_object(entry_id, resolved); end if;
  end loop;
  return result;
end;
$$;

-- This projection is deliberately not persisted. It validates only immutable
-- receipt/evidence/use structure; authored answer keys remain client authority.
create or replace function public.lp_quest_valid_v2_attempt_receipts(evidence jsonb, content_decks jsonb, attempt_receipts jsonb)
returns jsonb language plpgsql immutable as $$
declare
  receipts jsonb := public.lp_quest_union_v2_attempt_receipts(
    attempt_receipts, '{}'::jsonb
  );
  decks jsonb := public.lp_quest_merge_v2_content_decks(
    content_decks, '{}'::jsonb
  );
  events jsonb := public.lp_quest_union_v2_evidence(evidence, '[]'::jsonb);
  result jsonb := '{}'::jsonb;
  progress jsonb := '{}'::jsonb;
  receipt jsonb;
  event_value jsonb;
  event_id text;
  use_id text;
  use_value jsonb;
  use_category text;
  reference_count int;
  event_count int;
  use_count int;
  correction_count int;
  expected_support int;
  correct_value boolean;
  completed_value boolean;
  candidate_valid boolean;
  group_key text;
  group_progress jsonb;
  expected_decision int;
  expected_attempt int;
  group_closed boolean;
begin
  for receipt in
    select value
      from jsonb_each(receipts)
     where value ->> 'kind' = 'attempt_receipt'
     order by value ->> 'operation' collate "C",
              value ->> 'subjectId' collate "C",
              (value ->> 'decisionOrdinal')::numeric,
              (value ->> 'attemptOrdinal')::numeric,
              value ->> 'attemptId' collate "C"
  loop
    candidate_valid := true;
    event_count := jsonb_array_length(receipt -> 'eventIds');
    use_count := jsonb_array_length(receipt -> 'useIds');
    correction_count := jsonb_array_length(receipt -> 'correctionRecordIds');
    completed_value := (receipt ->> 'completed')::boolean;
    event_value := null;

    if event_count > 1 then candidate_valid := false; end if;
    if event_count = 1 then
      event_id := receipt #>> '{eventIds,0}';
      select count(*), (jsonb_agg(item) -> 0)
        into reference_count, event_value
        from jsonb_array_elements(events) item
       where item ->> 'id' = event_id
         and item ->> 'evidenceKind' <> 'conflict'
         and coalesce((item ->> 'conflicted')::boolean, false) = false;
      if reference_count <> 1
        or event_id <> (receipt ->> 'attemptId') || ':0'
        or jsonb_typeof(event_value -> 'correct') <> 'boolean'
        or jsonb_typeof(event_value -> 'supportLevel') <> 'number'
        or jsonb_typeof(event_value -> 'revealed') <> 'boolean' then
        candidate_valid := false;
      else
        expected_support := least((receipt ->> 'attemptOrdinal')::int, 3);
        if (event_value ->> 'supportLevel')::int <> expected_support
          or (event_value ->> 'revealed')::boolean
            <> ((receipt ->> 'attemptOrdinal')::int >= 3) then
          candidate_valid := false;
        end if;
      end if;
      select count(*) into reference_count
        from jsonb_each(receipts) competing
       where competing.value ->> 'kind' = 'attempt_receipt'
         and competing.value -> 'eventIds' @> jsonb_build_array(event_id);
      if reference_count <> 1 then candidate_valid := false; end if;
    end if;

    for use_id in select item #>> '{}' from jsonb_array_elements(receipt -> 'useIds') item
    loop
      select count(*), (jsonb_agg(item.value) -> 0),
             (array_agg(item.category order by item.category collate "C"))[1]
        into reference_count, use_value, use_category
        from (
          select category, entry.value
          from (values
            ('heartWords'), ('stories'), ('alternatives'), ('morphology'), ('transfer')
          ) categories(category)
          cross join lateral jsonb_each(decks -> category -> 'uses') entry
          where entry.key = use_id and entry.value ->> 'kind' = 'use'
        ) item;
      if reference_count <> 1 then candidate_valid := false; end if;
      select count(*) into reference_count
        from jsonb_each(receipts) competing
       where competing.value ->> 'kind' = 'attempt_receipt'
         and competing.value -> 'useIds' @> jsonb_build_array(use_id);
      if reference_count <> 1 then candidate_valid := false; end if;
    end loop;

    if event_count = 1 then
      correct_value := coalesce((event_value ->> 'correct')::boolean, false);
    else
      correct_value := false;
    end if;
    if receipt ->> 'operation' = 'story_transfer' then
      if event_count <> 1 then candidate_valid := false;
      elsif correct_value then
        if not completed_value or correction_count <> 0 or use_count <> 2 then
          candidate_valid := false;
        end if;
      elsif completed_value
        or receipt -> 'correctionRecordIds'
          <> jsonb_build_array('content-correction:' || (receipt ->> 'attemptId'))
        or use_count <> 0 then
        candidate_valid := false;
      end if;
    elsif event_count = 0 then
      if (receipt ->> 'decisionOrdinal')::int <> 0
        or (receipt ->> 'attemptOrdinal')::int <> 0
        or not completed_value or correction_count <> 0 or use_count <> 1
        or use_category <> 'morphology' then
        candidate_valid := false;
      end if;
    elsif correct_value then
      if correction_count <> 0 or use_count > 1
        or (use_count = 1 and not completed_value) then
        candidate_valid := false;
      end if;
    elsif completed_value
      or receipt -> 'correctionRecordIds'
        <> jsonb_build_array('content-correction:' || (receipt ->> 'attemptId'))
      or use_count <> 0 then
      candidate_valid := false;
    end if;

    group_key := md5((receipt ->> 'operation') || chr(31) || (receipt ->> 'subjectId'));
    group_progress := coalesce(progress -> group_key, jsonb_build_object(
      'decision', 0, 'attempt', 0, 'closed', false
    ));
    expected_decision := (group_progress ->> 'decision')::int;
    expected_attempt := (group_progress ->> 'attempt')::int;
    group_closed := (group_progress ->> 'closed')::boolean;
    if group_closed
      or (receipt ->> 'decisionOrdinal')::int <> expected_decision
      or (receipt ->> 'attemptOrdinal')::int <> expected_attempt then
      candidate_valid := false;
    end if;

    if candidate_valid then
      result := result || jsonb_build_object(receipt ->> 'attemptId', receipt);
      if completed_value then
        progress := progress || jsonb_build_object(group_key, jsonb_build_object(
          'decision', expected_decision, 'attempt', expected_attempt, 'closed', true
        ));
      elsif correct_value then
        progress := progress || jsonb_build_object(group_key, jsonb_build_object(
          'decision', expected_decision + 1, 'attempt', 0, 'closed', false
        ));
      else
        progress := progress || jsonb_build_object(group_key, jsonb_build_object(
          'decision', expected_decision, 'attempt', expected_attempt + 1, 'closed', false
        ));
      end if;
    end if;
  end loop;
  return result;
end;
$$;

-- Whole-state structural projection. Raw merge entries are retained elsewhere;
-- this function filters only for read-time statistics and coverage parity.
create or replace function public.lp_quest_valid_v2_content_decks(content_decks jsonb, attempt_receipts jsonb, evidence jsonb)
returns jsonb language plpgsql immutable as $$
declare
  decks jsonb := public.lp_quest_merge_v2_content_decks(
    content_decks, '{}'::jsonb
  );
  receipts jsonb := public.lp_quest_valid_v2_attempt_receipts(
    evidence, decks, attempt_receipts
  );
  result jsonb := jsonb_build_object(
    'heartWords', jsonb_build_object('visits', '{}'::jsonb, 'uses', '{}'::jsonb),
    'stories', jsonb_build_object('visits', '{}'::jsonb, 'uses', '{}'::jsonb),
    'alternatives', jsonb_build_object('visits', '{}'::jsonb, 'uses', '{}'::jsonb),
    'morphology', jsonb_build_object('visits', '{}'::jsonb, 'uses', '{}'::jsonb),
    'transfer', jsonb_build_object('visits', '{}'::jsonb, 'uses', '{}'::jsonb)
  );
  category text;
  visit_entry record;
  use_entry record;
  visit_value jsonb;
  owner_value jsonb;
  pair_value jsonb;
  pair_category text;
  pair_visit jsonb;
  transfer_visit jsonb;
  receipt_id text;
  final_receipt jsonb;
  expected_receipt_ids jsonb;
  reference_count int;
  valid_use boolean;
begin
  foreach category in array array[
    'heartWords', 'stories', 'alternatives', 'morphology', 'transfer'
  ] loop
    for visit_entry in select * from jsonb_each(decks -> category -> 'visits')
    loop
      if visit_entry.value ->> 'kind' <> 'visit' then continue; end if;
      select count(*) into reference_count
        from jsonb_each(decks -> category -> 'visits') competing
       where competing.value ->> 'kind' = 'visit'
         and competing.value ->> 'contentInstanceId' = visit_entry.value ->> 'contentInstanceId'
         and competing.value -> 'journeyStep' = visit_entry.value -> 'journeyStep';
      if reference_count = 1 then
        result := jsonb_set(result, array[category, 'visits', visit_entry.key], visit_entry.value, true);
      end if;
    end loop;
  end loop;

  foreach category in array array[
    'heartWords', 'stories', 'alternatives', 'morphology', 'transfer'
  ] loop
    for use_entry in select * from jsonb_each(decks -> category -> 'uses')
    loop
      valid_use := use_entry.value ->> 'kind' = 'use';
      visit_value := result -> category -> 'visits' -> (use_entry.value ->> 'visitId');
      valid_use := valid_use and visit_value is not null
        and use_entry.value ->> 'category' = visit_value ->> 'category'
        and use_entry.value ->> 'contentInstanceId' = visit_value ->> 'contentInstanceId'
        and use_entry.value ->> 'visitOwnerId' = visit_value ->> 'visitOwnerId'
        and use_entry.value ->> 'slotId' = visit_value ->> 'slotId'
        and use_entry.value ->> 'recordId' = visit_value ->> 'recordId'
        and use_entry.value -> 'journeyStep' = visit_value -> 'journeyStep';
      select count(*) into reference_count
        from jsonb_each(decks -> category -> 'uses') competing
       where competing.value ->> 'kind' = 'use'
         and competing.value ->> 'visitId' = use_entry.value ->> 'visitId'
         and competing.value ->> 'actionUseId' = use_entry.value ->> 'actionUseId';
      valid_use := valid_use and reference_count = 1;

      if valid_use and category = 'heartWords' then
        if use_entry.value ->> 'actionUseId' <> visit_value ->> 'ownerActionUseId' then
          owner_value := decks -> 'heartWords' -> 'uses'
            -> ((use_entry.value ->> 'visitId') || ':' || (visit_value ->> 'ownerActionUseId'));
          valid_use := owner_value ->> 'kind' = 'use'
            and owner_value ->> 'visitId' = visit_value ->> 'visitId'
            and owner_value ->> 'recordId' = visit_value ->> 'recordId';
        end if;
      elsif valid_use then
        for receipt_id in
          select item #>> '{}' from jsonb_array_elements(use_entry.value -> 'attemptReceiptIds') item
        loop
          if not (receipts ? receipt_id) then valid_use := false; exit; end if;
        end loop;
        if valid_use then
          select receipts -> (item #>> '{}') into final_receipt
            from jsonb_array_elements(use_entry.value -> 'attemptReceiptIds')
              with ordinality as ordered(item, ordinal)
           order by ordinal desc limit 1;
          valid_use := final_receipt is not null
            and (final_receipt ->> 'completed')::boolean
            and final_receipt -> 'useIds' @> jsonb_build_array(use_entry.key);
          if valid_use and category = 'alternatives' then
            valid_use := (final_receipt ->> 'decisionOrdinal')::int = case final_receipt ->> 'subjectId'
              when 's16-alternative' then 1
              when 's28-alternative' then 0
              when 's29-alternative' then 0
              when 's37-alternative' then 3
              else (final_receipt ->> 'decisionOrdinal')::int end;
          end if;
        end if;
        if valid_use then
          select coalesce(jsonb_agg(to_jsonb(entry.key) order by
              (entry.value ->> 'decisionOrdinal')::numeric,
              (entry.value ->> 'attemptOrdinal')::numeric,
              entry.key collate "C"), '[]'::jsonb)
            into expected_receipt_ids
            from jsonb_each(receipts) entry
           where entry.value ->> 'operation' = case
               when category in ('stories', 'transfer') then 'story_transfer'
               else 'content_placement' end
             and entry.value ->> 'subjectId' = case
               when category in ('stories', 'transfer')
                 then use_entry.value ->> 'transactionId'
               else use_entry.value ->> 'visitOwnerId' end;
          valid_use := expected_receipt_ids = use_entry.value -> 'attemptReceiptIds';
        end if;
      end if;

      if valid_use and category in ('stories', 'transfer') then
        pair_category := case when category = 'stories' then 'transfer' else 'stories' end;
        pair_value := decks -> pair_category -> 'uses' -> (use_entry.value ->> 'pairedUseId');
        pair_visit := result -> pair_category -> 'visits' -> (pair_value ->> 'visitId');
        valid_use := pair_value ->> 'kind' = 'use'
          and pair_visit is not null
          and pair_value ->> 'pairedUseId' = use_entry.key
          and pair_value ->> 'transactionId' = use_entry.value ->> 'transactionId'
          and pair_value ->> 'evidenceEventId' = use_entry.value ->> 'evidenceEventId'
          and pair_value -> 'narrativeChoiceToken' = use_entry.value -> 'narrativeChoiceToken'
          and pair_value -> 'journeyStep' = use_entry.value -> 'journeyStep'
          and pair_value -> 'attemptReceiptIds' = use_entry.value -> 'attemptReceiptIds'
          and pair_value ->> 'contentInstanceId' = pair_visit ->> 'contentInstanceId'
          and pair_value ->> 'visitOwnerId' = pair_visit ->> 'visitOwnerId'
          and pair_value ->> 'slotId' = pair_visit ->> 'slotId'
          and pair_value ->> 'recordId' = pair_visit ->> 'recordId';
        if valid_use then
          transfer_visit := case when category = 'transfer' then visit_value else pair_visit end;
          valid_use := case when transfer_visit -> 'wordId' = 'null'::jsonb
            then use_entry.value -> 'narrativeChoiceToken' = 'null'::jsonb
            else jsonb_typeof(use_entry.value -> 'narrativeChoiceToken') = 'string'
              and btrim(use_entry.value ->> 'narrativeChoiceToken') <> '' end;
          valid_use := valid_use
            and final_receipt #>> '{eventIds,0}' = use_entry.value ->> 'evidenceEventId';
          valid_use := valid_use
            and jsonb_array_length(final_receipt -> 'useIds') = 2
            and final_receipt -> 'useIds' @> jsonb_build_array(use_entry.key)
            and final_receipt -> 'useIds' @> jsonb_build_array(use_entry.value ->> 'pairedUseId');
        end if;
      end if;

      if valid_use then
        result := jsonb_set(result, array[category, 'uses', use_entry.key], use_entry.value, true);
      end if;
    end loop;
  end loop;
  return result;
end;
$$;

-- Reissue the overall merge with the foundation behavior unchanged, replacing
-- only evidence/deck unions and adding the immutable attempt-receipt ledger.
create or replace function public.lp_quest_merge_learning_v2(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_v2 boolean := jsonb_typeof(existing) = 'object'
    and existing ->> 'v' = '2'
    and existing ->> 'contentVersion' = 'sound-seekers-v2';
  incoming_v2 boolean := jsonb_typeof(incoming) = 'object'
    and incoming ->> 'v' = '2'
    and incoming ->> 'contentVersion' = 'sound-seekers-v2';
  existing_epoch numeric := public.lp_quest_num(existing -> 'reset', 'epoch');
  incoming_epoch numeric := public.lp_quest_num(incoming -> 'reset', 'epoch');
  winner jsonb;
  result jsonb;
  trail jsonb;
  assignment_value jsonb;
  incoming_assignment_value jsonb;
  settings_value jsonb;
  checkpoint_value jsonb := 'null'::jsonb;
begin
  if not existing_v2 and not incoming_v2 then
    return coalesce(incoming, existing, '{}'::jsonb);
  end if;

  if existing_v2 and not incoming_v2 then
    winner := existing;
  elsif incoming_v2 and not existing_v2 then
    winner := incoming;
  elsif existing_epoch <> incoming_epoch then
    winner := case when existing_epoch > incoming_epoch then existing else incoming end;
  end if;

  assignment_value := coalesce(
    public.lp_quest_normalize_v2_assignment(existing -> 'assignment'),
    'null'::jsonb
  );
  if coalesce(incoming ? 'assignment', false) then
    if incoming -> 'assignment' = 'null'::jsonb then
      assignment_value := 'null'::jsonb;
    else
      incoming_assignment_value := public.lp_quest_normalize_v2_assignment(
        incoming -> 'assignment'
      );
      if incoming_assignment_value is not null then
        assignment_value := incoming_assignment_value;
      end if;
    end if;
  end if;
  settings_value := coalesce(
    case when jsonb_typeof(incoming -> 'settings') = 'object'
      then incoming -> 'settings' end,
    case when jsonb_typeof(existing -> 'settings') = 'object'
      then existing -> 'settings' end,
    '{}'::jsonb
  );

  if winner is not null then
    result := public.lp_quest_merge_learning_v2(winner, winner);
    return result || jsonb_build_object(
      'v', 2,
      'contentVersion', 'sound-seekers-v2',
      'assignment', assignment_value,
      'settings', settings_value
    );
  end if;

  trail := jsonb_build_object(
    'routeCursor', case
      when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
        then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
      when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0
        then public.lp_quest_num(existing -> 'trail', 'routeCursor')
      else 1 end,
    'journeyStep', greatest(
      public.lp_quest_num(existing -> 'trail', 'journeyStep'),
      public.lp_quest_num(incoming -> 'trail', 'journeyStep'),
      1
    ),
    'completedStopIds', public.lp_quest_union_v2_ids(
      existing #> '{trail,completedStopIds}', incoming #> '{trail,completedStopIds}'
    ),
    'repairs', public.lp_jsonb_forward_merge(
      coalesce(existing #> '{trail,repairs}', '{}'::jsonb),
      coalesce(incoming #> '{trail,repairs}', '{}'::jsonb)
    ),
    'chapterCoverage', public.lp_jsonb_forward_merge(
      coalesce(existing #> '{trail,chapterCoverage}', '{}'::jsonb),
      coalesce(incoming #> '{trail,chapterCoverage}', '{}'::jsonb)
    )
  );

  if incoming_v2
    and jsonb_typeof(incoming -> 'checkpoint') = 'object'
    and incoming #>> '{checkpoint,contentVersion}' = 'sound-seekers-v2' then
    checkpoint_value := incoming -> 'checkpoint';
  end if;

  result := jsonb_build_object(
    'v', 2,
    'contentVersion', 'sound-seekers-v2',
    'reset', jsonb_build_object(
      'epoch', greatest(existing_epoch, incoming_epoch),
      'at', case
        when coalesce(existing #>> '{reset,at}', '')
          >= coalesce(incoming #>> '{reset,at}', '') then existing #> '{reset,at}'
        else incoming #> '{reset,at}' end
    ),
    'trail', trail,
    'evidence', public.lp_quest_union_v2_evidence(
      existing -> 'evidence', incoming -> 'evidence'
    ),
    'confusions', public.lp_jsonb_forward_merge(
      coalesce(existing -> 'confusions', '{}'::jsonb),
      coalesce(incoming -> 'confusions', '{}'::jsonb)
    ),
    'contentDecks', public.lp_quest_merge_v2_content_decks(
      existing -> 'contentDecks', incoming -> 'contentDecks'
    ),
    'attemptReceipts', public.lp_quest_union_v2_attempt_receipts(
      existing -> 'attemptReceipts', incoming -> 'attemptReceipts'
    ),
    'journal', jsonb_build_object(
      'words', public.lp_quest_union_v2_ids(
        existing #> '{journal,words}', incoming #> '{journal,words}'
      ),
      'scenes', public.lp_quest_union_v2_ids(
        existing #> '{journal,scenes}', incoming #> '{journal,scenes}'
      ),
      'stickers', public.lp_quest_union_v2_ids(
        existing #> '{journal,stickers}', incoming #> '{journal,stickers}'
      )
    ),
    'rewards', jsonb_build_object(
      'claimedIds', public.lp_quest_union_v2_ids(
        existing #> '{rewards,claimedIds}', incoming #> '{rewards,claimedIds}'
      )
    ),
    'checkpoint', checkpoint_value,
    'assignment', assignment_value,
    'settings', settings_value
  );
  return result;
end;
$$;

create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language sql immutable as $$
  select public.lp_quest_merge_learning_v2(existing, incoming);
$$;

create or replace function public.lp_forward_merge_progress(
  p_area text, p_existing jsonb, p_incoming jsonb
)
returns jsonb language sql immutable as $$
  select case
    when p_area in ('daily_mission', 'profile') then p_incoming
    when p_area = 'phonics_quest'
      then public.lp_quest_merge_learning_v2(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

revoke all on function public.lp_quest_normalize_v2_activity_type(text, text) from public;
revoke all on function public.lp_quest_normalize_v2_deck_visit(text, text, jsonb) from public;
revoke all on function public.lp_quest_normalize_v2_deck_use(text, text, jsonb) from public;
revoke all on function public.lp_quest_union_v2_deck_visits(text, jsonb, jsonb) from public;
revoke all on function public.lp_quest_union_v2_deck_uses(text, jsonb, jsonb) from public;
revoke all on function public.lp_quest_merge_v2_deck(text, jsonb, jsonb) from public;
revoke all on function public.lp_quest_merge_v2_content_decks(jsonb, jsonb) from public;
revoke all on function public.lp_quest_normalize_v2_attempt_receipt(text, jsonb) from public;
revoke all on function public.lp_quest_union_v2_attempt_receipts(jsonb, jsonb) from public;
revoke all on function public.lp_quest_valid_v2_attempt_receipts(jsonb, jsonb, jsonb) from public;
revoke all on function public.lp_quest_valid_v2_content_decks(jsonb, jsonb, jsonb) from public;
revoke all on function public.lp_quest_union_v2_evidence(jsonb, jsonb) from public;
revoke all on function public.lp_quest_union_v2_ids(jsonb, jsonb) from public;
revoke all on function public.lp_quest_normalize_v2_assignment(jsonb) from public;
revoke all on function public.lp_quest_merge_learning_v2(jsonb, jsonb) from public;
revoke all on function public.lp_merge_phonics_quest(jsonb, jsonb) from public;

grant execute on function public.lp_quest_normalize_v2_activity_type(text, text) to anon, authenticated;
grant execute on function public.lp_quest_normalize_v2_deck_visit(text, text, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_normalize_v2_deck_use(text, text, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_union_v2_deck_visits(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_union_v2_deck_uses(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_v2_deck(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_v2_content_decks(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_normalize_v2_attempt_receipt(text, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_union_v2_attempt_receipts(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_valid_v2_attempt_receipts(jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_valid_v2_content_decks(jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_union_v2_evidence(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_union_v2_ids(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_normalize_v2_assignment(jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_learning_v2(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;
