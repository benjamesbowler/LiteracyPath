import assert from "node:assert/strict";
import test from "node:test";
import { isEligibleLiteracyResponse, buildLiteracyExposureIndex, getLiteracyExposure, recordLiteracyExposures, readLiteracyExposures, literacyEvidenceConditions } from "../../src/utils/literacyEvidence.js";

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
  assert.equal(literacyEvidenceConditions({ itemSnapshot: { passage: "Text", passageAccess: "text_and_audio" } }).modality, "Text and audio comprehension");
  assert.equal(literacyEvidenceConditions({ itemSnapshot: { passage: "Text", passageAccess: "text_only" } }).modality, "Printed-text comprehension");
  assert.equal(literacyEvidenceConditions({ itemSnapshot: { modality: "listening" } }).modality, "Listening comprehension");
});
