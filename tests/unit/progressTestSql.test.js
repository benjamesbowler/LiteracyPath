import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { PROGRESS_BANK as bank } from '../../src/content/assessments/v3/progressBank.generated.js';
import { createProgressTestRun, beginProgressTest, commitProgressResponse, nextProgressItem, finishProgressTest, progressAttemptFromRun } from '../../src/utils/progressTestRouter.js';
const sql = ['20261002165900_progress_bank_manifest_part_one.sql', '20261002165910_progress_bank_manifest_part_two.sql', '20261002170000_adaptive_progress_checks.sql']
 .map(file => readFileSync(new URL(`../../supabase/migrations/${file}`,import.meta.url),'utf8')).join('\n');
const merge = readFileSync(new URL('../../supabase/migrations/20260614090000_progress_forward_merge.sql',import.meta.url),'utf8');
const archive = readFileSync(new URL('../../supabase/migrations/20260724003000_immutable_assessment_evidence.sql',import.meta.url),'utf8');
const teacher='11000000-0000-4000-8000-000000000001', other='11000000-0000-4000-8000-000000000002';
const classId='22000000-0000-4000-8000-000000000001',studentId='33000000-0000-4000-8000-000000000001',secondStudent='33000000-0000-4000-8000-000000000002';
const clone=x=>structuredClone(x);
async function fixture() {
 const db=await PGlite.create({extensions:{pgcrypto}});
 await db.exec(`create schema auth; create extension pgcrypto; create role anon; create role authenticated;
 create table auth.users(id uuid primary key); insert into auth.users values('${teacher}'),('${other}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('fixture.actor',true),'')::uuid$$;
 create function public.assert_current_actor_teacher_access() returns void language plpgsql as $$begin if auth.uid() is null then raise exception 'Teacher required'; end if; end$$;
 create table public.classes(id uuid primary key,teacher_id uuid); insert into classes values('${classId}','${teacher}');
 create table public.students(id uuid primary key,class_id uuid references classes(id),teacher_id uuid,name text,archived_at timestamptz);
 insert into students values('${studentId}','${classId}','${teacher}','Synthetic learner',null),('${secondStudent}','${classId}','${teacher}','Second synthetic learner',null);
 create function public.student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where s.id=case when token='synthetic-token' then '${studentId}'::uuid else null end and s.archived_at is null$$;
 create table public.student_progress(id uuid primary key default gen_random_uuid(),student_id uuid references students(id) on delete cascade,area text,key text,payload jsonb,updated_at timestamptz,unique(student_id,area,key));
 create table public.assessment_attempts(attempt_id text primary key,student_id text,class_id text,teacher_id uuid references auth.users(id),assessment_type text,skill_id text,skill_name text,skill_level integer,skill_phase integer,started_at timestamptz,completed_at timestamptz,total_questions integer,correct_count integer,accuracy numeric(5,2) not null default 0,status text,administration_status text,schema_version integer,payload jsonb,created_at timestamptz default now(),updated_at timestamptz default now());
 create table public.student_focus_sessions(id uuid primary key default gen_random_uuid(),teacher_id uuid,class_id uuid,target text,content_version text,selection_scope text,status text default 'active',started_at timestamptz default now(),expires_at timestamptz,updated_at timestamptz default now(),ended_at timestamptz,constraint student_focus_sessions_target_check check(target in ('cycle_practice')));
 create table public.student_focus_session_members(session_id uuid references student_focus_sessions(id),student_id uuid references students(id) on delete cascade,resolved_config jsonb,status text default 'assigned',active boolean default true,content_ok boolean default false,completed_at timestamptz,updated_at timestamptz,primary key(session_id,student_id));
 create table public.reading_sessions(student_ids uuid[],status text,updated_at timestamptz);
 create function public.end_expired_student_focus_sessions() returns void language sql as $$update public.student_focus_sessions set status='ended' where expires_at<=now()$$;
 `);
 for (const fn of ['lp_merge_daily_mission','lp_merge_phonics_quest','lp_merge_hollow','lp_merge_transfer_missions','lp_merge_el_quest']) await db.exec(`create function public.${fn}(jsonb,jsonb) returns jsonb language sql immutable as $$select $2$$;`);
 await db.exec(merge);await db.exec(archive); await db.exec(sql); await db.exec(`set fixture.actor='${teacher}';`);
 return db;
}
const query=async(db,s,args=[])=>(await db.query(s,args)).rows[0].value;
const run= (id='sql-progress')=>createProgressTestRun({bank,studentId,classId,teacherId:teacher,attemptId:id,planKind:'focused',trackId:'hear_sounds',seed:42});
const save=(db,r,a=null)=>query(db,'select public.teacher_save_progress_run($1,$2) value',[r,a]);
async function denied(promise) { let result; try {result=await promise;} catch {return;} assert.equal(result.ok,false); }
function answer(r,correct=true){const x=r.currentItem; const delivery=Object.fromEntries(Object.entries(x.audio||{}).flatMap(([role,cue])=>Array.isArray(cue)?cue.map((c,i)=>[`${role}:${i}`,'completed']):[[role,'completed']])); return commitProgressResponse(r,{itemId:x.id,selected:correct?x.answer:x.choices.find(c=>c.id!==x.answer).id,audioDelivery:delivery});}

test('progress SQL binds frozen routing and archive to the learner and assigned plan',async t=>{
 const db=await fixture(); try {
 await t.test('manifest and RPC ACLs match runtime, private bank cannot be read',async()=>{
  assert.deepEqual(await query(db,'select manifest value from public.progress_test_banks'),bank);
  assert.equal(await query(db,"select has_table_privilege('authenticated','public.progress_test_banks','select') value"),false);
  assert.equal(await query(db,"select has_function_privilege('anon','public.teacher_save_progress_run(jsonb,jsonb)','execute') value"),false);
  assert.equal(await query(db,"select has_function_privilege('anon','public.student_save_progress_run(text,uuid,jsonb,jsonb)','execute') value"),true);
  assert.equal(await query(db,"select has_function_privilege('authenticated','public.lp_progress_save(uuid,uuid,uuid,uuid,jsonb,jsonb)','execute') value"),false);
 });
 let r=run();
 await t.test('ownership, missing field, forged pool and insufficient stock fail closed',async()=>{
  await db.exec(`set fixture.actor='${other}';`);assert.equal((await save(db,r)).ok,false);await db.exec(`set fixture.actor='${teacher}';`);
  for(const mutate of [x=>delete x.status,x=>delete x.startingPoints.hear_sounds.tier,x=>x.pool[0].answer=x.pool[0].choices[1].id,x=>x.pool=x.pool.slice(0,2)]) {const bad=clone(r);mutate(bad);await denied(save(db,bad));}
  assert.equal((await save(db,{...r,pool:r.pool.map(item=>item.id)})).ok,true);
  assert.deepEqual((await query(db,'select teacher_get_progress_run($1,null) value',[studentId])).run,r);
 });
 await t.test('first response, audio delivery and route cannot be replaced after reload',async()=>{
  r=answer(beginProgressTest(r));assert.equal((await save(db,r)).ok,true);
  const bad=clone(r);bad.responses[0].selected=bad.responses[0].itemSnapshot.choices.find(c=>c.id!==bad.responses[0].selected).id;await assert.rejects(save(db,bad));
  const noAudio=clone(r);delete noAudio.responses[0].audioDelivery['choices:0'];await assert.rejects(save(db,noAudio),/audio/);
  const reroute=clone(r);reroute.tracks.hear_sounds.nextTier=0;await assert.rejects(save(db,reroute),/track/);
  const old=clone(r);old.responses=[];old.routeDecisions=[];await assert.rejects(save(db,old),/history|track/);
  r=answer(nextProgressItem(r),false);assert.equal(r.responses[1].routeBefore,2);assert.equal(r.responses[1].routeAfter,1);assert.equal((await save(db,r)).ok,true);
  const resumed=(await query(db,'select teacher_get_progress_run($1,null) value',[studentId])).run;assert.deepEqual(resumed,r);assert.equal(resumed.tracks.hear_sounds.nextTier,1);assert.equal(resumed.currentItem,null);
 });
 await t.test('partial terminal archive is immutable, null accuracy, replayable and idempotent',async()=>{
  r=finishProgressTest(r,'partial');const a=progressAttemptFromRun(r);
  assert.equal((await save(db,r,a)).ok,true);assert.equal((await save(db,r,a)).ok,true);
  const stored=await db.query('select accuracy,total_questions,correct_count,payload,raw_evidence from assessment_attempts where attempt_id=$1',[r.attemptId]);
  assert.equal(stored.rows.length,1);assert.equal(stored.rows[0].accuracy,null);assert.deepEqual(stored.rows[0].raw_evidence.result,stored.rows[0].payload);assert.equal(stored.rows[0].correct_count,1);
  const changed=clone(a);changed.correctCount=8;assert.equal((await save(db,r,changed)).ok,false);
  await assert.rejects(db.query("update assessment_attempts set payload=jsonb_set(payload,'{passed}','true') where attempt_id=$1",[r.attemptId]),/immutable|archive/);
  await assert.rejects(db.query("update student_progress set payload=jsonb_set(payload,'{status}','\"running\"') where area='progress_check'"),/immutable/);
  const history=(await query(db,'select teacher_get_progress_run($1,null) value',[studentId])).history;
  assert.equal(JSON.stringify(history).includes('Synthetic learner'),false);assert.equal(history[0].questionRecords[0].questionId,r.responses[0].questionId);
  const fresh=createProgressTestRun({bank,studentId,classId,teacherId:teacher,attemptId:'fresh-after-history',planKind:'focused',trackId:'hear_sounds',previousAttempts:history});
  assert.equal(fresh.pool.some(x=>x.stimulusFamilyId===r.responses[0].stimulusFamilyId),false);assert.equal((await save(db,fresh)).ok,true);
  await assert.rejects(save(db,run('repeated-exposure')),/exposed/);
 });
 await t.test('teacher assignment, child token and expiry are enforced',async()=>{
  const config={plan_kind:'focused',track_id:'printed_words',bank_version:bank.version};
  assert.equal((await query(db,'select teacher_start_progress_check_session($1,$2,$3,60,$4,false) value',[classId,[secondStudent],{'*':config},bank.version])).ok,true);
  const assigned=await query(db,'select teacher_start_progress_check_session($1,$2,$3,60,$4,false) value',[classId,[studentId],{'*':config},bank.version]);assert.equal(assigned.ok,true);
  const id=assigned.session.id;
  assert.equal((await query(db,'select student_get_progress_run($1,$2) value',['bad-token',id])).ok,false);
  const child=createProgressTestRun({bank,studentId,classId,teacherId:teacher,assignmentId:id,attemptId:'assigned-child',planKind:'focused',trackId:'printed_words'});
  assert.equal((await query(db,'select student_save_progress_run($1,$2,$3,null) value',['synthetic-token',id,child])).ok,true);
  const wrong=clone(child);wrong.studentId=secondStudent;assert.equal((await query(db,'select student_save_progress_run($1,$2,$3,null) value',['synthetic-token',id,wrong])).ok,false);
  const wrongPlan=run('wrong-plan');wrongPlan.assignmentId=id;assert.equal((await save(db,wrongPlan)).ok,false);
  await db.query("update student_focus_sessions set expires_at=now()-interval '1 second' where id=$1",[id]);
  assert.equal((await query(db,'select student_save_progress_run($1,$2,$3,null) value',['synthetic-token',id,child])).ok,false);
 });
 await t.test('complete broad profile saves each strand without invented score or mastery',async()=>{
  let complete=beginProgressTest(createProgressTestRun({bank,studentId:secondStudent,classId,teacherId:teacher,attemptId:'completed-broad',planKind:'broad_profile',seed:73}));
  while(complete.status==='running') {complete=nextProgressItem(answer(complete));}
  assert.equal(complete.status,'completed');const a=progressAttemptFromRun(complete);
  const fake=clone(a);fake.metadata.result.strands[0].correctCount=99;fake.metrics.progressProfile=fake.metadata.result;assert.equal((await save(db,complete,fake)).ok,false);
  assert.equal((await save(db,complete,a)).ok,true);
  assert.equal(await query(db,"select count(*)::integer value from assessment_attempts where assessment_type='adaptive_progress_test' and accuracy is null"),2);
  await assert.rejects(db.query("update assessment_attempts set total_questions=999 where attempt_id='completed-broad'"),/immutable/);
 });
 await t.test('ordinary archives keep required accuracy and learner drafts follow deletion',async()=>{
  await assert.rejects(db.query("insert into assessment_attempts(attempt_id,student_id,class_id,teacher_id,assessment_type,started_at,completed_at,accuracy,payload) select 'ordinary-null',student_id,class_id,teacher_id,'skill',started_at,completed_at,null,jsonb_set(payload,'{attemptId}','\"ordinary-null\"') from assessment_attempts where attempt_id=$1",[r.attemptId]),/check/);
  await db.query('delete from student_focus_session_members where student_id=$1',[studentId]);await db.query('delete from students where id=$1',[studentId]);
  assert.equal(await query(db,'select count(*)::integer value from student_progress where student_id=$1',[studentId]),0);
 });
 }finally{await db.close();}
});
