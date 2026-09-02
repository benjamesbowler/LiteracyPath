import test from "node:test";
import assert from "node:assert/strict";

import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  createConnectedTextChallenge,
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";
import {
  getSceneVisualSemantics,
  resolveNarrativeBranchOutcome,
  resolveSceneVisualSemantic
} from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import {
  beginConnectedTextPresentation,
  checkpointConnectedTextPresentation,
  closeConnectedTextPresentation,
  isConnectedTextPresentationTransition,
  projectConnectedTextPresentationTransition,
  reduceConnectedTextPresentation,
  rehydrateConnectedTextPresentation
} from "../../src/features/soundSeekers/engine/connectedTextPresentation.js";
import {
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  completeStoryTransferCorrectionModel,
  completeStoryTransferTransaction,
  materializeBossTransferChallenge
} from "../../src/features/soundSeekers/engine/contentDeckTransactions.js";
import {
  validAttemptReceipts,
  validContentDeckUses
} from "../../src/features/soundSeekers/engine/contentCoverage.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";

function start(sceneId, journeyStep, narrativeChoiceToken = null) {
  const stopId = `s${journeyStep}`;
  const begun = beginStoryTransferTransaction(createSoundSeekersState(), { stopId, journeyStep, seed: journeyStep });
  const state = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId: begun.transaction.transactionId,
    narrativeChoiceToken
  });
  const challenge = narrativeChoiceToken
    ? materializeBossTransferChallenge(state, { transactionId: begun.transaction.transactionId })
    : createConnectedTextChallenge(state, { transactionId: begun.transaction.transactionId, routeSeed: "presentation" });
  const presentation = beginConnectedTextPresentation({ sceneId, transactionId: begun.transaction.transactionId });
  return { state, challenge, presentation, transactionId: begun.transaction.transactionId };
}

function submit(fixture, token, minute) {
  return completeStoryTransferTransaction(fixture.state, {
    transactionId: fixture.transactionId,
    challenge: fixture.challenge,
    response: { kind: "literacy-answer", token },
    audio: { status: "completed" },
    at: `2026-09-02T00:${String(minute).padStart(2, "0")}:00.000Z`,
    sessionDay: "2026-09-02"
  });
}

test("an authenticated wrong receipt produces correction and a later correct receipt produces action", () => {
  const fixture = start("scene-s1", 1);
  const wrongToken = fixture.challenge.optionTokens.find(token => token !== fixture.challenge.expectedToken);
  const wrong = submit(fixture, wrongToken, 1);
  const wrongState = normalizeSoundSeekersState(JSON.parse(JSON.stringify(wrong.nextState)));
  const corrected = reduceConnectedTextPresentation(fixture.presentation, {
    type: "decision_committed", reducerRevision: 0, evidenceEventId: wrong.event.id
  }, { state: wrongState });
  assert.equal(corrected.transition.phase, "correction");
  assert.equal(corrected.transition.correctionRecordId, wrong.correction.correctionRecordId);
  assert.equal(corrected.transition.postDecisionSemanticId, null);
  assert.equal(isConnectedTextPresentationTransition(corrected.transition), true);
  assert.equal(isConnectedTextPresentationTransition({ ...corrected.transition }), false);
  assert.throws(() => checkpointConnectedTextPresentation(fixture.presentation));

  const resumedChallenge = createConnectedTextChallenge(wrongState, {
    transactionId: fixture.transactionId, routeSeed: "presentation"
  });
  const completed = completeStoryTransferTransaction(wrongState, {
    transactionId: fixture.transactionId,
    challenge: resumedChallenge,
    response: { kind: "literacy-answer", token: resumedChallenge.expectedToken },
    audio: { status: "completed" },
    at: "2026-09-02T00:02:00.000Z",
    sessionDay: "2026-09-02"
  });
  const action = reduceConnectedTextPresentation(corrected.nextPresentation, {
    type: "decision_committed", reducerRevision: 1, evidenceEventId: completed.event.id
  }, { state: completed.nextState });
  assert.equal(isConnectedTextPresentationTransition(corrected.transition), false);
  assert.equal(action.transition.phase, "action");
  assert.equal(action.transition.postDecisionSemanticId,
    getSceneVisualSemantics("scene-s1").postDecisionSemanticIds[0]);
  assert.deepEqual(Object.keys(projectConnectedTextPresentationTransition(action.transition)), [
    "sceneId", "transactionId", "attemptId", "decisionId", "reducerRevision", "phase",
    "correctionRecordId", "postDecisionSemanticId", "storyOutcomeId", "meaningSemanticId"
  ]);

  const checkpoint = JSON.parse(JSON.stringify(checkpointConnectedTextPresentation(action.nextPresentation)));
  const rehydrated = rehydrateConnectedTextPresentation(completed.nextState, checkpoint);
  assert.equal(isConnectedTextPresentationTransition(action.transition), false);
  assert.equal(rehydrated.presentation.phase, "action");
  assert.equal(isConnectedTextPresentationTransition(rehydrated.transition), true);
  const resolved = reduceConnectedTextPresentation(rehydrated.presentation, {
    type: "action_completed", reducerRevision: rehydrated.presentation.reducerRevision
  }, { state: completed.nextState });
  assert.equal(resolved.transition.phase, "resolved");
  assert.equal(closeConnectedTextPresentation(resolved.nextPresentation), true);
  assert.equal(isConnectedTextPresentationTransition(resolved.transition), false);
});

test("boss narrative choice is rederived from reciprocal Task 2 uses", () => {
  const sceneId = "scene-s5";
  const narrativeToken = toChildConnectedTextScene(sceneId, "boss-route").choice.options[0].token;
  const branch = resolveNarrativeBranchOutcome(sceneId, narrativeToken);
  const fixture = start(sceneId, 5, narrativeToken);
  const completed = submit(fixture, fixture.challenge.expectedToken, 5);
  const action = reduceConnectedTextPresentation(fixture.presentation, {
    type: "decision_committed", reducerRevision: 0, evidenceEventId: completed.event.id
  }, { state: completed.nextState });
  assert.equal(action.transition.phase, "action");
  assert.equal(action.transition.storyOutcomeId, branch.storyOutcomeId);
  assert.equal(action.transition.postDecisionSemanticId, branch.postDecisionSemanticId);
  const checkpoint = JSON.parse(JSON.stringify(checkpointConnectedTextPresentation(action.nextPresentation)));
  const resumed = rehydrateConnectedTextPresentation(
    normalizeSoundSeekersState(JSON.parse(JSON.stringify(completed.nextState))), checkpoint
  );
  assert.equal(resumed.transition.storyOutcomeId, branch.storyOutcomeId);
  assert.equal(resumed.transition.postDecisionSemanticId, branch.postDecisionSemanticId);
  assert.throws(() => rehydrateConnectedTextPresentation(completed.nextState, {
    ...checkpoint, phase: "action"
  }));
  closeConnectedTextPresentation(resumed.presentation);
});

test("replacement invalidates every old state and transition identity", () => {
  const fixture = start("scene-s1", 1);
  const completed = submit(fixture, fixture.challenge.expectedToken, 1);
  const action = reduceConnectedTextPresentation(fixture.presentation, {
    type: "decision_committed", reducerRevision: 0, evidenceEventId: completed.event.id
  }, { state: completed.nextState });
  const replacement = beginConnectedTextPresentation({ sceneId: "scene-s2", transactionId: "replacement:s2" });
  assert.equal(isConnectedTextPresentationTransition(action.transition), false);
  assert.throws(() => checkpointConnectedTextPresentation(action.nextPresentation));
  assert.equal(closeConnectedTextPresentation(replacement), true);
  assert.throws(() => closeConnectedTextPresentation(replacement));
});

test("all forty real Task 2 completions survive correction, action, resolved, and meaning reloads", () => {
  let state = createSoundSeekersState();
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const journeyStep = Number(scene.stopId.slice(1));
    const transactionId = `story-transfer:${journeyStep}:${scene.stopId}`;
    const begun = beginStoryTransferTransaction(state, {
      stopId: scene.stopId, journeyStep, seed: journeyStep
    });
    const narrativeChoiceToken = scene.choice.kind === "narrative_bridge"
      ? toChildConnectedTextScene(scene.id, "all-scenes-route").choice.options[0].token
      : null;
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId, narrativeChoiceToken
    });
    let challenge = scene.choice.kind === "narrative_bridge"
      ? materializeBossTransferChallenge(pending, { transactionId })
      : createConnectedTextChallenge(pending, { transactionId, routeSeed: "all-scenes-route" });
    let presentation = beginConnectedTextPresentation({ sceneId: scene.id, transactionId });
    const wrongToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
    const wrong = completeStoryTransferTransaction(pending, {
      transactionId,
      challenge,
      response: { kind: "literacy-answer", token: wrongToken },
      audio: { status: "completed" },
      at: new Date(Date.UTC(2026, 8, 2, 1, journeyStep, 0)).toISOString(),
      sessionDay: "2026-09-02"
    });
    const wrongState = normalizeSoundSeekersState(JSON.parse(JSON.stringify(wrong.nextState)));
    const wrongReceipt = validAttemptReceipts(wrongState)
      .find(receipt => receipt.eventIds.includes(wrong.event.id));
    assert.deepEqual(wrongReceipt.correctionRecordIds, [wrong.correction.correctionRecordId]);
    const correction = reduceConnectedTextPresentation(presentation, {
      type: "decision_committed", reducerRevision: 0, evidenceEventId: wrong.event.id
    }, { state: wrongState });
    assert.equal(correction.transition.phase, "correction");
    assert.equal(correction.transition.postDecisionSemanticId, null);
    const correctionCheckpoint = JSON.parse(JSON.stringify(
      checkpointConnectedTextPresentation(correction.nextPresentation)
    ));
    const correctionReload = rehydrateConnectedTextPresentation(wrongState, correctionCheckpoint);
    presentation = correctionReload.presentation;

    challenge = scene.choice.kind === "narrative_bridge"
      ? materializeBossTransferChallenge(wrongState, { transactionId })
      : createConnectedTextChallenge(wrongState, { transactionId, routeSeed: "all-scenes-route" });
    const completed = completeStoryTransferTransaction(wrongState, {
      transactionId,
      challenge,
      response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "completed" },
      at: new Date(Date.UTC(2026, 8, 2, 2, journeyStep, 0)).toISOString(),
      sessionDay: "2026-09-02"
    });
    const completedState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(completed.nextState))
    );
    const action = reduceConnectedTextPresentation(presentation, {
      type: "decision_committed",
      reducerRevision: presentation.reducerRevision,
      evidenceEventId: completed.event.id
    }, { state: completedState });
    assert.equal(action.transition.phase, "action");
    const actionReload = rehydrateConnectedTextPresentation(
      completedState,
      JSON.parse(JSON.stringify(checkpointConnectedTextPresentation(action.nextPresentation)))
    );
    const resolved = reduceConnectedTextPresentation(actionReload.presentation, {
      type: "action_completed", reducerRevision: actionReload.presentation.reducerRevision
    }, { state: completedState });
    assert.equal(resolved.transition.phase, "resolved");
    const post = resolveSceneVisualSemantic(resolved.transition.postDecisionSemanticId);
    for (const meaningSemanticId of post.meaningSemanticIds) {
      const resolvedReload = rehydrateConnectedTextPresentation(
        completedState,
        JSON.parse(JSON.stringify(checkpointConnectedTextPresentation(resolved.nextPresentation)))
      );
      const meaning = reduceConnectedTextPresentation(resolvedReload.presentation, {
        type: "meaning_requested",
        reducerRevision: resolvedReload.presentation.reducerRevision,
        meaningSemanticId
      }, { state: completedState });
      assert.equal(meaning.transition.phase, "meaning_support");
      assert.equal(meaning.transition.meaningSemanticId, meaningSemanticId);
    }
    state = completedState;
  }
  assert.equal(validContentDeckUses(state, "stories").length, 40);
  assert.equal(validContentDeckUses(state, "transfer").length, 40);
  assert.equal(state.evidence.filter(event => event.domain === "connected_text_transfer").length, 64);
  assert.equal(state.evidence.filter(event => event.domain === "novel_decoding").length, 16);
  const finalIds = new Set(validContentDeckUses(state, "stories").map(use => use.evidenceEventId));
  assert.equal(state.evidence.filter(event => finalIds.has(event.id)
    && event.domain === "connected_text_transfer").length, 32);
  assert.equal(state.evidence.filter(event => finalIds.has(event.id)
    && event.domain === "novel_decoding").length, 8);
});

test("two and three misses rehydrate without granting an early payoff", () => {
  for (const missCount of [2, 3]) {
    const fixture = start("scene-s1", 1);
    let state = fixture.state;
    let presentation = fixture.presentation;
    for (let ordinal = 0; ordinal < missCount; ordinal += 1) {
      const challenge = createConnectedTextChallenge(state, {
        transactionId: fixture.transactionId, routeSeed: "retry-route"
      });
      const wrongToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
      const wrong = completeStoryTransferTransaction(state, {
        transactionId: fixture.transactionId,
        challenge,
        response: { kind: "literacy-answer", token: wrongToken },
        audio: { status: "completed" },
        at: `2026-09-02T03:${String(ordinal).padStart(2, "0")}:00.000Z`,
        sessionDay: "2026-09-02"
      });
      state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(wrong.nextState)));
      const correction = reduceConnectedTextPresentation(presentation, {
        type: "decision_committed",
        reducerRevision: presentation.reducerRevision,
        evidenceEventId: wrong.event.id
      }, { state });
      assert.equal(correction.transition.phase, "correction");
      assert.equal(correction.transition.postDecisionSemanticId, null);
      const resumed = rehydrateConnectedTextPresentation(
        state,
        JSON.parse(JSON.stringify(checkpointConnectedTextPresentation(correction.nextPresentation)))
      );
      presentation = resumed.presentation;
    }
    assert.equal(validAttemptReceipts(state).length, missCount);
    assert.equal(validContentDeckUses(state, "stories").length, 0);
    assert.equal(validContentDeckUses(state, "transfer").length, 0);
    if (missCount === 3) {
      assert.equal(state.checkpoint.storyTransfer.stage, "model_pending");
      const presentationCheckpoint = JSON.parse(JSON.stringify(
        checkpointConnectedTextPresentation(presentation)
      ));
      const modeled = completeStoryTransferCorrectionModel(state, {
        transactionId: fixture.transactionId
      });
      assert.equal(modeled.nextState.checkpoint.storyTransfer.stage, "response_pending");
      assert.equal(validAttemptReceipts(modeled.nextState).length, missCount);
      const resumed = rehydrateConnectedTextPresentation(
        normalizeSoundSeekersState(JSON.parse(JSON.stringify(modeled.nextState))),
        presentationCheckpoint
      );
      assert.equal(resumed.presentation.phase, "correction");
      closeConnectedTextPresentation(resumed.presentation);
    } else {
      closeConnectedTextPresentation(presentation);
    }
  }
});
