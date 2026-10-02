import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { mergeElQuestProgress } from '../../src/utils/adventureMapProgress.js';
import { createLearningResponseEpisode,commitLearningResponse,advanceLearningResponseReceipt,recordLearningGuidedAction,recordLearningGuidedStep,startLearningWithModel,learningResponseCompletionEvent,mergeLearningResponseCheckpoints } from '../../src/utils/learningResponseState.js';
const migration=readFileSync(new URL('../../supabase/migrations/20261002180000_learning_response_evidence.sql',import.meta.url),'utf8');
const teacher='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',student='20000000-0000-4000-8000-000000000001',session='30000000-0000-4000-8000-000000000001';
const q={id:'cat',mechanicId:'letterMatch',construct:'initial_sound',targetWord:'cat',choices:['c','t','d'],answer:'c'};
let episode=createLearningResponseEpisode({id:'episode',instrument:'cycle_practice',question:q,expected:'c',transfer:{question:{...q,id:'pig',targetWord:'pig',choices:['p','b','r'],answer:'p'},expected:'p'}});
episode=commitLearningResponse(episode,{selected:'t',correct:false});
const first=learningResponseCompletionEvent(episode);
episode=recordLearningGuidedAction(advanceLearningResponseReceipt(episode),'c');
episode=advanceLearningResponseReceipt(commitLearningResponse(episode,{selected:'p',correct:true,supported:true}));
const finish=learningResponseCompletionEvent(episode);
const wrap=value=>({schemaVersion:2,progressEpoch:2,cycles:{},...value});
async function fixture(){
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('fixture.actor',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 create function public.assert_current_actor_teacher_access() returns void language plpgsql as $$begin if auth.uid() is null or auth.uid() not in ('${teacher}'::uuid,'${other}'::uuid) then raise exception 'teacher access required'; end if; end$$;
 create function public.end_expired_student_focus_sessions() returns void language sql as $$select$$;
 create table public.student_progress(student_id uuid,area text,key text,payload jsonb);
 create table public.students(id uuid,name text,class_id uuid);
 create table public.student_focus_sessions(id uuid,teacher_id uuid,class_id uuid,target text,selection_scope text,content_version text,status text,started_at timestamptz,expires_at timestamptz,updated_at timestamptz);
 create table public.student_focus_session_members(student_id uuid,session_id uuid,status text,current_view text,content_ok boolean,last_seen_at timestamptz,completed_at timestamptz,resolved_config jsonb);
 create table public.student_focus_cycle_practice_attempts(id uuid,attempt_id text,cycle_id text,created_at timestamptz,completed_at timestamptz,payload jsonb,total_questions int,scored_questions int,correct_count int,supported_count int,media_failed_count int,practice_seconds int,session_elapsed_seconds int,check_seconds int,evidence_verified boolean,session_id uuid,student_id uuid,teacher_id uuid);
 insert into students values('${student}','Synthetic learner','40000000-0000-4000-8000-000000000001');
 insert into student_focus_sessions values('${session}','${teacher}','40000000-0000-4000-8000-000000000001','cycle_practice','selected','student-focus-v1','active',now(),now()+interval '1 hour',now());
 insert into student_focus_session_members values('${student}','${session}','completed','cycle-practice',true,now(),now(),'{}');`);
 const base=readFileSync(new URL('../../supabase/migrations/20260902141014_reset_adventure_map_progress_epoch_2.sql',import.meta.url),'utf8');
 await db.exec(base.slice(base.indexOf('create or replace function public.lp_el_quest_number'),base.indexOf('-- Keep the newest complete')));
 await db.exec(readFileSync(new URL('../../supabase/migrations/20260928100000_adventure_check_snapshot_merge.sql',import.meta.url),'utf8'));
 await db.exec(migration);
 return db;
}
test('rich Cycle projection retains wrong first/model/correct transfer without changing formal score or ownership',async t=>{
 const db=await fixture();t.after(()=>db.close());
 const payload={completedAt:'2026-10-02T05:00:00Z',status:'completed',learningResponsePolicyVersion:'learning-response-v1',learningResponses:[first,finish],questionRecords:[{questionId:'formal-q',construct:'initial_sound',responseStatus:'incorrect',selected:'x'}],practiceManifest:[{construct:'initial_sound',responses:2}]};
 await db.query(`insert into public.student_focus_cycle_practice_attempts values('50000000-0000-4000-8000-000000000001','attempt','cycle-1',now(),now(),$1,1,1,0,0,0,1800,1900,30,true,$2,$3,$4)`,[JSON.stringify(payload),session,student,teacher]);
 await db.exec(`set fixture.actor='${teacher}'; set role authenticated;`);
 const report=(await db.query('select public.teacher_get_student_focus_session($1) result',[session])).rows[0].result;
 const result=report.members[0].cycle_practice_result;
 assert.equal(result.accuracy,0);assert.equal(result.correctCount,0);assert.equal(result.scoredQuestions,1);
 assert.deepEqual(result.learningResponses,[first,finish]);assert.equal(result.learningResponses[1].learningEpisode.firstResponse.selected,'t');
 assert.equal(result.learningResponses[1].learningEpisode.responses[1].observedCorrect,true);
 assert.equal(result.learningResponses[1].learningEpisode.responses[1].isCorrect,null);
 assert.equal(result.learningResponseSource,'client_reported_practice_not_mastery');
 await db.exec(`set fixture.actor='${other}';`);
 assert.equal((await db.query('select public.teacher_get_student_focus_session($1) result',[session])).rows[0].result.session,null);
 assert.equal((await db.query('select public.teacher_get_student_focus_session(null) result')).rows[0].result.session,null);
 await db.exec("set fixture.actor='';");
 await assert.rejects(db.query('select public.teacher_get_student_focus_session(null)'),/teacher access required/);
 await db.exec('reset role;');
 assert.equal((await db.query("select has_function_privilege('anon','public.teacher_get_student_focus_session(uuid)','execute') allowed")).rows[0].allowed,false);
 assert.equal((await db.query("select has_table_privilege('authenticated','public.student_focus_cycle_practice_attempts','select') allowed")).rows[0].allowed,false);
 assert.doesNotMatch(migration,/create or replace function public\.student_complete_focus_cycle_practice/);
});
test('real PostgreSQL Adventure checkpoint/history merge agrees with immutable client boundary',async t=>{
 const db=await fixture();t.after(()=>db.close());
 const old=wrap({learningCheckpoint:{schemaVersion:1,episode:first.learningEpisode,updatedAt:'2026-10-02T01:00:00Z',revision:1},learningResponses:[first]});
 const newer=wrap({learningCheckpoint:{schemaVersion:1,episode,updatedAt:'2026-10-02T01:01:00Z',revision:2},learningResponses:[first,finish]});
 const closed=wrap({...newer,learningCheckpoint:{schemaVersion:1,closed:true,episode:null,updatedAt:'2026-10-02T01:02:00Z',revision:3}});
 const tampered=wrap({...newer,learningCheckpoint:{...newer.learningCheckpoint,episode:{...episode,firstResponse:{...episode.firstResponse,selected:'c',isCorrect:true}}}});
 const conflict=wrap({...newer,learningResponses:[{...first,steps:[{questionId:'changed'}]}]});
 for(const [left,right] of [[old,newer],[newer,old],[old,closed],[closed,old],[old,tampered],[old,conflict],[closed,closed],[null,old],[old,null],[old,{schemaVersion:3,progressEpoch:2,cycles:{},opaque:true}]]){
  const actual=(await db.query('select public.lp_merge_el_quest($1::jsonb,$2::jsonb) result',[JSON.stringify(left),JSON.stringify(right)])).rows[0].result;
  assert.deepEqual(actual,mergeElQuestProgress(left,right));
 }
 const info=(await db.query("select prosecdef,provolatile,proconfig from pg_proc where proname='lp_learning_response_checkpoint'")).rows[0];
 assert.equal(info.prosecdef,false);assert.equal(info.provolatile,'i');assert.ok(info.proconfig.includes('search_path=""'));
});

test('PostgreSQL preserves the same-episode committed prefix against newer empty/cursor/transfer regressions',async t=>{
 const db=await fixture();t.after(()=>db.close());
 const initial=createLearningResponseEpisode({id:'prefix',instrument:'adventure_map',question:q,expected:'c',transfer:{question:{...q,id:'pig',targetWord:'pig',choices:['p','b','r'],answer:'p'},expected:'p'}});
 const states=[initial];
 states.push(commitLearningResponse(states.at(-1),{selected:'t',correct:false}));
 states.push(advanceLearningResponseReceipt(states.at(-1)));
 states.push(recordLearningGuidedStep(states.at(-1),0));
 states.push(recordLearningGuidedAction(states.at(-1),'c'));
 states.push(commitLearningResponse(states.at(-1),{selected:'r',correct:false}));
 states.push(advanceLearningResponseReceipt(states.at(-1)));
 states.push(recordLearningGuidedStep(states.at(-1),0));
 states.push(recordLearningGuidedAction(states.at(-1),'p'));
 const snapshot=(value,newer=false)=>({schemaVersion:1,episode:value,updatedAt:newer?'2026-10-02T02:00:00Z':'2026-10-02T01:00:00Z',revision:newer?99:1});
 const pairs=[];
 for(let index=1;index<states.length;index++) for(const weaker of states.slice(0,index)) pairs.push([snapshot(states[index]),snapshot(weaker,true)]);
 const missing={...initial};delete missing.firstResponse;
 for(const weaker of [missing,startLearningWithModel(initial),{...states[2],firstResponse:null,phase:'answer'}]) pairs.push([snapshot(states[2]),snapshot(weaker,true)]);
 pairs.push([snapshot(states[3]),snapshot({...states[3],guidedCursor:0},true)]);
 pairs.push([snapshot(states[4]),snapshot({...states[4],role:'first_probe',phase:'answer',question:q,expected:'c'},true)]);
 pairs.push([snapshot(states[4]),snapshot({...states[4],transfer:null},true)]);
 pairs.push([snapshot(states.at(-1)),snapshot({...states.at(-1),phase:'answer',completion:null},true)]);
 for(const [stronger,weaker] of pairs) for(const [left,right] of [[stronger,weaker],[weaker,stronger]]) {
  const actual=(await db.query('select public.lp_learning_response_checkpoint($1::jsonb,$2::jsonb) result',[JSON.stringify(left),JSON.stringify(right)])).rows[0].result;
  assert.deepEqual(actual,stronger);assert.deepEqual(actual,mergeLearningResponseCheckpoints(left,right));
  assert.equal(actual.episode.firstResponse.selected,'t');
 }
 const model=startLearningWithModel(initial),placed=recordLearningGuidedStep(model,0),ready=recordLearningGuidedAction(placed,'c');
 const modelComplete=advanceLearningResponseReceipt(commitLearningResponse(ready,{selected:'p',correct:true,supported:true}));
 const fork={...placed,events:[...placed.events.slice(0,-1),{...placed.events.at(-1),selected:'x'}]};
 const closed={schemaVersion:1,closed:true,episode:null,updatedAt:'2026-10-02T03:00:00Z',revision:100};
 const future=snapshot({...modelComplete,schemaVersion:2,opaque:{keep:true}},true);
 for(const [left,right] of [
  ...[model,placed,ready,modelComplete].flatMap(value=>[[snapshot(value),snapshot(initial,true)],[snapshot(initial,true),snapshot(value)]]),
  [snapshot(modelComplete),snapshot(model,true)],[snapshot(placed),snapshot(fork,true)],
  [{...snapshot(placed),responseConflict:true},snapshot(ready,true)],
  [snapshot(states.at(-1)),closed],[closed,snapshot(states.at(-1))],[snapshot(model),future],
 ]) {
  const actual=(await db.query('select public.lp_learning_response_checkpoint($1::jsonb,$2::jsonb) result',[JSON.stringify(left),JSON.stringify(right)])).rows[0].result;
  assert.deepEqual(actual,mergeLearningResponseCheckpoints(left,right));
 }
 assert.equal(mergeLearningResponseCheckpoints(snapshot(model),snapshot(modelComplete)).episode.firstResponse,null);
});
