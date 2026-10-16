import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { loadLiteracyMockBank, literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_COUNTS } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../src/data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../src/utils/progressCheckAudio.js';

const bank=await loadLiteracyMockBank();
const byId=new Map(bank.map(q=>[q.id,q]));
const patterns={
 correct:()=>true,
 incorrect:()=>false,
 reversal:i=>i<16,
 alternating:i=>i%2===0,
 uneven:(_,q)=>['reading','listening','vocabulary'].includes(q.domainId),
 hold_starter:()=>null,
 hold_early:(_,q)=>q.adaptiveAreaBand<2?true:null,
 hold_building:(_,q)=>q.adaptiveAreaBand<3?true:null,
 hold_developing:(_,q)=>q.adaptiveAreaBand<4?true:null,
 hold_extending:(_,q)=>q.adaptiveAreaBand<5?true:null,
};

for(const [name,outcome]of Object.entries(patterns))test(`five fresh full sittings for the same learner: ${name}`,()=>{
 for(let seed=0;seed<3;seed++){
  const exposures=[];
  for(let sitting=1;sitting<=5;sitting++){
   const context=`${name}, seed ${seed}, sitting ${sitting}`;
   let offlineIds=[];
   let plan;
   assert.doesNotThrow(()=>{plan=selectLiteracyMockPlan(bank,{sessionId:`retake-${name}-${seed}-${sitting}`,studentId:`same-child-${seed}`,exposures,onOfflineItems:ids=>{offlineIds=ids;}});},context);
   const pool=bank.filter(q=>offlineIds.includes(q.id));
   const tutorials=Object.values(literacyMockTutorialIdsForVersion('literacy-mock-v8')).map(id=>byId.get(id));
   assert.ok(tutorials.every(Boolean),'All mechanics tutorials are available.');
   const assetPaths=new Set([...pool,...tutorials].flatMap(q=>[...q.requiredAudioPaths,...q.requiredImagePaths].map(path=>path.split('#')[0])));
   assetPaths.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.readPassage));
   assetPaths.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle));
   assert.ok(assetPaths.size<=512,`${context}: offline asset budget ${assetPaths.size}`);
   const bytes=[...assetPaths].reduce((sum,path)=>sum+statSync(new URL(`../../public${path}`,import.meta.url)).size,0);
   assert.ok(bytes<=48*1024*1024,`${context}: offline byte budget ${bytes}`);
   const responses=[],states=Object.fromEntries(Object.keys(LITERACY_MOCK_AREA_MAX).map(id=>[id,1]));
   for(let i=0;i<43;i++){
    const q=byId.get(plan.itemIds[i]);assert.ok(q,`${context}: missing question ${i+1}`);
    assert.equal(getLiteracyExposure(q,buildLiteracyExposureIndex({exposures,responses})).knownFamiliar,null,`${context}: repeated target ${q.id}`);
    assert.equal(q.adaptiveAreaBand,states[q.domainId],`${context}: ${q.id} demand`);
    const result=outcome(i,q),supported=result===null;
    responses.push({questionId:q.id,skillId:q.skillId,domainId:q.domainId,level:q.level,itemSnapshot:q.itemSnapshot,
     responseStatus:'answered',evidenceType:supported?'supported':'independent',supportUsed:supported,isCorrect:result!==false});
    if(!supported)states[q.domainId]=Math.max(0,Math.min(LITERACY_MOCK_AREA_MAX[q.domainId],q.adaptiveAreaBand+(result?1:-1)));
    const prefix=plan.itemIds.slice(0,i+1);
    assert.doesNotThrow(()=>{plan=adaptLiteracyMockPlan(pool,plan,responses,[],[],{exposures});},`${context}: after ${i+1}`);
    assert.deepEqual(plan.itemIds.slice(0,i+1),prefix);
   }
   assert.equal(responses.length,43);
   for(const [area,count]of Object.entries(LITERACY_MOCK_AREA_COUNTS))assert.equal(responses.filter(q=>q.domainId===area).length,count);
   exposures.push(...responses);
  }
 }
});
