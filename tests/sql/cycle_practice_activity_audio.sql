-- Run inside the isolated Cycle Practice fixture transaction. Its owner and
-- token boundary come from cycle_practice_evidence.sql; the caller rolls back.
do $test$
declare
  token text;
  result json;
  attempt jsonb;
  question jsonb;
  changed jsonb;
  stored jsonb;
  mechanic text;
  delivery text;
  expected_status text;
  check_session uuid := 'a1500000-0000-4000-8000-000000000001';
begin
  result := public.student_login('a1400000-0000-4000-8000-000000000001','123','cycle-play-audio-fixture','NULL24');
  token := result->>'token';
  if token is null then raise exception 'new activity synthetic login failed: %', result; end if;
  attempt := '{"attemptId":"new-activity","assessmentType":"cycle_practice_check","contentVersion":"cycle-practice-v2",
    "assessmentVersion":"cycle-practice-v2","policyVersion":"cycle-practice-policy-v2","cycleId":"cycle-1","cycleNumber":1,
    "practiceSeconds":1800,"sessionElapsedSeconds":1900,"checkSeconds":100,"totalQuestions":1}'::jsonb;

  foreach mechanic in array array['pictureSound','letterMatch','rhymeMatch','wordBuild','soundSort','letterTrace'] loop
    question := jsonb_build_object('questionId', 'new-' || mechanic, 'mechanicId', mechanic,
      'construct', 'authored_activity', 'evidenceConstruct', 'authored_activity', 'selected', 'a',
      'evidence', jsonb_build_object('activityRevision', 'cycle-play-2026-09'),
      'audioRequired', true, 'audioDelivery', 'delivered', 'responseStatus', 'correct', 'isCorrect', true);
    expected_status := 'completed';
    if mechanic = 'letterTrace' then
      question := question || jsonb_build_object('evidence', jsonb_build_object(
        'activityRevision', 'cycle-play-2026-09', 'independent', false, 'supportLevel', 1),
        'responseStatus', 'supported', 'isCorrect', null);
      expected_status := 'incomplete';
    end if;
    changed := attempt || jsonb_build_object('attemptId', 'delivered-' || mechanic, 'questionRecords', jsonb_build_array(question));
    set local role anon;
    result := public.student_complete_focus_cycle_practice(token, check_session, changed);
    reset role;
    if result->>'ok' is distinct from 'true' or result->>'status' is distinct from expected_status
      then raise exception 'delivered % rejected: %', mechanic, result; end if;
    select payload into stored from public.student_focus_cycle_practice_attempts where attempt_id = 'delivered-' || mechanic;
    if stored#>>'{questionRecords,0,evidence,activityRevision}' is distinct from 'cycle-play-2026-09'
      then raise exception 'activity revision lost for %', mechanic; end if;
    if mechanic = 'letterTrace' and (stored->>'scoredQuestions' <> '0' or stored->>'supportedCount' <> '1')
      then raise exception 'guided tracing became independent: %', stored; end if;
    result := public.student_complete_focus_cycle_practice(token, check_session, changed);
    if result->>'duplicate' is distinct from 'true' then raise exception 'new activity exact retry failed: %', mechanic; end if;
    result := public.student_complete_focus_cycle_practice(token, check_session, changed || '{"accuracy":99}');
    if result->>'error' is distinct from 'attempt_conflict' then raise exception 'new activity mutated retry accepted: %', mechanic; end if;

    -- Neither a false authored requirement nor a not-required delivery may
    -- bypass the instruction/target requirement for any new activity.
    changed := attempt || jsonb_build_object('attemptId', 'bypass-' || mechanic,
      'questionRecords', jsonb_build_array(question || '{"audioRequired":false,"audioDelivery":"not_required"}'));
    result := public.student_complete_focus_cycle_practice(token, check_session, changed);
    if result->>'error' is distinct from 'invalid_cycle_practice_evidence'
      then raise exception 'audio requirement bypassed for %: %', mechanic, result; end if;
    changed := attempt || jsonb_build_object('attemptId', 'not-required-' || mechanic,
      'questionRecords', jsonb_build_array(question || '{"audioDelivery":"not_required"}'));
    result := public.student_complete_focus_cycle_practice(token, check_session, changed);
    if result->>'error' is distinct from 'invalid_cycle_practice_evidence'
      then raise exception 'not-required delivery accepted for %: %', mechanic, result; end if;

    foreach delivery in array array['pending','unavailable','interrupted'] loop
      changed := attempt || jsonb_build_object('attemptId', delivery || '-' || mechanic,
        'questionRecords', jsonb_build_array(question || jsonb_build_object(
          'audioDelivery', delivery, 'responseStatus', 'media_failed', 'isCorrect', null)));
      result := public.student_complete_focus_cycle_practice(token, check_session, changed);
      if result->>'ok' is distinct from 'true' or result->>'status' is distinct from 'incomplete'
        then raise exception 'honest % media state rejected for %: %', delivery, mechanic, result; end if;
      select payload into stored from public.student_focus_cycle_practice_attempts where attempt_id = delivery || '-' || mechanic;
      if stored->>'scoredQuestions' <> '0' or stored->>'mediaFailedCount' <> '1' or stored->'accuracy' <> 'null'::jsonb
        then raise exception 'undelivered % audio produced accuracy for %: %', delivery, mechanic, stored; end if;
      changed := attempt || jsonb_build_object('attemptId', 'false-score-' || delivery || '-' || mechanic,
        'questionRecords', jsonb_build_array(question || jsonb_build_object(
          'audioDelivery', delivery, 'responseStatus', 'correct', 'isCorrect', true)));
      result := public.student_complete_focus_cycle_practice(token, check_session, changed);
      if result->>'error' is distinct from 'invalid_cycle_practice_evidence'
        then raise exception 'undelivered % audio scored for %: %', delivery, mechanic, result; end if;
    end loop;
  end loop;

  -- Pre-overhaul tracing keeps its original no-audio contract, so a frozen
  -- legacy v2 attempt can still be saved without rewriting its evidence.
  question := question || '{"evidence":{"supportLevel":1},"audioRequired":false,"audioDelivery":"not_required","responseStatus":"supported","isCorrect":null}';
  changed := attempt || jsonb_build_object('attemptId', 'legacy-v2-trace', 'questionRecords', jsonb_build_array(question));
  result := public.student_complete_focus_cycle_practice(token, check_session, changed);
  if result->>'ok' is distinct from 'true' then raise exception 'old tracing contract changed: %', result; end if;
  result := public.student_complete_focus_cycle_practice(token, check_session, changed);
  if result->>'duplicate' is distinct from 'true' then raise exception 'old tracing exact retry changed'; end if;
  question := question || '{"mechanicId":"letterMatch"}';
  changed := attempt || jsonb_build_object('attemptId', 'new-id-no-revision-bypass', 'questionRecords', jsonb_build_array(question));
  result := public.student_complete_focus_cycle_practice(token, check_session, changed);
  if result->>'error' is distinct from 'invalid_cycle_practice_evidence'
    then raise exception 'new activity omitted revision to bypass audio: %', result; end if;
  question := question || '{"mechanicId":"unknownActivity"}';
  changed := attempt || jsonb_build_object('attemptId', 'unknown-activity', 'questionRecords', jsonb_build_array(question));
  result := public.student_complete_focus_cycle_practice(token, check_session, changed);
  if result->>'error' is distinct from 'invalid_cycle_practice_evidence'
    then raise exception 'unknown activity accepted: %', result; end if;
end;
$test$;
