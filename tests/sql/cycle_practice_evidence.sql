-- Execute after every forward migration in an isolated database as its owner.
-- No persistent fixtures: the entire suite rolls back, including rate buckets.
begin;
set local search_path = public, extensions;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('a1100000-0000-4000-8000-000000000001', 'login-test@example.invalid', now(), '{"audit_only":true}');
insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values
  ('a1100000-0000-4000-8000-000000000002','other-teacher@example.invalid',now(),'{"audit_only":true}');
update public.pending_teacher_accounts set role='teacher',status='approved',approval_status='approved'
where user_id in ('a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000002');
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

insert into public.student_focus_sessions (id,teacher_id,class_id,target,content_version,started_at,expires_at)
values ('a1500000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001',
'a1300000-0000-4000-8000-000000000001','cycle_practice','cycle-practice-v2', now()-interval '40 minutes', now()+interval '20 minutes');
insert into public.student_focus_session_members (session_id,student_id,resolved_config)
values ('a1500000-0000-4000-8000-000000000001','a1400000-0000-4000-8000-000000000001','{"cycle_id":"cycle-1","cycle_number":1}');
do $test$
declare
  token text;
  result json;
  attempt jsonb;
  altered jsonb;
  stored jsonb;
  check_session uuid := 'a1500000-0000-4000-8000-000000000001';
begin
  result := public.student_login('a1400000-0000-4000-8000-000000000001','123','synthetic-cycle-device','NULL24');
  token := result->>'token';
  if token is null then raise exception 'synthetic login: %', result; end if;
  attempt := '{"attemptId":"cycle-test-1","assessmentType":"cycle_practice_check","contentVersion":"cycle-practice-v2",
    "assessmentVersion":"cycle-practice-v2","policyVersion":"cycle-practice-policy-v2","cycleId":"cycle-1","cycleNumber":1,
    "practiceSeconds":1800,"sessionElapsedSeconds":1900,"checkSeconds":100,"totalQuestions":4,"correctCount":999,
    "scoredQuestions":999,"status":"completed","accuracy":100,
    "practiceManifest":[{"construct":"letter_match","responses":12}], "checkedConstructs":["spoofed"],
    "questionRecords":[
      {"questionId":"q1","construct":"letter_match","evidenceConstruct":"letter_match","mechanicId":"letterPair","selected":"a","evidence":{},"audioRequired":false,"audioDelivery":"not_required","responseStatus":"correct","isCorrect":true},
      {"questionId":"q2","construct":"letter_match","evidenceConstruct":"letter_match","mechanicId":"letterPair","selected":"b","evidence":{},"audioRequired":false,"audioDelivery":"not_required","responseStatus":"incorrect","isCorrect":false},
      {"questionId":"q3","construct":"letter_formation","evidenceConstruct":"supported_trace","mechanicId":"letterTrace","selected":"a","evidence":{"supportLevel":1},"audioRequired":false,"audioDelivery":"not_required","responseStatus":"supported","isCorrect":null},
      {"questionId":"q4","construct":"phoneme","evidenceConstruct":"phoneme","mechanicId":"soundGate","selected":null,"evidence":{},"audioRequired":true,"audioDelivery":"unavailable","responseStatus":"media_failed","isCorrect":null}
    ]}'::jsonb;
  perform set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000001', true);
  result := public.teacher_get_student_focus_session(check_session);
  if result#>>'{members,0,cycle_practice_result}' is not null then raise exception 'unsubmitted check exposes result'; end if;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  result := public.student_complete_focus_cycle_practice('unknown-synthetic-token', check_session, attempt);
  if result->>'error' is distinct from 'invalid_session' then raise exception 'anonymous invalid token accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token, check_session, attempt);
  reset role;
  if result->>'ok' <> 'true' or result->>'status' <> 'incomplete' then raise exception 'mixed evidence rejected: %', result; end if;
  select payload into stored from public.student_focus_cycle_practice_attempts where attempt_id='cycle-test-1';
  if stored->>'correctCount' <> '1' or stored->>'scoredQuestions' <> '2' or stored->>'accuracy' <> '50'
    or stored->>'supportedCount' <> '1' or stored->>'mediaFailedCount' <> '1' or stored->>'totalQuestions' <> '4'
  then raise exception 'wrong independently recomputed denominator %',stored; end if;
  perform set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000001', true);
  result := public.teacher_get_student_focus_session(check_session);
  if result#>>'{members,0,cycle_practice_result,scoredQuestions}' is distinct from '2'
    or result#>>'{members,0,cycle_practice_result,supportedCount}' is distinct from '1'
    or result#>>'{members,0,cycle_practice_result,mediaFailedCount}' is distinct from '1'
    or result#>>'{members,0,cycle_practice_result,practiceSeconds}' is distinct from '1800'
    or result#>>'{members,0,cycle_practice_result,practiceManifest,0,responses}' is distinct from '12'
    or result#>>'{members,0,cycle_practice_result,practiceManifestSource}' is distinct from 'client_reported'
    or (result#>'{members,0,cycle_practice_result,checkedConstructs}')::jsonb is distinct from '["letter_formation","letter_match","phoneme"]'::jsonb
  then raise exception 'teacher missing truthful result %',result; end if;
  if jsonb_array_length((result#>'{members,0,cycle_practice_result,questionRecords}')::jsonb) <> 3
    or result#>>'{members,0,cycle_practice_result,questionRecords,0,questionId}' is distinct from 'q2'
    or result#>>'{members,0,cycle_practice_result,questionRecords,1,evidence,supportLevel}' is distinct from '1'
  then raise exception 'teacher coaching includes correct item or loses support evidence'; end if;
  perform set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000002', true);
  result := public.teacher_get_student_focus_session(check_session);
  if result->>'session' is not null then raise exception 'another teacher received result'; end if;
  perform set_config('request.jwt.claim.sub', '', true);
  if (select status from public.student_focus_session_members where session_id=check_session) <> 'needs_attention'
  then raise exception 'incomplete check marked completed'; end if;
  result := public.student_complete_focus_cycle_practice(token, check_session, attempt);
  if result->>'duplicate' <> 'true' then raise exception 'identical retry not duplicate'; end if;
  result := public.student_complete_focus_cycle_practice(token, check_session, attempt || '{"accuracy":99}');
  if result->>'error' <> 'attempt_conflict' then raise exception 'mutated retry accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token, 'a1500000-0000-4000-8000-000000000002', attempt);
  if result->>'error' <> 'attempt_conflict' then raise exception 'cross-session retry accepted'; end if;
  -- A supported correct boolean, missing support disposition, or false media
  -- requirement must never turn into independent evidence.
  altered := jsonb_set(attempt || '{"attemptId":"bad-support"}', '{questionRecords,2,isCorrect}', 'true');
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'ok' <> 'false' then raise exception 'supported true accepted'; end if;
  altered := jsonb_set(jsonb_set(attempt || '{"attemptId":"bad-support2"}', '{questionRecords,2,isCorrect}', 'true'),'{questionRecords,2,responseStatus}','"correct"');
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'ok' <> 'false' then raise exception 'supported score accepted'; end if;
  altered := jsonb_set(attempt || '{"attemptId":"bad-audio"}', '{questionRecords,3,audioRequired}', 'false');
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'ok' <> 'false' then raise exception 'authored media requirement bypassed'; end if;
  altered := jsonb_set(attempt || '{"attemptId":"bad-null"}', '{questionRecords,0,evidence}', 'null');
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'ok' <> 'false' then raise exception 'null evidence accepted'; end if;
  altered := jsonb_set(attempt || '{"attemptId":"bad-repeat"}', '{questionRecords,1,questionId}', '"q1"');
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'ok' <> 'false' then raise exception 'repeated question accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token,check_session,attempt || '{"attemptId":"bad-clock","sessionElapsedSeconds":999999}');
  if result->>'error' <> 'invalid_cycle_practice_duration' then raise exception 'manufactured elapsed accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token,check_session,attempt || '{"attemptId":"bad-active","practiceSeconds":1799}');
  if result->>'error' <> 'invalid_cycle_practice_duration' then raise exception 'premature check accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token,check_session,attempt || '{"attemptId":"bad-overlap","sessionElapsedSeconds":1801}');
  if result->>'error' <> 'invalid_cycle_practice_duration' then raise exception 'overlapping active and check accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token,check_session,attempt || '{"attemptId":"bad-manifest","practiceManifest":[{"construct":"letters","responses":0}]}');
  if result->>'error' is distinct from 'invalid_cycle_practice_manifest' then raise exception 'zero response manifest accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token,check_session,attempt || '{"attemptId":"bad-manifest-type","practiceManifest":[{"construct":"letters","responses":"12"}]}');
  if result->>'error' is distinct from 'invalid_cycle_practice_manifest' then raise exception 'string count accepted'; end if;
  -- All media failures mean no accuracy, not zero-percent literacy.
  altered := attempt || jsonb_build_object('attemptId','no-scored','totalQuestions',1,
    'questionRecords',jsonb_build_array(attempt->'questionRecords'->3));
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  select payload into stored from public.student_focus_cycle_practice_attempts where attempt_id='no-scored';
  if result->>'ok' <> 'true' or stored->'accuracy' <> 'null'::jsonb then raise exception 'missing evidence became zero'; end if;
  -- Old client evidence is retained without its inflated accuracy/time claim.
  altered := attempt || '{"attemptId":"legacy","contentVersion":"cycle-practice-v1"}';
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  select payload into stored from public.student_focus_cycle_practice_attempts where attempt_id='legacy';
  if result->>'ok' <> 'true' or stored->>'scoredQuestions' <> '0' or stored->'practiceSeconds' <> 'null'::jsonb
  then raise exception 'legacy evidence not safely retained'; end if;
  -- Fully independent check is completed; retry after session end still acks.
  altered := attempt || jsonb_build_object('attemptId','all-scored','totalQuestions',2,
    'questionRecords',jsonb_build_array(attempt->'questionRecords'->0,attempt->'questionRecords'->1));
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'status' <> 'completed' then raise exception 'independent check incomplete'; end if;
  update public.student_focus_sessions set status='ended',ended_at=now() where id=check_session;
  result := public.student_complete_focus_cycle_practice(token,check_session,altered);
  if result->>'duplicate' <> 'true' then raise exception 'post-end retry not acknowledged'; end if;
  update public.student_focus_sessions set ended_at=started_at+interval '31 minutes' where id=check_session;
  update public.student_focus_session_members set active=false,status='assigned',completed_at=null where session_id=check_session;
  result := public.student_complete_focus_cycle_practice(token,check_session,altered || '{"attemptId":"late-over-bound"}');
  if result->>'error' is distinct from 'invalid_cycle_practice_duration' then raise exception 'post-end time accepted'; end if;
  result := public.student_complete_focus_cycle_practice(token,check_session,altered || '{"attemptId":"late-recovery","sessionElapsedSeconds":1850,"checkSeconds":50}');
  if result->>'ok' is distinct from 'true' then raise exception 'first late recovery failed %',result; end if;
  select payload into stored from public.student_focus_cycle_practice_attempts where attempt_id='late-recovery';
  if stored->>'receivedAfterSessionEnd' is distinct from 'true' then raise exception 'late receive not flagged'; end if;
  if (select status from public.student_focus_session_members where session_id=check_session) <> 'assigned'
    then raise exception 'late recovery mutated inactive member'; end if;
  perform set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000001', true);
  result := public.teacher_get_student_focus_session(check_session);
  if result#>>'{session,id}' is distinct from check_session::text then raise exception 'owner cannot read ended result'; end if;
  perform set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000002', true);
  result := public.teacher_get_student_focus_session(check_session);
  if result->>'session' is not null then raise exception 'other teacher reads ended session'; end if;
  if (select count(*) from public.student_focus_cycle_practice_attempts) <> 5 then raise exception 'invalid attempts persisted'; end if;
end;
$test$;
rollback;
