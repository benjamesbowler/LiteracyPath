import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockPhonicsDepthItems, correctLiteracyMockPhonicsDemand } from '../../src/data/literacyMockPhonicsDepth.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';

const bank = await loadLiteracyMockBank({ includeUnavailable: true });
const rows = buildLiteracyMockPhonicsDepthItems(bank).map(source => normalizeLiteracyMockItem(source));
const bySuffix = suffix => rows.find(item => item.id.endsWith(suffix));

test('phonics depth retains each entry task and access contract with distinct stable evidence', () => {
  assert.equal(rows.length, 24);
  assert.equal(new Set(rows.map(item => item.id)).size, rows.length);
  for (const item of rows) {
    const template = bank.find(source => source.id === item.sourceProvenance.taskTemplate);
    for (const field of ['skillId', 'domainId', 'constructClaim', 'modality', 'evidenceModality', 'format', 'answerMode', 'hideWrittenLabels']) {
      assert.equal(item[field], template[field], `${item.id}:${field}`);
    }
    assert.equal(item.level, 2);
    assert.equal(item.canonicalItemId, item.id);
    assert.equal(item.sourceItemId, item.id);
    assert.notEqual(item.stimulusKey, template.stimulusKey);
    assert.ok(item.difficultyEvidence);
    assert.equal(item.itemSnapshot.id, item.id);
    assert.equal(item.itemSnapshot.targetWord, item.targetWord);
    for (const image of item.requiredImagePaths) assert.ok(fs.existsSync(new URL(`../../public${image.split('#')[0]}`, import.meta.url)), image);
  }
});

test('four-phoneme blending plays only atomic sounds before the response alternatives', () => {
  for (const [suffix, sounds, key] of [['phonemes-stop', ['s', 't', 'o', 'p'], 'stop'], ['phonemes-plan', ['p', 'l', 'a', 'n'], 'plan']]) {
    const item = bySuffix(suffix);
    const cueSounds = item.requiredAudioCues.filter(cue => cue.role === 'phoneme');
    assert.deepEqual(cueSounds.map(cue => cue.text), sounds);
    assert.deepEqual(cueSounds.map(cue => cue.path), sounds.map(sound => getPreferredPhonemeAudioPath(sound)));
    assert.ok(cueSounds.every(cue => cue.path));
    assert.equal(item.targetWord, '');
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'target_word'), false);
    assert.equal(item.requiredAudioCues.filter(cue => cue.text === key).length, 1);
    assert.equal(item.requiredAudioCues.find(cue => cue.text === key).role, 'choice');
    assert.equal(item.hideWrittenLabels, true);
    assert.equal(item.choices.find(choice => choice.id === item.answer).label, key);
  }
});

test('spoken comparisons use exact replayable pictures without exposing printed word answers', () => {
  for (const item of rows.filter(row => row.evidenceModality === 'audio+image')) {
    assert.equal(item.hideWrittenLabels, true);
    assert.equal(item.renderTargetText, false);
    assert.equal(item.choices.length, 3);
    for (const choice of item.choices) {
      assert.ok(choice.image);
      const cue = item.requiredAudioCues.find(cue => cue.role === 'choice' && cue.choiceId === choice.id);
      assert.equal(cue.text, choice.label);
      assert.ok(cue.path);
    }
    assert.equal(item.requiredAudioCues.find(cue => cue.role === 'target_word').text, item.targetWord);
  }
  assert.equal(bySuffix('final-pond').choices.find(choice => choice.id === bySuffix('final-pond').answer).label, 'bed');
  assert.equal(bySuffix('blend-splinter').choices.find(choice => choice.id === bySuffix('blend-splinter').answer).label, 'splash');
});

test('dictated builds use two multiletter graphemes and exactly three response spaces', () => {
  for (const [word, graphemes] of [['chick', ['ch', 'i', 'ck']], ['shell', ['sh', 'e', 'll']]]) {
    const item = bySuffix(`build-${word}`);
    assert.equal(item.responseLength, 3);
    assert.equal(item.answer, word);
    assert.equal(graphemes.join(''), word);
    assert.ok(graphemes.every(grapheme => item.choices.some(choice => choice.label === grapheme)));
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false);
    assert.equal(item.prompt.includes(word), false);
    assert.equal(item.renderTargetText, false);
  }
});

test('vowel completion retains the literal target spelling and never narrates printed alternatives', () => {
  for (const item of rows.filter(row => ['vowel_teams', 'long_vowels'].includes(row.skillId))) {
    const key = item.choices.find(choice => choice.id === item.answer).label;
    const masked = item.prompt.match(/completes? (\S+)\?/)[1];
    const parts = key.includes('_') ? key.split('_') : [key];
    let index = 0;
    assert.equal(masked.replace(/_+/g, () => parts[index++]), item.targetWord);
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false);
    assert.ok(item.choices.every(choice => !choice.audioPath));
  }
  assert.ok(bySuffix('team-igh-twilight'));
  assert.ok(bySuffix('team-igh-spotlight'));
  assert.equal(rows.some(item => item.targetWord === 'bright'), false);
});

test('missing exact audio fails closed and demand correction does not mutate its source', () => {
  const source = { ...bySuffix('phonemes-stop'), requiredAudioCues: bySuffix('phonemes-stop').requiredAudioCues.map(cue => ({ ...cue, path: cue.role === 'phoneme' && cue.text === 's' ? '' : cue.path })) };
  assert.equal(normalizeLiteracyMockItem(source).mediaReady, false);
  const original = { id: 'lp3.long_vowels_silent_e.l1.A.e_e.v4', level: 1 };
  assert.equal(correctLiteracyMockPhonicsDemand(original).level, 2);
  assert.equal(original.level, 1);
  const different = { id: 'lp3.long_vowels_silent_e.l1.A.e_e.v1', level: 1 };
  assert.equal(correctLiteracyMockPhonicsDemand(different), different);
});

test('vowel task identities separate reading, dictated spelling and competing pronunciations', () => {
  const item = id => bank.find(value => value.id === id);
  for (const [left, right] of [
    ['lp3.vowel_teams.l1.B.ea.v5', 'mock.depth.phonics.team-ea-stream'],
    ['lp3.vowel_teams.l1.C.ai.v3', 'mock.depth.phonics.team-ai-strain'],
    ['lp3.vowel_teams.l1.C.ea.v3', 'lp3.vowel_teams.l1.B.ea.v5'],
    ['lp3.vowel_teams.l2.C.ow.v3', 'lp3.vowel_teams.l2.A.ow.v4'],
    ['lp3.vowel_teams.l2.B.ow.v5', 'lp3.vowel_teams.l2.C.ow.v6'],
    ['lp3.long_vowels_silent_e.l1.A.a_e.v1', 'lp3.long_vowels_silent_e.l2.A.a_e.v1'],
    ['lp3.r_controlled_vowels.l1.A.ar.v1', 'lp3.r_controlled_vowels.l2.A.ar.v4'],
    ['lp3.r_controlled_vowels.l1.A.ar.v1', 'lp3.r_controlled_vowels.l1.A.ar.v4'],
  ]) {
    assert.ok(item(left), left); assert.ok(item(right), right);
    assert.equal(sameLiteracyMockTask(item(left), item(right)), false, `${left} versus ${right}`);
  }
});

test('genuine vowel spelling ladders retain three entry examples and adapt within spelling', () => {
  // Media availability is tested separately; this isolates authored routing
  // even while the pending exact recordings keep these additions unpublished.
  const available = bank.map(item => ({ ...item, mediaReady: true }));
  for (const suffix of ['team-ai-strain', 'team-ay-spray', 'team-ee-screen', 'team-ea-stream',
    'team-oa-throat', 'team-igh-twilight', 'split-e-concrete']) {
    const hard = bySuffix(suffix);
    const entry = bank.filter(item => item.level === 1 && sameLiteracyMockTask(item, hard));
    assert.ok(entry.length >= 3, suffix);
    assert.ok(entry.every(item => /complete/.test(item.prompt)), suffix);
    const plan = { seed: `actual-spelling:${suffix}`, itemIds: entry.slice(0, 3).map(item => item.id) };
    const response = { questionId: plan.itemIds[0], evidenceType: 'independent', responseStatus: 'answered', isCorrect: true };
    const adapted = adaptLiteracyMockPlan(available, plan, [response]);
    for (const id of adapted.itemIds.slice(1)) {
      const next = bank.find(item => item.id === id);
      assert.equal(next.level, 2, suffix);
      assert.equal(sameLiteracyMockTask(next, hard), true, id);
    }
  }
});
