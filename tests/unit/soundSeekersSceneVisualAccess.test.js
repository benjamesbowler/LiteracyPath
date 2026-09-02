import test from "node:test";
import assert from "node:assert/strict";

import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  createConnectedTextChallenge,
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
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
  completeStoryTransferTransaction,
  materializeBossTransferChallenge
} from "../../src/features/soundSeekers/engine/contentDeckTransactions.js";
import { validAttemptReceipts, validContentDeckUses }
  from "../../src/features/soundSeekers/engine/contentCoverage.js";
import {
  issueSceneVisualAccess,
  validateSceneVisualAccess
} from "../../src/features/soundSeekers/engine/sceneVisualAccess.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";

function completePresentationForVisualTest(sceneId, { narrativeChoiceToken = null } = {}) {
  const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.id === sceneId);
  const journeyStep = Number(scene.stopId.slice(1));
  const initial = createSoundSeekersState();
  const currentState = normalizeSoundSeekersState({
    ...initial, trail: { ...initial.trail, journeyStep }
  });
  const begun = beginStoryTransferTransaction(currentState, {
    stopId: scene.stopId, journeyStep, seed: journeyStep
  });
  const pendingState = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId: begun.transaction.transactionId,
    narrativeChoiceToken
  });
  const challenge = scene.choice.kind === "narrative_bridge"
    ? materializeBossTransferChallenge(pendingState, {
      transactionId: begun.transaction.transactionId
    })
    : createConnectedTextChallenge(pendingState, {
      transactionId: begun.transaction.transactionId,
      routeSeed: `visual-test:${sceneId}`
    });
  const initialPresentation = beginConnectedTextPresentation({
    sceneId, transactionId: begun.transaction.transactionId, state: pendingState
  });
  const completed = completeStoryTransferTransaction(pendingState, {
    transactionId: begun.transaction.transactionId,
    challenge,
    response: { kind: "literacy-answer", token: challenge.expectedToken },
    audio: { status: "completed" },
    at: `2026-09-02T05:${String(journeyStep).padStart(2, "0")}:00.000Z`,
    sessionDay: "2026-09-02"
  });
  const state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(completed.nextState)));
  const action = reduceConnectedTextPresentation(initialPresentation, {
    type: "decision_committed",
    reducerRevision: initialPresentation.reducerRevision,
    evidenceEventId: completed.event.id
  }, { state });
  assert.equal(action.transition.phase, "action");
  assert.equal(action.transition.attemptId, validAttemptReceipts(state).at(-1).attemptId);
  if (scene.choice.kind === "narrative_bridge") {
    assert.equal(typeof narrativeChoiceToken, "string");
    const uses = [
      ...validContentDeckUses(state, "stories"),
      ...validContentDeckUses(state, "transfer")
    ];
    assert.equal(uses.length, 2);
    assert.deepEqual(uses.map(use => use.narrativeChoiceToken), [
      narrativeChoiceToken, narrativeChoiceToken
    ]);
  }
  return {
    state,
    attemptId: action.transition.attemptId,
    actionPresentation: action.nextPresentation,
    actionTransition: action.transition
  };
}

function pendingIncorrectPresentationForVisualTest(sceneId) {
  const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.id === sceneId);
  const journeyStep = Number(scene.stopId.slice(1));
  const narrativeChoiceToken = scene.choice.kind === "narrative_bridge"
    ? toChildConnectedTextScene(sceneId, `wrong:${sceneId}`).choice.options[0].token
    : null;
  const initial = createSoundSeekersState();
  const currentState = normalizeSoundSeekersState({
    ...initial, trail: { ...initial.trail, journeyStep }
  });
  const begun = beginStoryTransferTransaction(currentState, {
    stopId: scene.stopId, journeyStep, seed: journeyStep
  });
  const pendingState = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId: begun.transaction.transactionId,
    narrativeChoiceToken
  });
  const challenge = scene.choice.kind === "narrative_bridge"
    ? materializeBossTransferChallenge(pendingState, {
      transactionId: begun.transaction.transactionId
    })
    : createConnectedTextChallenge(pendingState, {
      transactionId: begun.transaction.transactionId,
      routeSeed: `wrong:${sceneId}`
    });
  const presentation = beginConnectedTextPresentation({
    sceneId, transactionId: begun.transaction.transactionId, state: pendingState
  });
  const wrongToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
  const wrong = completeStoryTransferTransaction(pendingState, {
    transactionId: begun.transaction.transactionId,
    challenge,
    response: { kind: "literacy-answer", token: wrongToken },
    audio: { status: "completed" },
    at: `2026-09-02T06:${String(journeyStep).padStart(2, "0")}:00.000Z`,
    sessionDay: "2026-09-02"
  });
  const state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(wrong.nextState)));
  const correction = reduceConnectedTextPresentation(presentation, {
    type: "decision_committed",
    reducerRevision: presentation.reducerRevision,
    evidenceEventId: wrong.event.id
  }, { state });
  const receipt = validAttemptReceipts(state).at(-1);
  assert.equal(receipt.attemptId, correction.transition.attemptId);
  assert.equal(receipt.correctionRecordIds.length, 1);
  return {
    attemptId: correction.transition.attemptId,
    receipt,
    transition: correction.transition
  };
}

function assertNoCorrectnessOrEvidenceFields(value) {
  const forbidden = /correct|evidence|expected|answer|score|feedback|confusion|correction/iu;
  assert.equal(Object.keys(value).some(key => forbidden.test(key)), false);
}

test("only a current Task 3 branded transition unlocks later semantics", () => {
  const fixture = completePresentationForVisualTest("scene-s1");
  const actionContext = Object.freeze({
    sceneId: "scene-s1",
    attemptId: fixture.attemptId,
    reducerRevision: fixture.actionTransition.reducerRevision
  });
  const actionAccess = issueSceneVisualAccess(fixture.actionTransition, actionContext);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), true);

  const resolved = reduceConnectedTextPresentation(fixture.actionPresentation, {
    type: "action_completed",
    reducerRevision: fixture.actionPresentation.reducerRevision
  }, { state: fixture.state });
  assert.equal(isConnectedTextPresentationTransition(fixture.actionTransition), false);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), false);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), false);
  assert.throws(() => issueSceneVisualAccess(fixture.actionTransition, actionContext));
  assert.throws(() => checkpointConnectedTextPresentation(fixture.actionPresentation));

  const context = Object.freeze({
    sceneId: "scene-s1",
    attemptId: fixture.attemptId,
    reducerRevision: resolved.transition.reducerRevision
  });
  const access = issueSceneVisualAccess(resolved.transition, context);
  assert.equal(validateSceneVisualAccess(access, context), true);
  assert.deepEqual(Object.keys(access), [
    "kind", "sceneId", "attemptId", "reducerRevision", "decisionId",
    "phase", "postDecisionSemanticId", "storyOutcomeId", "meaningSemanticId"
  ]);
  assert.equal(access.kind, "scene_visual_access");
  assert.equal(access.phase, "resolved");
  assert.equal(access.storyOutcomeId, null);
  assert.equal(Object.isFrozen(access), true);
  assertNoCorrectnessOrEvidenceFields(access);

  for (const forged of [
    { ...access }, JSON.parse(JSON.stringify(access)), structuredClone(access)
  ]) {
    assert.equal(validateSceneVisualAccess(forged, context), false);
  }
  for (const mismatch of [
    { ...context, sceneId: "scene-s2" },
    { ...context, attemptId: "attempt:scene-s1:old" },
    { ...context, reducerRevision: 8 },
    { ...context, phase: "resolved" }
  ]) {
    const mismatchAccess = issueSceneVisualAccess(resolved.transition, context);
    assert.equal(validateSceneVisualAccess(mismatchAccess, mismatch), false);
    assert.equal(validateSceneVisualAccess(mismatchAccess, context), false);
  }
  assert.throws(() => issueSceneVisualAccess(resolved.transition, {
    ...context, phase: "resolved"
  }));
  for (const forgedTransition of [
    { ...resolved.transition }, Object.freeze({ ...resolved.transition }),
    structuredClone(resolved.transition), JSON.parse(JSON.stringify(resolved.transition))
  ]) {
    assert.throws(() => issueSceneVisualAccess(forgedTransition, context));
  }
});

test("meaning access is direct and no pre-choice or correction can issue access", () => {
  const assessed = completePresentationForVisualTest("scene-s1");
  const resolved = reduceConnectedTextPresentation(assessed.actionPresentation, {
    type: "action_completed",
    reducerRevision: assessed.actionPresentation.reducerRevision
  }, { state: assessed.state });
  const post = resolveSceneVisualSemantic(resolved.transition.postDecisionSemanticId);
  const meaningSemanticId = post.meaningSemanticIds[0];
  const meaning = reduceConnectedTextPresentation(resolved.nextPresentation, {
    type: "meaning_requested",
    reducerRevision: resolved.nextPresentation.reducerRevision,
    meaningSemanticId
  }, { state: assessed.state });
  const context = {
    sceneId: "scene-s1",
    attemptId: assessed.attemptId,
    reducerRevision: meaning.transition.reducerRevision
  };
  const access = issueSceneVisualAccess(meaning.transition, context);
  assert.equal(validateSceneVisualAccess(access, context), true);
  assert.equal(access.phase, "meaning_support");
  assert.equal(access.meaningSemanticId, meaningSemanticId);
  assert.throws(() => issueSceneVisualAccess(meaning.transition, {
    ...context, meaningSemanticId
  }));

  const preChoiceBegun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: "s1", journeyStep: 1, seed: 1
  });
  const preChoiceState = checkpointStoryTransferTransaction(preChoiceBegun.nextState, {
    transactionId: preChoiceBegun.transaction.transactionId,
    narrativeChoiceToken: null
  });
  const preChoice = beginConnectedTextPresentation({
    sceneId: "scene-s1",
    transactionId: preChoiceBegun.transaction.transactionId,
    state: preChoiceState
  });
  assert.throws(() => issueSceneVisualAccess(preChoice, {
    sceneId: "scene-s1", attemptId: assessed.attemptId, reducerRevision: 0
  }));

  for (const semantics of SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS) {
    const wrong = pendingIncorrectPresentationForVisualTest(semantics.sceneId);
    assert.equal(wrong.transition.phase, "correction");
    assert.equal(wrong.transition.correctionRecordId, wrong.receipt.correctionRecordIds[0]);
    assert.equal(wrong.transition.postDecisionSemanticId, null);
    assert.equal(wrong.transition.storyOutcomeId, null);
    assert.equal(wrong.transition.meaningSemanticId, null);
    assert.throws(() => issueSceneVisualAccess(wrong.transition, {
      sceneId: semantics.sceneId,
      attemptId: wrong.attemptId,
      reducerRevision: wrong.transition.reducerRevision
    }));
  }
});

test("all boss branches survive fresh issuance but not rehydrate, close, or replacement", () => {
  const bossScenes = SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.filter(
    item => item.postDecisionSemanticIds.length === 2
  );
  assert.equal(bossScenes.length, 8);
  const coveredBossPostDecisions = new Set();
  for (const semantics of bossScenes) {
    const branchResults = [];
    const bossOptions = toChildConnectedTextScene(
      semantics.sceneId, `visual-test:${semantics.sceneId}`
    ).choice.options;
    assert.equal(bossOptions.length, 2);
    for (const option of bossOptions) {
      const boss = completePresentationForVisualTest(semantics.sceneId, {
        narrativeChoiceToken: option.token
      });
      const expectedBranch = resolveNarrativeBranchOutcome(semantics.sceneId, option.token);
      const bossResolved = reduceConnectedTextPresentation(boss.actionPresentation, {
        type: "action_completed",
        reducerRevision: boss.actionPresentation.reducerRevision
      }, { state: boss.state });
      const narrativeContext = {
        sceneId: semantics.sceneId,
        attemptId: boss.attemptId,
        reducerRevision: bossResolved.transition.reducerRevision
      };
      const narrative = issueSceneVisualAccess(bossResolved.transition, narrativeContext);
      const simultaneous = issueSceneVisualAccess(bossResolved.transition, narrativeContext);
      assert.equal(validateSceneVisualAccess(narrative, narrativeContext), true);
      assert.equal(validateSceneVisualAccess(simultaneous, narrativeContext), true);
      assert.equal(narrative.storyOutcomeId, expectedBranch.storyOutcomeId);
      assert.equal(narrative.postDecisionSemanticId, expectedBranch.postDecisionSemanticId);

      const checkpoint = checkpointConnectedTextPresentation(bossResolved.nextPresentation);
      const resumed = rehydrateConnectedTextPresentation(
        boss.state, JSON.parse(JSON.stringify(checkpoint))
      );
      assert.notEqual(resumed.transition, bossResolved.transition);
      assert.equal(isConnectedTextPresentationTransition(bossResolved.transition), false);
      assert.equal(validateSceneVisualAccess(narrative, narrativeContext), false);
      assert.equal(validateSceneVisualAccess(simultaneous, narrativeContext), false);
      const resumedContext = {
        ...narrativeContext,
        reducerRevision: resumed.transition.reducerRevision
      };
      const reissued = issueSceneVisualAccess(resumed.transition, resumedContext);
      assert.equal(validateSceneVisualAccess(reissued, resumedContext), true);
      assert.equal(reissued.storyOutcomeId, expectedBranch.storyOutcomeId);
      assert.equal(reissued.postDecisionSemanticId, expectedBranch.postDecisionSemanticId);
      branchResults.push([reissued.storyOutcomeId, reissued.postDecisionSemanticId]);
      coveredBossPostDecisions.add(reissued.postDecisionSemanticId);
      assert.equal(closeConnectedTextPresentation(resumed.presentation), true);
      assert.equal(validateSceneVisualAccess(reissued, resumedContext), false);
    }
    assert.equal(new Set(branchResults.map(item => JSON.stringify(item))).size, 2);
  }
  assert.equal(coveredBossPostDecisions.size, 16);

  const replaced = completePresentationForVisualTest("scene-s1");
  const replacedContext = {
    sceneId: "scene-s1",
    attemptId: replaced.attemptId,
    reducerRevision: replaced.actionTransition.reducerRevision
  };
  const replacedAccess = issueSceneVisualAccess(
    replaced.actionTransition, replacedContext
  );
  const replacementInitial = createSoundSeekersState();
  const replacementCurrent = normalizeSoundSeekersState({
    ...replacementInitial,
    trail: { ...replacementInitial.trail, journeyStep: 2 }
  });
  const replacementBegun = beginStoryTransferTransaction(replacementCurrent, {
    stopId: "s2", journeyStep: 2, seed: 2
  });
  const replacementState = checkpointStoryTransferTransaction(replacementBegun.nextState, {
    transactionId: replacementBegun.transaction.transactionId,
    narrativeChoiceToken: null
  });
  beginConnectedTextPresentation({
    sceneId: "scene-s2",
    transactionId: replacementBegun.transaction.transactionId,
    state: replacementState
  });
  assert.equal(isConnectedTextPresentationTransition(replaced.actionTransition), false);
  assert.equal(validateSceneVisualAccess(replacedAccess, replacedContext), false);
});
