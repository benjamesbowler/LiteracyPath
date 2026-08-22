-- Fail closed on every family snapshot shape. The first portal migration set
-- size, key and wording limits; this pass makes missing or wrongly typed nested
-- fields explicitly invalid rather than relying on SQL comparisons with NULL.

begin;

create or replace function public.guardian_family_snapshot_is_valid(
  p_snapshot jsonb,
  p_student_id uuid
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_text text := lower(coalesce(p_snapshot::text, ''));
  v_key text;
  v_item jsonb;
begin
  if jsonb_typeof(p_snapshot) is distinct from 'object'
     or p_snapshot ->> 'schemaVersion' is distinct from '1'
     or p_snapshot #>> '{learner,id}' is distinct from p_student_id::text
     or jsonb_typeof(p_snapshot -> 'learner') is distinct from 'object'
     or jsonb_typeof(p_snapshot -> 'strengths') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'canDo') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'nextFocus') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'progress') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'atHome') is distinct from 'object'
     or jsonb_typeof(p_snapshot #> '{atHome,activities}') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'contact') is distinct from 'object'
     or jsonb_typeof(p_snapshot -> 'updatedLabel') is distinct from 'string'
     or jsonb_typeof(p_snapshot -> 'highlight') is distinct from 'string'
     or jsonb_typeof(p_snapshot -> 'meaning') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{learner,name}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{learner,classLabel}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{learner,schoolName}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{atHome,title}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{atHome,introduction}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{atHome,durationLabel}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{atHome,language}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{atHome,privacyText}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{contact,name}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{contact,email}') is distinct from 'string'
     or jsonb_typeof(p_snapshot #> '{contact,message}') is distinct from 'string'
     or btrim(p_snapshot #>> '{learner,name}') = ''
     or btrim(p_snapshot #>> '{learner,classLabel}') = ''
     or btrim(p_snapshot #>> '{learner,schoolName}') = ''
     or jsonb_array_length(p_snapshot -> 'strengths') > 4
     or jsonb_array_length(p_snapshot -> 'canDo') > 4
     or jsonb_array_length(p_snapshot -> 'nextFocus') > 3
     or jsonb_array_length(p_snapshot -> 'progress') > 6
     or jsonb_array_length(p_snapshot #> '{atHome,activities}') > 5
     or octet_length(p_snapshot::text) > 65536
     or p_snapshot ? 'reports'
  then
    return false;
  end if;

  for v_key in select jsonb_object_keys(p_snapshot)
  loop
    if v_key not in (
      'schemaVersion', 'learner', 'updatedLabel', 'highlight', 'strengths',
      'canDo', 'nextFocus', 'meaning', 'progress', 'atHome',
      'recentReading', 'contact'
    ) then
      return false;
    end if;
  end loop;

  for v_item in
    select value from jsonb_array_elements(p_snapshot -> 'strengths')
    union all select value from jsonb_array_elements(p_snapshot -> 'canDo')
    union all select value from jsonb_array_elements(p_snapshot -> 'nextFocus')
  loop
    if jsonb_typeof(v_item) is distinct from 'string' then return false; end if;
  end loop;

  for v_item in select value from jsonb_array_elements(p_snapshot -> 'progress')
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item -> 'id') is distinct from 'string'
       or jsonb_typeof(v_item -> 'label') is distinct from 'string'
       or jsonb_typeof(v_item -> 'status') is distinct from 'string'
       or jsonb_typeof(v_item -> 'detail') is distinct from 'string'
       or v_item ->> 'status' not in ('doing_well', 'growing', 'not_checked')
    then
      return false;
    end if;
  end loop;

  for v_item in select value from jsonb_array_elements(p_snapshot #> '{atHome,activities}')
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item -> 'moment') is distinct from 'string'
       or jsonb_typeof(v_item -> 'title') is distinct from 'string'
       or jsonb_typeof(v_item -> 'direction') is distinct from 'string'
    then
      return false;
    end if;
  end loop;

  if p_snapshot ? 'recentReading' then
    if jsonb_typeof(p_snapshot -> 'recentReading') is distinct from 'array'
       or jsonb_array_length(p_snapshot -> 'recentReading') > 3
    then
      return false;
    end if;
    for v_item in select value from jsonb_array_elements(p_snapshot -> 'recentReading')
    loop
      if jsonb_typeof(v_item) is distinct from 'object'
         or jsonb_typeof(v_item -> 'title') is distinct from 'string'
         or jsonb_typeof(v_item -> 'detail') is distinct from 'string'
      then
        return false;
      end if;
    end loop;
  end if;

  if v_text ~ '\m(accuracy|benchmark|class rank|denominator|mastery|percentile|phoneme|raw score)\M'
     or v_text ~ '[£$€¥]'
  then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.guardian_family_snapshot_is_valid(jsonb, uuid)
  from public, anon, authenticated;

commit;
