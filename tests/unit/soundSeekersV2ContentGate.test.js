import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSoundSeekersV2Content,
  buildSoundSeekersV2AuthoritySnapshot,
  buildSoundSeekersV2CanonicalCoverageFixture,
  scanSoundSeekersV2SourcePolicy,
  summarizeSoundSeekersV2Coverage,
  validateSoundSeekersV2ContentAuthorities
} from "../../tools/checkSoundSeekersV2Content.mjs";

const EXPECTED_COVERAGE = {
  canonicalCoverage: {
    complete: true,
    categories: {
      heartWords: { coveredRecordCount: 60, totalRecordCount: 60 },
      stories: { coveredRecordCount: 40, totalRecordCount: 40 },
      alternatives: { coveredRecordCount: 4, totalRecordCount: 4 },
      morphology: { coveredRecordCount: 1, totalRecordCount: 1 },
      transfer: { coveredRecordCount: 40, totalRecordCount: 40 }
    }
  },
  validUseCounts: {
    heartWords: 81,
    stories: 40,
    alternatives: 4,
    morphology: 1,
    transfer: 40
  },
  assessedDecisionCounts: {
    connectedTextTransfer: 32,
    novelDecoding: 8
  }
};

test("the aggregate content gate derives exact canonical coverage through the real reducers", () => {
  const fixture = buildSoundSeekersV2CanonicalCoverageFixture();
  assert.deepEqual(Object.keys(fixture), ["state", "evidenceEvents", "attemptReceipts"]);
  assert.equal(Object.isFrozen(fixture.evidenceEvents), true);
  assert.equal(Object.isFrozen(fixture.attemptReceipts), true);
  assert.deepEqual(summarizeSoundSeekersV2Coverage(fixture.state), EXPECTED_COVERAGE);
  assert.deepEqual(assertSoundSeekersV2Content().coverageSummary, EXPECTED_COVERAGE);
});

test("the data-only authority snapshot is exact and every cloned mutation fails closed", () => {
  const snapshot = buildSoundSeekersV2AuthoritySnapshot();
  assert.deepEqual(Object.keys(snapshot), [
    "questStops", "chapters", "expeditions", "reviewSourceId", "pronunciationInvariant",
    "contentDeckCategories", "contentDeckCatalogs", "contentDeckBindings",
    "contentDeckPlacements", "coverageSummary", "attemptReceiptSummary",
    "connectedTextScenes", "sceneVisualSemantics", "narrativeBranchOutcomes",
    "meaningSupport", "meaningVisualOwners", "instructionAudioInventory",
    "sceneAudioInventory", "biomeKits", "sceneRenderSpecs", "optionVisuals",
    "meaningVisuals", "routeSpecs", "landmarkBindings", "characterVisuals",
    "playerVisual", "creatorOptions", "poseIds", "assetManifest"
  ]);
  assert.equal(validateSoundSeekersV2ContentAuthorities(structuredClone(snapshot)), true);
  const changed = structuredClone(snapshot);
  changed.expeditions[0].stopId = "s40";
  assert.throws(() => validateSoundSeekersV2ContentAuthorities(changed));
});

test("the source policy rejects raw colors and preview answer-authority imports", () => {
  assert.deepEqual(scanSoundSeekersV2SourcePolicy().violations, []);
  assert.throws(() => scanSoundSeekersV2SourcePolicy({
    virtualSources: {
      "src/features/soundSeekers/preview/bad.jsx": "import '../content/connectedTextAnswerKeys.js'; export default '#abc';"
    }
  }));
});
