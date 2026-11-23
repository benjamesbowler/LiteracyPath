-- Scope family wording validation to controlled report text and verify the
-- identity fields against the authorized learner and school before release.
-- Existing releases keep their original snapshots.

begin;

create or replace function public.guardian_family_snapshot_is_valid(
  p_snapshot jsonb,
  p_student_id uuid
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_text text;
  v_identity text;
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
     or jsonb_array_length(p_snapshot -> 'nextFocus') > 2
     or jsonb_array_length(p_snapshot -> 'progress') > 6
     or jsonb_array_length(p_snapshot #> '{atHome,activities}') > 5
     or octet_length(p_snapshot::text) > 65536
     or p_snapshot ? 'reports'
  then
    return false;
  end if;

  if (p_snapshot -> 'learner') - array['id', 'name', 'classLabel', 'schoolName'] <> '{}'::jsonb
     or (p_snapshot -> 'contact') - array['name', 'email', 'message'] <> '{}'::jsonb
     or (p_snapshot -> 'atHome') - array['title', 'introduction', 'durationLabel', 'language', 'activities', 'privacyText'] <> '{}'::jsonb
  then
    return false;
  end if;

  foreach v_identity in array array[
    p_snapshot #>> '{learner,name}', p_snapshot #>> '{learner,classLabel}',
    p_snapshot #>> '{learner,schoolName}', p_snapshot #>> '{contact,name}'
  ] loop
    if btrim(v_identity) = '' or char_length(v_identity) > 200 or v_identity ~ '[[:cntrl:]]' then
      return false;
    end if;
  end loop;

  v_identity := p_snapshot #>> '{contact,email}';
  if char_length(v_identity) > 320
     or (v_identity <> '' and v_identity !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+[.][^[:space:]@<>]+$')
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
       or v_item - array['id', 'label', 'status', 'detail'] <> '{}'::jsonb
       or v_item ->> 'status' not in (
         'secure', 'developing', 'needs_support', 'mixed_evidence',
         'not_enough_evidence', 'not_checked', 'doing_well', 'growing'
       )
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
       or v_item - array['moment', 'title', 'direction'] <> '{}'::jsonb
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
         or v_item - array['title', 'detail'] <> '{}'::jsonb
      then
        return false;
      end if;
    end loop;
  end if;

  -- Typed identity and contact fields are handled separately. The contact
  -- message is authored educational copy and still participates in the check.
  v_text := lower(((p_snapshot - 'learner' #- '{contact,name}') #- '{contact,email}')::text);
  if v_text ~ '\m(accuracy|benchmark|class[[:space:]]+rank|decoding|denominator|mastery|percentile|phoneme|raw[[:space:]]+score|scoring|microphase)\M'
     or v_text ~ '[£$€¥]'
  then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.guardian_family_snapshot_is_valid(jsonb, uuid)
  from public, anon, authenticated;

create or replace function public.teacher_release_family_report(
  p_student_id uuid,
  p_title text,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_school_id uuid;
  v_school_name text;
  v_class_name text;
  v_teacher_email text;
  v_report_id uuid;
  v_released_at timestamptz;
begin
  perform public.assert_current_actor_teacher_access();

  select student.*
  into v_student
  from public.students student
  where student.id = p_student_id
    and student.archived_at is null
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id));
  if v_student.id is null then
    raise exception using errcode = '42501', message = 'The learner is not available to this teacher.';
  end if;

  select class.school_id, class.name, school.name
  into v_school_id, v_class_name, v_school_name
  from public.classes class
  join public.schools school on school.id = class.school_id
  where class.id = v_student.class_id;
  select owner.email into v_teacher_email
  from auth.users owner
  where owner.id = v_student.teacher_id;
  if btrim(coalesce(p_title, '')) = '' or char_length(btrim(p_title)) > 120 then
    return jsonb_build_object('ok', false, 'error', 'report_title_required');
  end if;
  if not public.guardian_family_snapshot_is_valid(p_snapshot, p_student_id)
     or p_snapshot #>> '{learner,name}' is distinct from btrim(v_student.name)
     or p_snapshot #>> '{learner,classLabel}' is distinct from btrim(v_class_name)
     or p_snapshot #>> '{learner,schoolName}' is distinct from btrim(v_school_name)
     or (
       p_snapshot #>> '{contact,email}' <> ''
       and lower(p_snapshot #>> '{contact,email}') is distinct from lower(v_teacher_email)
     )
  then
    return jsonb_build_object('ok', false, 'error', 'invalid_family_snapshot');
  end if;

  insert into public.family_report_releases (
    school_id, student_id, teacher_id, title, schema_version,
    snapshot, released_by, released_at
  ) values (
    v_school_id, v_student.id, v_student.teacher_id, btrim(p_title), 1,
    p_snapshot, v_actor_id, now()
  ) returning id, released_at into v_report_id, v_released_at;

  insert into public.guardian_access_audit (
    teacher_id, school_id, student_id, report_id, event_type
  ) values (
    v_actor_id, v_school_id, v_student.id, v_report_id, 'report_released'
  );

  return jsonb_build_object(
    'ok', true,
    'report_id', v_report_id,
    'released_at', v_released_at
  );
end;
$$;

revoke all on function public.teacher_release_family_report(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_release_family_report(uuid, text, jsonb) to authenticated;

commit;
