import test from "node:test";
import assert from "node:assert/strict";

import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS
} from "../../src/features/soundSeekers/content/expeditions.js";
import { SOUND_SEEKERS_HEART_WORDS } from "../../src/features/soundSeekers/content/heartWords.js";
import { SOUND_SEEKERS_INSTRUCTIONS } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { getContentDeckCatalogRecord } from "../../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { getContentDeckOwnerBinding } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { createHeartWordChoices } from "../../src/features/soundSeekers/content/childChoiceContent.js";
import { toChildConnectedTextScene } from "../../src/features/soundSeekers/content/connectedText.js";
import { createChallenge } from "../../src/features/soundSeekers/engine/createChallenge.js";
import { toChildChallengeView } from "../../src/features/soundSeekers/engine/challengeContract.js";
import { createContentDeckState } from "../../src/features/soundSeekers/engine/contentDeckState.js";
import {
  projectBoundContentResolverInputs,
  serveContentDeck
} from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";
import { SOUND_POWER_REGISTRY } from "../../src/features/soundSeekers/engine/powers/index.js";
import { createInteractionRuntimeModel } from "../../src/features/soundSeekers/engine/powers/contracts.js";
import {
  SOUND_SEEKERS_PREVIEW_FIXTURES,
  resolveSoundSeekersPreviewFixture
} from "../../src/features/soundSeekers/preview/previewFixtures.js";
import * as previewFixtureModule from "../../src/features/soundSeekers/preview/previewFixtures.js";

const FIXTURE_KEYS = Object.freeze([
  "actionId", "contentId", "contextId", "expectedAction", "id", "instructionId",
  "legalActorTranscripts", "phaseId", "powerId", "recordsDomain", "slotId", "stopId"
].sort());
const STEP_KEYS = Object.freeze(["controlId", "optionToken", "sourceToken"]);
const FORBIDDEN_KEYS = new Set([
  "answer", "answerMap", "commitResult", "completion", "correct", "event",
  "expectedToken", "isCorrect", "missionTransition", "privateAnswerMap",
  "responseIntents", "supportLevel"
]);

const EXPECTED_IDENTITIES = Object.freeze([
  ["s1-primary-echo-search", "s1", "s1-primary", "a", null],
  ["s2-primary-contrast-sort", "s2", "s2-primary", "n", null],
  ["s11-primary-contrast-sort", "s11", "s11-primary", "rock", null],
  ["s6-primary-contrast-sort", "s6", "s6-primary", "heart-word:my", "heart-slot-s6-1"],
  ["s1-secondary-word-forge", "s1", "s1-secondary", "mat", null],
  ["s2-secondary-blend-bridge", "s2", "s2-secondary", "sit", null],
  ["s5-transfer-blend-bridge", "s5", "s5-transfer", "cat", "transfer-slot-s5"],
  ["s3-primary-memory-delivery", "s3", "s3-primary", "o", null],
  ["s7-primary-memory-delivery", "s7", "s7-primary", "jam", null],
  ["s1-heart-1-memory-delivery", "s1", "s1-heart-1", "heart-word:a", "heart-slot-s1-1"],
  ["s3-transfer-memory-delivery", "s3", "s3-transfer", "scene-s3", "transfer-slot-s3"],
  ["s1-transfer-story-power", "s1", "s1-transfer", "scene-s1", "transfer-slot-s1"]
]);

function recursivelyFrozen(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Object.values(value).every(child => recursivelyFrozen(child, seen));
}

function collectKeys(value, found = new Set()) {
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    found.add(key);
    collectKeys(child, found);
  }
  return found;
}

function actionFor(fixture) {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === fixture.stopId);
  assert.ok(expedition, `${fixture.id}: missing expedition`);
  const action = [...expedition.phases, ...expedition.heartWordOpportunities]
    .find(item => item.id === fixture.actionId);
  assert.ok(action, `${fixture.id}: missing action`);
  assert.equal(fixture.phaseId, action.id);
  assert.equal(fixture.contextId, action.contextId);
  return { action, expedition };
}

function heartRecordFor(fixture) {
  return SOUND_SEEKERS_HEART_WORDS.find(record => record.contentId === fixture.contentId
    && record.slotIds.includes(fixture.slotId)) || null;
}

function assertContentTuple(fixture, action, expedition) {
  if (action.contentBinding?.category === "heartWords") {
    const record = heartRecordFor(fixture);
    assert.ok(record, `${fixture.id}: missing heart-word content`);
    assert.equal(fixture.slotId, action.contentBinding.slotId);
    return;
  }
  if (action.connectedTextId) {
    assert.equal(fixture.slotId, expedition.contentDeckSlotIds.transfer[0]);
    const record = getContentDeckCatalogRecord("transfer", `transfer:${fixture.stopId}`);
    assert.ok(record?.slotIds.includes(fixture.slotId));
    assert.equal(record.instructionId, fixture.instructionId);
    assert.equal(fixture.contentId, action.wordId || action.connectedTextId);
    return;
  }
  assert.equal(fixture.slotId, null);
  assert.equal(fixture.contentId, action.wordId || action.targetIds?.[0]);
}

function interactionFor(action) {
  return Object.freeze({
    action,
    context: SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]
  });
}

function ordinaryPublicModel(fixture, action) {
  let contentSource = null;
  if (action.contentBinding?.category === "heartWords") {
    const owner = getContentDeckOwnerBinding("heartWords", fixture.slotId);
    const served = serveContentDeck(createContentDeckState(), {
      binding: owner,
      visitId: `preview-visit:${fixture.id}`,
      stopId: fixture.stopId,
      journeyStep: Number(fixture.stopId.slice(1)),
      seed: 11
    });
    contentSource = projectBoundContentResolverInputs(served);
  }
  const challenge = createChallenge({
    action,
    missionId: `preview:${fixture.id}`,
    attemptOrdinal: 0,
    seed: 11,
    selectedTargetId: action.targetIds?.[0] || null,
    contentSource
  });
  const child = toChildChallengeView(challenge);
  assert.ok(child);
  const power = SOUND_POWER_REGISTRY[action.powerId];
  const state = power.createState(challenge, {
    seed: 11,
    resume: null,
    interaction: interactionFor(action)
  });
  return { child, model: power.view(state, challenge) };
}

function step(controlId, optionToken = null, sourceToken = null) {
  return { controlId, optionToken, sourceToken };
}

function connectedTextTranscripts(fixture, action) {
  const record = getContentDeckCatalogRecord("transfer", `transfer:${fixture.stopId}`);
  const scene = toChildConnectedTextScene(action.connectedTextId, fixture.id);
  assert.ok(record);
  if (action.powerId === "blend_bridge") {
    const pronunciation = getPronunciation(action.wordId);
    assert.ok(pronunciation);
    return scene.choice.options.flatMap(narrativeOption =>
      record.bossDecision.options.map(option => [
        step("choose_narrative_route", narrativeOption.token),
        ...pronunciation.units.map(unit => step("activate_segment", null, unit.grapheme)),
        step("sweep_blend"),
        step(action.expectedAction, option.token)
      ]));
  }
  const optionTokens = scene.choice.options.map(option => option.token);
  if (action.powerId === "memory_delivery") {
    return optionTokens.map(token => [
      step("receive_cue"), step("move"), step("arrive"),
      step(action.expectedAction, token)
    ]);
  }
  return optionTokens.map(token => [step("read_text"), step(action.expectedAction, token)]);
}

function heartMemoryTranscripts(fixture, action) {
  const record = heartRecordFor(fixture);
  assert.ok(record);
  const token = record.answerTokensByActivity[action.activityFocus];
  const options = createHeartWordChoices({ record, activityType: action.activityFocus,
    stopId: fixture.stopId, seed: 11 });
  const challenge = Object.freeze({
    challengeId: `preview:${fixture.id}:challenge`,
    attemptId: `preview:${fixture.id}:attempt:0`,
    targetId: record.targetId,
    recordsDomain: action.recordsDomain,
    powerId: action.powerId,
    wordId: record.wordId,
    activityType: action.activityFocus,
    expectedAction: action.expectedAction,
    instructionId: action.instructionId,
    expectedToken: token,
    optionTokens: Object.freeze(options.map(option => option.token)),
    childText: "Carry the whole word to its matching place.",
    cue: "whole_word",
    requiresAudio: false
  });
  const child = toChildChallengeView(challenge);
  assert.ok(child);
  return child.optionTokens.map(optionToken => [
    step("receive_cue"), step("move"), step("arrive"),
    step(action.expectedAction, optionToken)
  ]);
}

function independentlyDerivedTranscripts(fixture, action) {
  const runtime = createInteractionRuntimeModel(
    action,
    SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]
  );
  assert.equal(runtime.actionId, action.id);
  let transcripts;
  if (action.connectedTextId) {
    transcripts = connectedTextTranscripts(fixture, action);
  } else if (action.kind === "content_opportunity") {
    transcripts = heartMemoryTranscripts(fixture, action);
  } else {
    const { child, model } = ordinaryPublicModel(fixture, action);
    if (action.powerId === "echo_search") {
      transcripts = model.candidates.map(candidate => [
        step("probe", candidate.label),
        step("confirm_candidate", candidate.label)
      ]);
    } else if (action.powerId === "contrast_sort") {
      transcripts = model.items.flatMap(item => model.bins.map(bin => [
        step(action.expectedAction, bin.label, item.label)
      ]));
    } else if (action.powerId === "word_forge") {
      transcripts = model.rack.map(tile => [step("place_tile", tile.label)]);
    } else if (action.powerId === "blend_bridge") {
      transcripts = model.choices.map((choice, index) => [
        ...model.segments.map(segment => step("activate_segment", null, segment.label)),
        step("sweep_blend"),
        step(action.expectedAction, child.optionTokens[index])
      ]);
    } else if (action.powerId === "memory_delivery") {
      transcripts = model.recipients.map((recipient, index) => [
        step("receive_cue"), step("move"), step("arrive"),
        step(action.expectedAction, child.optionTokens[index])
      ]);
    } else {
      throw new Error(`${fixture.id}: unsupported preview power`);
    }
  }
  for (const transcript of transcripts) {
    for (const actorStep of transcript) {
      assert.ok(runtime.validInputs.includes(actorStep.controlId)
        || (action.powerId === "blend_bridge"
          && actorStep.controlId === "choose_narrative_route"),
        `${fixture.id}: ${actorStep.controlId} is not public`);
    }
  }
  return transcripts;
}

test("preview exports exactly one frozen authored fixture for each decision contract", () => {
  assert.deepEqual(Object.keys(previewFixtureModule).sort(), [
    "SOUND_SEEKERS_PREVIEW_FIXTURES", "resolveSoundSeekersPreviewFixture"
  ]);
  const contracts = Object.values(SOUND_SEEKERS_INSTRUCTIONS)
    .filter(contract => contract.phase === "decision");
  assert.equal(SOUND_SEEKERS_PREVIEW_FIXTURES.length, 12);
  assert.deepEqual(
    SOUND_SEEKERS_PREVIEW_FIXTURES.map(fixture => [
      fixture.instructionId, fixture.powerId, fixture.expectedAction, fixture.recordsDomain
    ]),
    contracts.map(contract => [
      contract.instructionId, contract.powerId, contract.expectedAction, contract.recordsDomain
    ])
  );
  assert.deepEqual(
    SOUND_SEEKERS_PREVIEW_FIXTURES.map(fixture => [
      fixture.id, fixture.stopId, fixture.phaseId, fixture.contentId, fixture.slotId
    ]),
    EXPECTED_IDENTITIES
  );
  assert.equal(recursivelyFrozen(SOUND_SEEKERS_PREVIEW_FIXTURES), true);
});

test("every fixture is an exact real expedition/content tuple with no private authority", () => {
  for (const fixture of SOUND_SEEKERS_PREVIEW_FIXTURES) {
    assert.deepEqual(Object.keys(fixture).sort(), FIXTURE_KEYS, fixture.id);
    assert.match(fixture.phaseId, new RegExp(`^${fixture.stopId}-`, "u"));
    assert.ok(fixture.contentId);
    const { action, expedition } = actionFor(fixture);
    assert.deepEqual(
      [fixture.instructionId, fixture.powerId, fixture.expectedAction, fixture.recordsDomain],
      [action.instructionId, action.powerId, action.expectedAction, action.recordsDomain]
    );
    assertContentTuple(fixture, action, expedition);
    for (const key of collectKeys(fixture)) {
      assert.equal(FORBIDDEN_KEYS.has(key), false, `${fixture.id}: leaked ${key}`);
    }
  }
});

test("legal actor transcripts cover every public path with equal answer-neutral shapes", () => {
  for (const fixture of SOUND_SEEKERS_PREVIEW_FIXTURES) {
    const { action } = actionFor(fixture);
    const derived = independentlyDerivedTranscripts(fixture, action);
    assert.deepEqual(fixture.legalActorTranscripts, derived, fixture.id);
    assert.ok(derived.length >= 2, `${fixture.id}: needs at least two legal paths`);
    assert.equal(new Set(derived.map(transcript => JSON.stringify(transcript))).size,
      derived.length, `${fixture.id}: duplicate actor path`);
    const transcriptShape = derived[0].map(actorStep => Object.keys(actorStep));
    for (const transcript of derived) {
      assert.deepEqual(transcript.map(actorStep => Object.keys(actorStep)), transcriptShape);
      for (const actorStep of transcript) {
        assert.deepEqual(Object.keys(actorStep), STEP_KEYS);
        assert.equal(typeof actorStep.controlId, "string");
        assert.equal(actorStep.optionToken === null || typeof actorStep.optionToken === "string", true);
        assert.equal(actorStep.sourceToken === null || typeof actorStep.sourceToken === "string", true);
      }
    }
  }
  const boss = SOUND_SEEKERS_PREVIEW_FIXTURES.find(fixture =>
    fixture.instructionId === "blend-bridge-choose-novel-meaning");
  assert.equal(boss.legalActorTranscripts.length, 6,
    "both public narrative routes must reach all three public blend choices");
});

test("resolver accepts only fixture identity plus exact redundant public route fields", () => {
  for (const fixture of SOUND_SEEKERS_PREVIEW_FIXTURES) {
    assert.strictEqual(resolveSoundSeekersPreviewFixture({ fixtureId: fixture.id }), fixture);
    assert.strictEqual(resolveSoundSeekersPreviewFixture({
      fixtureId: fixture.id,
      stop: fixture.stopId,
      phase: fixture.phaseId,
      power: fixture.powerId
    }), fixture);
    for (const [key, value] of [
      ["stop", "s40"], ["phase", "s40-primary"], ["power", "story_power"]
    ]) {
      if (fixture[{ stop: "stopId", phase: "phaseId", power: "powerId" }[key]] === value) continue;
      assert.throws(() => resolveSoundSeekersPreviewFixture({
        fixtureId: fixture.id,
        [key]: value
      }), /does not match authored content/u);
    }
  }
  assert.throws(() => resolveSoundSeekersPreviewFixture({
    stopId: "s1", phaseId: "s1-primary", powerId: "story_power"
  }), /fixture identity is required/u);
  assert.throws(() => resolveSoundSeekersPreviewFixture({ fixtureId: "missing" }),
    /fixture is unknown/u);
  assert.throws(() => resolveSoundSeekersPreviewFixture({
    fixtureId: SOUND_SEEKERS_PREVIEW_FIXTURES[0].id,
    answer: "forged"
  }), /request shape is invalid/u);

  let invoked = false;
  const accessor = {};
  Object.defineProperty(accessor, "fixtureId", {
    enumerable: true,
    get() {
      invoked = true;
      return SOUND_SEEKERS_PREVIEW_FIXTURES[0].id;
    }
  });
  assert.throws(() => resolveSoundSeekersPreviewFixture(accessor), /request shape is invalid/u);
  assert.equal(invoked, false);
});
