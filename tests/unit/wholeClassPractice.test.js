import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_RUNTIME_V10 } from '../../src/data/generated/literacyMockRuntimeV10.generated.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { wholeClassMockRounds, wholeClassMockPool, wholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
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
