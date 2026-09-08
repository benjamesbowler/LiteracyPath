-- Execute after every forward migration in an isolated database as its owner.
-- No persistent fixtures: the entire suite rolls back, including rate buckets.
begin;
set local search_path = public, extensions;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('a1100000-0000-4000-8000-000000000001', 'login-test@example.invalid', now(), '{"audit_only":true}');
insert into public.schools (id, name)
values ('a1200000-0000-4000-8000-000000000001', 'Synthetic Login School');
insert into public.classes (id, teacher_id, school_id, name, access_code)
values ('a1300000-0000-4000-8000-000000000001',
  'a1100000-0000-4000-8000-000000000001', 'a1200000-0000-4000-8000-000000000001',
  'Synthetic Login Class', 'NULL24');
insert into public.students (id, teacher_id, class_id, name, symbol_password)
values ('a1400000-0000-4000-8000-000000000001',
  'a1100000-0000-4000-8000-000000000001', 'a1300000-0000-4000-8000-000000000001',
  'Synthetic Login Learner', '123');

create temporary table login_cases (
  label text, sequence text, device text default 'synthetic-login-device-0001',
  code text default 'NULL24', setup text default 'normal',
  expected_error text, expected_failures integer default 0,
  expected_event text, expected_ok boolean default false
);
insert into login_cases (label, sequence, expected_error, expected_failures, expected_event) values
  ('null sequence', null, 'wrong_password', 1, 'login_failed'),
  ('empty sequence', '', 'wrong_password', 1, 'login_failed'),
  ('short sequence', '12', 'wrong_password', 1, 'login_failed'),
  ('long sequence', '1234', 'wrong_password', 1, 'login_failed'),
  ('zero digit', '120', 'wrong_password', 1, 'login_failed'),
  ('non-digit sequence', 'abc', 'wrong_password', 1, 'login_failed'),
  ('whitespace sequence', ' 123', 'wrong_password', 1, 'login_failed'),
  ('trailing newline', E'123\n', 'wrong_password', 1, 'login_failed'),
  ('wrong sequence', '999', 'wrong_password', 1, 'login_failed');
insert into login_cases (label, sequence, setup, expected_error, expected_failures, expected_event) values
  ('missing stored password', '123', 'no-password', 'no_password', 0, null),
  ('both passwords null', null, 'no-password', 'no_password', 0, null),
  ('archived learner', '123', 'archived', 'not_found', 0, null),
  ('missing learner', '123', 'missing-id', 'not_found', 0, null),
  ('null learner', '123', 'null-id', 'not_found', 0, null),
  ('expired class code', '123', 'expired-code', 'code_expired', 0, 'code_expired'),
  ('active password lockout', '123', 'locked', 'locked', 5, 'login_locked'),
  ('null during lockout', null, 'locked', 'locked', 5, 'login_locked'),
  ('recent failure increments', null, 'recent-failure', 'wrong_password', 3, 'login_failed'),
  ('stale failure restarts', null, 'stale-failure', 'wrong_password', 1, 'login_failed'),
  ('device throttle', '123', 'throttle-device', 'rate_limited', 0, 'rate_limited'),
  ('network throttle', '123', 'throttle-network', 'rate_limited', 0, 'rate_limited'),
  ('code throttle', '123', 'throttle-code', 'rate_limited', 0, 'rate_limited');
insert into login_cases (label, sequence, device, expected_error, expected_event) values
  ('null device', '123', null, 'invalid_device', 'rate_limited'),
  ('short device', '123', 'bad', 'invalid_device', 'rate_limited'),
  ('invalid device characters', '123', 'invalid!device!value', 'invalid_device', 'rate_limited');
insert into login_cases (label, sequence, code, expected_error, expected_event) values
  ('null code', '123', null, 'invalid_code', 'code_rejected'),
  ('empty code', '123', '', 'invalid_code', 'code_rejected'),
  ('wrong code', '123', 'WRONG24', 'invalid_code', 'code_rejected');
insert into login_cases (label, sequence, setup, expected_ok, expected_event) values
  ('correct sequence', '123', 'normal', true, 'login_succeeded'),
  ('success resets recent failures', '123', 'recent-failure', true, 'login_succeeded'),
  ('expired lockout allows success', '123', 'stale-failure', true, 'login_succeeded');
insert into login_cases (label, sequence, code, expected_ok, expected_event) values
  ('normalized valid class code', '123', ' null24 ', true, 'login_succeeded');

do $cases$
declare
  c record;
  browser_role text;
  learner constant uuid := 'a1400000-0000-4000-8000-000000000001';
  class_id constant uuid := 'a1300000-0000-4000-8000-000000000001';
  result jsonb;
  session_count integer;
  failed_count integer;
  failed_at timestamptz;
  dimension text;
  fingerprint text;
begin
  foreach browser_role in array array['anon', 'authenticated'] loop
    for c in select * from login_cases loop
      delete from public.student_sessions where student_id = learner;
      delete from public.class_access_events;
      delete from public.class_access_rate_limits;
      update public.students set symbol_password = case when c.setup = 'no-password' then null else '123' end,
        archived_at = case when c.setup = 'archived' then now() else null end,
        failed_login_count = case when c.setup in ('locked', 'stale-failure') then 5
          when c.setup = 'recent-failure' then 2 else 0 end,
        last_failed_login_at = case when c.setup in ('locked', 'recent-failure') then now()
          when c.setup = 'stale-failure' then now() - interval '2 minutes' else null end
        where id = learner;
      update public.classes set access_code_expires_at =
        case when c.setup = 'expired-code' then now() - interval '1 second' else null end
        where id = class_id;
      perform set_config('request.headers', '{"x-forwarded-for":"198.51.100.91"}', true);
      perform set_config('request.jwt.claim.sub', '', true);
      perform set_config('request.jwt.claim.role', browser_role, true);
      if c.setup like 'throttle-%' then
        dimension := substr(c.setup, 10);
        fingerprint := case dimension
          when 'device' then public.class_access_fingerprint('device', c.device)
          when 'network' then public.class_access_network_fingerprint()
          else public.class_access_fingerprint('code', c.code) end;
        insert into public.class_access_rate_limits (bucket_key, dimension, attempt_count, locked_until)
          values (public.class_access_fingerprint('bucket', dimension || ':' || fingerprint),
            dimension, 1, now() + interval '2 minutes');
      end if;
      execute format('set local role %I', browser_role);
      result := public.student_login(
        case when c.setup = 'null-id' then null when c.setup = 'missing-id'
          then 'a1400000-0000-4000-8000-000000000099'::uuid else learner end,
        c.sequence, c.device, c.code)::jsonb;
      execute 'reset role';
      select count(*) into session_count from public.student_sessions where student_id = learner;
      select failed_login_count, last_failed_login_at into failed_count, failed_at
        from public.students where id = learner;
      if (result ->> 'ok')::boolean is distinct from c.expected_ok
        or result ->> 'error' is distinct from c.expected_error
        or session_count <> (case when c.expected_ok then 1 else 0 end)
        or failed_count <> c.expected_failures
      then
        raise exception '% / %: wrong result or effects (ok %, error %, sessions %, failures %)',
          browser_role, c.label, result ->> 'ok', result ->> 'error', session_count, failed_count;
      end if;
      if c.expected_ok then
        if result ->> 'token' is null or length(result ->> 'token') <> 64
          or not exists (select 1 from public.student_sessions
            where student_id = learner and token = result ->> 'token'
              and not revoked and expires_at > now())
          or failed_at is not null
        then raise exception '% / %: invalid successful session', browser_role, c.label; end if;
      elsif result ? 'token' then
        raise exception '% / %: denied response includes token', browser_role, c.label;
      end if;
      if c.expected_error = 'wrong_password' and (failed_at is null or failed_at < now()) then
        raise exception '% / %: failure timestamp not updated', browser_role, c.label;
      end if;
      if c.expected_error in ('locked', 'rate_limited')
        and coalesce((result ->> 'retry_seconds')::integer, 0) < 1 then
        raise exception '% / %: retry window missing', browser_role, c.label;
      end if;
      if (select count(*) from public.class_access_events) <>
        (case when c.expected_event is null then 0 else 1 end)
        or (c.expected_event is not null and not exists
          (select 1 from public.class_access_events where event_type = c.expected_event)) then
        raise exception '% / %: wrong audit event', browser_role, c.label;
      end if;
    end loop;
    execute format('set local role %I', browser_role);
    begin
      perform public.student_login(learner, '123');
      raise exception 'obsolete login overload still callable';
    exception when undefined_function or insufficient_privilege then null;
    end;
    execute 'reset role';
  end loop;
end
$cases$;

rollback;
