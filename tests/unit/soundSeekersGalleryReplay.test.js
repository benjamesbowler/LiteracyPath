import assert from "node:assert/strict";
import test from "node:test";

import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  createConnectedTextChallenge,
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";
import {
  resolveNarrativeBranchOutcome,
  resolveSceneVisualSemantic
} from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import {
  beginConnectedTextPresentation,
  checkpointConnectedTextPresentation,
  closeConnectedTextPresentation,
  isConnectedTextPresentationTransition,
  reduceConnectedTextPresentation,
  rehydrateConnectedTextPresentation
} from "../../src/features/soundSeekers/engine/connectedTextPresentation.js";
import {
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  completeStoryTransferCorrectionModel,
  completeStoryTransferTransaction,
  materializeBossTransferChallenge,
  materializeStoryTransferChallenge
} from "../../src/features/soundSeekers/engine/contentDeckTransactions.js";
import {
  validAttemptReceipts,
  validContentDeckUses
} from "../../src/features/soundSeekers/engine/contentCoverage.js";
import {
  issueSceneVisualAccess,
  validateSceneVisualAccess
} from "../../src/features/soundSeekers/engine/sceneVisualAccess.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";
import {
  SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS,
  parseSoundSeekersGalleryQuery,
  replaySoundSeekersGalleryFixture
} from "../../src/features/soundSeekers/preview/galleryReplayRecipes.js";

const serialized = value => JSON.parse(JSON.stringify(value));
const transitionContext = transition => ({
  sceneId: transition.sceneId,
  attemptId: transition.attemptId,
  reducerRevision: transition.reducerRevision
});

function challengeFor(state, transactionId, sceneId) {
  const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.id === sceneId);
  const canonical = materializeStoryTransferChallenge(state, { transactionId });
  const delegated = scene.choice.kind === "narrative_bridge"
    ? materializeBossTransferChallenge(state, { transactionId })
    : createConnectedTextChallenge(state, { transactionId, routeSeed: "gallery-smoke" });
  assert.equal(delegated, canonical);
  return canonical;
}

function commitDecision(state, transactionId, challenge, token, minute) {
  return completeStoryTransferTransaction(state, {
    transactionId,
    challenge,
    response: { kind: "literacy-answer", token },
    audio: { status: "completed" },
    at: `2026-09-03T01:${String(minute).padStart(2, "0")}:00.000Z`,
    sessionDay: "2026-09-03"
  });
}

export function exerciseCanonicalWrongReloadCorrect({ sceneId, wrongCount, seed = 11 }) {
  if (![1, 3].includes(wrongCount)) throw new TypeError("gallery smoke requires one or three misses");
  const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.id === sceneId);
  const journeyStep = Number(scene.stopId.slice(1));
  const narrativeChoiceToken = scene.choice.kind === "narrative_bridge"
    ? toChildConnectedTextScene(scene.id, "gallery-smoke").choice.options[0].token
    : null;
  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: scene.stopId, journeyStep, seed
  });
  const transactionId = begun.transaction.transactionId;
  let state = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId, narrativeChoiceToken
  });
  let presentation = beginConnectedTextPresentation({ sceneId, transactionId });
  let correction = null;
  let wrong = null;
  const phases = [];
  const retainedChallenges = [];
  for (let ordinal = 0; ordinal < wrongCount; ordinal += 1) {
    const wrongChallenge = challengeFor(state, transactionId, sceneId);
    retainedChallenges.push(wrongChallenge);
    const wrongToken = wrongChallenge.optionTokens.find(token => token !== wrongChallenge.expectedToken);
    wrong = commitDecision(state, transactionId, wrongChallenge, wrongToken, ordinal + 1);
    state = normalizeSoundSeekersState(serialized(wrong.nextState));
    correction = reduceConnectedTextPresentation(presentation, {
      type: "decision_committed",
      reducerRevision: presentation.reducerRevision,
      evidenceEventId: wrong.event.id
    }, { state });
    assert.equal(correction.transition.phase, "correction");
    assert.equal(correction.transition.correctionRecordId, wrong.correction.correctionRecordId);
    assert.equal(correction.transition.postDecisionSemanticId, null);
    assert.equal(correction.transition.storyOutcomeId, null);
    assert.equal(correction.transition.meaningSemanticId, null);
    assert.throws(() => issueSceneVisualAccess(correction.transition, transitionContext(correction.transition)));
    phases.push("correction");
    presentation = correction.nextPresentation;
  }
  const oldCorrection = correction.transition;
  const preReloadPresentation = correction.nextPresentation;
  const envelope = serialized({
    schemaVersion: 1,
    state: normalizeSoundSeekersState(state),
    presentation: checkpointConnectedTextPresentation(preReloadPresentation)
  });
  assert.deepEqual(Object.keys(envelope.state.contentDecks), [
    "heartWords", "stories", "alternatives", "morphology", "transfer"
  ]);
  assert.equal(envelope.state.evidence.length, wrongCount);
  assert.equal(Object.keys(envelope.state.attemptReceipts).length, wrongCount);
  assert.equal(Boolean(envelope.state.checkpoint?.storyTransfer), true);
  assert.equal(/presentationTransition|sceneAccess|"challenge"|"response"|expectedToken/u.test(JSON.stringify(envelope)), false);
  const correctionReload = rehydrateConnectedTextPresentation(
    normalizeSoundSeekersState(envelope.state), envelope.presentation
  );
  assert.equal(isConnectedTextPresentationTransition(oldCorrection), false);
  assert.throws(() => checkpointConnectedTextPresentation(preReloadPresentation));

  let modelConsumed = false;
  if (wrongCount === 3) {
    assert.equal(state.checkpoint.storyTransfer.stage, "model_pending");
    const beforeModel = {
      evidence: state.evidence.length,
      receipts: validAttemptReceipts(state).length,
      stories: validContentDeckUses(state, "stories").length,
      transfer: validContentDeckUses(state, "transfer").length
    };
    state = completeStoryTransferCorrectionModel(state, { transactionId }).nextState;
    assert.equal(state.checkpoint.storyTransfer.stage, "response_pending");
    assert.deepEqual({
      evidence: state.evidence.length,
      receipts: validAttemptReceipts(state).length,
      stories: validContentDeckUses(state, "stories").length,
      transfer: validContentDeckUses(state, "transfer").length
    }, beforeModel);
    modelConsumed = true;
  }

  const correctChallenge = challengeFor(state, transactionId, sceneId);
  assert.equal(retainedChallenges.includes(correctChallenge), false);
  const completed = commitDecision(
    state, transactionId, correctChallenge, correctChallenge.expectedToken, wrongCount + 1
  );
  state = normalizeSoundSeekersState(serialized(completed.nextState));
  const action = reduceConnectedTextPresentation(correctionReload.presentation, {
    type: "decision_committed",
    reducerRevision: correctionReload.presentation.reducerRevision,
    evidenceEventId: completed.event.id
  }, { state });
  assert.equal(action.transition.phase, "action");
  phases.push("action");
  for (const invalidEvent of [
    { type: "decision_committed", reducerRevision: action.nextPresentation.reducerRevision, evidenceEventId: wrong.event.id },
    { type: "action_completed", reducerRevision: action.nextPresentation.reducerRevision, transactionId },
    { type: "resolved", reducerRevision: action.nextPresentation.reducerRevision }
  ]) assert.throws(() => reduceConnectedTextPresentation(action.nextPresentation, invalidEvent, { state }));

  const actionContext = transitionContext(action.transition);
  const actionAccess = issueSceneVisualAccess(action.transition, actionContext);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), true);
  for (const mismatch of [
    { ...actionContext, sceneId: sceneId === "scene-s1" ? "scene-s2" : "scene-s1" },
    { ...actionContext, attemptId: `${actionContext.attemptId}:stale` },
    { ...actionContext, reducerRevision: actionContext.reducerRevision + 1 }
  ]) {
    const access = issueSceneVisualAccess(action.transition, actionContext);
    assert.equal(validateSceneVisualAccess(access, mismatch), false);
    assert.equal(validateSceneVisualAccess(access, actionContext), false);
  }
  for (const lookalike of [
    { ...action.transition },
    Object.freeze({ ...action.transition }),
    structuredClone(action.transition),
    serialized(action.transition)
  ]) assert.throws(() => issueSceneVisualAccess(lookalike, actionContext));
  for (const lookalike of [
    { ...actionAccess },
    Object.freeze({ ...actionAccess }),
    structuredClone(actionAccess),
    serialized(actionAccess)
  ]) assert.equal(validateSceneVisualAccess(lookalike, actionContext), false);

  const actionCheckpoint = serialized(checkpointConnectedTextPresentation(action.nextPresentation));
  for (const mutate of [
    checkpoint => { checkpoint.transactionId = `${transactionId}:wrong`; },
    checkpoint => { checkpoint.phase = "resolved"; }
  ]) {
    const forgedCheckpoint = serialized(actionCheckpoint);
    mutate(forgedCheckpoint);
    assert.throws(() => rehydrateConnectedTextPresentation(state, forgedCheckpoint));
  }
  if (narrativeChoiceToken) {
    const reciprocal = Object.values(state.contentDecks.stories.uses)
      .concat(Object.values(state.contentDecks.transfer.uses))
      .filter(use => use.narrativeChoiceToken === narrativeChoiceToken);
    assert.equal(reciprocal.length, 2);
    assert.equal(JSON.stringify([wrong.event, completed.event, ...Object.values(state.attemptReceipts)])
      .includes(narrativeChoiceToken), false);
    const mismatched = serialized(state);
    const transferUse = Object.values(mismatched.contentDecks.transfer.uses)
      .find(use => use.narrativeChoiceToken === narrativeChoiceToken);
    transferUse.narrativeChoiceToken = `${narrativeChoiceToken}:mismatch`;
    assert.throws(() => rehydrateConnectedTextPresentation(mismatched, actionCheckpoint));
  }
  const actionReload = rehydrateConnectedTextPresentation(state, actionCheckpoint);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), false);
  assert.equal(isConnectedTextPresentationTransition(action.transition), false);
  assert.throws(() => checkpointConnectedTextPresentation(action.nextPresentation));
  const freshActionContext = transitionContext(actionReload.transition);
  const freshActionAccess = issueSceneVisualAccess(actionReload.transition, freshActionContext);
  assert.equal(validateSceneVisualAccess(freshActionAccess, freshActionContext), true);

  const resolved = reduceConnectedTextPresentation(actionReload.presentation, {
    type: "action_completed", reducerRevision: actionReload.presentation.reducerRevision
  }, { state });
  phases.push("resolved");
  assert.equal(validateSceneVisualAccess(freshActionAccess, freshActionContext), false);
  const resolvedContext = transitionContext(resolved.transition);
  const resolvedAccess = issueSceneVisualAccess(resolved.transition, resolvedContext);
  assert.equal(validateSceneVisualAccess(resolvedAccess, resolvedContext), true);
  const meaningSemanticId = resolveSceneVisualSemantic(
    resolved.transition.postDecisionSemanticId
  ).meaningSemanticIds[0];
  const meaning = reduceConnectedTextPresentation(resolved.nextPresentation, {
    type: "meaning_requested",
    reducerRevision: resolved.nextPresentation.reducerRevision,
    meaningSemanticId
  }, { state });
  assert.equal(validateSceneVisualAccess(resolvedAccess, resolvedContext), false);
  const meaningContext = transitionContext(meaning.transition);
  const meaningAccess = issueSceneVisualAccess(meaning.transition, meaningContext);
  const meaningCheckpoint = serialized(checkpointConnectedTextPresentation(meaning.nextPresentation));
  const meaningReload = rehydrateConnectedTextPresentation(state, meaningCheckpoint);
  assert.equal(validateSceneVisualAccess(meaningAccess, meaningContext), false);
  const reloadedContext = transitionContext(meaningReload.transition);
  const reloadedAccess = issueSceneVisualAccess(meaningReload.transition, reloadedContext);
  assert.equal(closeConnectedTextPresentation(meaningReload.presentation), true);
  assert.equal(validateSceneVisualAccess(reloadedAccess, reloadedContext), false);

  const beforeNextScene = rehydrateConnectedTextPresentation(state, meaningCheckpoint);
  const beforeNextContext = transitionContext(beforeNextScene.transition);
  const beforeNextAccess = issueSceneVisualAccess(beforeNextScene.transition, beforeNextContext);
  const next = beginConnectedTextPresentation({
    sceneId: sceneId === "scene-s1" ? "scene-s2" : "scene-s1",
    transactionId: sceneId === "scene-s1" ? "story-transfer:2:s2" : "story-transfer:1:s1"
  });
  assert.equal(validateSceneVisualAccess(beforeNextAccess, beforeNextContext), false);
  closeConnectedTextPresentation(next);
  return Object.freeze({
    phases,
    serializedEnvelopeIncludedCompleteState: true,
    oldCorrectionPresentationRejected: true,
    oldCorrectionTransitionRejected: true,
    correctionAccessRejected: true,
    modelConsumed,
    freshChallengeAfterReload: true,
    oldActionAccessRejectedAfterSecondReload: true,
    oldActionPresentationRejectedAfterSecondReload: true,
    oldActionTransitionRejectedAfterSecondReload: true,
    freshActionAccessValid: true,
    actionAccessRejectedAfterResolved: true,
    freshResolvedAccessValid: true
  });
}

test("canonical gallery smoke exercises wrong, reload, correct, action, meaning, and invalidation", () => {
  for (const [sceneId, wrongCount] of [["scene-s1", 1], ["scene-s5", 3]]) {
    const audit = exerciseCanonicalWrongReloadCorrect({ sceneId, wrongCount, seed: 11 });
    assert.deepEqual(audit.phases, [...Array(wrongCount).fill("correction"), "action", "resolved"]);
    for (const [key, value] of Object.entries(audit)) {
      if (key !== "phases" && key !== "modelConsumed") assert.equal(value, true, key);
    }
    assert.equal(audit.modelConsumed, wrongCount === 3);
  }
});

test("gallery queries accept only canonical child-safe replay inputs", () => {
  assert.deepEqual(parseSoundSeekersGalleryQuery("?stop=s20&fixture=assessed-correct-resolved&density=full&motion=full&labels=hidden&seed=11"), {
    mode: "scene", stopId: "s20", sceneId: "scene-s20", fixtureId: "assessed-correct-resolved",
    density: "full", motion: "full", labels: "hidden", seed: 11, optionId: null
  });
  for (const unsafe of [
    "state=repair", "phase=resolved", "worldState=repair", "correct=true", "answer=x",
    "fixture=resolved", "stop=s1&stop=s2", "unknown=x",
    "mode=creator", "mode=creator&option=idle",
    "mode=character-bouncy&option=body-shape-round",
    "mode=scene&stop=s1&option=body-shape-round",
    "mode=scene&stop=s5&fixture=boss-resolved&option=scene-s1-option-lift-light",
    "mode=meaning-meaning-bike-two-wheel-pedal-vehicle&scene=scene-s2&fixture=assessed-direct-meaning",
    "mode=meaning-meaning-action-person-doing-something&scene=scene-s40&fixture=boss-direct-meaning"
  ]) assert.throws(() => parseSoundSeekersGalleryQuery(`?${unsafe}`));

  assert.equal(parseSoundSeekersGalleryQuery(
    "?mode=creator&stop=s1&fixture=pre-choice&option=body-shape-sprout"
  ).optionId, "body-shape-sprout");
  assert.equal(parseSoundSeekersGalleryQuery(
    "?mode=character-bouncy&stop=s1&fixture=pre-choice&option=idle"
  ).optionId, "idle");
});

test("every frozen recipe is committed reducer replay rather than authored presentation state", () => {
  assert.equal(Object.isFrozen(SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS), true);
  for (const recipeId of SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS) {
    const boss = recipeId.startsWith("boss-");
    const sceneId = boss ? "scene-s5" : "scene-s1";
    const replay = replaySoundSeekersGalleryFixture({ recipeId, sceneId, seed: 11 });
    assert.equal(replay.recipeId, recipeId);
    assert.equal(replay.transitionSource, "committed-reducer-replay");
    assert.equal("challenge" in replay, false);
    assert.equal("expectedToken" in replay, false);
    if (replay.presentationTransition) {
      assert.equal(isConnectedTextPresentationTransition(replay.presentationTransition), true);
    }
    if (replay.sceneAccess) {
      assert.equal(validateSceneVisualAccess(replay.sceneAccess, replay.context), true);
    }
  }
});

test("all forty scenes and both boss branches resolve through current branded transitions", () => {
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const optionIds = scene.choice.kind === "narrative_bridge"
      ? scene.choice.options.map(option => option.visualSemanticId) : [null];
    for (const optionId of optionIds) {
      const replay = replaySoundSeekersGalleryFixture({
        recipeId: scene.choice.kind === "narrative_bridge" ? "boss-resolved" : "assessed-correct-resolved",
        sceneId: scene.id,
        seed: 11,
        optionId
      });
      assert.equal(isConnectedTextPresentationTransition(replay.presentationTransition), true);
      assert.equal(validateSceneVisualAccess(replay.sceneAccess, replay.context), true);
      if (scene.choice.kind === "narrative_bridge") {
        const branch = resolveNarrativeBranchOutcome(scene.id, replay.persistedNarrativeChoiceToken);
        assert.equal(replay.presentationTransition.storyOutcomeId, branch.storyOutcomeId);
        assert.equal(replay.sceneAccess.storyOutcomeId, branch.storyOutcomeId);
        assert.equal(replay.canonicalEvidenceDomain, "novel_decoding");
      } else {
        assert.equal(replay.presentationTransition.storyOutcomeId, null);
        assert.equal(replay.canonicalEvidenceDomain, "connected_text_transfer");
      }
    }
  }
});
