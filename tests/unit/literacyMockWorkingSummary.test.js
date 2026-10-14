import test from 'node:test';
import assert from 'node:assert/strict';
import { literacyMockWorkingSummary,literacyMockAccuracyText } from '../../src/utils/literacyMockWorkingSummary.js';
import { LEARNING_EVIDENCE_POLICY } from '../../src/policy/learningPolicy.js';
const now='2026-10-14T06:00:00Z';
const row=(index,level=1,correct=true,overrides={})=>({questionId:`q${index}`,skillId:index%2?'key_details':'sequencing',domainId:'reading',level,isCorrect:correct,classification:'independent',recent:true,serverReceivedAt:now,...overrides});
const pupil=rows=>({responses:rows,skills:[{id:'key_details',label:'Key details'},{id:'sequencing',label:'Sequencing'}]});
const summarize=rows=>literacyMockWorkingSummary(pupil(rows),{now:Date.parse(now)});
const minimum=LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses;
test('accuracy uses exact independent fresh scored counts and never converts missing or helped work into errors',()=>{
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
