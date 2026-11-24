import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V14 } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { reviewLanguageItem, reviewLanguagePicturePaths, reviewedLanguageBand } from '../../src/data/literacyMockReviewedLanguage.js';
import { resolveLiteracyMockImagePath } from '../../src/data/literacyMockImageDelivery.js';
import { literacyMockBeginnerVocabularyIssue } from '../../src/policy/literacyMockBeginnerVocabulary.js';
import { mockResponseComplete, mockResponseValue } from '../../src/utils/literacyMockResponse.js';

const originals = LITERACY_MOCK_RUNTIME_V14.filter(q => q.adaptiveMixedEligible && q.mediaReady &&
  ['language','vocabulary'].includes(q.domainId)).map(q => q.itemSnapshot);
const originalById = new Map(originals.map(q => [q.id,q]));
const items = originals.map(q => reviewLanguageItem(reviewLanguagePicturePaths(q)));
const original = q => originalById.get(q.id);
const foils = q => q.choices.filter(c => ![q.answer].flat().includes(c.id));
const family = (domain, band, format) => items.filter(q => q.domainId===domain && q.adaptiveAreaBand===band && (!format || q.format===format));
const setOfLabels = choices => choices.map(c => c.label).sort().join('|');

test('revised language evidence preserves exposure identities and exact media, and rejects changes to a key, recording or passage', () => {
  for (const item of items.filter(q=>q!==original(q))) {
    const prev = original(item);
    assert.equal(item.canonicalItemId,prev.canonicalItemId);
    assert.equal(item.canonicalPassageId,prev.canonicalPassageId);
    assert.equal(item.exposureFamilyId,prev.exposureFamilyId);
    assert.equal(reviewedLanguageBand(item,prev),item.adaptiveAreaBand,item.id);
    assert.equal(reviewedLanguageBand({...item,answer:'invented-key'},prev),null);
    assert.equal(reviewedLanguageBand({...item,requiredAudioCues:[]},prev),null);
    assert.equal(reviewedLanguageBand({...item,passage:'A different context.'},prev),null);
    assert.equal(literacyMockBeginnerVocabularyIssue({...item,contentVersion:'literacy-mock-v15'}),null);
    for (const path of [...item.requiredImagePaths.map(resolveLiteracyMockImagePath),...item.requiredAudioPaths]) {
      assert.ok(path && existsSync(new URL('../../public'+path.split('#')[0],import.meta.url)),item.id+' '+path);
    }
    assert.deepEqual(new Set(item.requiredAudioCues.map(c=>c.path)),new Set(item.requiredAudioPaths));
    for (const cue of item.requiredAudioCues.filter(c=>c.role==='choice')) {
      const choice=item.choices.find(c=>c.id===cue.choiceId);
      assert.equal(choice.label,cue.text,item.id);
      assert.equal(choice.audioPath,cue.path,item.id);
    }
  }
});

test('Starter picture sets differ by target and present one spoken referent in four distinct images', () => {
  const starter=family('vocabulary',1);
  assert.equal(starter.length,114);
  assert.equal(new Set(starter.map(q=>setOfLabels(q.choices))).size,114);
  for (const q of starter) {
    assert.equal(new Set(q.choices.map(c=>c.image)).size,4,q.id);
    assert.equal(q.choices.find(c=>c.id===q.answer).label,q.targetWord);
    assert.ok(q.choices.every(c=>c.imageAlt===c.label));
    assert.equal(q.hideWrittenLabels,true);
    assert.equal(q.renderTargetText,false);
    assert.ok(q.requiredAudioCues.some(c=>c.role==='target_word' && c.text===q.targetWord));
  }
  for (const target of ['hen','duck']) assert.ok(!starter.find(q=>q.targetWord===target).choices.some(c=>c.label==='bird'));
  assert.ok(!starter.find(q=>q.targetWord==='star').choices.some(c=>['moon','sun'].includes(c.label)));
  for (const band of [0,1]) {
    const actions=family('language',band);
    assert.equal(actions.length,60);
    assert.ok(new Set(actions.map(q=>setOfLabels(foils(q)))).size>=56);
    for(const q of actions) if(q.taskDemand?.proof?.rejected) assert.deepEqual(q.taskDemand.proof.rejected,foils(q).map(c=>c.label));
  }
});

test('word relationships include distractors for the last match and avoid repeated choice anchors', () => {
  const matches=family('vocabulary',2,'match');
  assert.equal(matches.length,36);
  for (const q of matches) {
    assert.equal(q.matchTargets.length,3);
    assert.equal(q.answer.length,3);
    assert.equal(foils(q).length,1);
    assert.ok(!q.matchTargets.some(t=>t.label===foils(q)[0].label),q.id);
    assert.equal(mockResponseComplete(q,q.answer.slice(0,2)),false);
    assert.equal(mockResponseComplete(q,q.answer),true);
  }
  const singles=family('vocabulary',2,'choice');
  assert.equal(singles.length,82);
  for (const q of singles) {
    if (q.prompt.startsWith('Choose a word')) assert.ok(q.choices.every(c=>!c.label.includes(' — ')));
    else assert.equal(new Set(q.choices.map(c=>c.label.split(' — ')[0])).size,4);
    assert.equal(q.choices.filter(c=>c.audioPath).length,4);
  }
});

test('ceiling questions require both contextual senses or a conclusion supported by the supplied language', () => {
  const pairs=family('vocabulary',5,'match');
  assert.equal(pairs.length,13);
  for(const q of pairs) {
    assert.equal(q.requiredAudioCues.filter(c=>c.role==='choice').length,4);
    assert.equal(q.requiredAudioCues.find(c=>c.role==='passage').text,q.passage);
    assert.equal(q.requiredAudioCues.find(c=>c.role==='target_word').text,q.targetWord);
    assert.equal(q.requiredAudioCues.find(c=>c.role==='instruction').text,q.prompt);
    assert.deepEqual(q.matchTargets.map(t=>t.label),['First use','Second use'].map(pos=>pos+' of “'+q.targetWord+'”'));
    assert.equal(foils(q).length,2);
    assert.equal(mockResponseComplete(q,q.answer.slice(0,1)),false);
    assert.equal(mockResponseComplete(q,q.answer),true);
    assert.deepEqual(mockResponseValue(q,q.answer),q.answer);
    assert.equal(reviewedLanguageBand({...q,answer:[...q.answer].reverse()},original(q)),null);
  }
  const entailment=family('language',5).filter(q=>q.prompt==='Which statement must be true?');
  assert.equal(entailment.length,22);
  for(const q of entailment) {
    assert.equal(q.taskDemand.proof.source,q.passage);
    assert.equal(q.requiredAudioCues.find(c=>c.role==='instruction').text,q.prompt);
    assert.equal(q.taskDemand.proof.retained,q.choices.find(c=>c.id===q.answer).label);
  }
});
