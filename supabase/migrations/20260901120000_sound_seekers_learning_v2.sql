-- Sound Seekers v2 uses an immutable evidence ledger and one canonical game
-- state. The migration is intentionally additive here; applying it to a
-- hosted project is a separate, explicit release action.

create or replace function public.lp_quest_union_v2_evidence(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  with raw(event) as (
    select value
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select value
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  ), valid as (
    select event || jsonb_build_object(
             'id', btrim(event ->> 'id'),
             'at', case
               when jsonb_typeof(event -> 'at') = 'number' then event -> 'at'
               when jsonb_typeof(event -> 'at') = 'string' and btrim(event ->> 'at') <> '' then to_jsonb(btrim(event ->> 'at'))
               else '0'::jsonb end
           ) as event,
           btrim(event ->> 'id') as id,
           case when jsonb_typeof(event -> 'at') = 'number' then (event ->> 'at')::numeric else 0 end as at_number,
           case when jsonb_typeof(event -> 'at') = 'string' and btrim(event ->> 'at') <> '' then btrim(event ->> 'at') end as at_text
      from raw
     where jsonb_typeof(event) = 'object'
       and coalesce(btrim(event ->> 'id'), '') <> ''
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
           case when jsonb_typeof(event -> 'at') = 'number' then (event ->> 'at')::numeric else 0 end as at_number,
           case when jsonb_typeof(event -> 'at') = 'string' and btrim(event ->> 'at') <> '' then btrim(event ->> 'at') end as at_text
      from resolved
  ), retained as (
    select event, id, at_number, at_text
      from sortable
     order by case when at_text is null then 0 else 1 end desc, at_number desc, at_text desc nulls last, id desc
     limit 1200
  )
  select coalesce(
    jsonb_agg(event order by case when at_text is null then 0 else 1 end, at_number asc, at_text asc nulls last, id asc),
    '[]'::jsonb
  ) from retained;
$$;

create or replace function public.lp_quest_normalize_v2_assignment(payload jsonb)
returns jsonb language sql immutable as $$
  with stop_ids as (
    select coalesce(jsonb_agg(to_jsonb(id) order by id collate "C"), '[]'::jsonb) as value
      from (
        select distinct btrim(value #>> '{}') as id
          from jsonb_array_elements(coalesce(case when jsonb_typeof(payload -> 'stopIds') = 'array' then payload -> 'stopIds' end, '[]'::jsonb))
         where jsonb_typeof(value) = 'string' and btrim(value #>> '{}') <> ''
      ) ids
  ), targets as (
    select coalesce(jsonb_agg(to_jsonb(id) order by id collate "C"), '[]'::jsonb) as value
      from (
        select id from (
          select distinct btrim(value #>> '{}') as id
            from jsonb_array_elements(coalesce(case when jsonb_typeof(payload -> 'targets') = 'array' then payload -> 'targets' end, '[]'::jsonb))
           where jsonb_typeof(value) = 'string' and btrim(value #>> '{}') <> ''
        ) ordered order by id collate "C" limit 6
      ) ids
  )
  select case when jsonb_array_length(stop_ids.value) + jsonb_array_length(targets.value) = 0 then null else
    jsonb_strip_nulls(jsonb_build_object(
      'stopIds', case when jsonb_array_length(stop_ids.value) > 0 then stop_ids.value end,
      'targets', case when jsonb_array_length(targets.value) > 0 then targets.value end,
      'note', case when jsonb_typeof(payload -> 'note') = 'string' then left(payload ->> 'note', 120) end,
      'assignedAt', case when jsonb_typeof(payload -> 'assignedAt') = 'string' then payload ->> 'assignedAt' end,
      'by', case when jsonb_typeof(payload -> 'by') = 'string' then payload ->> 'by' end
    )) end
    from stop_ids, targets;
$$;

create or replace function public.lp_quest_union_v2_ids(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  with ids(id) as (
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
    union
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
  )
  select coalesce(jsonb_agg(to_jsonb(id) order by id collate "C"), '[]'::jsonb)
    from ids
   where coalesce(btrim(id), '') <> '';
$$;

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

  -- A v2 state is authoritative over a stale v1 save. Teacher assignment is
  -- deliberately carried below because it is not a child-owned game field.
  if existing_v2 and not incoming_v2 then
    winner := existing;
  elsif incoming_v2 and not existing_v2 then
    winner := incoming;
  elsif existing_epoch <> incoming_epoch then
    winner := case when existing_epoch > incoming_epoch then existing else incoming end;
  end if;

  -- Child uploads omit this teacher-owned key. An explicit incoming key is a
  -- teacher partial update: valid data replaces, JSON null clears, and a
  -- malformed non-null value fails closed by retaining the stored assignment.
  assignment_value := coalesce(
    public.lp_quest_normalize_v2_assignment(existing -> 'assignment'),
    'null'::jsonb
  );
  if coalesce(incoming ? 'assignment', false) then
    if incoming -> 'assignment' = 'null'::jsonb then
      assignment_value := 'null'::jsonb;
    else
      incoming_assignment_value := public.lp_quest_normalize_v2_assignment(incoming -> 'assignment');
      if incoming_assignment_value is not null then
        assignment_value := incoming_assignment_value;
      end if;
    end if;
  end if;
  settings_value := coalesce(
    case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
    case when jsonb_typeof(existing -> 'settings') = 'object' then existing -> 'settings' end,
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
      'at', case when coalesce(existing #>> '{reset,at}', '') >= coalesce(incoming #>> '{reset,at}', '')
        then existing #> '{reset,at}' else incoming #> '{reset,at}' end
    ),
    'trail', trail,
    'evidence', public.lp_quest_union_v2_evidence(existing -> 'evidence', incoming -> 'evidence'),
    'confusions', public.lp_jsonb_forward_merge(
      coalesce(existing -> 'confusions', '{}'::jsonb), coalesce(incoming -> 'confusions', '{}'::jsonb)
    ),
    'contentDecks', jsonb_build_object(
      'heartWords', public.lp_jsonb_forward_merge(
        coalesce(existing #> '{contentDecks,heartWords}', '{}'::jsonb), coalesce(incoming #> '{contentDecks,heartWords}', '{}'::jsonb)
      ),
      'stories', public.lp_jsonb_forward_merge(
        coalesce(existing #> '{contentDecks,stories}', '{}'::jsonb), coalesce(incoming #> '{contentDecks,stories}', '{}'::jsonb)
      ),
      'alternatives', public.lp_jsonb_forward_merge(
        coalesce(existing #> '{contentDecks,alternatives}', '{}'::jsonb), coalesce(incoming #> '{contentDecks,alternatives}', '{}'::jsonb)
      )
    ),
    'journal', jsonb_build_object(
      'words', public.lp_quest_union_v2_ids(existing #> '{journal,words}', incoming #> '{journal,words}'),
      'scenes', public.lp_quest_union_v2_ids(existing #> '{journal,scenes}', incoming #> '{journal,scenes}'),
      'stickers', public.lp_quest_union_v2_ids(existing #> '{journal,stickers}', incoming #> '{journal,stickers}')
    ),
    'rewards', jsonb_build_object(
      'claimedIds', public.lp_quest_union_v2_ids(existing #> '{rewards,claimedIds}', incoming #> '{rewards,claimedIds}')
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

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area in ('daily_mission', 'profile') then p_incoming
    when p_area = 'phonics_quest' then public.lp_quest_merge_learning_v2(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

revoke all on function public.lp_quest_union_v2_evidence(jsonb, jsonb) from public;
revoke all on function public.lp_quest_union_v2_ids(jsonb, jsonb) from public;
revoke all on function public.lp_quest_normalize_v2_assignment(jsonb) from public;
revoke all on function public.lp_quest_merge_learning_v2(jsonb, jsonb) from public;
revoke all on function public.lp_merge_phonics_quest(jsonb, jsonb) from public;
grant execute on function public.lp_quest_union_v2_evidence(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_union_v2_ids(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_normalize_v2_assignment(jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_learning_v2(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;
