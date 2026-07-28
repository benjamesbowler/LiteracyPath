\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id,
  aud,
  role,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  'fa000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'status-boundary@example.invalid',
  '{"audit_only": true}'::jsonb,
  now(),
  now()
);

insert into public.pending_teacher_accounts (
  user_id,
  email,
  role,
  status,
  approval_status
)
values (
  'fa000000-0000-4000-8000-000000000001',
  'status-boundary@example.invalid',
  'pending',
  'pending',
  'pending'
)
on conflict (user_id) do update
set role = excluded.role,
    status = excluded.status,
    approval_status = excluded.approval_status;

create or replace function pg_temp.assert_teacher_rpcs_blocked(p_state text)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_expected constant text[] := array[
    'teacher_assign_instructional_group_follow_up(uuid,text,text,date)',
    'teacher_class_access_log(uuid,integer)',
    'teacher_class_access_summary(uuid)',
    'teacher_complete_learner_deletion(uuid,text,jsonb)',
    'teacher_create_insight_intervention(text,uuid,jsonb,uuid[],text[],text,text,date)',
    'teacher_delete_empty_class(uuid)',
    'teacher_delete_learner_data_staged(uuid,uuid,text,text)',
    'teacher_delete_saved_assessment_report(text)',
    'teacher_export_learner_data(uuid,text,text)',
    'teacher_get_learner_deletion_status(uuid,text)',
    'teacher_list_learner_data_rights(uuid)',
    'teacher_prepare_learner_deletion(uuid,text,text)',
    'teacher_record_insight_observation(uuid,jsonb,uuid[],text,text,text,date)',
    'teacher_regenerate_class_code(uuid)',
    'teacher_reset_student_progress(uuid,timestamp with time zone)',
    'teacher_review_instructional_group(uuid,uuid[],jsonb)',
    'teacher_save_instructional_group(uuid,text,jsonb,uuid[],jsonb)',
    'teacher_set_class_code_expiry(uuid,timestamp with time zone)',
    'teacher_set_class_leaderboard_scope(uuid,text)',
    'teacher_set_school(text)',
    'teacher_set_student_archived(uuid,uuid,boolean)',
    'teacher_set_student_symbol_password(uuid,text,timestamp with time zone)',
    'teacher_transfer_student(uuid,uuid,uuid)'
  ];
  v_actual text[];
  v_rpc record;
  v_call text;
  v_message text;
begin
  select coalesce(
    array_agg(procedure.oid::regprocedure::text order by procedure.oid::regprocedure::text),
    '{}'::text[]
  )
  into v_actual
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prosecdef
    and procedure.proname like 'teacher\_%' escape '\'
    and has_function_privilege('authenticated', procedure.oid, 'EXECUTE');

  if v_actual is distinct from v_expected then
    raise exception
      'Teacher RPC test inventory drift. Expected %, found %.',
      v_expected,
      v_actual;
  end if;

  for v_rpc in
    select
      procedure.proname,
      coalesce((
        select string_agg(
          'null::' || format_type(argument_type, null),
          ', '
          order by argument_position
        )
        from unnest(procedure.proargtypes::oid[])
          with ordinality as argument(argument_type, argument_position)
      ), '') as null_arguments,
      procedure.oid::regprocedure::text as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
      and procedure.proname like 'teacher\_%' escape '\'
      and has_function_privilege('authenticated', procedure.oid, 'EXECUTE')
    order by procedure.oid::regprocedure::text
  loop
    v_call := format(
      'select public.%I(%s)',
      v_rpc.proname,
      v_rpc.null_arguments
    );
    begin
      execute v_call;
      raise exception
        '% account reached guarded teacher RPC %',
        p_state,
        v_rpc.signature;
    exception
      when insufficient_privilege then
        get stacked diagnostics v_message = message_text;
        if v_message <> 'An approved teacher account is required.' then
          raise exception
            '% reached % before the account guard: %',
            p_state,
            v_rpc.signature,
            v_message;
        end if;
    end;
  end loop;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'fa000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $test$
begin
  if public.current_actor_has_teacher_access() then
    raise exception 'a pending account was treated as approved';
  end if;

  perform pg_temp.assert_teacher_rpcs_blocked('pending');

  begin
    insert into public.classes (
      id,
      teacher_id,
      name
    )
    values (
      'fa100000-0000-4000-8000-000000000001',
      auth.uid(),
      'Pending account must not create this'
    );
    raise exception 'a pending account inserted a class';
  exception
    when insufficient_privilege then null;
  end;
end
$test$;

reset role;
update public.pending_teacher_accounts
set role = 'teacher',
    status = 'approved',
    approval_status = 'approved'
where user_id = 'fa000000-0000-4000-8000-000000000001';

set local role authenticated;

do $test$
declare
  v_teacher_id constant uuid := 'fa000000-0000-4000-8000-000000000001';
  v_class_id constant uuid := 'fa100000-0000-4000-8000-000000000001';
  v_student_id constant uuid := 'fa200000-0000-4000-8000-000000000001';
begin
  if not public.current_actor_has_teacher_access() then
    raise exception 'an approved account was denied';
  end if;

  insert into public.classes (id, teacher_id, name)
  values (v_class_id, v_teacher_id, 'Approved account class');

  insert into public.students (
    id,
    teacher_id,
    class_id,
    name
  )
  values (
    v_student_id,
    v_teacher_id,
    v_class_id,
    'Status boundary learner'
  );

  insert into public.answers (
    id,
    teacher_id,
    student_id,
    skill,
    question,
    chosen_answer,
    correct_answer,
    is_correct
  )
  values (
    'fa300000-0000-4000-8000-000000000001',
    v_teacher_id,
    v_student_id,
    'Initial Sounds',
    'Audit question',
    'a',
    'a',
    true
  );

  insert into public.mastery (
    id,
    teacher_id,
    student_id,
    skill_id,
    skill_label,
    mastered,
    attempts,
    last_score,
    last_total
  )
  values (
    'fa400000-0000-4000-8000-000000000001',
    v_teacher_id,
    v_student_id,
    'initial_sounds',
    'Initial Sounds',
    false,
    1,
    1,
    1
  );

  insert into public.item_mastery (
    id,
    teacher_id,
    student_id,
    item_key,
    item_type,
    attempts,
    correct,
    sessions_seen,
    mastered
  )
  values (
    'fa500000-0000-4000-8000-000000000001',
    v_teacher_id,
    v_student_id,
    'a',
    'initial_sound',
    1,
    1,
    1,
    false
  );

  update public.classes
  set name = 'Approved update'
  where id = v_class_id;

  if (select count(*) from public.classes where id = v_class_id) <> 1
     or (select count(*) from public.students where id = v_student_id) <> 1
     or (select count(*) from public.answers where student_id = v_student_id) <> 1
     or (select count(*) from public.mastery where student_id = v_student_id) <> 1
     or (select count(*) from public.item_mastery where student_id = v_student_id) <> 1
  then
    raise exception 'approved CRUD did not reach every core teacher table';
  end if;
end
$test$;

reset role;

insert into public.student_sessions (
  student_id,
  token,
  expires_at,
  revoked
)
values (
  'fa200000-0000-4000-8000-000000000001',
  'status-boundary-child-token',
  now() + interval '1 hour',
  false
);

update public.pending_teacher_accounts
set role = 'pending',
    status = 'rejected',
    approval_status = 'rejected'
where user_id = 'fa000000-0000-4000-8000-000000000001';

set local role authenticated;

do $test$
begin
  if public.current_actor_has_teacher_access() then
    raise exception 'a rejected account retained teacher access';
  end if;
  perform pg_temp.assert_teacher_rpcs_blocked('rejected');
  if (select count(*) from public.classes) <> 0
     or (select count(*) from public.students) <> 0
     or (select count(*) from public.answers) <> 0
     or (select count(*) from public.mastery) <> 0
     or (select count(*) from public.item_mastery) <> 0
  then
    raise exception 'a rejected account could still read owned learning data';
  end if;

  begin
    insert into public.classes (teacher_id, name)
    values (auth.uid(), 'Rejected account write');
    raise exception 'a rejected account inserted a class';
  exception
    when insufficient_privilege then null;
  end;
end
$test$;

reset role;
update public.pending_teacher_accounts
set role = 'teacher',
    status = 'disabled',
    approval_status = 'approved'
where user_id = 'fa000000-0000-4000-8000-000000000001';

set local role authenticated;

do $test$
begin
  if public.current_actor_has_teacher_access() then
    raise exception 'a disabled account retained teacher access';
  end if;
  perform pg_temp.assert_teacher_rpcs_blocked('disabled');
  if (select count(*) from public.classes) <> 0
     or (select count(*) from public.students) <> 0
     or (select count(*) from public.answers) <> 0
     or (select count(*) from public.mastery) <> 0
     or (select count(*) from public.item_mastery) <> 0
  then
    raise exception 'a disabled account could still read owned learning data';
  end if;

  begin
    update public.classes
    set name = 'Disabled update'
    where id = 'fa100000-0000-4000-8000-000000000001';
    if found then
      raise exception 'a disabled account updated a class';
    end if;
  exception
    when insufficient_privilege then null;
  end;
end
$test$;

-- Teacher approval governs the adult account, not an already authenticated
-- child session. The anonymous student RPC still uses its own token boundary.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $test$
declare
  v_result json;
begin
  v_result := public.student_save_progress(
    'status-boundary-child-token',
    'profile',
    '__all__',
    '{"schemaVersion":1,"reducedChoiceMode":false}'::jsonb
  );
  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    raise exception 'student token RPC was broken by the teacher-account policy: %', v_result;
  end if;
end
$test$;

reset role;

do $test$
begin
  if not exists (
    select 1
    from public.student_progress
    where student_id = 'fa200000-0000-4000-8000-000000000001'
      and area = 'profile'
      and key = '__all__'
  ) then
    raise exception 'student token RPC did not persist progress';
  end if;
end
$test$;

rollback;
