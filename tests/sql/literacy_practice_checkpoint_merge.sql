begin;
do $$
declare
  old_value jsonb := '{"id":"run-a","startedAt":"2026-10-12T01:00:00Z","index":1,"checkpointRevision":1,"questionIds":["q1","q2","q3"],"answers":[true,true],"adaptiveStrands":{"reading":{"tier":3,"canProbe":true}},"responseEpisode":{"firstResponse":{"isCorrect":true}}}';
  next_value jsonb := '{"id":"run-a","startedAt":"2026-10-12T01:00:00Z","index":2,"checkpointRevision":2,"questionIds":["q1","q2","q4"],"answers":[true,true],"adaptiveStrands":{"reading":{"tier":2,"canProbe":false}},"responseEpisode":null}';
  new_run jsonb := '{"id":"run-b","startedAt":"2026-10-12T02:00:00Z","index":0,"checkpointRevision":1,"questionIds":["q5","q6","q7"],"completedAt":null}';
  cleared jsonb := '{"id":"run-a","startedAt":"2026-10-12T01:00:00Z","index":2,"checkpointRevision":3,"cleared":true}';
  merged jsonb;
  old_payload jsonb;
  next_payload jsonb;
  bloated jsonb;
begin
  if public.lp_merge_practice_checkpoint(old_value,next_value) <> next_value then raise exception 'adaptive snapshot was combined with an old plan/draft'; end if;
  if public.lp_merge_practice_checkpoint(next_value,old_value) <> next_value then raise exception 'late earlier save replaced newer snapshot'; end if;
  if public.lp_merge_practice_checkpoint(next_value,new_run) <> new_run then raise exception 'new sitting inherited old state'; end if;
  if public.lp_merge_practice_checkpoint(new_run,next_value) <> new_run then raise exception 'late old sitting replaced restarted sitting'; end if;
  if public.lp_merge_practice_checkpoint(next_value,cleared) <> cleared then raise exception 'clear was lost'; end if;
  if public.lp_merge_practice_checkpoint(cleared,next_value) <> cleared then raise exception 'late checkpoint resurrected cleared sitting'; end if;
  if public.lp_merge_practice_checkpoint(old_value,null) <> old_value then raise exception 'omitted checkpoint erased a sitting'; end if;
  if public.lp_merge_practice_checkpoint(old_value,'null'::jsonb) <> 'null'::jsonb then raise exception 'explicit legacy clear was ignored'; end if;
  if public.lp_merge_practice_checkpoint(old_value - 'checkpointRevision', next_value - 'checkpointRevision') <> next_value - 'checkpointRevision' then raise exception 'legacy progress did not advance'; end if;
  if public.lp_merge_practice_checkpoint(next_value - 'checkpointRevision', old_value - 'checkpointRevision') <> next_value - 'checkpointRevision' then raise exception 'legacy late progress regressed'; end if;
  select old_value || jsonb_build_object('index',40,'questionIds',jsonb_agg('q'||n)) into bloated from generate_series(1,286) n;
  if public.lp_merge_practice_checkpoint(bloated,next_value) <> next_value then raise exception 'healthy local save could not repair bloated legacy cloud snapshot'; end if;
  old_payload := jsonb_build_object('games',jsonb_build_object('literacy-practice',jsonb_build_object('stars',3,'practiceRecord',jsonb_build_object('completions',jsonb_build_array(jsonb_build_object('id','answer-a'))),'checkpoints',jsonb_build_object('practice',old_value)),'skills-trail',jsonb_build_object('checkpoints',jsonb_build_object('practice',old_value)),'rocket-run',jsonb_build_object('stars',3,'checkpoints',jsonb_build_object('easy',jsonb_build_object('level',5)))));
  next_payload := jsonb_build_object('games',jsonb_build_object('literacy-practice',jsonb_build_object('stars',1,'practiceRecord',jsonb_build_object('completions',jsonb_build_array(jsonb_build_object('id','answer-b'))),'checkpoints',jsonb_build_object('practice',next_value)),'skills-trail',jsonb_build_object('checkpoints',jsonb_build_object('practice',next_value)),'rocket-run',jsonb_build_object('stars',1,'checkpoints',jsonb_build_object('easy',jsonb_build_object('level',2)))));
  merged := public.lp_forward_merge_progress('learn_games',old_payload,next_payload);
  if merged#>'{games,literacy-practice,checkpoints,practice}' <> next_value then raise exception 'learn_games routing did not preserve snapshot'; end if;
  if merged#>'{games,skills-trail,checkpoints,practice}' <> next_value then raise exception 'shared Skills Trail snapshot was still forward merged'; end if;
  if merged#>>'{games,rocket-run,checkpoints,easy,level}' <> '5' then raise exception 'unrelated arcade checkpoint contract changed'; end if;
  if merged#>>'{games,literacy-practice,stars}' <> '3' then raise exception 'earned achievements were lost'; end if;
  if jsonb_array_length(merged#>'{games,literacy-practice,practiceRecord,completions}') <> 2 then raise exception 'saved answers were lost'; end if;
  if public.lp_forward_merge_progress('profile',old_payload,next_payload) <> next_payload then raise exception 'profile routing changed'; end if;
  if public.lp_forward_merge_progress('progress_check',old_payload,next_payload) <> next_payload then raise exception 'progress-check routing changed'; end if;
  if public.lp_forward_merge_progress('unrelated_area',old_payload,next_payload) <> public.lp_jsonb_forward_merge(old_payload,next_payload) then raise exception 'unrelated merge changed'; end if;
end;
$$;

-- The actual student_progress trigger must also work for teacher-mode upserts.
grant select,insert,update on public.student_progress to authenticated;
grant usage,select on all sequences in schema public to authenticated;
set local role authenticated;
insert into public.student_progress(student_id,area,key,payload) values
('00000000-0000-4000-8000-000000000001','learn_games','__all__','{"games":{"literacy-practice":{"checkpoints":{"practice":{"id":"run-a","index":1,"questionIds":["q1","q2","q3"]}}}}}');
update public.student_progress set payload='{"games":{"literacy-practice":{"checkpoints":{"practice":{"id":"run-a","index":2,"questionIds":["q1","q2","q4"]}}}}}' where student_id='00000000-0000-4000-8000-000000000001';
do $$ begin
  if (select payload#>'{games,literacy-practice,checkpoints,practice,questionIds}' from public.student_progress where student_id='00000000-0000-4000-8000-000000000001') <> '["q1","q2","q4"]'::jsonb then raise exception 'authenticated trigger still unions adaptive plans'; end if;
end; $$;
reset role;
rollback;
