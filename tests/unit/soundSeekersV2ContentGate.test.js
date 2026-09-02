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
  const mutations = [
    ["quest stop", value => { value.questStops[0].title = "drift"; }],
    ["chapter", value => { value.chapters[0].title = "drift"; }],
    ["expedition", value => { value.expeditions[0].stopId = "s40"; }],
    ["review source", value => { value.reviewSourceId = "drift"; }],
    ["pronunciation", value => { value.pronunciationInvariant.contentHash = "drift"; }],
    ["deck categories", value => { value.contentDeckCategories.pop(); }],
    ["deck catalog", value => { value.contentDeckCatalogs.heartWords.pop(); }],
    ["deck binding", value => { value.contentDeckBindings[0].stopId = "s40"; }],
    ["deck placement", value => { value.contentDeckPlacements[0].stopId = "s40"; }],
    ["coverage", value => { value.coverageSummary.validUseCounts.heartWords -= 1; }],
    ["receipt summary", value => { value.attemptReceiptSummary.ids.pop(); }],
    ["connected text", value => { value.connectedTextScenes[0].stopId = "s40"; }],
    ["scene semantic", value => { value.sceneVisualSemantics[0].chapterId = "drift"; }],
    ["branch", value => { value.narrativeBranchOutcomes[0].storyOutcomeId = "drift"; }],
    ["meaning support", value => { value.meaningSupport[0].visualSemanticId = "drift"; }],
    ["meaning owner", value => { value.meaningVisualOwners[0].meaningSemanticId = "drift"; }],
    ["instruction audio", value => { value.instructionAudioInventory[0].path = "/drift.mp3"; }],
    ["scene audio", value => { value.sceneAudioInventory[0].path = "/drift.mp3"; }]
  ];
  for (const [label, mutate] of mutations) {
    const changed = structuredClone(snapshot);
    mutate(changed);
    assert.throws(() => validateSoundSeekersV2ContentAuthorities(changed), undefined, label);
  }
});

test("coverage rejects category, use, receipt, evidence, reciprocal, and decision-split mutations", () => {
  const fixture = buildSoundSeekersV2CanonicalCoverageFixture();
  for (const [label, mutate] of [
    ["missing category", state => { delete state.contentDecks.transfer; }],
    ["missing use", state => {
      delete state.contentDecks.heartWords.uses[Object.keys(state.contentDecks.heartWords.uses)[0]];
    }],
    ["orphan reciprocal", state => {
      delete state.contentDecks.transfer.uses[Object.keys(state.contentDecks.transfer.uses)[0]];
    }],
    ["missing receipt", state => { delete state.attemptReceipts[Object.keys(state.attemptReceipts)[0]]; }],
    ["receipt conflict", state => {
      const id = Object.keys(state.attemptReceipts)[0];
      state.attemptReceipts[id].eventIds = [];
    }],
    ["missing evidence", state => { state.evidence.pop(); }],
    ["evidence domain", state => { state.evidence[0].domain = "novel_decoding"; }]
  ]) {
    const state = structuredClone(fixture.state);
    mutate(state);
    assert.throws(() => summarizeSoundSeekersV2Coverage(state), undefined, label);
  }
});

test("the source policy rejects raw colors and preview answer-authority imports", () => {
  assert.deepEqual(scanSoundSeekersV2SourcePolicy().violations, []);
  assert.throws(() => scanSoundSeekersV2SourcePolicy({
    virtualSources: {
      "src/features/soundSeekers/preview/bad.jsx": "import '../content/connectedTextAnswerKeys.js'; export default '#abc';"
    }
  }));
  for (const [label, source] of [
    ["CSS short hex", ".bad { color: #abc; }"],
    ["CSS alpha hex", ".bad { color: #abcdef12; }"],
    ["JS numeric hex", "export const bad = 0xabcdef;"],
    ["directory scan", "import { readdirSync } from 'node:fs'; readdirSync('public/game-assets');"]
  ]) {
    const extension = label.startsWith("CSS") ? "css" : "js";
    assert.throws(() => scanSoundSeekersV2SourcePolicy({
      virtualSources: { [`src/features/soundSeekers/preview/bad.${extension}`]: source }
    }), undefined, label);
  }
});
