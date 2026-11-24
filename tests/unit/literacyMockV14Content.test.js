import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LITERACY_MOCK_RUNTIME_V14 } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { literacyMockBeginnerVocabularyIssue } from '../../src/policy/literacyMockBeginnerVocabulary.js';
import { scoreLiteracyMockResponse } from '../../src/data/literacyMockRuntimeContract.js';
import { isLiteracyItemEligible, literacyItemQualityIssue, LITERACY_MOCK_V14_PICTURE_ISSUES } from '../../src/policy/literacyItemEligibility.js';
import { auditLiteracyMockItem } from '../../tools/lib/literacyMockContracts.mjs';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

const active = LITERACY_MOCK_RUNTIME_V14.filter(item => item.adaptiveMixedEligible && !item.tutorialOnly);
const cell = (domain, band) => active.filter(item => item.domainId === domain && item.adaptiveAreaBand === band);

test('all authored single-choice cells rotate the key and retain literal IDs across rendered shuffles', () => {
  const cells = Object.groupBy(active.filter(i => i.format === 'choice'), i => i.domainId + ':' + i.adaptiveAreaBand);
  for (const items of Object.values(cells)) {
    const counts = [0, 0, 0, 0];
    for (const item of items) {
      const at = item.choices.findIndex(c => c.id === item.answer);
      assert.equal(item.choices.length, 4, item.id);
      assert.ok(at >= 0, item.id);
      counts[at]++;
      const rendered = mockChoices(item, 'another-sitting');
      assert.deepEqual(rendered.find(c => c.id === item.answer), item.choices[at]);
    }
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, JSON.stringify(counts));
  }
});

test('entry sound and word questions use diverse, complete sets with recordings bound to visible choices', () => {
  for (const [domain, band] of [['reading',0], ['language',0], ['language',1], ['sound_awareness',0], ['sound_awareness',1]]) {
    const items = cell(domain,band);
    const signatures = new Set(items.map(i => i.choices.map(c => c.label).sort().join('|')));
    assert.equal(signatures.size, items.length, domain+band);
    const counts = new Map();
    for (const item of items) {
      assert.equal(literacyMockBeginnerVocabularyIssue(item), null);
      for (const c of item.choices) {
        if (c.id !== item.answer) counts.set(c.label, (counts.get(c.label) || 0) + 1);
        if (c.audioPath) assert.ok(item.requiredAudioCues.some(cue => cue.role === 'choice' && cue.choiceId === c.id
          && cue.text === c.label && cue.path === c.audioPath), item.id);
        if (item.evidenceModality === 'audio+image') assert.ok(c.image && c.imageAlt, item.id);
      }
    }
    assert.ok(Math.max(...counts.values()) <= Math.ceil(items.length / 4), domain+band);
  }
  const pup = cell('reading',0).find(i => i.targetWord === 'pup');
  assert.ok(pup && !pup.choices.some(c => c.label === 'dog'));
  for (const item of cell('writing',1).filter(i => /starts .*(?:capital letter)/.test(i.prompt))) {
    assert.deepEqual(item.choices.filter(c => /^[A-Z]/.test(c.label)).map(c => c.id), [item.answer], item.id);
  }
  for (const item of active.filter(i => ['Which word rhymes with the word you hear?', 'Which word has the same starting sound?'].includes(i.prompt)
    && i.requiredAudioCues.some(c => c.role === 'target_word'))) {
    assert.equal(item.requiredAudioCues.find(c => c.role === 'instruction').text, item.prompt, item.id);
  }
});

test('select-all keys score sets of varying sizes and alphabet spelling scores the whole dictated word', () => {
  const sets = active.filter(i => i.selectAllThatApply);
  assert.deepEqual(new Set(sets.map(i => i.answer.length)), new Set([2,3]));
  for (const item of sets) {
    assert.equal(scoreLiteracyMockResponse(item, [...item.answer].reverse()), true);
    assert.equal(scoreLiteracyMockResponse(item, item.answer.slice(1)), false);
    const wrong = item.choices.find(c => !item.answer.includes(c.id));
    assert.equal(scoreLiteracyMockResponse(item, [...item.answer,wrong.id]), false);
    assert.ok(item.requiredAudioCues.some(c => c.role === 'instruction' && c.text === item.prompt));
  }
  const dictations = active.filter(i => i.alphabetSpelling);
  assert.ok(dictations.some(i => i.id.startsWith('mock.v14.spell.')));
  for (const item of dictations) {
    assert.equal(item.renderTargetText,false,item.id);
    assert.ok(item.requiredAudioCues.some(c => c.role === 'target_word' && c.path && c.text === item.answer), item.id);
    assert.equal(scoreLiteracyMockResponse(item,item.answer),true);
    assert.equal(scoreLiteracyMockResponse(item,item.answer.slice(0,-1)),false);
  }
});

test('the literal new-task classifier rejects a mismatched demand, broken passage, or unavailable stimulus', () => {
  const swimming = active.find(q => q.id === 'mock.v14.read.pond-rail');
  assert.deepEqual(swimming.choices.filter(c => swimming.answer.includes(c.id)).map(c => c.label).sort(), ['duck','frog']);
  for (const mutation of [
    {...swimming, adaptiveAreaBand: 3},
    {...swimming, passage: 'A frog sat on the rock.'},
    {...swimming, format: 'choice'},
    {...active.find(q => q.id.startsWith('mock.v14.spell.')), requiredAudioCues: []},
  ]) assert.ok(auditLiteracyMockItem(mutation).some(issue => issue.code === 'Q-MOCK-DEMAND'), mutation.id);
});

test('withdrawn picture choices are version scoped and preserve the originally recorded response', () => {
  for (const [id, reason] of Object.entries(LITERACY_MOCK_V14_PICTURE_ISSUES)) {
    const item = active.find(q => q.id === id);
    const response = {questionSnapshot: item.itemSnapshot, selected: item.answer};
    assert.equal(isLiteracyItemEligible(item), false);
    assert.deepEqual(literacyItemQualityIssue(response), {code: 'ambiguous_picture', reason});
    assert.equal(response.selected, item.answer);
    assert.equal(literacyItemQualityIssue({...item.itemSnapshot, contentVersion:'literacy-mock-v13'}), null);
  }
});
