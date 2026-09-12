import test from 'node:test';
import assert from 'node:assert/strict';
import { createCycleClock, buildCyclePlan, readCycleState, writeCycleState } from '../../src/components/cycle-practice/cyclePracticeState.js';
import { cycleQuestionRecord, summarizeCycleRecords } from '../../src/policy/cyclePracticePolicy.js';
import { buildCyclePracticePools, cycleFocusGraphemes } from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';

test('activity requires bracketed inputs; background, pause, idle and check never add practice', () => {
  const c = createCycleClock(0);
  c.tick(30_000,'practice',true,false); assert.equal(c.values.activePracticeSeconds,0);
  c.input(30_000,'practice',true,false); c.input(50_000,'practice',true,false);
  assert.equal(c.values.activePracticeSeconds,20);
  c.tick(55_000,'practice',false,false); c.input(60_000,'practice',true,false);
  assert.equal(c.values.activePracticeSeconds,20);
  c.input(130_000,'practice',true,false); assert.equal(c.values.activePracticeSeconds,20);
  c.tick(135_000,'practice',true,true); c.input(140_000,'practice',true,false);
  c.resetInput(); c.tick(140_000,'assessment',true,false); c.tick(150_000,'assessment',true,false);
  assert.equal(c.values.activePracticeSeconds,20); assert.equal(c.values.checkSeconds,10);
  c.input(160_000,'assessment',true,false); assert.equal(c.values.activePracticeSeconds,20);
  const d=createCycleClock(1);d.restore(c.values);d.input(5,'practice',true,false);
  assert.equal(d.values.activePracticeSeconds,20);
});
test('support and missing required audio are unscored with original and actual constructs retained', () => {
  const r={id:'trace-1',mechanicId:'letterTrace',construct:'letter_formation'};
  const supported=cycleQuestionRecord(r,{correct:true,construct:'supported_formation_practice',selected:'m',evidence:{independent:false,supportUsed:['model']}},{mode:'assessment'});
  assert.equal(supported.isCorrect,null);assert.equal(supported.responseStatus,'supported');assert.equal(supported.selected,'m');
  assert.equal(supported.evidenceConstruct,'supported_formation_practice');
  const failed=cycleQuestionRecord({...r,mechanicId:'soundGate'},{correct:false},{audioDelivery:'unavailable'});
  assert.equal(failed.responseStatus,'media_failed'); assert.equal(failed.isCorrect,null);
  const good=cycleQuestionRecord(r,{correct:true},{mode:'assessment'});
  assert.deepEqual(summarizeCycleRecords([supported,failed,good]),{totalQuestions:3,scoredQuestions:1,correctCount:1,supportedCount:1,mediaFailedCount:1,scorePercent:100,status:'incomplete'});
  assert.equal(cycleQuestionRecord(r,{correct:true},{attempts:1}).responseStatus,'supported');
});
test('retired audio games retain their stored media evidence requirements', () => {
  for (const mechanicId of ['soundGate', 'soundBoxes', 'wordMachine', 'wordChain', 'phraseFlow']) {
    const failed = cycleQuestionRecord({ id: `historical-${mechanicId}`, mechanicId, audioRequired: false },
      { correct: true }, { mode: 'assessment', audioDelivery: 'unavailable' });
    assert.equal(failed.responseStatus, 'media_failed', mechanicId);
    assert.equal(failed.isCorrect, null, mechanicId);
    assert.equal(failed.audioRequired, true, mechanicId);
  }
});
test('all 27 cycles generate stable resumable plans and changing passes cover fresh pool items', () => {
  let changed=0;
  for(const cycle of elSkillsBlockCycles.filter(c=>c.cycleNumber)) {
    const first=buildCyclePlan(cycle,'coverage');const next=buildCyclePlan(cycle,'coverage',1);const check=buildCyclePlan(cycle,'coverage',0,true);
    assert.deepEqual(first,buildCyclePlan(cycle,'coverage'));assert.ok(first.rounds.length);assert.ok(check.rounds.length);
    assert.deepEqual(first.unavailable,[],cycle.id);assert.deepEqual(check.unavailable,[],cycle.id);
    assert.ok(check.rounds.every(r=>r.mechanicId!=='phraseFlow'));
    const constructs = new Set(Object.values(buildCyclePracticePools(cycle, 'coverage', true)).flat().filter(r => r.checkEligible).map(r => r.construct));
    for (const grapheme of cycleFocusGraphemes(cycle)) assert.ok(check.rounds.some(r => r.targetGrapheme === grapheme), `${cycle.id}: ${grapheme}`);
    assert.deepEqual(new Set(check.rounds.map(r=>r.construct)),constructs,cycle.id);
    assert.deepEqual(new Set(first.blueprint.assessedConstructs), constructs, `${cycle.id}: report only actual Check constructs`);
    for (const construct of constructs) assert.ok(first.blueprint.practisedConstructs.includes(construct));
    assert.equal(new Set(check.rounds.map(r=>r.id)).size,check.rounds.length);
    if(JSON.stringify(first.rounds)!==JSON.stringify(next.rounds))changed++;
  }
  assert.equal(changed,27);
});
test('recovery retains exact pending payload and never claims quota write success',()=>{
  const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const pendingAttempt={attemptId:'same',questionRecords:[{selected:'m'}]};
  assert.equal(writeCycleState('one',{pendingAttempt,mode:'practice',assessmentRecords:[],practiceRecords:[],pass:0,practiceIndex:0,assessmentIndex:0,attempts:0},storage),true);
  assert.deepEqual(readCycleState('one',storage).pendingAttempt,pendingAttempt);
  assert.equal(writeCycleState('one',{pendingAttempt},{setItem(){throw Error('quota');}}),false);
  assert.deepEqual(readCycleState('one',storage).pendingAttempt,pendingAttempt);
});

test('suspended check and pause intervals are excluded at the visibility transition', () => {
  const clock=createCycleClock(0);
  clock.tick(0,'assessment',true,false);
  clock.tick(10_000,'assessment',false,false);
  clock.tick(100_000,'assessment',true,false);
  assert.equal(clock.values.checkSeconds,10);
  clock.tick(110_000,'assessment',true,true);
  clock.tick(200_000,'assessment',true,false);
  assert.equal(clock.values.checkSeconds,20);
  clock.tick(210_000,'finished',true,false);
  assert.equal(clock.values.checkSeconds,30);
});
test('blocked localStorage getter is caught before recovery access',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  try {
    Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('SecurityError');}});
    assert.equal(readCycleState('blocked'),null);
    assert.equal(writeCycleState('blocked',{}),false);
  } finally {
    if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;
  }
});
