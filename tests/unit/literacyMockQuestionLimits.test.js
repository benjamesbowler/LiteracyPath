import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_RUNTIME_V12 as bank } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_SHORT_ITEM_COUNTS, literacyMockQuestionLimit } from '../../src/policy/literacyMockQuestionLimit.js';
import { literacyMockBoundaryState } from '../../src/policy/literacyMockBoundaryPolicy.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { literacyMockWorkingSummary } from '../../src/utils/literacyMockWorkingSummary.js';
import { projectMockMutation } from '../../src/utils/literacyMockOutbox.js';

const byId = new Map(bank.map(item => [item.id,item]));
const answered = (item, correct, flags={}) => ({ questionId:item.id, domainId:item.domainId, skillId:item.skillId,
  itemSnapshot:item.itemSnapshot, responseStatus:'answered', evidenceType:'independent', classification:'independent',
  isCorrect:correct, recent:true, serverReceivedAt:new Date().toISOString(), ...flags });

for (const count of LITERACY_MOCK_SHORT_ITEM_COUNTS) for (const pattern of ['correct','incorrect','alternating','help']) {
  test(`V12 ${count}-question maximum follows the unchanged ${pattern} route and preserves saved prefixes`, () => {
    let ids=[];
    let plan=selectLiteracyMockPlan(bank,{sessionId:`short-${count}-${pattern}`,studentId:'synthetic',itemCount:count,onOfflineItems:values=>{ids=values;}});
    assert.equal(plan.itemIds.length,count);
    const pool=bank.filter(item=>ids.includes(item.id)), rows=[], visits={};
    while(rows.length<plan.itemIds.length) {
      const item=byId.get(plan.itemIds[rows.length]), state=literacyMockBoundaryState(rows,{bank:byId})[item.domainId];
      assert.equal(item.adaptiveAreaBand,state.nextBand);
      assert.equal(state.complete,false);
      assert.equal(getLiteracyExposure(item,buildLiteracyExposureIndex({responses:rows})).knownFamiliar,null);
      const ordinal=visits[item.domainId]||0;visits[item.domainId]=ordinal+1;
      if(pattern==='correct') assert.equal(item.adaptiveAreaBand,ordinal<3?0:1+Math.floor((ordinal-3)/2));
      if(pattern==='help') assert.equal(item.adaptiveAreaBand,0);
      const supported=pattern==='help';
      rows.push(answered(item,pattern!=='incorrect' && (pattern!=='alternating' || ordinal%2===0),
        supported?{supportUsed:true,evidenceType:'supported',classification:'supported'}:{}));
      plan=adaptLiteracyMockPlan(pool,plan,rows,[],[],{itemCount:count});
      assert.ok(plan.itemIds.length<=count);
      assert.deepEqual(plan.itemIds.slice(0,rows.length),rows.map(row=>row.questionId));
    }
    assert.deepEqual(new Set(rows.map(row=>row.domainId)),new Set(LITERACY_MOCK_AREA_ORDER));
    const states=literacyMockBoundaryState(rows,{bank:byId});
    if(pattern==='incorrect') assert.equal(rows.length,Math.min(count,16),'Confirmed floors may finish a sitting early');
    if(pattern==='correct') {
      assert.equal(rows.length,count);
      assert.ok(Object.values(states).every(state=>state.boundary===null),'A short all-correct sample cannot invent a ceiling');
      const summary=literacyMockWorkingSummary({contentVersion:'literacy-mock-v12',boundaryAdaptive:true,
        maximumPlanned:count,run:{status:'completed',responses:rows},responses:rows});
      assert.ok(summary.boundaryAreas.every(area=>area.stopReason==='session_question_limit' && area.boundary===null));
      assert.ok(summary.boundaryAreas.every(area=>area.label==='Question limit reached — uncertain'));
    }
    if(pattern==='help') assert.ok(Object.values(states).every(state=>state.nextBand===0 && state.boundary===null));
  });
}

test('short options apply only to V12, and historical complete tests keep their maximum',()=>{
  for(const version of ['literacy-mock-v9','literacy-mock-v10','literacy-mock-v11']) {
    assert.throws(()=>literacyMockQuestionLimit(version,15,version==='literacy-mock-v11'?124:67));
  }
  assert.equal(literacyMockQuestionLimit('literacy-mock-v12',undefined,124),124);
  assert.equal(literacyMockQuestionLimit('literacy-mock-v12',124,124),124);
  for(const count of [null,0,14,16,24,26,41,125,'15']) {
    if(count===null) assert.equal(literacyMockQuestionLimit('literacy-mock-v12',count,124),124);
    else assert.throws(()=>literacyMockQuestionLimit('literacy-mock-v12',count,124));
  }
});

test('an offline short sitting cannot extend its plan beyond the teacher-selected maximum',()=>{
  const plan=selectLiteracyMockPlan(bank,{sessionId:'short-offline',studentId:'synthetic',itemCount:15});
  const run={contentVersion:'literacy-mock-v12',plan,responses:[],revision:1,status:'running'};
  assert.throws(()=>projectMockMutation(run,{expectedRevision:1,plan:{...plan,itemIds:[...plan.itemIds,'another-item']}},{itemCount:15}),/Invalid local plan prefix/);
});
