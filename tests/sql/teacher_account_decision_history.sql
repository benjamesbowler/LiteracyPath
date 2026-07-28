\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_admin_id constant uuid := 'f1100000-0000-4000-8000-000000000001';
  v_teacher_id constant uuid := 'f1200000-0000-4000-8000-000000000001';
  v_new_teacher_id constant uuid := 'f1200000-0000-4000-8000-000000000002';
  v_school_one_id constant uuid := 'f1300000-0000-4000-8000-000000000001';
  v_school_two_id constant uuid := 'f1300000-0000-4000-8000-000000000002';
  v_class_id constant uuid := 'f1400000-0000-4000-8000-000000000001';
  v_account_id uuid;
  v_new_account_id uuid;
  v_event_id uuid;
  v_count integer;
  v_school_id uuid;
begin
  insert into auth.users (
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      v_admin_id,
      'authenticated',
      'authenticated',
      'account-history-admin@example.invalid',
      '{"audit_only": true}'::jsonb,
      now(),
      now()
    ),
    (
      v_teacher_id,
      'authenticated',
      'authenticated',
      'account-history-teacher@example.invalid',
      '{"audit_only": true}'::jsonb,
      now(),
      now()
    ),
    (
      v_new_teacher_id,
      'authenticated',
      'authenticated',
      'account-history-new-teacher@example.invalid',
      '{"audit_only": true}'::jsonb,
      now(),
      now()
    );

  insert into public.app_admins (user_id, email)
  values (v_admin_id, 'account-history-admin@example.invalid');

  insert into public.schools (id, name)
  values
    (v_school_one_id, 'Account history school one'),
    (v_school_two_id, 'Account history school two');

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    role,
    status,
    approval_status,
    school_id
  )
  values (
    v_teacher_id,
    'account-history-teacher@example.invalid',
    'teacher',
    'approved',
    'approved',
    v_school_one_id
  )
  returning id into v_account_id;

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    role,
    status,
    approval_status
  )
  values (
    v_new_teacher_id,
    'account-history-new-teacher@example.invalid',
    'teacher',
    'approved',
    'approved'
  )
  returning id into v_new_account_id;

  insert into public.classes (id, teacher_id, school_id, name)
  values (
    v_class_id,
    v_teacher_id,
    v_school_one_id,
    'Account history class'
  );

  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  perform public.admin_set_teacher_account_status(
    v_account_id,
    'disabled',
    'Employment could not be confirmed.'
  );
  perform public.admin_set_teacher_account_status(
    v_account_id,
    'approved',
    null
  );
  perform public.admin_set_teacher_account_status(
    v_account_id,
    'rejected',
    'School asked us to decline access.'
  );

  select count(*)
  into v_count
  from public.teacher_account_decision_events event
  where event.account_id = v_account_id;

  if v_count <> 3 then
    raise exception
      'decision history was overwritten instead of appended: % events',
      v_count;
  end if;

  if exists (
    select 1
    from public.teacher_account_decision_events event
    where event.account_id = v_account_id
      and (
        event.decided_by is distinct from v_admin_id
        or event.decided_at is null
      )
  ) then
    raise exception 'decision actor or timestamp was not server-owned';
  end if;

  select event.id
  into v_event_id
  from public.teacher_account_decision_events event
  where event.account_id = v_account_id
  order by event.decided_at
  limit 1;

  begin
    update public.teacher_account_decision_events
    set reason = 'Attempted rewrite of saved history.'
    where id = v_event_id;
    raise exception 'decision-history update unexpectedly succeeded';
  exception
    when sqlstate '42501' then
      null;
  end;

  begin
    delete from public.teacher_account_decision_events
    where id = v_event_id;
    raise exception 'decision-history delete unexpectedly succeeded';
  exception
    when sqlstate '42501' then
      null;
  end;

  begin
    perform public.admin_set_teacher_account_status(
      v_new_account_id,
      'approved',
      null
    );
    raise exception 'account without a school was unexpectedly approved';
  exception
    when sqlstate '22023' then
      null;
  end;

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);

  begin
    perform public.teacher_set_school('Account history school two');
    raise exception 'ordinary teacher moved their tenant';
  exception
    when sqlstate '42501' then
      null;
  end;

  select class.school_id
  into v_school_id
  from public.classes class
  where class.id = v_class_id;

  if v_school_id is distinct from v_school_one_id then
    raise exception 'blocked tenant transfer still moved the class';
  end if;

  perform public.teacher_set_school('Account history school one');

  perform set_config('request.jwt.claim.sub', v_new_teacher_id::text, true);
  perform public.teacher_set_school('Account history school two');

  select account.school_id
  into v_school_id
  from public.pending_teacher_accounts account
  where account.id = v_new_account_id;

  if v_school_id is distinct from v_school_two_id then
    raise exception 'approved teacher with no school could not set it once';
  end if;
end;
$test$;

rollback;
