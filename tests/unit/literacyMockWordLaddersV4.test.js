import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLiteracyMockWordLaddersV4, MOCK_V4_HFW_PROMPT, MOCK_V4_HOMOPHONE_PROMPT } from '../../src/data/literacyMockWordLaddersV4.js';
import { hfwApprovedWordsBySkill } from '../../src/data/hfwApprovedCoverageWords.js';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { sameLiteracyMockTask, literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { canonicalLiteracyIdentity, buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { mockChoices, selectLiteracyMockFreshCheck } from '../../src/utils/literacyMockPlanner.js';

const templates = [...Object.keys(hfwApprovedWordsBySkill), 'homophones'].map(skillId => ({ id: `template:${skillId}`, skillId }));
const sources = buildLiteracyMockWordLaddersV4(templates);
const items = sources.map(source => normalizeLiteracyMockItem(source));
const hfw = items.filter(item => item.skillId.startsWith('hfw_'));
const homophones = items.filter(item => item.skillId === 'homophones');
const composedBank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v4', includeUnavailable: true });
const lexicon = new Set(JSON.parse(fs.readFileSync(new URL('../../src/content/lexicon/approvedWords.json', import.meta.url))).words);
const word = text => text.toLowerCase().replace(/[^a-z]/g, '');

// Independent matrix implementation: demand tests inspect the actual strings,
// not the author's level labels or declared distances/relationships.
function literalEditDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1,
      matrix[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
  }
  return matrix[a.length][b.length];
}

// Ordinary pronunciation alternatives matter even when strings are different.
// This guard includes the accent-sensitive been/bean contrast rejected in review.
const homophoneGroups = [
  ['a', 'ay'], ['are', 'r'], ['be', 'bee'], ['for', 'four', 'fore', 'fur', 'far'], ['i', 'eye'],
  ['to', 'two', 'too'], ['by', 'buy', 'bye'], ['do', 'due', 'dew'], ['one', 'won'],
  ['their', 'there', "they're"], ['your', "you're"], ['see', 'sea'], ['so', 'sew', 'sow'],
  ['some', 'sum'], ['two', 'to', 'too'], ['would', 'wood'], ['write', 'right', 'rite'],
  ['been', 'bin', 'bean'], ['made', 'maid'], ['no', 'know'], ['way', 'weigh', 'whey'],
  ['new', 'knew'], ['hear', 'here'], ['sun', 'son'], ['blue', 'blew'], ['ate', 'eight'],
];

test('v4 word sources preserve the supplied baseline and declare a separate recognition ladder', () => {
  const baseline = structuredClone(templates);
  buildLiteracyMockWordLaddersV4(templates);
  assert.deepEqual(templates, baseline);
  assert.equal(items.length, 144);
  assert.equal(hfw.length, 120);
  assert.equal(homophones.length, 24);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  for (const item of items) {
    assert.equal(item.itemSnapshot.id, item.id);
    assert.deepEqual(item.itemSnapshot.sourceProvenance.demand, item.sourceProvenance.demand);
    assert.equal(item.demandCeiling, undefined, item.id);
    assert.ok(item.difficultyEvidence, item.id);
    assert.ok(item.mediaDecision.reason, item.id);
    assert.ok(item.choices.some(choice => choice.id === item.answer), item.id);
  }
  assert.throws(() => buildLiteracyMockWordLaddersV4([]), /Missing v4 word-ladder skill/);
  assert.throws(() => buildLiteracyMockWordLaddersV4(templates.filter(item => item.skillId !== 'homophones')), /homophones/);
});

test('every literal HFW target/key/foil is real, in band where required, and unambiguous under its recording', () => {
  for (const item of hfw) {
    assert.equal(item.format, 'choice', item.id);
    assert.equal(item.answerMode, 'exact', item.id);
    assert.equal(item.choices.length, 3, item.id);
    assert.ok(hfwApprovedWordsBySkill[item.skillId].includes(item.targetWord), item.id);
    assert.equal(item.choices.find(choice => choice.id === item.answer).label, item.targetWord, item.id);
    const labels = item.choices.map(choice => choice.label);
    assert.equal(new Set(labels).size, 3, item.id);
    assert.ok(labels.every(label => lexicon.has(label)), `${item.id}: all three printed words are approved real words`);
    for (const group of homophoneGroups.filter(group => group.includes(item.targetWord))) {
      assert.equal(labels.filter(label => group.includes(label)).length, 1, `${item.id}: isolated audio cannot key two homophones`);
    }
    assert.equal(item.prompt, MOCK_V4_HFW_PROMPT);
    assert.equal(item.prompt.toLowerCase().split(/[^a-z]+/).includes(item.targetWord), false, `${item.id}: printed direction leaks target`);
    assert.equal(item.passage, '');
    assert.equal(item.renderTargetText, false);
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false, `${item.id}: printed alternatives must stay silent`);
    assert.ok(item.choices.every(choice => !choice.audioPath), item.id);
    assert.equal(item.requiredAudioCues.find(cue => cue.role === 'target_word').path, getLedaWordAudioPath(item.targetWord));
    assert.equal(item.requiredAudioCues.find(cue => cue.role === 'target_word').text, item.targetWord);
    assert.equal(item.mediaReady, true, item.id);
    for (const path of item.requiredAudioPaths) assert.ok(fs.existsSync(new URL(`../../public${path}`, import.meta.url)), `${item.id}: ${path}`);
    for (const choice of item.choices.filter(choice => choice.id !== item.answer)) assert.ok(item.distractorRationales[choice.id].includes(choice.label), item.id);
  }
});

test('every HFW L2 pair raises orthographic discrimination while target stock, operation and access remain constant', () => {
  for (const entry of hfw.filter(item => item.level === 1)) {
    const harder = hfw.find(item => item.level === 2 && item.skillId === entry.skillId && item.targetWord === entry.targetWord);
    assert.ok(harder, entry.id);
    assert.ok(sameLiteracyMockTask(entry, harder), entry.id);
    assert.deepEqual(harder.requiredAudioCues, entry.requiredAudioCues, entry.id);
    for (const key of ['format', 'answerMode', 'modality', 'evidenceModality', 'displayPassageDuringResponse', 'hideWrittenLabels']) {
      assert.equal(harder[key], entry[key], `${entry.id}: ${key}`);
    }
    const easyFoils = entry.choices.filter(choice => choice.id !== entry.answer).map(choice => choice.label);
    const hardFoils = harder.choices.filter(choice => choice.id !== harder.answer).map(choice => choice.label);
    const easyDistances = easyFoils.map(foil => literalEditDistance(entry.targetWord, foil));
    const hardDistances = hardFoils.map(foil => literalEditDistance(harder.targetWord, foil));
    assert.ok(easyDistances.every(distance => distance >= 2), entry.id);
    assert.ok(easyFoils.every(foil => foil.length === entry.targetWord.length), `${entry.id}: length cannot identify the entry key`);
    assert.ok(hardFoils.every((foil, index) => hardDistances[index] === 1
      || (harder.targetWord === 'was' && foil === 'saw')), harder.id);
    assert.ok(hardFoils.some(foil => foil.length === harder.targetWord.length), `${harder.id}: key length must be shared`);
    assert.deepEqual(entry.sourceProvenance.demand.foilEditDistances, easyDistances);
    assert.deepEqual(harder.sourceProvenance.demand.foilEditDistances, hardDistances);
    assert.equal(harder.sourceProvenance.demand.closeRealWordFoils, 2);
    assert.equal(entry.sourceProvenance.demand.closeRealWordFoils, 0);
    assert.ok(!easyFoils.some(foil => hardFoils.includes(foil)), `${harder.id}: both foils change`);
  }
});

test('same-word HFW wrappers remain familiar across levels and the original v3 authoring', async () => {
  const original = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v3' });
  for (const entry of hfw.filter(item => item.level === 1)) {
    const harder = hfw.find(item => item.skillId === entry.skillId && item.level === 2 && item.targetWord === entry.targetWord);
    const prior = original.find(item => item.skillId === entry.skillId && item.targetWord === entry.targetWord
      && item.requiredAudioCues.some(cue => cue.role === 'target_word' && cue.text === entry.targetWord));
    assert.ok(prior, entry.id);
    for (const item of [entry, harder]) {
      const identity = canonicalLiteracyIdentity(item);
      assert.equal(identity.familyId, `hfw-word:${entry.targetWord}`);
      assert.equal(identity.passageKey, `hfw-word:${entry.targetWord}`);
      assert.equal(item.stimulusKey, `hfw-word:${entry.targetWord}`);
    }
    const index = buildLiteracyExposureIndex({ exposures: [prior] });
    assert.equal(getLiteracyExposure(harder, index).knownFamiliar, true, harder.id);
    assert.equal(getLiteracyExposure(harder, buildLiteracyExposureIndex({ exposures: [entry] })).knownFamiliar, true, harder.id);
  }
});

test('every HFW exact task/level/access pool supports two independent six-question fresh checks', () => {
  // Exercise the canonical composer's capacity marker and the real planner.
  const authoredIds = new Set(hfw.map(item => item.id));
  const certifiedHfw = composedBank.filter(item => authoredIds.has(item.id));
  assert.equal(certifiedHfw.length, 120);
  assert.ok(certifiedHfw.every(item => item.adaptiveMixedEligible === true));
  const groups = Map.groupBy(certifiedHfw, item => `${literacyMockTaskKey(item)}:l${item.level}`);
  assert.equal(groups.size, 8);
  for (const pool of groups.values()) {
    assert.equal(pool.length, 15);
    assert.equal(new Set(pool.map(item => item.exposureFamilyId)).size, 15);
    const first = selectLiteracyMockFreshCheck(certifiedHfw, { sessionId: 'v4-capacity', studentId: 'student', reference: pool[0], itemCount: 6, seed: 'one' });
    assert.equal(first.unavailable, false);
    assert.equal(first.plan.itemIds.length, 6);
    const seen = first.plan.itemIds.map(id => certifiedHfw.find(item => item.id === id));
    const second = selectLiteracyMockFreshCheck(certifiedHfw, { sessionId: 'v4-capacity', studentId: 'student', reference: pool[0], exposures: seen, itemCount: 6, seed: 'two' });
    assert.equal(second.unavailable, false);
    assert.equal(second.plan.itemIds.length, 6);
    assert.equal(second.plan.itemIds.some(id => first.plan.itemIds.includes(id)), false);
    assert.equal(new Set([...seen, ...second.plan.itemIds.map(id => hfw.find(item => item.id === id))].map(item => item.exposureFamilyId)).size, 12);
  }
});

// The oracle names the intended repaired sentence, independently of source
// indices or explanations. Each row checks the actual literal error and every
// remaining occurrence after repair; a semantic error cannot pass on metadata.
const repairs = [
  ['sea_see', 'see', 'sea', 'We sailed on the sea.', 'I see a boat on the sea.', 6, 1],
  ['sun_son', 'son', 'sun', 'The sun shines in the sky.', 'The sun shines as my son runs outside.', 1, 5],
  ['be_bee', 'be', 'bee', 'A bee landed on a flower.', 'A bee landed near me; I will be still.', 1, 7],
  ['no_know', 'no', 'know', 'I know the answer.', 'I know the answer, but I said no.', 1, 7],
  ['one_won', 'one', 'won', 'Our team won the race.', 'The one team that trained hard won the race.', 6, 1],
  ['ate_eight', 'eight', 'ate', 'I ate my lunch.', 'I ate my lunch when the clock struck eight.', 1, 8],
  ['hear_here', 'hear', 'here', 'Stand here by me.', 'I hear a bird, but stand here by me.', 6, 1],
  ['blue_blew', 'blue', 'blew', 'The wind blew my hat away.', 'The wind blew away my blue hat.', 2, 5],
  ['to_two', 'to', 'two', 'I have two red socks.', 'I went to bed with two warm socks on.', 5, 2],
  ['there_their', 'their', 'there', 'There is a dog outside.', 'We saw there was a dog beside their gate.', 2, 7],
  ['right_write', 'right', 'write', 'I write my name.', 'My right hand helps me write my name.', 5, 1],
  ['new_knew', 'new', 'knew', 'I knew the answer.', 'The new pupil knew the answer to the question.', 3, 1],
];

test('every homophone literal error repairs one sentence while the correct contextual use remains a selectable foil', () => {
  for (const [pair, wrong, replacement, entryRepair, harderRepair, errorIndex, correctIndex] of repairs) {
    const entry = homophones.find(item => item.level === 1 && item.id.endsWith(`.${pair}`));
    const harder = homophones.find(item => item.level === 2 && item.id.endsWith(`.${pair}`));
    assert.ok(entry && harder, pair);
    assert.ok(sameLiteracyMockTask(entry, harder), pair);
    assert.equal(harder.answer, `c${errorIndex}`, pair);
    for (const [item, expected] of [[entry, entryRepair], [harder, harderRepair]]) {
      const tokens = item.passage.split(' ');
      const keyed = item.choices.find(choice => choice.id === item.answer);
      assert.equal(word(keyed.label), wrong, item.id);
      assert.equal(keyed.label, tokens[keyed.tokenIndex], item.id);
      const replacementWithCase = /^[A-Z]/.test(keyed.label) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
      tokens[keyed.tokenIndex] = keyed.label.replace(/[a-z]+/i, replacementWithCase);
      assert.equal(tokens.join(' '), expected, item.id);
      assert.equal(item.choices.length, item.passage.split(' ').length, item.id);
      assert.equal(new Set(item.choices.map(choice => choice.id)).size, item.choices.length, item.id);
      assert.deepEqual(item.choices.map(choice => choice.tokenIndex), item.choices.map((_, index) => index));
      assert.equal(item.sourceProvenance.demand.replacement, replacement);
      for (const choice of item.choices.filter(choice => choice.id !== item.answer)) assert.ok(item.distractorRationales[choice.id], `${item.id}:${choice.id}`);
    }
    assert.equal(entry.choices.filter(choice => word(choice.label) === wrong).length, 1, entry.id);
    assert.equal(harder.choices.filter(choice => word(choice.label) === wrong).length, 2, harder.id);
    assert.equal(word(harder.choices[correctIndex].label), wrong, harder.id);
    assert.notEqual(harder.choices[correctIndex].id, harder.answer);
    assert.match(harder.distractorRationales[`c${correctIndex}`], /correctly means/);
    assert.equal(harder.sourceProvenance.demand.correctHomophoneTokenIndex, correctIndex);
    assert.equal(harder.sourceProvenance.demand.requiresOccurrenceContext, true);
    assert.equal(entry.sourceProvenance.demand.requiresOccurrenceContext, false);
    assert.equal(harder.sourceProvenance.demand.sameSpellingOccurrences, 2);
    assert.equal(entry.sourceProvenance.demand.sameSpellingOccurrences, 1);
    assert.ok(entry.choices.length <= 9 && harder.choices.length <= 12, pair);
  }
  assert.equal(repairs.filter(row => row[5] < row[6]).length, 6, 'Error order must defeat a later-copy shortcut.');
  assert.equal(repairs.filter(row => row[5] > row[6]).length, 6);
});

test('homophone access is identical across levels and audio gaps cannot be reported as ready', () => {
  const availableInstruction = getLedaInstructionAudioPath(MOCK_V4_HOMOPHONE_PROMPT);
  for (const item of homophones) {
    assert.equal(item.format, 'select_text');
    assert.equal(item.answerMode, 'exact');
    assert.equal(item.modality, 'reading');
    assert.equal(item.evidenceModality, 'text');
    assert.equal(item.passageAccess, 'text_only');
    assert.equal(item.targetWord, '');
    assert.equal(item.prompt, MOCK_V4_HOMOPHONE_PROMPT);
    assert.deepEqual(item.requiredAudioCues, [{ role: 'instruction', text: MOCK_V4_HOMOPHONE_PROMPT, path: availableInstruction }]);
    assert.equal(item.mediaReady, Boolean(availableInstruction), item.id);
    if (availableInstruction) assert.ok(fs.existsSync(new URL(`../../public${availableInstruction}`, import.meta.url)));
  }
  for (const level of [1, 2]) {
    const pool = homophones.filter(item => item.level === level);
    assert.equal(pool.length, 12);
    assert.equal(new Set(pool.map(item => canonicalLiteracyIdentity(item).familyId)).size, 12);
    assert.equal(new Set(pool.map(item => canonicalLiteracyIdentity(item).passageKey)).size, 12);
  }
  for (const entry of homophones.filter(item => item.level === 1)) {
    const harder = homophones.find(item => item.level === 2 && item.exposureFamilyId === entry.exposureFamilyId);
    assert.equal(getLiteracyExposure(harder, buildLiteracyExposureIndex({ exposures: [entry] })).knownFamiliar, true);
  }
});

test('runtime shuffling changes HFW key position while selectable homophone occurrence order stays exact', () => {
  const entry = hfw[0];
  const keyPositions = new Set(Array.from({ length: 20 }, (_, index) => mockChoices(entry, `seed:${index}`).findIndex(choice => choice.id === entry.answer)));
  assert.equal(keyPositions.size, 3);
  for (const item of homophones) assert.deepEqual(mockChoices(item, 'arbitrary-seed'), item.choices);
});
