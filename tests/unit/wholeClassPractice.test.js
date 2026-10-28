import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_RUNTIME_V10 } from '../../src/data/generated/literacyMockRuntimeV10.generated.js';
import { LITERACY_MOCK_RUNTIME_V12 } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { wholeClassMockRounds, wholeClassMockPool, wholeClassMockAnswer, createWholeClassMockSession, advanceWholeClassMockSession, recordWholeClassMockAttempt } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { buildCyclePracticePlan } from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';

test('mixed class practice starts with every area at the chosen first step and varies on a new run', () => {
  const first = wholeClassMockRounds(LITERACY_MOCK_RUNTIME_V10, {seed:'class-a'});
  assert.equal(first.length,12);
  assert.equal(new Set(first.map(item=>item.id)).size,12);
  assert.deepEqual(new Set(first.slice(0,8).map(item=>item.domainId)),new Set(LITERACY_MOCK_AREA_ORDER));
  assert.ok(first.every(item=>item.adaptiveAreaBand===0 && item.mediaReady && isLiteracyItemEligible(item) && !item.tutorialOnly));
  assert.notDeepEqual(first.map(item=>item.id),wholeClassMockRounds(LITERACY_MOCK_RUNTIME_V10,{seed:'class-b'}).map(item=>item.id));
  assert.deepEqual(first,wholeClassMockRounds(LITERACY_MOCK_RUNTIME_V10,{seed:'class-a'}));
});

test('teacher-chosen area and practice step select actual eligible content without falling back to another step', () => {
  for(const area of LITERACY_MOCK_AREA_ORDER){
    for(let band=0;band<=6;band++){
      const rows=wholeClassMockRounds(LITERACY_MOCK_RUNTIME_V10,{area,band:String(band),seed:'class',count:'all'});
      assert.ok(rows.every(item=>item.domainId===area && item.adaptiveAreaBand===band));
      assert.equal(rows.length,wholeClassMockPool(LITERACY_MOCK_RUNTIME_V10,area,String(band)).length);
    }
  }
  assert.deepEqual(wholeClassMockRounds(LITERACY_MOCK_RUNTIME_V10,{area:'print',band:'6',seed:'class'}),[]);
  const pool=wholeClassMockPool(LITERACY_MOCK_RUNTIME_V10,'all','all');
  const withdrawn={...pool[0],id:'withdrawn',mediaReady:false};
  const tutorial={...pool[0],id:'tutorial',tutorialOnly:true};
  assert.ok(!wholeClassMockRounds([...pool,withdrawn,tutorial],{seed:'class',band:'all',count:'all'}).some(item=>['withdrawn','tutorial'].includes(item.id)));
});

test('all original MAP response formats have an explicit class answer reveal',()=>{
  const rows=wholeClassMockPool(LITERACY_MOCK_RUNTIME_V10,'all','all');
  for(const item of rows)assert.ok(wholeClassMockAnswer(item).trim(),item.id);
  assert.equal(wholeClassMockAnswer({format:'build_word',answer:'clock'}),'clock');
  assert.equal(wholeClassMockAnswer({format:'order',answer:['b','a'],choices:[{id:'a',label:'cat.'},{id:'b',label:'The'}]}),'The cat.');
});

test('all 27 cycles supply original practice activities rather than an assessment/check deck',()=>{
  for(const cycle of elSkillsBlockCycles.filter(cycle=>cycle.cycleNumber)){
    const plan=buildCyclePracticePlan(cycle,'teacher-class-practice');
    assert.ok(plan.rounds.length>=12,cycle.id);
    assert.equal(new Set(plan.rounds.map(round=>round.mechanicId)).size,6,cycle.id);
    assert.ok(plan.rounds.every(round=>round.stationId!=='check'));
  }
});

const adaptiveBank = LITERACY_MOCK_AREA_ORDER.flatMap(domainId => Array.from({length:4},(_,adaptiveAreaBand) =>
 Array.from({length:15},(_,i) => ({id:`${domainId}:${adaptiveAreaBand}:${i}`,domainId,adaptiveAreaBand,
  exposureFamilyId:`${domainId}:${adaptiveAreaBand}:family:${i}`,mediaReady:true,adaptiveMixedEligible:true})))).flat(2);
const nextClass = session => advanceWholeClassMockSession(adaptiveBank,session);
const answerClass = (session,correct,extra={}) => recordWholeClassMockAttempt(session,session.rounds.length-1,{correct,...extra});

test('the default twelve-question mixed class round reaches harder real questions after correct answers',()=>{
 for(const seed of ['classroom-report','another-class','retake']) {
  let session=createWholeClassMockSession(LITERACY_MOCK_RUNTIME_V12,{seed});
  const shown=[];
  for(let index=0;index<12;index++) {
   shown.push(session.rounds[index]);
   session=advanceWholeClassMockSession(LITERACY_MOCK_RUNTIME_V12,recordWholeClassMockAttempt(session,index,{correct:true}));
  }
  assert.deepEqual(shown.map(item=>item.adaptiveAreaBand),[0,0,0,0,0,0,0,0,1,1,1,1]);
  assert.deepEqual(shown.slice(0,8).map(item=>item.domainId),LITERACY_MOCK_AREA_ORDER);
  assert.equal(new Set(shown.map(item=>item.id)).size,12);
 }
});

test('class practice responds on the next visit to each area without borrowing success from another area',()=>{
 let session=createWholeClassMockSession(adaptiveBank,{seed:'short-mixed-reversal',count:32});
 const shown=[];
 for(let index=0;index<32;index++) {
  shown.push(session.rounds[index].adaptiveAreaBand);
  session=nextClass(answerClass(session,index<16));
 }
 assert.deepEqual(shown,[...Array(8).fill(0),...Array(8).fill(1),...Array(8).fill(2),...Array(8).fill(1)]);
});

test('focused class practice starts at zero and fresh correct answers move one adjacent step up to its ceiling',()=>{
 let session=createWholeClassMockSession(adaptiveBank,{area:LITERACY_MOCK_AREA_ORDER[0],seed:'gradual',count:24});
 const bands=[];
 for(let i=0;i<9;i++){
  bands.push(session.rounds.at(-1).adaptiveAreaBand);
  session=nextClass(answerClass(session,true));
 }
 assert.deepEqual(bands,[0,1,2,3,3,3,3,3,3]);
 assert.equal(new Set(session.rounds.map(row=>row.exposureFamilyId)).size,session.rounds.length);
});

test('every area keeps its own practice step and each first-attempt error lowers one step',()=>{
 let session=createWholeClassMockSession(adaptiveBank,{area:'all',seed:'area-curves',count:64});
 const areaBands=new Map();
 for(let i=0;i<48;i++){
  const item=session.rounds.at(-1),seen=areaBands.get(item.domainId)||[];seen.push(item.adaptiveAreaBand);areaBands.set(item.domainId,seen);
  const correct=seen.length<=3;session=nextClass(answerClass(session,correct));
 }
 for(const bands of areaBands.values()) assert.deepEqual(bands.slice(0,6),[0,1,2,3,2,1]);
});

test('retries, answer reveals and unanswered navigation cannot manufacture harder class questions',()=>{
 let session=createWholeClassMockSession(adaptiveBank,{area:LITERACY_MOCK_AREA_ORDER[0],seed:'support',count:24});
 session=recordWholeClassMockAttempt(session,0,{correct:false});
 session=recordWholeClassMockAttempt(session,0,{correct:true});
 session=nextClass(session);
 session=recordWholeClassMockAttempt(session,1,{revealed:true});
 session=recordWholeClassMockAttempt(session,1,{correct:true});
 session=nextClass(session);session=nextClass(session);
 assert.ok(session.rounds.every(item=>item.adaptiveAreaBand===0));
 session=answerClass(session,true);session=nextClass(session);
 session=answerClass(session,true);session=nextClass(session);
 assert.equal(session.rounds.at(-1).adaptiveAreaBand,2,'Only the two fresh correct answers have promoted it');
 const snapshot=session.rounds.map(item=>item.id),state=JSON.stringify(session.progress);
 session=recordWholeClassMockAttempt(session,0,{correct:true});
 assert.deepEqual(session.rounds.map(item=>item.id),snapshot,'Earlier questions remain stable');
 assert.equal(JSON.stringify(session.progress),state,'Revisiting an earlier answer cannot update current capability');
});

test('adaptive exhaustion stays at its current step without jumping to available hard material',()=>{
 const area=LITERACY_MOCK_AREA_ORDER[0],bank=adaptiveBank.filter(item=>item.domainId===area && (item.adaptiveAreaBand!==0 || item.id.endsWith(':0')));
 let session=createWholeClassMockSession(bank,{area,seed:'exhaust',count:24});
 session=advanceWholeClassMockSession(bank,recordWholeClassMockAttempt(session,0,{correct:false}));
 assert.equal(session.rounds.length,1);assert.equal(session.exhausted,true);
 assert.equal(session.progress[area].band,0);
});

test('teacher-selected numbered bands remain fixed and finite while legacy all-steps becomes adaptive',()=>{
 const area=LITERACY_MOCK_AREA_ORDER[0];
 let fixed=createWholeClassMockSession(adaptiveBank,{area,band:'2',seed:'fixed',count:12});
 assert.equal(fixed.adaptive,false);assert.equal(fixed.rounds.length,12);
 assert.ok(fixed.rounds.every(item=>item.adaptiveAreaBand===2));
 fixed=recordWholeClassMockAttempt(fixed,0,{correct:false});
 assert.ok(fixed.rounds.every(item=>item.adaptiveAreaBand===2));
 const adaptive=createWholeClassMockSession(adaptiveBank,{area,band:'all',seed:'legacy-all',count:12});
 assert.equal(adaptive.adaptive,true);assert.equal(adaptive.rounds[0].adaptiveAreaBand,0);
});


test('revealing an unanswered question holds its current step and later success respects the bank ceiling',()=>{
 const area=LITERACY_MOCK_AREA_ORDER[0];
 let session=createWholeClassMockSession(adaptiveBank,{area,seed:'reveal-resets',count:24});
 for(let i=0;i<2;i++)session=nextClass(answerClass(session,true));
 session=recordWholeClassMockAttempt(session,2,{revealed:true});session=nextClass(session);
 assert.equal(session.rounds.at(-1).adaptiveAreaBand,2,'The reveal has not promoted or lowered it');
 for(let i=0;i<2;i++)session=nextClass(answerClass(session,true));
 assert.equal(session.rounds.at(-1).adaptiveAreaBand,3);
 for(let i=0;i<8;i++)session=nextClass(answerClass(session,true));
 assert.equal(session.rounds.at(-1).adaptiveAreaBand,3,'A ceiling holds at its actual bank maximum');
 assert.equal(session.exhausted,undefined);
});

test('all-incorrect real mixed rounds stay introductory and one successful area cannot promote another',()=>{
 let session=createWholeClassMockSession(LITERACY_MOCK_RUNTIME_V12,{seed:'incorrect-mixed',count:24});
 for(let index=0;index<24;index++) {
  assert.equal(session.rounds[index].adaptiveAreaBand,0);
  session=advanceWholeClassMockSession(LITERACY_MOCK_RUNTIME_V12,recordWholeClassMockAttempt(session,index,{correct:false}));
 }
 session=createWholeClassMockSession(LITERACY_MOCK_RUNTIME_V12,{seed:'uneven-class',count:24});
 for(let index=0;index<24;index++) {
  const item=session.rounds[index],successful=item.domainId==='phonics';
  assert.equal(item.adaptiveAreaBand,successful ? Math.floor(index/8) : 0);
  session=advanceWholeClassMockSession(LITERACY_MOCK_RUNTIME_V12,recordWholeClassMockAttempt(session,index,{correct:successful}));
 }
});

test('renamed items sharing a canonical family or passage cannot supply extra class evidence',()=>{
 const area=LITERACY_MOCK_AREA_ORDER[0],base=adaptiveBank.find(item=>item.domainId===area && item.adaptiveAreaBand===0);
 const bank=[base,{...base,id:'renamed-copy'},{...base,id:'new-family-same-passage',exposureFamilyId:'other',canonicalPassageId:'shared'},
  {...base,id:'third',exposureFamilyId:'third',canonicalPassageId:'shared'}];
 let session=createWholeClassMockSession(bank,{area,seed:'duplicate',count:12});
 for(let i=0;i<4;i++)session=advanceWholeClassMockSession(bank,answerClass(session,true));
 assert.ok(session.rounds.length<=2);
 assert.equal(session.progress[area].band,0);
 assert.equal(session.exhausted,true);
});
