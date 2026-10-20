import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { loadLiteracyMockBank, scoreLiteracyMockResponse, literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockBoundaryState, literacyMockBoundaryLimits } from '../../src/policy/literacyMockBoundaryPolicy.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { mockConstructionLength } from '../../src/utils/literacyMockResponse.js';
import { mockOfflineMediaAssetLimit } from '../../src/utils/literacyMockOfflineMedia.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../src/data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../src/utils/progressCheckAudio.js';

// Real authoring sources and actual public bytes. Never mark missing recordings
// ready or substitute routing fixtures in this publication/capacity gate.
const version='literacy-mock-v11';
const assetLimit=mockOfflineMediaAssetLimit(version);
const publication=await loadLiteracyMockBank({contentVersion:version,includeUnavailable:true});
const bank=publication.filter(item=>item.mediaReady);
const byId=new Map(bank.map(item=>[item.id,item]));
const tutorialIds=Object.values(literacyMockTutorialIdsForVersion(version));
const tutorials=tutorialIds.map(id=>byId.get(id));
const byteSizes=new Map();
function bytesFor(path){
 if(!byteSizes.has(path))byteSizes.set(path,statSync(new URL(`../../public${path}`,import.meta.url)).size);
 return byteSizes.get(path);
}
function selectedValue(item,correct){
 if(correct)return item.answer;
 let options;
 if(item.format==='build_word'){
  const length=mockConstructionLength(item),labels=item.choices.map(choice=>choice.label);
  options=labels.map((_,start)=>Array.from({length},(_,index)=>labels[(start+index)%labels.length]).join(''));
 }else if(Array.isArray(item.answer))options=[[...item.answer].reverse(),[...item.answer.slice(1),item.answer[0]],
  [item.choices.find(choice=>choice.id!==item.answer[0])?.id,...item.answer.slice(1)]];
 else options=item.choices.map(choice=>choice.id);
 const incorrect=options.find(value=>!scoreLiteracyMockResponse(item,value));
 assert.notEqual(incorrect,undefined,`A real incorrect selected value must exist for ${item.id}`);
 return incorrect;
}

test('V11 eligible questions and tutorials retain their exact resolved real media',()=>{
 const eligible=publication.filter(item=>item.adaptiveMixedEligible && !item.tutorialOnly && isLiteracyItemEligible(item));
 const unavailable=eligible.filter(item=>!item.mediaReady);
 assert.equal(unavailable.length,0,`Unresolved V11 media: ${unavailable.slice(0,8).map(item=>item.id).join(', ')}`);
 assert.ok(tutorials.every(Boolean),'Each required tutorial must be resolved in the same publication');
 for(const item of [...eligible,...tutorials])for(const path of [...item.requiredAudioPaths,...item.requiredImagePaths]){
  const bytes=bytesFor(path.split('#')[0]);
  assert.ok(bytes>0 && bytes<=4*1024*1024,`${item.id}: real media must fit its per-file offline bound`);
 }
});

const patterns={
 correct:()=>true,
 incorrect:()=>false,
 reversal:(_item,areaIndex)=>areaIndex<5,
 alternating:(_item,areaIndex)=>areaIndex%2===0,
 uneven:item=>['reading','listening','vocabulary'].includes(item.domainId),
};
for(const[name,outcome]of Object.entries(patterns))test(`V11 actual bank: five fresh retakes with bounded real media, ${name}`,t=>{
 let maximumAssets=0,maximumBytes=0,minimumLength=Infinity,maximumLength=0;
 assert.ok(tutorials.every(Boolean),'Real required tutorials must be present before selecting a sitting');
 for(let seed=0;seed<3;seed++){
  const exposures=[];
  for(let sitting=0;sitting<5;sitting++){
   const context=`${name}, seed ${seed}, sitting ${sitting+1}`;
   let offlineIds=[];
   let plan;
   assert.doesNotThrow(()=>{plan=selectLiteracyMockPlan(bank,{sessionId:`v11-${name}-${seed}-${sitting}`,studentId:`same-child-${seed}`,exposures,
    onOfflineItems:ids=>{offlineIds=ids;}});},`${context}: reserve selection`);
   const pool=bank.filter(item=>offlineIds.includes(item.id));
   const media=new Set([...pool,...tutorials].flatMap(item=>[...item.requiredAudioPaths,...item.requiredImagePaths]).map(path=>path.split('#')[0]));
   media.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.readPassage));
   media.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle));
   const bytes=[...media].reduce((sum,path)=>sum+bytesFor(path),0);
   maximumAssets=Math.max(maximumAssets,media.size);maximumBytes=Math.max(maximumBytes,bytes);
   assert.ok(media.size<=assetLimit,`${context}: ${media.size} assets exceed ${assetLimit}`);
   assert.ok(bytes<=48*1024*1024,`${context}: ${bytes} bytes exceed 48 MiB`);
   const rows=[],counts={},routes={};
   while(rows.length<plan.itemIds.length){
    const item=byId.get(plan.itemIds[rows.length]),state=literacyMockBoundaryState(rows,{bank:byId})[item.domainId];
    assert.ok(offlineIds.includes(item.id),`${context}: exact authorized offline pool`);
    assert.equal(state.complete,false,`${context}: stopped area`);
    assert.equal(item.adaptiveAreaBand,state.nextBand,`${context}: ${item.domainId} next demand`);
    assert.equal(getLiteracyExposure(item,buildLiteracyExposureIndex({exposures,responses:rows})).knownFamiliar,null,`${context}: fresh ${item.id}`);
    const route=routes[item.domainId]||=[];route.push(item.adaptiveAreaBand);
    if(route.length>1)assert.ok(Math.abs(route.at(-1)-route.at(-2))<=1,`${context}: gradual actual question curve`);
    const areaIndex=counts[item.domainId]||0;counts[item.domainId]=areaIndex+1;
    const correct=outcome(item,areaIndex),selected=selectedValue(item,correct);
    assert.equal(scoreLiteracyMockResponse(item,selected),correct,`${context}: exact selected-value score`);
    rows.push({questionId:item.id,domainId:item.domainId,skillId:item.skillId,level:item.level,itemSnapshot:item.itemSnapshot,
     responseStatus:'answered',evidenceType:'independent',selected,isCorrect:correct});
    try { plan=adaptLiteracyMockPlan(pool,plan,rows,[],[],{exposures}); } catch(error) { error.message=`${context}: after ${rows.length} (${item.domainId}, band ${item.adaptiveAreaBand}, correct ${correct}): ${error.message}`; throw error; }
    assert.deepEqual(plan.itemIds.slice(0,rows.length),rows.map(row=>row.questionId),`${context}: immutable answered prefix`);
   }
   const states=literacyMockBoundaryState(rows,{bank:byId});
   assert.ok(Object.values(states).every(state=>state.complete),`${context}: all eight areas finish`);
   assert.ok(rows.length<=literacyMockBoundaryLimits(version).maximum,context);
   assert.ok(states.print.lowerLetterTargets.length<=5,`${context}: finite print stock`);
   if(name==='correct'){
    assert.equal(rows.length,108,context);
    assert.ok(Object.values(states).every(state=>state.stopReason==='ceiling_confirmed'),context);
    for(const route of Object.values(routes))assert.deepEqual(route.slice(0,3),[0,0,0],context);
   }
   if(name==='incorrect')assert.equal(rows.length,16,context);
   minimumLength=Math.min(minimumLength,rows.length);maximumLength=Math.max(maximumLength,rows.length);
   exposures.push(...rows);
  }
 }
 t.diagnostic(JSON.stringify({pattern:name,maximumAssets,maximumBytes,minimumLength,maximumLength}));
});

test('a prolonged assisted entry path has its full bounded question bank offline',()=>{
 let ids=[];let plan=selectLiteracyMockPlan(bank,{sessionId:'v11-assistance-hold',studentId:'assistance-hold',onOfflineItems:values=>{ids=values;}});
 const pool=bank.filter(item=>ids.includes(item.id)),rows=[],counts={};
 while(rows.length<plan.itemIds.length){
  const item=byId.get(plan.itemIds[rows.length]),index=counts[item.domainId]||0;counts[item.domainId]=index+1;
  const supported=index%3===2;
  assert.equal(item.adaptiveAreaBand,0,'Two independent successes interrupted by help never promote the area.');
  assert.ok(ids.includes(item.id));
  rows.push({questionId:item.id,domainId:item.domainId,skillId:item.skillId,level:item.level,itemSnapshot:item.itemSnapshot,
   responseStatus:'answered',evidenceType:supported?'supported':'independent',supportUsed:supported,selected:item.answer,isCorrect:true});
  plan=adaptLiteracyMockPlan(pool,plan,rows);
 }
 const states=literacyMockBoundaryState(rows,{bank:byId});
 for(const [domain,state]of Object.entries(states)){
  assert.equal(state.stopReason,domain==='print'?'letter_limit':'budget_limit');
  assert.equal(state.boundary,null);
 }
 assert.equal(rows.length,116);
});
