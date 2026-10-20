import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { upgradeMeaningChoicesV11, listMeaningChoicesV11AudioGaps } from '../../src/data/literacyMockFourChoiceMeaningV11.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10' });
const scoped = bank.filter(q => q.adaptiveMixedEligible && q.format === 'choice' && ['vocabulary', 'language', 'writing', 'reading', 'listening'].includes(q.domainId) && q.adaptiveAreaBand >= 2);

test('every active upper meaning choice has one key and three distinct, explained distractors', () => {
  assert.ok(scoped.length >= 800);
  for (const source of scoped) {
    const before = JSON.stringify(source);
    const item = upgradeMeaningChoicesV11(source, bank);
    assert.equal(JSON.stringify(source), before, `${source.id}: source mutated`);
    assert.equal(item.choices.length, 4, item.id);
    assert.equal(new Set(item.choices.map(c => c.label.toLowerCase().replace(/\s+/g, ' ').trim())).size, 4, item.id);
    assert.equal(item.choices.filter(c => c.id === item.answer).length, 1, item.id);
    for (const c of item.choices.filter(c => c.id !== item.answer)) assert.ok((item.distractorRationales[c.id] || item.distractorRationales[c.label])?.length > 0, `${item.id}: ${c.label}`);
    assert.equal(item.exposureFamilyId, source.exposureFamilyId, item.id);
    if (item.sourceProvenance?.v11MeaningChoices?.familiarWordRelationRepair) {
      assert.ok(item.canonicalPassageId.startsWith('v11-relation:'));
      assert.equal(item.stimulusKey, item.canonicalPassageId);
      assert.equal(item.sourceProvenance.v11MeaningChoices.priorCanonicalPassageId, source.canonicalPassageId);
      assert.equal(item.sourceProvenance.v11MeaningChoices.priorStimulusKey, source.stimulusKey);
    } else {
      assert.equal(item.canonicalPassageId, source.canonicalPassageId, item.id);
      assert.equal(item.stimulusKey, source.stimulusKey, item.id);
    }
    if (item !== source) assert.ok(item.id.endsWith('.v11'));
  }
});

test('all word relationship content uses familiar words, including every predecessor advanced family', () => {
  const forbidden = /\b(triumph|succeed|aid|scorching|reluctant|unwilling|fragile|flexible|expand|shrink|advance|retreat|proceed|approach|arrive|depart|increase|decrease|include|exclude|accept|refuse|attach|detach|permit|forbid|authorize|gather|scatter|assemble|rigid|pliable|durable|delicate|opaque|transparent|gradual|sudden|generous|stingy|frequent|cautious|reckless|temporary|permanent|fortunate|wealthy|vacant|sturdy|weary|drenched|glum|gleaming|tarnished|parched|cramped)\b/i;
  for (const source of scoped.filter(q => q.skillId === 'antonyms_synonyms')) {
    const item = upgradeMeaningChoicesV11(source, bank);
    assert.doesNotMatch([item.prompt, item.passage, ...item.choices.map(c => c.label)].join(' '), forbidden, source.id);
    assert.equal(item.choices.length, 4);
  }
});

test('new spoken alternatives request their exact recordings and reading responses stay silent', () => {
  const upgraded = scoped.map(q => upgradeMeaningChoicesV11(q, bank));
  for (const item of upgraded) {
    const spoken = item.requiredAudioCues.filter(c => c.role === 'choice');
    if (item.domainId === 'reading' || item.constructClaim.includes('sentence_boundary')) assert.equal(spoken.length, 0, item.id);
    else if (spoken.length) for (const choice of item.choices) {
      const cue = spoken.find(c => c.choiceId === choice.id);
      assert.equal(cue?.text, choice.label, `${item.id}: missing exact ${choice.label}`);
    }
  }
  for (const gap of listMeaningChoicesV11AudioGaps(bank)) assert.ok(gap.text && gap.role && gap.itemIds.length);
});

test('out of scope formats, historical items and lower bands remain unchanged', () => {
  for (const source of bank.filter(q => !scoped.includes(q)).slice(0, 200)) assert.equal(upgradeMeaningChoicesV11(source, bank), source);
});

test('sequencing offers four supplied events while retaining the original first-event question and key', () => {
  const sources = scoped.filter(q => q.constructClaim.replace(/^listening_/, '') === 'story_event_order');
  assert.equal(sources.length, 90);
  for (const source of sources) {
    const item = upgradeMeaningChoicesV11(source, bank);
    assert.equal(item.prompt, 'What happened first?');
    assert.equal(item.answer, source.answer);
    assert.ok(item.passage.startsWith(`${source.passage} At the end, `));
    assert.ok(item.passage.endsWith(item.taskDemand.proof.fourthEventEvidence));
    assert.equal(item.choices[3].label, item.taskDemand.proof.fourthEvent);
    assert.equal(item.taskDemand.features.responseEvents, 4);
    if (item.domainId === 'listening') assert.equal(item.requiredAudioCues.find(c => c.role === 'passage').text, item.passage);
  }
});

test('historical versions are ignored and repairs are idempotent', () => {
  const source = scoped.find(q => q.id === 'mock.capacity.language.opposite-win-lose');
  const historical = { ...source, contentVersion: 'literacy-mock-v9' };
  assert.equal(upgradeMeaningChoicesV11(historical, bank), historical);
  const repaired = upgradeMeaningChoicesV11(source, bank);
  assert.equal(upgradeMeaningChoicesV11(repaired, bank), repaired);
  assert.deepEqual(repaired.choices.map(c => c.label), ['win — lose', 'win — play', 'win — try', 'win — score']);
});

test('reviewed meaning foils avoid a second synonym and maintain homogeneous summary form', () => {
  const same = scoped.filter(q => q.skillId === 'antonyms_synonyms').map(q => upgradeMeaningChoicesV11(q, bank));
  for (const item of same) {
    const labels = item.choices.map(c => c.label);
    if (labels[0] === 'shut — close') assert.ok(!labels.includes('shut — slam'));
    if (labels[0] === 'lend — borrow') assert.ok(!labels.includes('lend — keep'));
    assert.ok(!labels.includes('often — never'));
  }
  for (const source of scoped.filter(q => q.constructClaim.replace(/^listening_/, '') === 'mostly_about_info')) {
    const item = upgradeMeaningChoicesV11(source, bank);
    const howSummary = source.choices.every(c => c.label.startsWith('How '));
    assert.equal(item.choices[3].label.startsWith('How '), howSummary, item.id);
  }
});


test('equivalent repaired relations share one new semantic exposure alias while retaining historical families', () => {
  const groups = new Map();
  for (const source of scoped.filter(q => q.skillId === 'antonyms_synonyms')) {
    const item = upgradeMeaningChoicesV11(source, bank);
    const visible = `${item.prompt}:${item.choices.map(c => c.label).sort().join('|')}`;
    const group = groups.get(visible) || [];
    group.push({ item, source }); groups.set(visible, group);
  }
  const repeated = [...groups.values()].filter(group => group.length > 1);
  assert.ok(repeated.length >= 10);
  for (const group of repeated) {
    assert.equal(new Set(group.map(({ item }) => item.canonicalPassageId)).size, 1);
    assert.equal(new Set(group.map(({ item }) => item.stimulusKey)).size, 1);
    for (const { item, source } of group) assert.equal(item.exposureFamilyId, source.exposureFamilyId);
  }
});


test('the reverse direction of a familiar relation does not create a fresh exposure', () => {
  const repaired = scoped.filter(q => q.skillId === 'antonyms_synonyms').map(q => upgradeMeaningChoicesV11(q, bank));
  const close = repaired.find(q => q.choices[0].label === 'close — shut');
  const shut = repaired.find(q => q.choices[0].label === 'shut — close');
  assert.ok(close && shut);
  assert.equal(close.canonicalPassageId, shut.canonicalPassageId);
  assert.equal(close.stimulusKey, shut.stimulusKey);
});
