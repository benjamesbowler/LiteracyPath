import fs from 'node:fs';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan,adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { projectMockMutation,prepareMockDelivery,acknowledgeMockOutbox } from '../../src/utils/literacyMockOutbox.js';

// Produce reviewable SQL only. The caller must explicitly authorize its hosted
// execution. All synthetic accounts, sessions, answers and receipts roll back.
export async function literacyMockV5HostedProofSql(){
 const bank=await loadLiteracyMockBank(),cases=[];
 for(const pattern of ['wrong','right','reversal']){
  let ids=[];const plan=selectLiteracyMockPlan(bank,{sessionId:`hosted-${pattern}`,studentId:'synthetic',onOfflineItems:value=>{ids=value;}}),offline=bank.filter(q=>ids.includes(q.id));
  const byId=new Map(offline.map(q=>[q.id,q])),requests=[];let run={contentVersion:'literacy-mock-v5',assignmentId:'synthetic-session',studentId:'synthetic',revision:1,eventRevision:0,plan,responses:[],presentations:[],helpRequests:[],status:'running'};const serverRun=structuredClone(run);
  for(let index=0;index<43;index++){
   const q=byId.get(run.plan.itemIds[index]),correct=pattern==='right'||pattern==='reversal'&&index<16;
   let selected=q.answer;
   if(!correct){if(Array.isArray(q.answer)){selected=[...q.answer];if(q.format==='multi_select')selected[0]=q.choices.find(c=>!selected.includes(c.id)).id;else if(selected.length>1)[selected[0],selected[1]]=[selected[1],selected[0]];else selected[0]=q.choices.find(c=>c.id!==q.answer[0]).id;}else selected=q.format==='build_word'?'xxx':q.choices.find(c=>c.id!==q.answer).id;}
   const event={type:'event',requestId:`shown-${index}`,questionId:q.id,event:'presented'};requests.push(event);run=projectMockMutation(run,event,{item:q});
   const response={requestId:`answer-${index}`,expectedRevision:run.revision,plan:null,response:{questionId:q.id,selected,responseStatus:'answered',knownFamiliar:false,supportUsed:false,audioDelivery:Object.fromEntries(q.requiredAudioPaths.map(p=>[p,'completed']))}};
   requests.push(response);run=projectMockMutation(run,response,{item:q,isCorrect:correct});
   if(index<42){const next=adaptLiteracyMockPlan(offline,run.plan,run.responses,[],run.presentations);if(JSON.stringify(next.itemIds)!==JSON.stringify(run.plan.itemIds)){const change={requestId:`adapt-${index}`,expectedRevision:run.revision,plan:next,response:null};requests.push(change);run=projectMockMutation(run,change);}}
  }
  const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k)};
  const fullRun=structuredClone(run);let box={schemaVersion:1,studentId:'synthetic',sessionId:'synthetic-session',run,serverRun,mock:{state:'running'},requests};const chunks=[];
  while(box.requests.length){
   box=prepareMockDelivery(box,{batchId:`chunk-${chunks.length}`},storage);const sent=box.delivery.sent;
   chunks.push({requests:sent.requests,answers:sent.run.responses.length,final:sent.requests.length===box.requests.length,batchId:sent.batchId});
   const delivered={ok:true,batchId:sent.batchId,acknowledged:sent.requests.map(r=>r.requestId),mock:box.mock,
    run:{...sent.run,presentations:fullRun.presentations.slice(0,sent.run.eventRevision),status:sent.run.responses.length===43?'completed':'running'}};
   box=acknowledgeMockOutbox(box,sent,delivered,request=>({item:byId.get(request.questionId||request.response?.questionId),isCorrect:fullRun.responses.find(r=>r.questionId===request.response?.questionId)?.isCorrect}),storage);
  }
  cases.push({pattern,plan,chunks,correct:fullRun.responses.filter(r=>r.isCorrect).length,bands:fullRun.responses.map(r=>r.itemSnapshot.adaptiveAreaBand)});
 }
 const payload=JSON.stringify(cases).replaceAll("'","''");
 return `begin;
set local statement_timeout='90s';
do $proof$
declare teacher uuid:=gen_random_uuid(); class_id uuid:=gen_random_uuid(); pupil uuid; token text; assessment uuid;
 c jsonb; chunk jsonb; result jsonb; boot jsonb; delivered jsonb; report jsonb; actual_bands jsonb; n integer; collection text; delivery_started timestamptz;
begin
 -- No real account, class or learner is modified. Auth triggers create only this
 -- synthetic pending row, which is approved inside this rollback transaction.
 insert into auth.users(id,email,aud,role,raw_user_meta_data,email_confirmed_at)
 values(teacher,'map-v5-rollback-'||teacher::text||'@literacypath.invalid','authenticated','authenticated','{"audit_only":true,"display_name":"Synthetic MAP rollback verification"}',now());
 update public.pending_teacher_accounts set role='teacher',status='approved',approval_status='approved' where user_id=teacher;
 perform set_config('request.jwt.claim.sub',teacher::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',teacher,'role','authenticated')::text,true);
 if not public.current_actor_has_teacher_access() then raise exception 'Synthetic teacher lacks access'; end if;
 insert into public.classes(id,name,teacher_id) values(class_id,'Synthetic MAP rollback verification',teacher);
 for c in select value from jsonb_array_elements('${payload}'::jsonb) loop
  pupil:=gen_random_uuid();token:=gen_random_uuid()::text||gen_random_uuid()::text;
  insert into public.students(id,name,class_id,teacher_id)values(pupil,'Synthetic '||(c->>'pattern'),class_id,teacher);
  insert into public.student_sessions(student_id,token)values(pupil,token);
  result:=public.teacher_prepare_literacy_mock_session_v5(class_id,array[pupil],false,20,43,'prepare-'||(c->>'pattern'),'untimed')::jsonb;
  if result->>'ok' is distinct from 'true' then raise exception 'Preparation failed: %',result->>'error'; end if;
  assessment:=(result#>>'{session,id}')::uuid;
  result:=public.teacher_control_literacy_mock_session(assessment,'start',0,'start')::jsonb;
  if result->>'ok' is distinct from 'true' then raise exception 'Start failed: %',result->>'error'; end if;
  result:=public.student_save_literacy_mock_run(token,assessment,'initial',0,c->'plan',null)::jsonb;
  if result->>'ok' is distinct from 'true' then raise exception 'Initial plan failed: %',result->>'error'; end if;
  boot:=public.student_sync_literacy_mock_batch(token,assessment,'bootstrap',null,'[]',null)::jsonb;
  if boot->>'ok' is distinct from 'true' then raise exception 'Lease failed: %',boot->>'error'; end if;
  collection:=null;
  if c->>'pattern'='wrong' then
   result:=public.teacher_control_literacy_mock_session(assessment,'collect',(boot#>>'{mock,revision}')::integer,'collect-early')::jsonb;
   if result->>'ok' is distinct from 'true' or result#>>'{session,mock,state}'<>'running' then raise exception 'Early collection did not wait for the iPad'; end if;
   collection:=result#>>'{session,mock,collection_id}';
  end if;
  for chunk in select value from jsonb_array_elements(c->'chunks') loop
   if jsonb_array_length(chunk->'requests')>12 then raise exception 'Unbounded delivery'; end if;
   delivery_started:=clock_timestamp();
   delivered:=public.student_sync_literacy_mock_batch(token,assessment,chunk->>'batchId',(boot#>>'{run,offlineLeaseId}')::uuid,chunk->'requests',case when chunk->>'final'='true' then collection else null end)::jsonb;
   if clock_timestamp()-delivery_started>interval '2500 milliseconds' then raise exception 'Bounded % delivery exceeded the child API budget: % ms',c->>'pattern',extract(epoch from clock_timestamp()-delivery_started)*1000; end if;
   if delivered->>'ok' is distinct from 'true' then raise exception 'Delivery % failed: %',c->>'pattern',delivered->>'error'; end if;
   if jsonb_array_length(delivered#>'{run,responses}')<>(chunk->>'answers')::integer then raise exception 'Incomplete prefix receipt'; end if;
   if chunk->>'final'<>'true' and collection is not null and delivered#>>'{mock,state}'<>'running' then raise exception 'Collection closed before final receipt'; end if;
   result:=public.student_sync_literacy_mock_batch(token,assessment,chunk->>'batchId',(boot#>>'{run,offlineLeaseId}')::uuid,chunk->'requests',case when chunk->>'final'='true' then collection else null end)::jsonb;
   if result->>'duplicate' is distinct from 'true' then raise exception 'Duplicate delivery changed evidence'; end if;
  end loop;
  if jsonb_array_length(delivered#>'{run,responses}')<>43 then raise exception 'Incomplete sitting'; end if;
  select count(*) filter(where r->>'isCorrect'='true'),jsonb_agg(r#>'{itemSnapshot,adaptiveAreaBand}' order by ord)
   into n,actual_bands from jsonb_array_elements(delivered#>'{run,responses}') with ordinality rows(r,ord);
  if n<>(c->>'correct')::integer or actual_bands<>c->'bands' then raise exception 'Scoring or routing mismatch'; end if;
  if collection is null then
   result:=public.teacher_control_literacy_mock_session(assessment,'collect',(delivered#>>'{mock,revision}')::integer,'collect')::jsonb;
   if result->>'ok' is distinct from 'true' then raise exception 'Collection failed: %',result->>'error'; end if;
  elsif delivered#>>'{mock,state}'<>'completed' then raise exception 'Final receipt did not finish collection'; end if;
  report:=public.teacher_get_literacy_mock_report(assessment)::jsonb;
  if jsonb_array_length(report#>'{members,0,run,responses}')<>43
   or report#>'{members,0,run,responses}'<>delivered#>'{run,responses}' then raise exception 'Teacher evidence does not match receipt'; end if;
 end loop;
end; $proof$;
rollback;
select 'Three complete 43-answer synthetic runs passed canonical routing, scoring, duplicate delivery, collection and teacher-report assertions, with each bounded delivery below 2500 ms; all test writes rolled back.' proof,
 (select count(*) from auth.users where email like 'map-v5-rollback-%@literacypath.invalid') residual_synthetic_accounts;
`;
}
if(process.argv[1]?.endsWith('/hostedRollbackProof.mjs')){
 const path=process.argv[process.argv.indexOf('--output')+1];if(!process.argv.includes('--output')||!path)throw Error('Specify --output; this tool never executes SQL.');
 fs.writeFileSync(path,await literacyMockV5HostedProofSql());console.log('Wrote rollback-only hosted verification SQL.');
}
