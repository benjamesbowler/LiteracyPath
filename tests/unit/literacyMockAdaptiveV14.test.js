import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { LITERACY_MOCK_ADAPTIVE_VERSION as version } from '../../src/policy/literacyMockVersions.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { adaptLiteracyMockPlan, selectLiteracyMockPlan, mockChoices } from '../../src/utils/literacyMockPlanner.js';
import { mockOfflineMediaPaths, mockOfflineMediaAssetLimit } from '../../src/utils/literacyMockOfflineMedia.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const bank = await loadLiteracyMockRuntimeBank({contentVersion:version, mixed:true});
function run(itemCount, rotation, policy, exposures = []) {
  const options = { sessionId:'20000000-0000-4000-8000-00000000000'+rotation, studentId:'fixture', itemCount, exposures };
  const byId = new Map(bank.map(item=>[item.id,item]));
  let classroom = createWholeClassMockSession(bank, options);
  let reserveIds;
  let plan = selectLiteracyMockPlan(bank, {...options,onOfflineItems:ids=>{reserveIds=new Set(ids);}});
  const reserve=bank.filter(item=>reserveIds.has(item.id));
  assert.ok(mockOfflineMediaPaths(reserve).length < mockOfflineMediaAssetLimit(version)-6);
  const trace={}, rows=[], history = buildLiteracyExposureIndex({exposures});
  while(rows.length < plan.itemIds.length) {
    const index=rows.length, item=byId.get(plan.itemIds[index]);
    assert.equal(item.id,classroom.rounds[index].id);
    assert.deepEqual(mockChoices(item,plan.seed),mockChoices(classroom.rounds[index],classroom.seed));
    assert.equal(getLiteracyExposure(item,history).knownFamiliar,null);
    const bands=trace[item.domainId] ||= [];
    const {correct,supported=false} = policy(item,index,bands);
    bands.push(item.adaptiveAreaBand);
    const wrong = item.format === 'build_word' ? 'x' : Array.isArray(item.answer)
      ? [item.choices.find(choice => item.answer[0] !== choice.id).id] : item.choices.find(choice => choice.id !== item.answer).id;
    const answer={questionId:item.id,responseStatus:'answered',supportUsed:supported,selected:correct?item.answer:wrong,
      audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path => [path,'completed']))};
    classroom=submitWholeClassMockAnswer(classroom,item,answer);
    rows.push({...answer,isCorrect:correct,evidenceType:supported?'supported':'independent',skillId:item.skillId,domainId:item.domainId,itemSnapshot:item.itemSnapshot});
    plan=adaptLiteracyMockPlan(reserve,plan,rows,[],[],options);
    assert.deepEqual(classroom.run.plan.itemIds,plan.itemIds);
    assert.deepEqual(plan.itemIds.slice(0,rows.length),rows.map(row=>row.questionId));
  }
  return {trace,rows};
}

test('V14 pupil and class use identical presentations and respond in both directions at all three caps', () => {
  for(const cap of [15,25,40]) {
    const positive=run(cap,1,()=>({correct:true}));
    const negative=run(cap,1,()=>({correct:false}));
    assert.equal(positive.rows.length,cap);
    const formats = new Set(positive.rows.map(row=>row.itemSnapshot.format));
    if (cap === 15) assert.ok(formats.size >= 4);
    else assert.deepEqual(formats, new Set(['choice','multi_select','match','build_word','order','select_text']));
    assert.equal(negative.rows.length,Math.min(cap,24));
    for(const [sample, next] of [[positive,2],[negative,0]]) {
      assert.equal(new Set(sample.rows.slice(0,15).map(row=>row.domainId)).size,8);
      assert.deepEqual(sample.rows.slice(0,2).map(row=>row.itemSnapshot.adaptiveAreaBand),[1,next]);
      for(const bands of Object.values(sample.trace)) {
        assert.equal(bands[0],1);
        if(bands.length>=2) assert.equal(bands[1],next);
      }
    }
    const mixed=run(cap,3,item=>({correct:item.domainId==='phonics'}));
    assert.deepEqual(mixed.trace.phonics.slice(0,2),[1,2]);
    assert.deepEqual(mixed.trace.reading.slice(0,2),[1,0]);
  }
});
test('V14 help holds demand and fresh independent reversals change the next visit',()=>{
  const result=run(40,0,(_item,_index,bands)=>({correct:bands.length<2,supported:bands.length===0}));
  for(const trace of Object.values(result.trace)) assert.deepEqual(trace.slice(0,4),[1,1,2,1]);
});
test('V14 five consecutive retakes use fresh items, passages and families on different paths',()=>{
  const exposures=[];
  for(let index=0;index<5;index++) {
    const {rows}=run(40,index,(item,n)=>({correct:index%2===0 || item.domainId===LITERACY_MOCK_AREA_ORDER[n%8]}),exposures);
    exposures.push(...rows);
  }
});
