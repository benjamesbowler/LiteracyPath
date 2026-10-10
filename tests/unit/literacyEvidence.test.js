import assert from "node:assert/strict";
import test from "node:test";
import { isEligibleLiteracyResponse, buildLiteracyExposureIndex, getLiteracyExposure, recordLiteracyExposures, readLiteracyExposures, literacyEvidenceConditions } from "../../src/utils/literacyEvidence.js";
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
