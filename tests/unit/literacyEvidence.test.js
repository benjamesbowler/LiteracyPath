import assert from "node:assert/strict";
import test from "node:test";
import { isEligibleLiteracyResponse, buildLiteracyExposureIndex, getLiteracyExposure, recordLiteracyExposures, readLiteracyExposures, literacyEvidenceConditions, literacyExposureIdentities } from "../../src/utils/literacyEvidence.js";
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';

test("public and mock routing exclude the same helped, familiar, invalid and incomplete responses", () => {
  for (const evidence of [{ evidenceUse: "independent_practice_response", supportUsed: [] }, { evidenceType: "independent", supportUsed: false }]) {
    const response = { ...evidence, isCorrect: true, responseStatus: "answered", validity: "valid" };
    assert.equal(isEligibleLiteracyResponse(response), true);
    for (const override of [{ knownFamiliar: true }, { priorPracticeExposure: true }, { priorPassageExposure: true },
      { priorFamilyExposure: true }, { supportUsed: ["passage_audio"] }, { supportUsed: true }, { responseStatus: "skipped" },
      { responseStatus: "media_failed" }, { mediaReady: false }, { validity: "invalid" }, { presentationRole: "transfer" },
      { isCorrect: null }, { audioRequired: true, targetDelivered: true, audioDelivery: "not_delivered" }]) {
      assert.equal(isEligibleLiteracyResponse({ ...response, ...override }), false, JSON.stringify(override));
    }
  }
});

test("practice and mock share item, normalized passage and explicit family exposure without guessing from a skill", () => {
  const index = buildLiteracyExposureIndex({ practiceRecord: { completions: [{ steps: [{ questionId: "public-a", itemSnapshot: { passage: "Mina’s   bag is red.", exposureFamilyId: "authored-family" } }] }] },
    mockRuns: [{ responses: [{ questionId: "mock-b", itemSnapshot: { sourceItemId: "public-b" } }] }] });
  assert.deepEqual(getLiteracyExposure({ id: "listening-alias", passage: "mina's bag is red." }, index).familiarityReasons, ["passage"]);
  assert.deepEqual(getLiteracyExposure({ id: "variant", exposureFamilyId: "authored-family" }, index).familiarityReasons, ["family"]);
  assert.deepEqual(getLiteracyExposure({ id: "public-b" }, index).familiarityReasons, ["item"]);
  assert.equal(getLiteracyExposure({ id: "unseen", skillId: "same-skill" }, index).knownFamiliar, null);
});

test("device exposure storage is learner scoped, deduplicated and contains no answers or tokens", () => {
  const stored = new Map(); const storage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  const item = { questionId: "q", selected: "sensitive-answer", token: "secret", itemSnapshot: { passage: "Passage" } };
  recordLiteracyExposures("learner-a", [item, item], storage);
  assert.equal(readLiteracyExposures("learner-a", storage).length, 1);
  assert.deepEqual(readLiteracyExposures("learner-b", storage), []);
  assert.doesNotMatch([...stored.values()][0], /sensitive-answer|secret/);
});

test('historical case triples project shown letters without rewriting evidence or marking atomic distractors familiar', async () => {
  const atomic = letter => ({ id: `new-${letter}`, canonicalPassageId: `letter-case:${letter}`, exposureFamilyId: `letter-case:${letter}` });
  for (const contentVersion of ['literacy-mock-v1', 'literacy-mock-v2']) {
    const bank = await loadLiteracyMockBank({ contentVersion, includeUnavailable: true });
    const itemSnapshot = bank.find(item => item.id === 'mock.letters.round');
    assert.ok(itemSnapshot, contentVersion);
    const response = { questionId: itemSnapshot.id, itemSnapshot, isCorrect: false, selected: ['wrong'] };
    const before = JSON.stringify(response);
    for (const history of [{ responses: [response] }, { mockRuns: [{ presentations: [response] }] },
      { exposures: [{ exposureItemId: itemSnapshot.id }] }]) {
      const index = buildLiteracyExposureIndex(history);
      for (const letter of ['a', 'm', 't']) assert.equal(getLiteracyExposure(atomic(letter), index).knownFamiliar, true, `${contentVersion}:${letter}`);
      assert.equal(getLiteracyExposure(atomic('z'), index).knownFamiliar, null);
    }
    assert.equal(JSON.stringify(response), before);
  }
  const atomicResponse = { itemSnapshot: { ...atomic('a'), constructClaim: 'letter_case_correspondence', format: 'match',
    responseLength: 1, matchTargets: [{ label: 'A' }], choices: [{ label: 'a' }, { label: 'm' }, { label: 'o' }] } };
  const index = buildLiteracyExposureIndex({ responses: [atomicResponse] });
  assert.equal(getLiteracyExposure(atomic('a'), index).knownFamiliar, true);
  for (const letter of ['m', 'o']) assert.equal(getLiteracyExposure(atomic(letter), index).knownFamiliar, null);
  const multi = { itemSnapshot: { id: 'different-legacy-case', constructClaim: 'letter_case_correspondence', format: 'match',
    responseLength: 10, matchTargets: [{ label: ' X ' }], choices: ['y', { label: 'Z' }, { label: 'word' }, { label: '7' }] } };
  assert.deepEqual(literacyExposureIdentities(multi).slice(1).map(id => id.passageKey), ['letter-case:x', 'letter-case:y', 'letter-case:z']);
  assert.equal(literacyExposureIdentities({ itemSnapshot: { ...multi.itemSnapshot, constructClaim: 'matching_words' } }).length, 1);
  assert.equal(literacyExposureIdentities({ questionId: 'mock.letters.guessed-xyz' }).length, 1);
});

test('historical case projections persist only deduplicated learner-scoped identities', () => {
  const stored = new Map(); const storage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  const response = { questionId: 'mock.letters.round', selected: 'private-answer', token: 'private-token' };
  const before = JSON.stringify(response);
  recordLiteracyExposures('case-learner', [response, response], storage);
  assert.equal(readLiteracyExposures('case-learner', storage).length, 4);
  assert.deepEqual(readLiteracyExposures('other-case-learner', storage), []);
  assert.doesNotMatch([...stored.values()][0], /private-answer|private-token/);
  assert.equal(JSON.stringify(response), before);
});

test('historical vowel categories retain their literal target across formats without rewriting frozen evidence', async () => {
  const current = (await loadLiteracyMockBank({ includeUnavailable: true })).filter(item => item.id.startsWith('lp3.')
    && /^identify_read_(?:short_vowel|vowel|split_vowel)_sound:/.test(item.constructClaim)
    && !item.passage && !item.targetWord && item.format === 'choice');
  assert.equal(current.length, 36);
  for (const contentVersion of ['literacy-mock-v1', 'literacy-mock-v2']) {
    const frozen = await loadLiteracyMockBank({ contentVersion, includeUnavailable: true });
    for (const item of current) {
      const snapshot = frozen.find(old => old.id === item.id);
      assert.ok(snapshot, item.id);
      const word = snapshot.choices.find(choice => choice.id === snapshot.answer)?.label.toLowerCase();
      assert.equal(word, item.stimulusKey, `${contentVersion}:${item.id}`);
      for (const value of [{ questionId: item.id, itemSnapshot: snapshot, selected: 'wrong', isCorrect: false },
        { exposureItemId: item.id, exposurePassageKey: `response-evidence:["${word}"]` }]) {
        const before = JSON.stringify(value);
        const index = buildLiteracyExposureIndex({ exposures: [value] });
        assert.equal(getLiteracyExposure({ id: `new-spelling-${word}`, canonicalPassageId: word }, index).knownFamiliar, true);
        assert.equal(getLiteracyExposure({ id: 'different-target', canonicalPassageId: 'unseen-word' }, index).knownFamiliar, null);
        assert.equal(JSON.stringify(value), before);
      }
    }
  }
});

test('word aliases require exact category evidence and never parse unrelated response-evidence labels', () => {
  const category = { id: 'other-authored-category', skillId: 'long_vowels', format: 'choice',
    constructClaim: 'identify_read_split_vowel_sound:a_e', choices: [{ id: 'a', label: ' Cane ' }, { id: 'b', label: 'can' }],
    answer: 'a', stimulusKey: 'response-evidence:["cane"]' };
  const positive = { itemSnapshot: category, selected: 'b', token: 'private-token' };
  const index = buildLiteracyExposureIndex({ responses: [positive] });
  assert.equal(getLiteracyExposure({ id: 'spelling-cane', stimulusKey: 'cane' }, index).knownFamiliar, true);
  assert.equal(getLiteracyExposure({ id: 'spelling-can', stimulusKey: 'can' }, index).knownFamiliar, null);
  for (const value of [
    { exposureItemId: 'unknown', exposurePassageKey: category.stimulusKey },
    { exposureItemId: 'lp3.long_vowels_silent_e.guessed', exposurePassageKey: category.stimulusKey },
    ...[{ passage: 'A man leans on a cane.' }, { targetWord: 'rain' }, { skillId: 'vocabulary' },
      { constructClaim: 'context_clue_meaning' }, { format: 'build_word' }, { answer: 'missing' }]
      .map(change => ({ itemSnapshot: { ...category, ...change } })),
  ]) {
    assert.equal(literacyExposureIdentities(value).length, 1, JSON.stringify(value));
  }
  const stored = new Map(); const storage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  recordLiteracyExposures('word-learner', [positive, positive], storage);
  assert.equal(readLiteracyExposures('word-learner', storage).length, 2);
  assert.deepEqual(readLiteracyExposures('other-word-learner', storage), []);
  assert.doesNotMatch([...stored.values()][0], /private-token|selected|choices|answer/);
});

test('r-controlled category history retains both the heard anchor and the keyed printed target', async () => {
  const published = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v3' });
  const item = published.find(value => value.id === 'lp3.r_controlled_vowels.l2.A.ar.v4');
  const response = { itemSnapshot: item.itemSnapshot, selected: 'wrong', isCorrect: false };
  const before = JSON.stringify(response);
  const index = buildLiteracyExposureIndex({ responses: [response] });
  for (const word of ['car', 'shark']) assert.equal(getLiteracyExposure({ id: `new-${word}`, canonicalPassageId: word }, index).knownFamiliar, true);
  assert.equal(getLiteracyExposure({ id: 'new-park', canonicalPassageId: 'park' }, index).knownFamiliar, null);
  assert.equal(JSON.stringify(response), before);
  for (const change of [{ skillId: 'vocabulary' }, { constructClaim: 'context_clue_meaning' }, { passage: 'A shark swam.' }]) {
    assert.equal(literacyExposureIdentities({ itemSnapshot: { ...item.itemSnapshot, ...change } }).length, 1);
  }
});

test("report conditions distinguish text and audio from print-only and listening-only evidence", () => {
  assert.equal(literacyEvidenceConditions({ itemSnapshot: { passage: "Text", passageAccess: "text_and_audio" } }).modality, "Text and audio");
  assert.equal(literacyEvidenceConditions({ itemSnapshot: { passage: "Text", passageAccess: "text_only" } }).modality, "Printed text");
  assert.equal(literacyEvidenceConditions({ itemSnapshot: { modality: "listening" } }).modality, "Audio");
});

test("oral writing access keeps its authored construct without calling it comprehension", () => {
  const conditions = literacyEvidenceConditions({ itemSnapshot: {
    constructClaim: "Organize familiar events in a logical order",
    oralLanguageAccess: true, evidenceModality: "audio+text"
  } });
  assert.equal(conditions.construct, "Organize familiar events in a logical order");
  assert.equal(conditions.modality, "Text and audio");
});

test('a pending request is not answer assistance but awaits resolution before independent use', () => {
  const response = { responseStatus: 'answered', isCorrect: true, evidenceType: 'independent', supportUsed: false, supportPending: true };
  assert.equal(isEligibleLiteracyResponse(response), false);
  assert.match(literacyEvidenceConditions(response).support, /awaiting teacher review/);
  assert.equal(isEligibleLiteracyResponse({ ...response, supportPending: false, assistanceType: 'access' }), true);
  assert.equal(isEligibleLiteracyResponse({ ...response, supportPending: false, assistanceType: 'answer' }), false);
});

test('actual printed-passage and listening tasks disclose their saved required choice narration', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const [id, expected] of [
    ['mock.depth.key_details.ticket', 'Printed text'],
    ['mock.depth.context_clues.bank', 'Printed text · Required choice narration completed'],
    ['mock.depth.pencil', 'Printed text · Required choice narration completed'],
    ['mock.depth.listen_key_details.ticket', 'Audio · Required choice narration completed'],
  ]) {
    const itemSnapshot = bank.find(item => item.id === id);
    const response = { itemSnapshot, questionId: id, isCorrect: true, responseStatus: 'answered', evidenceType: 'independent',
      audioDelivery: Object.fromEntries(itemSnapshot.requiredAudioPaths.map(path => [path, 'completed'])) };
    const before = JSON.stringify(response);
    const task = literacyMockTaskKey(response);
    assert.equal(literacyEvidenceConditions(response).modality, expected, id);
    assert.equal(isEligibleLiteracyResponse(response), true);
    assert.equal(literacyMockTaskKey(response), task);
    assert.equal(JSON.stringify(response), before, 'disclosure does not mutate the saved evidence');
  }
});

test('required choice narration cannot claim delivery from presentation, partial, failed or missing-path evidence', () => {
  const itemSnapshot = { passage: 'Text', requiredAudioCues: [
    { role: 'instruction', path: '/direction.mp3' },
    { role: 'choice', path: '/a.mp3', required: false },
    { role: 'choice', path: '/b.mp3' },
  ], requiredAudioPaths: ['/direction.mp3', '/a.mp3', '/b.mp3'] };
  assert.match(literacyEvidenceConditions({ itemSnapshot }).modality, /Choice narration required; playback not recorded/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: 'delivered' }).modality, /playback not recorded/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: { '/direction.mp3': 'completed' } }).modality, /playback not recorded/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: { '/a.mp3': 'completed' } }).modality, /only some playback completed/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: { '/a.mp3': 'completed', '/b.mp3': 'failed' } }).modality, /playback failure recorded/);
  assert.match(literacyEvidenceConditions({ itemSnapshot: { requiredAudioCues: [{ role: 'choice', text: 'Missing recording' }] } }).modality, /playback not recorded/);
});

test('permitted optional choice audio stays distinct from recorded playback and required paths', () => {
  const itemSnapshot = { passage: 'Text', choices: [{ id: 'a', audioPath: '/a.mp3' }, { id: 'b', audioPath: '/b.mp3' }] };
  assert.match(literacyEvidenceConditions({ itemSnapshot }).modality, /Choice audio available; use not recorded/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: { '/a.mp3': 'completed' } }).modality, /Some choices read aloud \(optional\)/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: { '/a.mp3': 'completed', '/b.mp3': 'completed' } }).modality, /Optional choice narration completed/);
  assert.match(literacyEvidenceConditions({ itemSnapshot, audioDelivery: { '/a.mp3': 'failed' } }).modality, /Optional choice playback failed/);
  assert.match(literacyEvidenceConditions({ itemSnapshot: { ...itemSnapshot, requiredAudioPaths: ['/a.mp3', '/b.mp3'] } }).modality, /Choice narration required; playback not recorded/);
});
