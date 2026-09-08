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


do $test$
declare
  first_login json;
  other_login json;
  result json;
  stored_expiry timestamptz;
begin
  first_login := public.student_login('a1400000-0000-4000-8000-000000000001', '123', 'synthetic-recovery-device', 'NULL24');
  other_login := public.student_login('a1400000-0000-4000-8000-000000000001', '123', 'synthetic-other-device', 'NULL24');
  if first_login->>'token' is null or other_login->>'token' is null then raise exception 'login failed'; end if;
  select expires_at into stored_expiry from public.student_sessions where token = first_login->>'token';
  if (first_login->>'expires_at')::timestamptz is distinct from stored_expiry then raise exception 'expiry is not server owned'; end if;
  set local role anon;
  result := public.student_revoke_session(first_login->>'token');
  if result->>'ok' <> 'true' then raise exception 'revoke failed'; end if;
  perform public.student_revoke_session(first_login->>'token');
  perform public.student_revoke_session(null);
  perform public.student_revoke_session('unknown-synthetic-token');
  reset role;
  if (public.student_from_token(first_login->>'token')).id is not null then raise exception 'revoked token still resolves'; end if;
  if (public.student_from_token(other_login->>'token')).id is null then raise exception 'unrelated session revoked'; end if;
  result := public.student_save_progress(first_login->>'token', 'phonics_letters', 'm', '{"status":"done"}');
  if result->>'error' <> 'invalid_session' then raise exception 'revoked write accepted'; end if;
  begin
    perform public.student_get_progress(first_login->>'token');
    raise exception 'revoked read accepted';
  exception when others then
    if sqlerrm <> 'invalid_session' then raise; end if;
  end;
  update public.student_sessions set expires_at = now() - interval '1 second' where token = other_login->>'token';
  if (public.student_from_token(other_login->>'token')).id is not null then raise exception 'server-expired token resolves'; end if;
end;
$test$;
rollback;
