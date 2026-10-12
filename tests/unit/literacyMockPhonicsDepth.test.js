import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockPhonicsDepthItems, correctLiteracyMockPhonicsDemand, MOCK_SILENT_E_TWINS } from '../../src/data/literacyMockPhonicsDepth.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';

const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v3' });
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

test('CVC evidence separates vowel completion, whole-word matching, reading and construction', () => {
  const ids = ['lp3.cvc_short_vowels.l1.A.short_a.v1',
    'lp3.cvc_short_vowels.l1.C.short_a.v3',
    'lp3.cvc_short_vowels.l1.B.short_a.v5',
    'lp3.cvc_short_vowels.l2.B.short_a.v5'];
  const items = ids.map(id => bank.find(item => item.id === id));
  assert.ok(items.every(Boolean));
  assert.deepEqual(items.map(item => item.constructClaim), [
    'complete_short_vowel_spelling:short_a', 'match_spoken_short_vowel_word:short_a',
    'identify_read_short_vowel_sound:short_a', 'construct_short_vowel_phoneme_sequence:short_a',
  ]);
  for (const [index, left] of items.entries()) {
    for (const right of items.slice(index + 1)) assert.equal(sameLiteracyMockTask(left, right), false);
  }
  const hard = bank.find(item => item.id === 'lp3.cvc_short_vowels.l2.A.short_a.v1');
  assert.equal(sameLiteracyMockTask(items[0], hard), true);
  const source = { skillId: 'cvc_short_vowels', itemKey: 'short_a',
    formatType: 'MISSING_VOWEL_CVC', constructClaim: 'short_a', level: 1 };
  assert.equal(correctLiteracyMockPhonicsDemand(source).constructClaim, 'complete_short_vowel_spelling:short_a');
  assert.equal(source.constructClaim, 'short_a');
  // Normalized hand-authored builds and unrelated skills keep their contracts.
  const build = { skillId: 'cvc_short_vowels', format: 'build_word', constructClaim: 'construct_dictated_word' };
  assert.equal(correctLiteracyMockPhonicsDemand(build), build);
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

test('supplied split-vowel completion and word matching do not invent a harder silent-e tier', async () => {
  const corrected = bank.filter(item => item.skillId === 'long_vowels'
    && (/^complete_split_vowel_spelling:[aiou]_e$/.test(item.constructClaim) || item.constructClaim === 'silent_e_vowel_contrast'));
  assert.ok(corrected.length > 40);
  for (const item of corrected) {
    assert.equal(item.level, 1, item.id);
    assert.equal(item.demandCeiling, 1, item.id);
    assert.ok(item.ceilingNextTask.includes('separate task'), item.id);
    assert.equal(item.itemSnapshot.level, 1, item.id);
    assert.equal(item.itemSnapshot.demandCeiling, 1, item.id);
  }
  for (const contentVersion of ['literacy-mock-v1', 'literacy-mock-v2']) {
    const frozen = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion });
    assert.equal(frozen.find(item => item.id === 'lp3.long_vowels_silent_e.l2.B.a_e.v5').level, 2);
  }
});

test('independent long-vowel reading requires a reviewed real short twin for Level2', () => {
  const categories = bank.filter(item => item.skillId === 'long_vowels'
    && item.constructClaim.startsWith('identify_read_split_vowel_sound:'));
  for (const item of categories) {
    const pattern = item.constructClaim.split(':')[1];
    const key = item.choices.find(choice => choice.id === item.answer).label;
    const twin = MOCK_SILENT_E_TWINS[pattern]?.[key];
    const hasTwin = Boolean(twin && item.choices.some(choice => choice.label === twin));
    assert.equal(item.level, hasTwin ? 2 : 1, item.id);
    assert.equal(item.requiredAudioCues.some(cue => ['choice', 'target_word'].includes(cue.role)), false, item.id);
  }
  assert.equal(bank.find(item => item.id === 'lp3.long_vowels_silent_e.l2.A.a_e.v1').level, 1); // gate / gas
  assert.equal(bank.find(item => item.id === 'lp3.long_vowels_silent_e.l2.B.a_e.v2').level, 2); // cane / can
  assert.deepEqual(MOCK_SILENT_E_TWINS.u_e, { cube: 'cub', cute: 'cut', tube: 'tub' });
});
