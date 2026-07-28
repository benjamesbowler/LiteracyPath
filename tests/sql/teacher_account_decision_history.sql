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
  v_event record;
  v_count integer;
  v_school_id uuid;
begin
  -- The auth-user trigger creates pending account rows. Reusing those rows is
  -- deliberate: an explicit second insert would only test a fixture collision.
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

  update public.pending_teacher_accounts
  set role = 'teacher',
      status = 'approved',
      approval_status = 'approved',
      school_id = v_school_one_id
  where user_id = v_teacher_id
  returning id into v_account_id;

  update public.pending_teacher_accounts
  set role = 'teacher',
      status = 'approved',
      approval_status = 'approved'
  where user_id = v_new_teacher_id
  returning id into v_new_account_id;

  if v_account_id is null or v_new_account_id is null then
    raise exception 'auth-user account trigger did not create both fixtures';
  end if;

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

  -- Assert the exact transition sequence, reason rules and school snapshot.
  select event.*
  into v_event
  from public.teacher_account_decision_events event
  where event.account_id = v_account_id
  order by event.decided_at, event.created_at, event.id
  offset 0 limit 1;

  if v_event.previous_status is distinct from 'approved'
     or v_event.decision_status is distinct from 'disabled'
     or v_event.reason is distinct from 'Employment could not be confirmed.'
     or v_event.school_id is distinct from v_school_one_id
     or v_event.school_name is distinct from 'Account history school one'
  then
    raise exception 'first decision event was not the expected disable snapshot: %',
      row_to_json(v_event);
  end if;

  select event.*
  into v_event
  from public.teacher_account_decision_events event
  where event.account_id = v_account_id
  order by event.decided_at, event.created_at, event.id
  offset 1 limit 1;

  if v_event.previous_status is distinct from 'disabled'
     or v_event.decision_status is distinct from 'approved'
     or v_event.reason is not null
     or v_event.school_id is distinct from v_school_one_id
     or v_event.school_name is distinct from 'Account history school one'
  then
    raise exception 'second decision event was not the expected approval snapshot: %',
      row_to_json(v_event);
  end if;

  select event.*
  into v_event
  from public.teacher_account_decision_events event
  where event.account_id = v_account_id
  order by event.decided_at, event.created_at, event.id
  offset 2 limit 1;

  if v_event.previous_status is distinct from 'approved'
     or v_event.decision_status is distinct from 'rejected'
     or v_event.reason is distinct from 'School asked us to decline access.'
     or v_event.school_id is distinct from v_school_one_id
     or v_event.school_name is distinct from 'Account history school one'
  then
    raise exception 'third decision event was not the expected rejection snapshot: %',
      row_to_json(v_event);
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

  -- The table constraint must be at least as strict as the RPC.
  begin
    insert into public.teacher_account_decision_events (
      account_id,
      teacher_user_id,
      previous_status,
      decision_status,
      reason
    )
    values (
      v_account_id,
      v_teacher_id,
      'approved',
      'rejected',
      null
    );
    raise exception 'rejected event without a reason unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.teacher_account_decision_events (
      account_id,
      teacher_user_id,
      previous_status,
      decision_status,
      reason
    )
    values (
      v_account_id,
      v_teacher_id,
      'rejected',
      'approved',
      'Approval must not carry a reason.'
    );
    raise exception 'approved event with a reason unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

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
    when sqlstate '42501' then null;
  end;

  begin
    delete from public.teacher_account_decision_events
    where id = v_event_id;
    raise exception 'decision-history delete unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  begin
    perform public.admin_set_teacher_account_status(
      v_new_account_id,
      'approved',
      null
    );
    raise exception 'account without a school was unexpectedly approved';
  exception
    when sqlstate '22023' then null;
  end;

  -- A rejected account must not use even the same-school no-op as an
  -- authenticated tenant lookup.
  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  begin
    perform public.teacher_set_school('Account history school one');
    raise exception 'rejected teacher reached the same-school result';
  exception
    when sqlstate '42501' then null;
  end;

  select class.school_id
  into v_school_id
  from public.classes class
  where class.id = v_class_id;

  if v_school_id is distinct from v_school_one_id then
    raise exception 'rejected account school lookup still moved the class';
  end if;

  -- Reapprove through the audited boundary before testing approved-teacher
  -- school behaviour. This creates a fourth, truthful transition event.
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform public.admin_set_teacher_account_status(v_account_id, 'approved', null);

  select event.*
  into v_event
  from public.teacher_account_decision_events event
  where event.account_id = v_account_id
  order by event.decided_at desc, event.created_at desc, event.id desc
  limit 1;

  if v_event.previous_status is distinct from 'rejected'
     or v_event.decision_status is distinct from 'approved'
     or v_event.reason is not null
     or v_event.school_id is distinct from v_school_one_id
  then
    raise exception 'reapproval event did not preserve the expected transition';
  end if;

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);

  begin
    perform public.teacher_set_school('Account history school two');
    raise exception 'ordinary teacher moved their tenant';
  exception
    when sqlstate '42501' then null;
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

do $grant_contract$
begin
  if exists (
    select 1
    from information_schema.table_privileges privilege
    where privilege.table_schema = 'public'
      and privilege.table_name = 'teacher_account_decision_events'
      and privilege.grantee = 'PUBLIC'
      and privilege.privilege_type = 'SELECT'
  ) then
    raise exception 'PUBLIC retained SELECT on decision history';
  end if;

  if has_table_privilege(
    'anon',
    'public.teacher_account_decision_events',
    'SELECT'
  ) then
    raise exception 'anonymous role retained SELECT on decision history';
  end if;

  if not has_table_privilege(
    'authenticated',
    'public.teacher_account_decision_events',
    'SELECT'
  ) then
    raise exception 'authenticated role lacks the RLS-gated SELECT grant';
  end if;
end;
$grant_contract$;

-- Exercise the real grants and RLS policy as PostgREST's authenticated role.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'f1100000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $admin_read$
declare
  v_visible_count integer;
  v_admin boolean;
begin
  select count(*)
  into v_visible_count
  from public.teacher_account_decision_events
  where teacher_user_id = 'f1200000-0000-4000-8000-000000000001';

  v_admin := public.is_app_admin(auth.uid());

  if v_visible_count <> 4 then
    raise exception
      'authenticated administrator could not read complete history (visible %, uid %, admin %)',
      v_visible_count,
      auth.uid(),
      v_admin;
  end if;
end;
$admin_read$;

select set_config(
  'request.jwt.claim.sub',
  'f1200000-0000-4000-8000-000000000001',
  true
);

do $teacher_read$
begin
  if (select count(*) from public.teacher_account_decision_events) <> 0 then
    raise exception 'ordinary teacher read administrator decision history';
  end if;
end;
$teacher_read$;

-- Anonymous/Public has no table grant at all, rather than a permissive empty
-- result that could regress if a future policy changed.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $anonymous_read$
begin
  begin
    perform count(*) from public.teacher_account_decision_events;
    raise exception 'anonymous role unexpectedly selected decision history';
  exception
    when insufficient_privilege then null;
  end;
end;
$anonymous_read$;

reset role;
rollback;
