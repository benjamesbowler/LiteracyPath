import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan,adaptLiteracyMockPlan,replaceFailedLiteracyMockMedia } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockAreaSchedule,LITERACY_MOCK_AREA_MAX,isLiteracyMockAreaRouteItem } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { literacyMockAreaState } from '../../src/utils/literacyMockAreaPlanner.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { literacyMockWorkingSummary } from '../../src/utils/literacyMockWorkingSummary.js';
import { canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';
const bank=await loadLiteracyMockBank({includeUnavailable:true}),byId=new Map(bank.map(q=>[q.id,q]));
const response=(q,ok,flags={})=>({questionId:q.id,itemSnapshot:q.itemSnapshot,skillId:q.skillId,domainId:q.domainId,level:q.level,responseStatus:'answered',evidenceType:'independent',isCorrect:ok,...flags});

test('phonics starts with CVC choices and advances to construction, never list-position difficulty',()=>{
 const slit=byId.get('mock.capacity.foundation.contrast.picture.l2.short_i.slit');
 assert.equal(slit.adaptiveAreaBand,1);assert.equal(isLiteracyMockAreaRouteItem(slit),false);
 assert.equal(isLiteracyMockAreaRouteItem(byId.get('mock.v4.word-ladder.hfw_26_50.l1.if')),false);
 assert.equal(isLiteracyMockAreaRouteItem(byId.get('lp3.hfw_1_25.l1.B.is.v2')),false);
 assert.equal(isLiteracyMockAreaRouteItem(byId.get('mock.v4.word-ladder.hfw_1_25.l1.on')),true);
 for(let seed=0;seed<12;seed++){
  let plan=selectLiteracyMockPlan(bank,{sessionId:`starter-${seed}`,studentId:'child'}),answers=[];
  for(let i=0;i<20;i++){
   const q=byId.get(plan.itemIds[i]);
   if(q.domainId==='phonics'){
    assert.ok(isLiteracyMockAreaRouteItem(q));
    if(q.adaptiveAreaBand===1){assert.match(q.targetWord,/^[a-z][aeiou][a-z]$/i);assert.ok(q.choices.every(c=>c.label.length===3));}
    if(q.adaptiveAreaBand===2)assert.equal(q.format,'build_word');
   }
   answers.push(response(q,true));plan=adaptLiteracyMockPlan(bank,plan,answers);
  }
 }
});

test('entry and first steps are genuinely simple tasks in every area with exact existing media',()=>{
 assert.equal(new Set(bank.filter(q=>Number.isInteger(q.adaptiveAreaBand)).map(q=>q.skillId)).size,50);
 const plan=selectLiteracyMockPlan(bank,{sessionId:'entry',studentId:'child'});
 assert.deepEqual(plan.itemIds.map(id=>byId.get(id).domainId),literacyMockAreaSchedule());
 assert.ok(plan.itemIds.every(id=>byId.get(id).adaptiveAreaBand===1));
 for(const domain of Object.keys(LITERACY_MOCK_AREA_MAX)){
  assert.ok(bank.some(q=>q.domainId===domain&&q.adaptiveAreaBand===0));
  assert.ok(bank.some(q=>q.domainId===domain&&q.adaptiveAreaBand===1));
 }
 for(const q of bank.filter(q=>q.foundationBand!==undefined)){
  assert.ok(q.mediaReady);assert.ok(!q.tutorialOnly);
  for(const path of [...q.requiredAudioPaths,...q.requiredImagePaths])assert.ok(fs.existsSync(new URL(`../../public${path.split('#')[0]}`,import.meta.url)),path);
  if(q.skillId==='picture_word_reading'){assert.equal(q.passage,'');assert.equal(q.requiredAudioCues.length,1);assert.ok(q.requiredAudioCues.every(c=>c.role==='instruction'));}
  if(q.skillId==='picture_vocabulary')assert.equal(q.hideWrittenLabels,true);
 }
});

test('complete bounded offline paths rise, fall and remain independent across every area and multiple seeds',()=>{
 const policies=[()=>true,()=>false,i=>i<16,i=>i%2===0,(_,q)=>['reading','listening'].includes(q.domainId)];
 for(let seed=0;seed<8;seed++)for(const correct of policies){
  let pool=[];let plan=selectLiteracyMockPlan(bank,{sessionId:seed===0?'mock-session':`seed-${seed}`,studentId:seed===0?'student-a':'child',onOfflineItems:ids=>{pool=ids;}});
  const offline=bank.filter(q=>pool.includes(q.id)),answers=[],states=Object.fromEntries(Object.keys(LITERACY_MOCK_AREA_MAX).map(d=>[d,1])),seen=new Set();
  assert.ok(new Set(offline.flatMap(q=>[...q.requiredAudioPaths,...q.requiredImagePaths].map(p=>p.split('#')[0]))).size<=512);
  for(let i=0;i<43;i++){
   const q=byId.get(plan.itemIds[i]);assert.equal(q.adaptiveAreaBand,states[q.domainId]);
   if(q.domainId==='phonics'&&q.adaptiveAreaBand===0){assert.equal(q.passage,'');assert.match(q.constructClaim,/^spoken_to_print_/);}
   for(const [kind,id]of Object.entries(canonicalLiteracyIdentity(q)))if(id){const identity=`${kind}:${id}`;assert.equal(seen.has(identity),false,identity);seen.add(identity);}
   const ok=correct(i,q);answers.push(response(q,ok));states[q.domainId]=Math.max(0,Math.min(LITERACY_MOCK_AREA_MAX[q.domainId],q.adaptiveAreaBand+(ok?1:-1)));
   const prefix=plan.itemIds.slice(0,i+1);try {plan=adaptLiteracyMockPlan(offline,plan,answers);}catch(error){throw new Error(`Seed ${seed}, policy ${policies.indexOf(correct)}, question ${i+1}, ${q.domainId} band ${q.adaptiveAreaBand}: ${error.message}`,{cause:error});}assert.deepEqual(plan.itemIds.slice(0,i+1),prefix);
  }
 }
});

test('help, familiarity, skipped and invalid observations cannot move an area; shown questions freeze',()=>{
 const plan=selectLiteracyMockPlan(bank,{sessionId:'flags',studentId:'child'}),q=byId.get(plan.itemIds[0]);
 for(const flags of [{supportUsed:true},{supportPending:true},{knownFamiliar:true},{responseStatus:'skipped'},{validity:'invalid'}]){
  assert.equal(literacyMockAreaState(bank,[response(q,true,flags)])[q.domainId],1);
 }
 const adapted=adaptLiteracyMockPlan(bank,plan,[response(q,false)],[],[{questionId:plan.itemIds[1]}]);assert.equal(adapted.itemIds[1],plan.itemIds[1]);
 assert.throws(()=>adaptLiteracyMockPlan(bank,plan,[response(byId.get(plan.itemIds[2]),true)]),/history/);
 assert.throws(()=>adaptLiteracyMockPlan(plan.itemIds.map(id=>byId.get(id)),plan,[response(q,false)]),error=>error.code==='mock_fresh_capacity');
});

test('media repair preserves actual task and band, or stops safely without recording a failure as a score',()=>{
 const plan=selectLiteracyMockPlan(bank,{sessionId:'media',studentId:'child'}),first=byId.get(plan.itemIds[0]);
 const failure={questionId:first.id,failedMediaPaths:[first.requiredAudioPaths.at(-1)]};
 const repaired=replaceFailedLiteracyMockMedia(bank,plan,[],[failure]);
 assert.equal(repaired.unavailable,false);assert.notEqual(repaired.plan.itemIds[0],first.id);
 const replacement=byId.get(repaired.plan.itemIds[0]);assert.equal(replacement.adaptiveAreaBand,first.adaptiveAreaBand);assert.equal(replacement.constructClaim,first.constructClaim);
 assert.equal(replaceFailedLiteracyMockMedia(plan.itemIds.map(id=>byId.get(id)),plan,[],[failure]).unavailable,true);
});

test('v5 reports reject missing or impossible demand metadata rather than inventing a level',()=>{
 const q=bank.find(q=>q.skillId==='picture_word_reading'&&q.adaptiveAreaBand===1);
 for(const demand of [undefined,-1,99]){
  const row={...response(q,true),serverReceivedAt:new Date().toISOString(),itemSnapshot:{...q.itemSnapshot,adaptiveAreaBand:demand}};
  const report=buildLiteracyMockReport({session:{content_version:'literacy-mock-v5'},members:[{student_id:'child',run:{responses:[row]}}]});
  assert.equal(report.pupils[0].totals.independent,0);assert.equal(literacyMockWorkingSummary(report.pupils[0]).accuracy.percent,null);
  assert.equal(report.totalSkills,50);
 }
});
