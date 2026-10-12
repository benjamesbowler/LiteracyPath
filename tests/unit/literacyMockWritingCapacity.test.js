import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { PHASE_PASS_RULE } from '../../src/content/blueprints/skillBlueprints.js';

const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v3' });
const writing = bank.filter(item => item.domainId === 'writing' && !item.tutorialOnly);
const added = writing.filter(item => item.id.startsWith('mock.capacity.writing.'));

test('the precise wrung choice reuses one complete verified homophone without changing its written answer', () => {
  const item = added.find(row => row.id === 'mock.capacity.writing.precise-hard-wring');
  assert.ok(item);
  assert.equal(item.choices.find(choice => choice.id === item.answer).label, 'wrung');
  const cue = item.requiredAudioCues.find(row => row.role === 'choice' && row.choiceId === item.answer);
  assert.equal(cue.text, 'wrung');
  assert.equal(cue.value, 'wrung');
  assert.equal(cue.path, '/audio/production/en-US/supplemental/rung-823f6d5890.mp3');
  assert.equal(cue.recordingProvenance.recordedText, 'rung');
  assert.equal(cue.recordingProvenance.ipa, 'ɹʌŋ');
  assert.equal(createHash('sha256').update(fs.readFileSync(`public${cue.path}`)).digest('hex'), cue.recordingProvenance.sha256);
  const overrides = added.flatMap(row => row.requiredAudioCues.filter(audio => audio.recordingProvenance));
  assert.deepEqual(overrides, [cue]);
  assert.equal(scoreLiteracyMockResponse(item, item.answer), true);
  for (const choice of item.choices.filter(row => row.id !== item.answer)) assert.equal(scoreLiteracyMockResponse(item, choice.id), false);
  assert.ok(added.filter(row => row.modality === 'reading' || row.evidenceModality === 'text').every(row => row.requiredAudioCues.every(audio => audio.role === 'instruction')));
});

test('new writing items score only their full keyed response and retain exact source provenance', () => {
  assert.ok(added.length >= 600);
  assert.equal(new Set(added.map(item => item.id)).size, added.length);
  for (const item of added) {
    assert.ok(scoreLiteracyMockResponse(item, item.answer), item.id);
    if (Array.isArray(item.answer)) {
      assert.equal(scoreLiteracyMockResponse(item, [...item.answer].reverse()), false, item.id);
      assert.equal(scoreLiteracyMockResponse(item, item.answer.slice(1)), false, item.id);
    } else {
      for (const choice of item.choices.filter(choice => choice.id !== item.answer)) assert.equal(scoreLiteracyMockResponse(item, choice.id), false, item.id);
    }
    if (item.format !== 'select_text') assert.equal(new Set(item.choices.map(choice => item.skillId === 'capitalization' || item.answerMode === 'sequence' ? choice.label : choice.label.toLowerCase())).size, item.choices.length, item.id);
    assert.ok(fs.readFileSync(item.sourceProvenance.file, 'utf8').length > 100, item.id);
    assert.ok(item.sourceProvenance.file.includes('Writing'), item.id);
    assert.ok(item.explanation.length > 15, item.id);
    assert.equal(item.mediaDecision.role, 'text-only', item.id);
  }
});

test('writing audio follows final visible wording and preserves independent reading access', () => {
  const correctedIds = ['mock.depth.revision-detail-0', 'mock.depth.revision-detail-2', 'mock.depth.writing-sequence-1', 'mock.depth.writing-sequence-2'];
  for (const item of [...added, ...bank.filter(item => correctedIds.includes(item.id))]) {
    const cues = item.requiredAudioCues;
    assert.equal(cues.filter(cue => cue.role === 'instruction' && cue.text === item.prompt).length, 1, item.id);
    if (item.modality === 'reading' || item.evidenceModality === 'text') {
      assert.deepEqual(cues.map(cue => cue.role), ['instruction'], item.id);
      assert.ok(item.choices.every(choice => !choice.audioPath), item.id);
    }
    for (const cue of cues) {
      if (cue.role === 'passage') assert.equal(cue.text, item.passage.replace(/_{2,}/g, '…'), item.id);
      if (cue.role === 'choice') assert.equal(cue.text, item.choices.find(choice => choice.id === cue.choiceId)?.label, item.id);
    }
    assert.equal(item.mediaReady, cues.length > 0 && cues.every(cue => Boolean(cue.path)), item.id);
  }
});

test('every open writing task has ten independent observations without counting finite wrappers', () => {
  const pools = Map.groupBy(writing, item => JSON.stringify([literacyMockTaskKey(item), item.level]));
  for (const [key, items] of pools) {
    if (items.every(item => item.finiteInventory)) continue;
    const accepted = [];
    for (const item of items) {
      if (getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures: accepted })).knownFamiliar) continue;
      if (accepted.some(row => row.stimulusKey === item.stimulusKey)) continue;
      accepted.push(item);
    }
    assert.ok(accepted.length >= 10, `${key}: ${accepted.length}`);
  }
});

test('incidental answer length cannot reach the pass threshold in writing choice pools', () => {
  const pools = Map.groupBy(writing.filter(item => item.format === 'choice'), item => JSON.stringify([literacyMockTaskKey(item), item.level]));
  for (const [key, items] of pools) {
    if (items.length < 10) continue;
    // These operations explicitly compare added marks or locate the single-letter pronoun.
    if (['list_comma', 'pronoun_i'].includes(items[0].constructClaim)) continue;
    for (const measure of [text => text.length, text => text.split(/\s+/).length]) for (const rank of [0, 1, 2, 'longest']) {
      const hits = items.reduce((sum, item) => {
        const lengths = item.choices.map(choice => measure(choice.label)).sort((a, b) => a - b);
        const target = rank === 'longest' ? lengths.at(-1) : lengths[rank];
        const ties = item.choices.filter(choice => measure(choice.label) === target);
        return sum + (ties.some(choice => choice.id === item.answer) ? 1 / ties.length : 0);
      }, 0);
      assert.ok(hits / items.length < PHASE_PASS_RULE.accuracyMin, `${key}: ${rank} predicts ${hits}/${items.length}`);
    }
  }
});

test('supplied case forms have no artificial harder level while locating errors remains distinct', () => {
  for (const item of writing.filter(item => item.constructClaim.startsWith('supply_') && item.constructClaim.endsWith('_capital_form'))) {
    assert.equal(item.level, 1, item.id);
    assert.equal(item.demandCeiling, 1, item.id);
  }
  const locate = writing.filter(item => item.constructClaim === 'locate_place_name_capital');
  assert.equal(locate.length, 10);
  assert.ok(locate.every(item => item.level === 2));
});
