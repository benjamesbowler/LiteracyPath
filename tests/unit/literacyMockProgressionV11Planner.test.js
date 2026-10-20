import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { literacyMockBoundaryState, literacyMockBoundaryLimits } from '../../src/policy/literacyMockBoundaryPolicy.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

// These fixtures exercise public planning and routing only. Their empty media
// arrays do not establish real-bank capacity, file availability or cache size.
const version='literacy-mock-v11';
const bank=Object.entries(LITERACY_MOCK_AREA_MAX).flatMap(([domainId,maximum])=>
 Array.from({length:maximum+1},(_,adaptiveAreaBand)=>Array.from({length:domainId==='print' && adaptiveAreaBand<=1 ? 26 : 50},(_,index)=>{
  const lowerPrint=domainId==='print' && adaptiveAreaBand<=1,letter=String.fromCharCode(97+index),id=`v11-planner.${domainId}.${adaptiveAreaBand}.${index}`;
  const item={id,contentVersion:version,adaptiveAreaVersion:'areas-v6',adaptiveAreaBand,adaptiveMixedEligible:true,
   adaptiveDemand:{operation:`fixture-${domainId}-${adaptiveAreaBand}`},domainId,skillId:lowerPrint?'letter_knowledge':`${domainId}-${index%2}`,
   level:1,format:'choice',constructClaim:lowerPrint ? adaptiveAreaBand===0?'letter_name':'letter_case_correspondence':`fixture-${domainId}-${adaptiveAreaBand}`,
   modality:'recognition',targetWord:lowerPrint?letter:'',exposureFamilyId:lowerPrint?`letter-case:${letter}`:id,
   stimulusKey:lowerPrint?`letter-case:${letter}`:id,
   choices:Array.from({length:4},(_,option)=>({id:`c${option}`,label:lowerPrint?String.fromCharCode(97+(index+option)%26):`Choice ${option}`})),answer:'c0',
   mediaReady:true,requiredAudioPaths:[],requiredImagePaths:[],requiredAudioCues:[]};
  return {...item,itemSnapshot:{...item}};
 })).flat());
const byId=new Map(bank.map(item=>[item.id,item]));
const response=(item,isCorrect,flags={})=>({questionId:item.id,domainId:item.domainId,skillId:item.skillId,level:item.level,
 itemSnapshot:item.itemSnapshot,responseStatus:'answered',evidenceType:'independent',isCorrect,...flags});
const initial=(seed,exposures=[],onOfflineItems)=>selectLiteracyMockPlan(bank,{sessionId:`v11-${seed}`,studentId:'same-child',seed,exposures,onOfflineItems});
const patterns={
 correct:()=>true,
 incorrect:()=>false,
 reversal:(_item,areaIndex)=>areaIndex<5,
 alternating:(_item,areaIndex)=>areaIndex%2===0,
 uneven:item=>['reading','listening','vocabulary'].includes(item.domainId),
};
for(const [name,outcome] of Object.entries(patterns))test(`V11 public planner: five fresh same-child sittings follow the ${name} curve`,()=>{
 const exposures=[];
 for(let sitting=0;sitting<5;sitting++){
  let reserved=[],plan=initial(`${name}:${sitting}`,exposures,ids=>{reserved=ids;});
  const pool=bank.filter(item=>reserved.includes(item.id)),counts={},rows=[];
  const paths=new Map(LITERACY_MOCK_AREA_ORDER.map(area=>[area,[]]));
  while(rows.length<plan.itemIds.length){
   const item=byId.get(plan.itemIds[rows.length]),state=literacyMockBoundaryState(rows,{bank:byId})[item.domainId];
   assert.ok(reserved.includes(item.id),'The delivered question belongs to the authorized offline pool');
   assert.equal(state.complete,false,`${name}: stopped areas cannot receive new questions`);
   assert.equal(item.adaptiveAreaBand,state.nextBand,`${name}: offer the current demand in ${item.domainId}`);
   const route=paths.get(item.domainId);route.push(item.adaptiveAreaBand);
   if(route.length>1)assert.ok(Math.abs(route.at(-1)-route.at(-2))<=1,'Every actual adjacent observation changes at most one step');
   assert.equal(getLiteracyExposure(item,buildLiteracyExposureIndex({exposures,responses:rows})).knownFamiliar,null,'A new ID does not erase semantic familiarity');
   const areaIndex=counts[item.domainId]||0;counts[item.domainId]=areaIndex+1;
   rows.push(response(item,outcome(item,areaIndex)));
   const prefix=rows.map(row=>row.questionId);
   plan=adaptLiteracyMockPlan(pool,plan,rows,[],[],{exposures});
   assert.deepEqual(plan.itemIds.slice(0,rows.length),prefix,'Committed answers retain their exact question prefix');
  }
  const states=literacyMockBoundaryState(rows,{bank:byId});
  assert.ok(Object.values(states).every(state=>state.complete));
  assert.ok(rows.length<=literacyMockBoundaryLimits(version).maximum);
  assert.ok(states.print.lowerLetterTargets.length<=5,'Finite letter capacity remains bounded across retakes');
  if(name==='correct'){
   assert.ok(Object.values(states).every(state=>state.stopReason==='ceiling_confirmed'));
   for(const route of paths.values())assert.deepEqual(route.slice(0,3),[0,0,0]);
  }
  if(name==='incorrect')assert.ok(Object.values(states).every(state=>state.stopReason==='floor_confirmed'));
  if(name==='alternating')assert.ok([...paths.values()].every(route=>route.every(band=>band===0)));
  exposures.push(...rows);
 }
});

test('V11 late help restores independent evidence requirements while freezing an already presented question',()=>{
 let plan=initial('late-help'),rows=[];
 while(rows.filter(row=>row.domainId==='sound_awareness').length<5){
  const item=byId.get(plan.itemIds[rows.length]);rows.push(response(item,true));
  plan=adaptLiteracyMockPlan(bank,plan,rows);
 }
 const before=literacyMockBoundaryState(rows,{bank:byId}).sound_awareness;
 assert.equal(before.nextBand,2);
 const shown=plan.itemIds[rows.length],prefix=rows.map(row=>row.questionId);
 rows=rows.map((row,index)=>index===0?{...row,supportUsed:true}:row);
 const repaired=adaptLiteracyMockPlan(bank,plan,rows,[],[{questionId:shown}]);
 const after=literacyMockBoundaryState(rows,{bank:byId}).sound_awareness;
 assert.equal(after.correctByBand[0],before.correctByBand[0]-1);
 assert.deepEqual(repaired.itemIds.slice(0,rows.length),prefix);
 assert.equal(repaired.itemIds[rows.length],shown,'Late support does not replace the question already on screen');
});

test('V11 support or familiarity cannot promote a learner and cannot be replaced by another area success',()=>{
 for(const flags of [{supportUsed:true},{knownFamiliar:true}]){
  let plan=initial(`help:${JSON.stringify(flags)}`),rows=[];
  while(rows.length<plan.itemIds.length){
   const item=byId.get(plan.itemIds[rows.length]);
   if(item.domainId==='sound_awareness')assert.equal(item.adaptiveAreaBand,0);
   rows.push(response(item,true,item.domainId==='sound_awareness'?flags:{}));
   plan=adaptLiteracyMockPlan(bank,plan,rows);
  }
  assert.equal(literacyMockBoundaryState(rows,{bank:byId}).sound_awareness.stopReason,'independent_followup_needed');
 }
});
