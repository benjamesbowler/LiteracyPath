import test from 'node:test';
import assert from 'node:assert/strict';
import { literacyMockWorkingSummary,literacyMockAccuracyText } from '../../src/utils/literacyMockWorkingSummary.js';
import { LEARNING_EVIDENCE_POLICY } from '../../src/policy/learningPolicy.js';
import { LITERACY_MOCK_DEMAND_LADDERS } from '../../src/policy/literacyMockDemandV6.js';
const now='2026-10-14T06:00:00Z';
const row=(index,level=1,correct=true,overrides={})=>({questionId:`q${index}`,skillId:index%2?'key_details':'sequencing',domainId:'reading',level,isCorrect:correct,classification:'independent',recent:true,serverReceivedAt:now,...overrides});
const pupil=rows=>({responses:rows,skills:[{id:'key_details',label:'Key details'},{id:'sequencing',label:'Sequencing'}]});
const summarize=rows=>literacyMockWorkingSummary(pupil(rows),{now:Date.parse(now)});
const minimum=LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses;
test('accuracy uses exact independent scored counts and never converts missing or helped work into errors',()=>{
 const result=summarize([row(1),row(2,1,false),row(3,1,true,{classification:'supported'}),row(4,1,true,{classification:'familiar'}),row(5,1,null,{classification:'media_failed'}),row(6,1,false,{classification:'content_invalid'})]);
 assert.deepEqual(result.accuracy,{correct:1,answered:2,percent:50});assert.equal(literacyMockAccuracyText(result.accuracy),'50% · 1 of 2 correct');
 assert.equal(result.helped.answered,1);assert.equal(result.familiar.answered,1);assert.equal(result.unscored,2);
 assert.equal(result.stage.ready,false);assert.equal(result.stage.label,'More evidence needed');
 assert.equal(summarize([]).accuracy.percent,null);assert.equal(summarize([]).stage.label,'Not measured yet');
});
test('a lower raw percentage on harder questions can support a challenge working level while an easier perfect test remains foundation',()=>{
 const foundation=summarize(Array.from({length:minimum},(_,i)=>row(i)));
 const challenge=summarize(Array.from({length:minimum*2},(_,i)=>row(i,2,i%4!==0)));
 assert.equal(foundation.accuracy.percent,100);assert.equal(foundation.stage.label,'Foundation tasks');
 assert.equal(challenge.accuracy.percent,75);assert.equal(challenge.stage.label,'Challenge tasks');
 assert.equal(challenge.stage.ready,true);
});
test('small, single-skill, outdated or mixed-demand samples do not manufacture a current level',()=>{
 assert.equal(summarize([row(0,2)]).stage.ready,false);
 assert.equal(summarize(Array.from({length:minimum},(_,i)=>row(i,2,true,{skillId:'key_details'}))).stage.ready,false);
 assert.equal(summarize(Array.from({length:minimum},(_,i)=>row(i,2,true,{recent:false}))).stage.ready,false);
 assert.equal(summarize([row(0),row(1,2)]).stage.label,'Mixed — confirm level');
});
test('a difficult challenge follow-up does not erase a supported foundation working level',()=>{
 const result=summarize([...Array.from({length:minimum},(_,i)=>row(i)),...Array.from({length:minimum},(_,i)=>row(i+minimum,2,false))]);
 assert.equal(result.stage.label,'Foundation tasks');assert.equal(result.levels[1].percent,0);
 assert.match(result.nextStep,/Recheck/);assert.ok(result.nextSkills.length<=3);
});
test('area summaries keep listening/reading, vocabulary and foundation evidence in their actual domains',()=>{
 const result=literacyMockWorkingSummary(pupil([row(1),row(2,1,false,{domainId:'vocabulary'})]),{domains:['vocabulary'],now:Date.parse(now)});
 assert.deepEqual(result.accuracy,{correct:0,answered:1,percent:0});assert.equal(result.stage.ready,false);
});
const areaRow=(index,band,overrides={})=>row(index,1,true,{domainId:'vocabulary',skillId:'context_clues',
 itemSnapshot:{adaptiveAreaBand:band,constructClaim:'meaning_at_named_occurrence',adaptiveDemand:{operation:'interpret_one_context',requires:'Use one occurrence of a word to select its contextual sense.'}},...overrides});
const areaPupil=rows=>({...pupil(rows),areaAdaptive:true,skills:[{id:'context_clues',label:'Context clues'}]});
test('historical single-area results retain the saved last sampled demand and date without implying a current level',()=>{
 const result=literacyMockWorkingSummary(areaPupil([areaRow(1,3,{recent:false,serverReceivedAt:'2026-06-01T00:00:00Z'}),areaRow(2,5,{recent:false,serverReceivedAt:'2026-06-01T00:01:00Z'})]),{domains:['vocabulary'],now:Date.parse(now)});
 assert.equal(result.stage.label,'Last sampled: Extending');
 assert.match(result.stage.detail,/Historical sample from Jun 1, 2026/);
 assert.match(result.stage.detail,/not an established working level/);
 assert.equal(result.stage.ready,false);
 assert.equal(result.lastSample.band,5);
 assert.equal(result.lastSample.historical,true);
 assert.equal(result.observedSuccess,null,'historical correct responses do not become a current strength');
 assert.equal(result.levels.at(-1).percent,100);
 assert.deepEqual(result.nextSkills,[],'historical errors do not create a current teaching suggestion');
});
test('the last sampled demand comes from the last independent response, including an error, while support and familiarity stay separate',()=>{
 const rows=[areaRow(1,3),areaRow(2,4,{isCorrect:false}),areaRow(3,5,{classification:'supported'}),areaRow(4,5,{classification:'familiar'})];
 const result=literacyMockWorkingSummary(areaPupil(rows),{domains:['vocabulary']});
 assert.equal(result.stage.label,'Last sampled: Developing');
 assert.equal(result.lastSample.isCorrect,false);
 assert.deepEqual(result.observedSuccess,{id:'context_clues',label:'Context clues',count:1});
 assert.equal(result.helped.answered,1);assert.equal(result.familiar.answered,1);
 assert.deepEqual(result.sampledTasks.map(task=>[task.band,task.correct,task.answered]),[[3,1,1],[4,0,1]]);
 assert.equal(result.priorExposureUnknown,2);
});
test('sampled task detail preserves actual skills, operations and access conditions instead of manufacturing a band conclusion',()=>{
 const rows=[areaRow(1,3),areaRow(2,3,{knownFamiliar:false}),areaRow(3,3,{isCorrect:false,itemSnapshot:{adaptiveAreaBand:3,constructClaim:'different_construct',adaptiveDemand:{operation:'different_operation',requires:'A different saved task.'}}}),areaRow(4,3,{sourceWindowMode:'timed_sample'})];
 const result=literacyMockWorkingSummary(areaPupil(rows),{domains:['vocabulary']});
 assert.equal(result.sampledTasks.length,3);
 assert.equal(result.sampledTasks[0].answered,2);
 assert.equal(result.sampledTasks[0].skillLabel,'Context clues');
 assert.equal(result.sampledTasks[0].operation,'interpret_one_context');
 assert.equal(result.sampledTasks[1].operationLabel,'A different saved task.');
 assert.equal(result.stage.ready,false);
 assert.equal(result.priorExposureUnknown,3);
 const absent=literacyMockWorkingSummary(areaPupil([]),{domains:['vocabulary']});
 assert.equal(absent.accuracy.percent,null);assert.equal(absent.lastSample,null);assert.deepEqual(absent.sampledTasks,[]);
 assert.doesNotMatch(absent.stage.detail,/fresh scored/);
});
const boundaryRow=(index,band,isCorrect=true,overrides={})=>areaRow(index,band,{responseStatus:'answered',evidenceType:'independent',isCorrect,
 itemSnapshot:{domainId:'vocabulary',skillId:'context_clues',level:1,adaptiveAreaVersion:'areas-v5',adaptiveAreaBand:band,constructClaim:'synthetic_vocabulary_task',adaptiveDemand:LITERACY_MOCK_DEMAND_LADDERS.vocabulary[band]},...overrides});
const boundarySummary=rows=>literacyMockWorkingSummary({...areaPupil(rows),boundaryAdaptive:true,contentVersion:'literacy-mock-v9'},{domains:['vocabulary']});
test('V9 distinguishes repeated boundary observations from the last sampled demand and unsampled demands',()=>{
 const result=boundarySummary([boundaryRow(1,0),boundaryRow(2,1,false),boundaryRow(3,0),boundaryRow(4,1,false)]);
 assert.equal(result.stage.label,'Last sampled: Starter');
 assert.equal(result.stage.ready,false);
 assert.equal(result.boundaryObservation.stopReason,'adjacent_boundary');
 assert.match(result.boundaryObservation.label,/Boundary observed: First steps \/ Starter/);
 assert.match(result.boundaryObservation.detail,/2 independent correct answers at First steps and 2 independent incorrect answers at Starter/);
 assert.deepEqual(result.boundaryObservation.unsampledBands.map(band=>band.band),[2,3,4,5]);
 assert.equal(result.accuracy.percent,50);
});
test('V9 repeated ceiling and first-step errors describe exact observations without a proficiency claim',()=>{
 const ceiling=boundarySummary([0,1,2,3,4,5,5].map((band,index)=>boundaryRow(index,band)));
 assert.equal(ceiling.boundaryObservation.stopReason,'ceiling_confirmed');
 assert.match(ceiling.boundaryObservation.detail,/2 independent correct answers/);
 assert.match(ceiling.boundaryObservation.detail,/does not establish a working level/);
 const floor=boundarySummary([boundaryRow(1,0,false),boundaryRow(2,0,false)]);
 assert.equal(floor.boundaryObservation.stopReason,'floor_confirmed');
 assert.equal(floor.accuracy.percent,0,'observed errors may be zero percent; absent bands may not');
 assert.match(floor.boundaryObservation.detail,/does not establish an ability floor/);
 assert.equal(floor.boundaryObservation.unsampledBands.length,5);
});
test('V9 support and familiarity cannot confirm observations, and an empty V9 result stays unmeasured',()=>{
 const source=[boundaryRow(1,0,false),boundaryRow(2,0,false,{classification:'supported'}),boundaryRow(3,0,false,{classification:'familiar'})];
 const result=boundarySummary(source);
 assert.equal(result.boundaryObservation.complete,true);
 assert.equal(result.boundaryObservation.label,'Independent follow-up needed');
 assert.equal(result.accuracy.answered,1);
 assert.equal(result.helped.answered,1);assert.equal(result.familiar.answered,1);
 const absent=boundarySummary([]);
 assert.equal(absent.accuracy.percent,null);
 assert.equal(absent.stage.label,'Not measured yet');
 assert.equal(absent.boundaryObservation.label,'No independent sample yet');
 const legacy=literacyMockWorkingSummary(areaPupil([areaRow(1,3)]),{domains:['vocabulary']});
 assert.equal(legacy.boundaryAdaptive,false);
 assert.equal(legacy.boundaryObservation,null,'V9 stopping rules never reinterpret a V1–V8 sitting');
});
test('V9 question and letter limits are visibly uncertain and do not turn supported work into an independent result',()=>{
 const budget=boundarySummary([[0,true],[1,true],[2,true],[3,false],[2,false],[1,true],[2,true],[3,true]].map(([band,correct],index)=>boundaryRow(index,band,correct)));
 assert.equal(budget.boundaryObservation.stopReason,'budget_limit');
 assert.match(budget.boundaryObservation.label,/Question limit reached — uncertain/);
 assert.match(budget.boundaryObservation.detail,/before a repeated stopping pattern/);
 assert.equal(budget.accuracy.answered,8);
 const printRows=['a','b','c','d','e'].map((targetWord,index)=>row(index,1,index!==2,{domainId:'print',skillId:'letter_knowledge',responseStatus:'answered',classification:[1,3].includes(index)?'supported':'independent',evidenceType:[1,3].includes(index)?'supported':'independent',
  itemSnapshot:{domainId:'print',skillId:'letter_knowledge',level:1,targetWord,constructClaim:'letter_name',adaptiveAreaVersion:'areas-v5',adaptiveAreaBand:[0,1,1,0,0][index]}}));
 const letters=literacyMockWorkingSummary({...pupil(printRows),boundaryAdaptive:true},{domains:['print']});
 assert.equal(letters.boundaryObservation.stopReason,'letter_limit');
 assert.match(letters.boundaryObservation.label,/Letter sample limit reached — uncertain/);
 assert.match(letters.boundaryObservation.detail,/stopping rule was not met/);
 assert.equal(letters.accuracy.answered,3);
 assert.equal(letters.helped.answered,2);
});
