import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhonicsCompletion, getWorkshopPrerequisites, makeMatchTiles, getPrintedMatchContract, settleExposureDeliveries } from '../../src/components/learn/phonics/phonicsActivityState.js';
import { cvcWordFamilies, getCvcWordGraphemes } from '../../src/data/cvcWordFamilies.js';

test('workshop uses every target, swap and distractor grapheme rather than any six letters or previous nest', () => {
  const family = cvcWordFamilies[0];
  assert.equal(getWorkshopPrerequisites(family, Object.fromEntries('xyzuvw'.split('').map(l => [l, 'completed']))).eligible, false);
  const { graphemes } = getWorkshopPrerequisites(family);
  const progress = Object.fromEntries(graphemes.map(l => [l.toUpperCase(), 'completed']));
  assert.equal(getWorkshopPrerequisites(family, progress).eligible, true);
  for (const l of graphemes) {
    const missing = { ...progress, [l.toUpperCase()]: 'inprogress' };
    assert.deepEqual(getWorkshopPrerequisites(family, missing).missing, [l]);
  }
  for (const f of cvcWordFamilies) {
    const p = getWorkshopPrerequisites(f);
    assert.ok(p.graphemes.length > 0);
    assert.equal(getWorkshopPrerequisites(f, Object.fromEntries(p.graphemes.map(l => [l, {status:'completed'}]))).eligible,true);
  }
});
test('shuffle epochs change layout with stable target identity and repeatable seeds', () => {
  const lesson = {letter:'a', words:[{word:'ant'},{word:'apple'}],distractors:[{word:'cat'},{word:'dog'}]};
  const first = makeMatchTiles(lesson,0);
  assert.deepEqual(first,makeMatchTiles(lesson,0));
  for(let epoch=1;epoch<10;epoch++) {
    const next = makeMatchTiles(lesson,epoch);
    assert.notDeepEqual(next,makeMatchTiles(lesson,epoch-1));
    assert.deepEqual(next.map(t=>t.word.word).sort(), first.map(t=>t.word.word).sort());
    assert.equal(next.filter(t=>t.isCorrect).length,2);
  }
});
test('completion retains support evidence and does not turn activity completion into independent mastery', () => {
  const steps=[{step:'trace',independent:true,supportUsed:['switch_trace'],strokeCoverages:[100]}];
  const event = createPhonicsCompletion(steps,'attempt-1');
  assert.equal(event.id,'attempt-1'); assert.equal(event.steps[0].independent,false);
  assert.deepEqual(event.steps[0].supportUsed,['switch_trace']);
  assert.equal(steps[0].independent,true);
});

test('X ending match never records or instructs an onset task', () => {
  const x = getPrintedMatchContract({letter:'X',matchPosition:'end'});
  assert.equal(x.construct,'printed_ending_matching');
  assert.match(x.prompt,/X endings/);
  assert.equal(x.location,'ending');
  assert.equal(getPrintedMatchContract({letter:'A'}).construct,'printed_onset_matching');
});

test('leaving exposure records in-flight audio as interrupted instead of permanently pending', () => {
  assert.deepEqual(settleExposureDeliveries({sound:'pending',ant:'delivered',apple:'playing'}), {sound:'interrupted',ant:'delivered',apple:'interrupted'});
});

test('every authored CVC target has reviewed units and unknown additions fail closed', () => {
  for (const family of cvcWordFamilies) for (const word of [...family.buildWords,...family.magicSwaps]) {
    const units=getCvcWordGraphemes(word);assert.equal(units.join(''),word);
    units[0]='changed'; assert.equal(getCvcWordGraphemes(word).join(''),word);
  }
  assert.throws(()=>getCvcWordGraphemes('ship'),/Missing authored/);
});
