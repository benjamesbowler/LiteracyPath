import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V14 } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { reviewedFoundationBand, reviewFoundationItem } from '../../src/data/literacyMockReviewedFoundations.js';
import { mockResponseComplete, mockResponseValue } from '../../src/utils/literacyMockResponse.js';

const original = LITERACY_MOCK_RUNTIME_V14.filter(item =>
  item.adaptiveMixedEligible && ['sound_awareness','phonics','print'].includes(item.domainId)).map(i=>i.itemSnapshot);
const items = original.map(reviewFoundationItem).filter(i=>i.adaptiveMixedEligible);
const print = items.filter(i=>i.domainId==='print');
const byId = new Map(original.map(i=>[i.id,i]));

test('foundation revisions preserve exposure identity, verify media and classify literal reviewed demand', () => {
  assert.equal(original.length,1148);
  assert.equal(items.length,1136);
  for (const item of items) {
    const source = byId.get(item.id);
    assert.equal(item.canonicalItemId,source.canonicalItemId);
    assert.equal(item.canonicalPassageId,source.canonicalPassageId);
    assert.equal(item.exposureFamilyId,source.exposureFamilyId);
    if (source===item) continue;
    // Source snapshots stay frozen in the earlier publication.
    assert.equal(source.contentVersion,'literacy-mock-v14');
    if (item.id!=='lp3.initial_sounds.l2.C.g.v3') assert.equal(reviewedFoundationBand(item),item.adaptiveAreaBand,item.id);
    const assets = [...item.requiredAudioPaths,...item.requiredImagePaths];
    for (const path of assets) assert.ok(existsSync(new URL('../../public'+path.split('#')[0],import.meta.url)),item.id+' '+path);
    assert.deepEqual(new Set(item.requiredAudioCues.map(c=>c.path)),new Set(item.requiredAudioPaths),item.id);
  }
});

test('full-alphabet dictation never supplies the vowel team or the spelling length', () => {
  const tasks = items.filter(i=>i.domainId==='phonics'&&i.format==='build_word');
  assert.equal(tasks.length,307);
  for (const item of tasks) {
    assert.equal(item.alphabetSpelling,true,item.id);
    assert.equal(item.renderTargetText,false,item.id);
    assert.equal(item.displayPassageDuringResponse,false,item.id);
    assert.equal(item.passage,item.requiredAudioCues.find(c=>c.role==='passage')?.text||'',item.id);
    assert.ok(mockResponseComplete(item,['z']),item.id);
    assert.equal(mockResponseValue(item,[...item.answer]),item.answer);
    assert.equal(item.requiredAudioCues.at(-1).text,item.answer);
  }
  const plane = tasks.find(i=>i.answer==='plane');
  assert.ok(plane.requiredAudioCues.some(c=>c.role==='passage'&&/flew over the city/i.test(c.text)));
  assert.equal(reviewedFoundationBand({...plane,renderTargetText:true}),null);
  assert.equal(reviewedFoundationBand({...plane,displayPassageDuringResponse:true}),null);
  assert.equal(reviewedFoundationBand({...plane,passage:'A different sentence.'}),null);
  assert.ok(!tasks.some(i=>i.answer==='stile'||i.answer==='plains'));
  assert.equal(byId.get('mock.v9.phonics.build.b5.stream').alphabetSpelling,undefined);
});

test('print questions use real boundary contrasts and preserve the word hotspot interaction', () => {
  const advanced = print.filter(i=>i.adaptiveAreaBand>=3);
  assert.equal(advanced.length,73);
  assert.equal(advanced.filter(i=>i.format==='select_text').length,16);
  for (const item of advanced) {
    assert.equal(item.requiredAudioCues.length,1);
    const key = item.choices.find(c=>c.id===item.answer);
    if (item.format==='select_text') {
      assert.ok(key.tokenIndex>0 && key.tokenIndex<item.choices.length-1);
      const preceding = item.choices.slice(0,key.tokenIndex).map(c=>c.label).join(' ');
      assert.match(preceding,item.adaptiveAreaBand===3 ? /,/ : /\b(?:Mr|Mrs|Ms|Dr)\./);
    } else if (!/^\d$/.test(key.label)) {
      assert.ok(item.choices.every(c=>/^[a-z]+(?:'[a-z]+)?$/.test(c.label)),item.id);
    }
    assert.equal(reviewedFoundationBand({...item,answer:'missing'}),null);
  }
});

test('spoken choices preserve each recorded option and remove a repeated or odd-one-out foil strategy', () => {
  const medial = items.filter(i=>i.domainId==='sound_awareness'&&i.adaptiveAreaBand===3);
  const foils = new Map();
  for (const item of medial) {
    for (const c of item.choices) {
      assert.ok(item.requiredAudioCues.some(cue=>cue.choiceId===c.id&&cue.text===c.label&&cue.path===c.audioPath));
      if (c.id !== item.answer) foils.set(c.label,(foils.get(c.label)||0)+1);
    }
  }
  assert.ok(Math.max(...foils.values())<=5);
  const gate = items.find(i=>i.id==='lp3.initial_sounds.l2.C.g.v3');
  assert.deepEqual(gate.choices.map(c=>c.label).sort(),['corn','glass','hat','mop']);
  assert.ok(gate.choices.every(c=>gate.requiredImagePaths.includes(c.image)));
});
